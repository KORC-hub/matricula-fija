import { blocksOverlap } from './time'
import type { Conflict, CourseGroup, WorkSchedule } from './types'

export function findPlanConflicts(workSchedule: WorkSchedule, groups: CourseGroup[]): Conflict[] {
  const conflicts: Conflict[] = []

  for (const group of groups) {
    const workClassPair = firstOverlappingPair(workSchedule.blocks, group.blocks)
    if (workClassPair) {
      conflicts.push({
        type: 'work_class',
        groupIds: [group.id],
        courseIds: [group.courseId],
        message: 'Esta clase se cruza con tu horario laboral.',
        blocks: [workClassPair[0], workClassPair[1]],
      })
    }
  }

  for (let leftIndex = 0; leftIndex < groups.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < groups.length; rightIndex += 1) {
      const left = groups[leftIndex]
      const right = groups[rightIndex]
      const classPair = firstOverlappingPair(left.blocks, right.blocks)
      if (classPair) {
        conflicts.push({
          type: 'class_class',
          groupIds: [left.id, right.id],
          courseIds: [left.courseId, right.courseId],
          message: 'Estos grupos se cruzan entre sí.',
          blocks: [...classPair],
        })
      }
    }
  }

  return conflicts
}

function firstOverlappingPair(leftBlocks: CourseGroup['blocks'], rightBlocks: CourseGroup['blocks']) {
  for (const left of leftBlocks) {
    for (const right of rightBlocks) {
      if (blocksOverlap(left, right)) return [left, right] as const
    }
  }
  return undefined
}
