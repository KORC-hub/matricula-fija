import type { WorkSchedule } from '@/lib/schedule/types'

export const demoProfile = {
  name: 'Camilo Ospina',
  email: 'camilo.ospina@ejemplo.local',
  university: 'Universidad Horizonte (datos de ejemplo)',
  program: 'Ingeniería de Software',
  semester: 5,
} as const

export const demoWorkSchedule: WorkSchedule = {
  blocks: [
    { day: 'mon', start: '06:00', end: '14:00' },
    { day: 'tue', start: '06:00', end: '14:00' },
    { day: 'wed', start: '06:00', end: '14:00' },
    { day: 'thu', start: '06:00', end: '14:00' },
    { day: 'fri', start: '06:00', end: '14:00' },
  ],
  commuteMinutes: 45,
}

export const demoSelectedCourseIds = [
  'estadistica-aplicada',
  'bases-datos-ii',
  'ingenieria-requisitos',
  'desarrollo-web',
  'ingles-v',
] as const

export const demoInitialGroupIds = [
  'bases-datos-ii-g1',
  'ingenieria-requisitos-g1',
  'desarrollo-web-g1',
  'ingles-v-g1',
] as const

export const demoPendingCourseId = 'estadistica-aplicada'
