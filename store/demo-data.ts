import { catalog } from '@/data/catalog'
import type { CompatibilityResponse, Plan, SuggestionResult, TimeBlock, WorkSchedule } from '@/lib/api/contracts'

export const DEMO_PROFILE = {
  name: 'Camilo Ospina',
  email: 'camilo.ospina@pascualbravo.edu.co',
  university: 'Institución Universitaria Pascual Bravo',
  program: 'Ingeniería de Software',
  semester: '5',
}

export const DEMO_WORK_SCHEDULE: WorkSchedule = {
  commuteMinutes: 45,
  blocks: (['mon', 'tue', 'wed', 'thu', 'fri'] as const).map((day) => ({ day, start: '06:00', end: '14:00' })) as TimeBlock[],
}

// Keep the client demo catalog sourced from the API fixture so metadata cannot drift.
export const DEMO_CATALOG = catalog

export const DEMO_CONFLICT_BLOCKS: TimeBlock[] = [
  { day: 'tue', start: '18:00', end: '20:00' },
  { day: 'tue', start: '18:00', end: '20:00' },
]

export const DEMO_PLAN: Plan = {
  groupIds: ['bases-datos-ii-g2', 'ingenieria-requisitos-g1'],
  courseIds: ['bases-datos-ii', 'ingenieria-requisitos'],
  credits: 5,
  conflicts: [{
    type: 'class_class',
    groupIds: ['bases-datos-ii-g2', 'ingenieria-requisitos-g1'],
    courseIds: ['bases-datos-ii', 'ingenieria-requisitos'],
    message: 'Estos grupos se cruzan entre sí.',
    blocks: DEMO_CONFLICT_BLOCKS,
  }],
  isValid: false,
}

const groupResult = (
  groupId: string,
  courseId: string,
  status: 'compatible' | 'risk' | 'conflict',
  message: string,
  code: string,
): CompatibilityResponse['courses'][number]['groups'][number] => ({
  groupId,
  courseId,
  status,
  reason: { code, message },
  seatsLeft: DEMO_CATALOG.groups.find((group) => group.id === groupId)?.seatsLeft ?? 0,
})

export const DEMO_COMPATIBILITY: CompatibilityResponse = { courses: [
  {
    courseId: 'estadistica-aplicada',
    status: 'no_viable',
    reason: { code: 'WORK_CONFLICT', message: 'El único grupo se cruza con tu jornada laboral.' },
    groups: [groupResult('estadistica-aplicada-g1', 'estadistica-aplicada', 'conflict', 'Tu turno está activo durante toda esta clase.', 'WORK_CONFLICT')],
  },
  {
    courseId: 'bases-datos-ii',
    status: 'compatible',
    reason: { code: 'BEST_GROUP_COMPATIBLE', message: 'Hay un grupo compatible.' },
    groups: [
      groupResult('bases-datos-ii-g1', 'bases-datos-ii', 'risk', 'Termina tu turno a las 2:00 p. m. y la clase empieza a las 2:00 p. m.; necesitas aproximadamente 45 minutos para llegar.', 'COMMUTE_TOO_SHORT'),
      groupResult('bases-datos-ii-g2', 'bases-datos-ii', 'compatible', 'Tienes tiempo suficiente para llegar.', 'COMPATIBLE'),
    ],
  },
  {
    courseId: 'ingenieria-requisitos',
    status: 'compatible',
    reason: { code: 'BEST_GROUP_COMPATIBLE', message: 'Ambos grupos quedan fuera de tu jornada laboral.' },
    groups: [
      groupResult('ingenieria-requisitos-g1', 'ingenieria-requisitos', 'compatible', 'Fuera de tu jornada laboral.', 'COMPATIBLE'),
      groupResult('ingenieria-requisitos-g2', 'ingenieria-requisitos', 'compatible', 'Fuera de tu jornada laboral.', 'COMPATIBLE'),
    ],
  },
  {
    courseId: 'desarrollo-web',
    status: 'compatible',
    reason: { code: 'BEST_GROUP_COMPATIBLE', message: 'Tu sábado queda disponible para esta clase.' },
    groups: [groupResult('desarrollo-web-g1', 'desarrollo-web', 'compatible', 'Tu sábado queda disponible.', 'COMPATIBLE')],
  },
  {
    courseId: 'ingles-v',
    status: 'compatible',
    reason: { code: 'BEST_GROUP_COMPATIBLE', message: 'El grupo queda después de tu jornada.' },
    groups: [groupResult('ingles-v-g1', 'ingles-v', 'compatible', 'Fuera de tu jornada laboral.', 'COMPATIBLE')],
  },
] }

export const DEMO_SUGGESTION: SuggestionResult = {
  plan: {
    groupIds: ['bases-datos-ii-g2', 'ingenieria-requisitos-g2', 'desarrollo-web-g1', 'ingles-v-g1'],
    courseIds: ['bases-datos-ii', 'ingenieria-requisitos', 'desarrollo-web', 'ingles-v'],
    credits: 12,
    conflicts: [],
    isValid: true,
  },
  blockedCourses: [{ courseId: 'estadistica-aplicada', reason: 'Su único grupo se cruza con tu horario laboral.' }],
  explanation: 'No hay un grupo compatible para todas las materias elegidas; se propone la mejor combinación disponible.',
}
