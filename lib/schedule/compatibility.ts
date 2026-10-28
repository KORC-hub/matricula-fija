import { blocksOverlap, commuteGap, formatTimeSpanish } from './time'
import type {
  AcademicBlockModality,
  CompatibilityReason,
  Course,
  CourseCompatibility,
  CourseGroup,
  GroupCompatibility,
  ModalityBlock,
  WorkSchedule,
} from './types'

const compatibleReason: CompatibilityReason = {
  code: 'COMPATIBLE',
  message: 'Este grupo cabe en tu horario.',
}

type EffectiveWorkBlock = WorkSchedule['blocks'][number] & { workMode: 'office' | 'remote' }

/** Resolve the extended per-day model without breaking legacy blocks-only payloads. */
export function getEffectiveWorkBlocks(workSchedule: WorkSchedule): EffectiveWorkBlock[] {
  if (!workSchedule.dayPreferences?.length) {
    return workSchedule.blocks.map((block) => ({ ...block, workMode: 'office' }))
  }

  const daysWithPreferences = new Set(workSchedule.dayPreferences.map((preference) => preference.day))
  const preferredBlocks = workSchedule.dayPreferences
    .filter((preference) => preference.workMode !== 'off')
    .map(({ workMode, ...block }) => ({ ...block, workMode: workMode as 'office' | 'remote' }))
  const legacyBlocks = workSchedule.blocks
    .filter((block) => !daysWithPreferences.has(block.day))
    .map((block) => ({ ...block, workMode: 'office' as const }))

  return [...preferredBlocks, ...legacyBlocks]
}

function effectiveClassBlocks(group: CourseGroup): ModalityBlock[] {
  if (group.modalityBlocks?.length) return group.modalityBlocks
  const modality: AcademicBlockModality = group.modality === 'virtual' ? 'virtual' : 'presencial'
  return group.blocks.map((block) => ({ ...block, modality }))
}

export function classifyGroup(group: CourseGroup, workSchedule: WorkSchedule): GroupCompatibility {
  if (group.seatsLeft <= 0) {
    return {
      groupId: group.id,
      courseId: group.courseId,
      status: 'no_seats',
      reason: {
        code: 'NO_SEATS',
        message: 'Este grupo no tiene cupos disponibles.',
      },
      seatsLeft: group.seatsLeft,
    }
  }

  const classBlocks = effectiveClassBlocks(group)
  const workBlocks = getEffectiveWorkBlocks(workSchedule)
  for (const classBlock of classBlocks) {
    for (const workBlock of workBlocks) {
      if (blocksOverlap(classBlock, workBlock)) {
        return {
          groupId: group.id,
          courseId: group.courseId,
          status: 'conflict',
          reason: {
            code: 'WORK_CLASS_CONFLICT',
            message: 'Esta clase se cruza con tu horario laboral.',
            relatedBlock: workBlock,
          },
          seatsLeft: group.seatsLeft,
        }
      }
    }
  }

  let closestRisk: { classBlock: ModalityBlock; workBlock: EffectiveWorkBlock; gap: number } | undefined
  if (workSchedule.commuteMinutes > 0) {
    for (const classBlock of classBlocks) {
      // A remote class does not require travel from an office shift or to campus.
      if (classBlock.modality !== 'presencial') continue
      for (const workBlock of workBlocks) {
        if (workBlock.workMode !== 'office') continue
        const gap = commuteGap(classBlock, workBlock)
        if (gap !== null && gap < workSchedule.commuteMinutes && (!closestRisk || gap < closestRisk.gap)) {
          closestRisk = { classBlock, workBlock, gap }
        }
      }
    }
  }

  if (closestRisk) {
    const { classBlock, workBlock } = closestRisk
    const classStartsAfterWork = workBlock.end <= classBlock.start
    const message = classStartsAfterWork
      ? `Termina tu turno a las ${formatTimeSpanish(workBlock.end)} y la clase empieza a las ${formatTimeSpanish(classBlock.start)}; necesitas aproximadamente ${workSchedule.commuteMinutes} minutos para llegar.`
      : `Tu clase termina a las ${formatTimeSpanish(classBlock.end)} y tu turno empieza a las ${formatTimeSpanish(workBlock.start)}; necesitas aproximadamente ${workSchedule.commuteMinutes} minutos para desplazarte.`

    return {
      groupId: group.id,
      courseId: group.courseId,
      status: 'risk',
      reason: {
        code: 'COMMUTE_TOO_SHORT',
        message,
        relatedBlock: classBlock,
      },
      seatsLeft: group.seatsLeft,
    }
  }

  return {
    groupId: group.id,
    courseId: group.courseId,
    status: 'compatible',
    reason: compatibleReason,
    seatsLeft: group.seatsLeft,
  }
}

export function summarizeCourse(
  course: Course,
  groups: CourseGroup[],
  workSchedule: WorkSchedule,
): CourseCompatibility {
  const groupResults = groups.map((group) => classifyGroup(group, workSchedule))
  const compatible = groupResults.find((group) => group.status === 'compatible')
  const risk = groupResults.find((group) => group.status === 'risk')

  if (compatible) {
    return {
      courseId: course.id,
      status: 'compatible',
      groups: groupResults,
      reason: {
        code: 'BEST_GROUP_COMPATIBLE',
        message: 'Hay un grupo compatible.',
      },
    }
  }

  if (risk) {
    return {
      courseId: course.id,
      status: 'risk',
      groups: groupResults,
      reason: {
        code: 'BEST_GROUP_RISK',
        message: 'Hay un grupo con riesgo por desplazamiento.',
      },
    }
  }

  return {
    courseId: course.id,
    status: 'no_viable',
    groups: groupResults,
    reason: {
      code: groups.length === 0 ? 'NO_GROUPS' : 'NO_VIABLE_GROUPS',
      message: groups.length === 0
        ? 'Esta materia no tiene grupos disponibles.'
        : 'No hay un grupo viable para esta materia en tu horario.',
    },
  }
}
