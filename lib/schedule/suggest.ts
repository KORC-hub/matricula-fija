import { classifyGroup } from './compatibility'
import { findPlanConflicts } from './conflicts'
import type {
  Catalog,
  Course,
  CourseGroup,
  Plan,
  SuggestPlanInput,
  SuggestionResult,
} from './types'

export function suggestPlan(input: SuggestPlanInput, catalog: Catalog): SuggestionResult {
  const selectedCourseIds = new Set(input.courseIds)
  const selectedCourses = catalog.courses.filter((course) => selectedCourseIds.has(course.id))
  const groupsByCourse = new Map<string, CourseGroup[]>()
  for (const group of catalog.groups) {
    const groups = groupsByCourse.get(group.courseId) ?? []
    groups.push(group)
    groupsByCourse.set(group.courseId, groups)
  }

  const pinnedGroupIds = input.pinnedGroupIds ?? []
  const pinnedGroups = pinnedGroupIds.map((groupId) => catalog.groups.find((group) => group.id === groupId))
  const missingPinnedGroup = pinnedGroups.find((group): group is undefined => !group)
  if (missingPinnedGroup) {
    return {
      blockedCourses: [],
      explanation: 'Uno de los grupos fijados ya no existe en el catálogo.',
    }
  }

  const pinnedByCourse = new Map<string, CourseGroup>()
  for (const group of pinnedGroups as CourseGroup[]) {
    if (!selectedCourseIds.has(group.courseId)) {
      return {
        blockedCourses: [],
        explanation: 'Un grupo fijado no corresponde a las materias elegidas.',
      }
    }
    if (pinnedByCourse.has(group.courseId)) {
      return {
        blockedCourses: [{ courseId: group.courseId, reason: 'Solo puedes fijar un grupo por materia.' }],
        explanation: 'No se pudo conservar la combinación fijada.',
      }
    }
    pinnedByCourse.set(group.courseId, group)
  }

  const candidatesByCourse = new Map<string, CourseGroup[]>()
  for (const course of selectedCourses) {
    const pinned = pinnedByCourse.get(course.id)
    const allAvailable = (groupsByCourse.get(course.id) ?? [])
      .filter((group) => group.seatsLeft > 0)
      .filter((group) => classifyGroup(group, input.workSchedule).status !== 'conflict')
      .sort(compareGroupPreference)
    const compatible = allAvailable.filter((group) => classifyGroup(group, input.workSchedule).status === 'compatible')
    const available = compatible.length > 0 ? compatible : allAvailable

    if (pinned) {
      const pinnedStatus = classifyGroup(pinned, input.workSchedule).status
      if (pinnedStatus === 'conflict') {
        return {
          blockedCourses: [{ courseId: course.id, reason: 'El grupo fijado se cruza con tu horario laboral.' }],
          explanation: 'No encontramos una combinación que conserve todos los grupos fijados.',
        }
      }
      if (pinned.seatsLeft <= 0) {
        return {
          blockedCourses: [{ courseId: course.id, reason: 'El grupo fijado no tiene cupos disponibles.' }],
          explanation: 'No encontramos una combinación que conserve todos los grupos fijados.',
        }
      }
      candidatesByCourse.set(course.id, [pinned])
    } else {
      candidatesByCourse.set(course.id, available)
    }
  }

  let bestGroups: CourseGroup[] | undefined
  const visit = (courseIndex: number, currentGroups: CourseGroup[]): void => {
    if (courseIndex === selectedCourses.length) {
      if (!bestGroups || isBetterSolution(currentGroups, bestGroups, selectedCourses)) {
        bestGroups = [...currentGroups]
      }
      return
    }

    const course = selectedCourses[courseIndex]
    const candidates = candidatesByCourse.get(course.id) ?? []
    const isPinned = pinnedByCourse.has(course.id)

    if (!isPinned) visit(courseIndex + 1, currentGroups)

    for (const group of candidates) {
      const conflicts = findPlanConflicts(input.workSchedule, [...currentGroups, group])
      const hasClassConflict = conflicts.some((conflict) => conflict.type === 'class_class')
      if (!hasClassConflict) {
        visit(courseIndex + 1, [...currentGroups, group])
      }
    }
  }

  visit(0, [])

  if (!bestGroups || bestGroups.length === 0) {
    return {
      blockedCourses: selectedCourses.map((course) => ({
        courseId: course.id,
        reason: blockedReason(course, candidatesByCourse.get(course.id) ?? []),
      })),
      explanation: 'No encontramos una combinación completa sin choques para las materias elegidas.',
    }
  }

  const solution = bestGroups
  const blockedCourses = selectedCourses
    .filter((course) => !solution.some((group) => group.courseId === course.id))
    .map((course) => ({
      courseId: course.id,
      reason: blockedReason(course, candidatesByCourse.get(course.id) ?? []),
    }))

  const conflicts = findPlanConflicts(input.workSchedule, solution)
  const plan: Plan = {
    groupIds: solution.map((group) => group.id),
    courseIds: selectedCourses
      .filter((course) => solution.some((group) => group.courseId === course.id))
      .map((course) => course.id),
    credits: solution.reduce((total, group) => {
      const course = selectedCourses.find((item) => item.id === group.courseId)
      return total + (course?.credits ?? 0)
    }, 0),
    conflicts,
    isValid: conflicts.length === 0,
  }

  return {
    plan,
    blockedCourses,
    explanation: blockedCourses.length > 0
      ? 'No hay un grupo compatible para todas las materias elegidas; se propone la mejor combinación disponible.'
      : undefined,
  }
}

function compareGroupPreference(left: CourseGroup, right: CourseGroup): number {
  const leftPresenceDays = presenceDays(left)
  const rightPresenceDays = presenceDays(right)
  if (leftPresenceDays !== rightPresenceDays) return leftPresenceDays - rightPresenceDays
  return left.id.localeCompare(right.id)
}

function presenceDays(group: CourseGroup): number {
  if (group.modality === 'virtual') return 0
  if (!group.modalityBlocks?.length) return new Set(group.blocks.map((block) => block.day)).size
  return new Set(group.modalityBlocks.filter((block) => block.modality === 'presencial').map((block) => block.day)).size
}

function isBetterSolution(candidate: CourseGroup[], current: CourseGroup[], courses: Course[]): boolean {
  const candidateCredits = creditsFor(candidate, courses)
  const currentCredits = creditsFor(current, courses)
  if (candidateCredits !== currentCredits) return candidateCredits > currentCredits
  if (candidate.length !== current.length) return candidate.length > current.length

  const candidatePresenceDays = candidate.reduce((total, group) => total + presenceDays(group), 0)
  const currentPresenceDays = current.reduce((total, group) => total + presenceDays(group), 0)
  if (candidatePresenceDays !== currentPresenceDays) return candidatePresenceDays < currentPresenceDays

  const candidateIds = candidate.map((group) => group.id).sort().join('|')
  const currentIds = current.map((group) => group.id).sort().join('|')
  return candidateIds < currentIds
}

function creditsFor(groups: CourseGroup[], courses: Course[]): number {
  return groups.reduce((total, group) => {
    const course = courses.find((item) => item.id === group.courseId)
    return total + (course?.credits ?? 0)
  }, 0)
}

function blockedReason(course: Course, candidates: CourseGroup[]): string {
  if (course.groupIds.length === 0) return 'Esta materia no tiene grupos disponibles.'
  if (candidates.length === 0) return 'Su oferta no tiene un grupo con cupos que evite el choque con tu horario laboral.'
  return 'Sus grupos disponibles se cruzan con otras materias del plan.'
}
