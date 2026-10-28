import { classifyGroup } from './compatibility'
import { findPlanConflicts } from './conflicts'
import type {
  AcademicRecord,
  Catalog,
  Course,
  CourseGroup,
  GroupCompatibility,
  IndividualRecommendation,
  PlanRecommendation,
  PrerequisiteStatus,
  RecommendationClassification,
  RecommendationInput,
  RecommendationResult,
  StudentProfile,
  WorkSchedule,
} from './types'

/**
 * Returns offered courses from the requested curriculum semester that still have
 * at least one seat. Risky groups are kept because the student can review them;
 * only work-hour conflicts are excluded when a schedule is provided.
 */
export function recommendAvailableCourses(
  semester: number,
  catalog: Catalog,
  workSchedule?: WorkSchedule,
): Course[] {
  return catalog.courses.filter((course) => {
    if (course.semester !== semester) return false

    return catalog.groups.some((group) => {
      if (group.courseId !== course.id || group.seatsLeft <= 0) return false
      if (!workSchedule) return true
      return classifyGroup(group, workSchedule).status !== 'conflict'
    })
  })
}

/** Alias with a domain-oriented name for callers building semester suggestions. */
export const recommendCoursesForSemester = recommendAvailableCourses

function prerequisiteStatus(course: Course, record: AcademicRecord): PrerequisiteStatus {
  const required = [
    ...(course.prerequisite ? [course.prerequisite] : []),
    ...(course.prerequisiteCodes ?? []),
  ].filter((code, index, all) => all.indexOf(code) === index)
  const entries = new Map(record.entries.map((entry) => [entry.courseId, entry.status]))
  const satisfied = required.filter((code) => {
    const status = entries.get(code)
    return status === 'aprobado' || status === 'homologado'
  })
  const missing = required.filter((code) => !satisfied.includes(code))
  return { required, satisfied, missing, eligible: missing.length === 0 }
}

function groupDays(group: CourseGroup): Set<string> {
  const blocks = group.modalityBlocks?.length ? group.modalityBlocks : group.blocks
  return new Set(blocks.map((block) => block.day))
}

function presenceDays(group: CourseGroup): number {
  if (group.modality === 'virtual') return 0
  if (!group.modalityBlocks?.length) return new Set(group.blocks.map((block) => block.day)).size
  return new Set(group.modalityBlocks.filter((block) => block.modality === 'presencial').map((block) => block.day)).size
}

function groupAnchorScore(group: CourseGroup, anchorDay?: string): number {
  return anchorDay && groupDays(group).has(anchorDay) ? 1 : 0
}

function groupRiskScore(result: GroupCompatibility): number {
  return result.status === 'risk' ? 1 : 0
}

function groupSortKey(
  group: CourseGroup,
  result: GroupCompatibility,
  anchorDay: string | undefined,
): [number, number, number, number, string] {
  const statusRank = result.status === 'compatible' ? 3 : result.status === 'risk' ? 2 : result.status === 'conflict' ? 1 : 0
  return [statusRank, groupAnchorScore(group, anchorDay), -presenceDays(group), -groupRiskScore(result), group.id]
}

function compareGroupCandidates(
  left: { group: CourseGroup; result: GroupCompatibility },
  right: { group: CourseGroup; result: GroupCompatibility },
  anchorDay?: string,
): number {
  const leftKey = groupSortKey(left.group, left.result, anchorDay)
  const rightKey = groupSortKey(right.group, right.result, anchorDay)
  for (let index = 0; index < leftKey.length; index += 1) {
    if (leftKey[index] === rightKey[index]) continue
    if (typeof leftKey[index] === 'string' && typeof rightKey[index] === 'string') {
      return (leftKey[index] as string).localeCompare(rightKey[index] as string)
    }
    return Number(rightKey[index]) - Number(leftKey[index])
  }
  return 0
}

function courseGroups(course: Course, catalog: Catalog): CourseGroup[] {
  const ids = new Set(course.groupIds)
  return catalog.groups.filter((group) => ids.has(group.id) && group.courseId === course.id)
}

function makeIndividualRecommendation(
  course: Course,
  catalog: Catalog,
  input: RecommendationInput,
  record: AcademicRecord,
  student: StudentProfile,
): { recommendation: IndividualRecommendation; candidates: Array<{ group: CourseGroup; result: GroupCompatibility }> } {
  const prerequisites = prerequisiteStatus(course, record)
  const anchorDay = input.preferences?.anchorDay ?? input.workSchedule.anchorDay
  const evaluated = courseGroups(course, catalog)
    .map((group) => ({ group, result: classifyGroup(group, input.workSchedule) }))
    .sort((left, right) => compareGroupCandidates(left, right, anchorDay))
  const candidates = evaluated.filter(({ result }) => result.status === 'compatible' || result.status === 'risk')
  let classification: RecommendationClassification
  let reason: string

  if (!prerequisites.eligible) {
    classification = 'blocked_prerequisite'
    reason = `Te falta aprobar ${prerequisites.missing.join(', ')} antes de cursar esta materia.`
  } else if (candidates.length > 0) {
    classification = candidates[0].result.status
    reason = classification === 'compatible'
      ? 'Encontramos grupos compatibles con tu horario laboral.'
      : 'Hay grupos disponibles, pero alguno deja poco tiempo para desplazarte.'
  } else if (evaluated.length > 0 && evaluated.every(({ result }) => result.status === 'no_seats')) {
    classification = 'no_seats'
    reason = 'Todos los grupos de esta materia están llenos.'
  } else if (evaluated.length === 0) {
    classification = 'no_viable'
    reason = 'Esta materia no tiene grupos publicados en la oferta actual.'
  } else {
    classification = 'conflict'
    reason = 'Sus grupos se cruzan con tu horario laboral.'
  }

  const semester = course.semester ?? student.currentSemester
  const canAdvance = semester > student.currentSemester && prerequisites.eligible
  const statusScore = classification === 'compatible' ? 400 : classification === 'risk' ? 300 : classification === 'conflict' ? 100 : 0
  const bestGroup = candidates[0]
  const score = statusScore
    + (bestGroup ? groupAnchorScore(bestGroup.group, anchorDay) * 40 - presenceDays(bestGroup.group) * 5 : 0)
    + course.credits * 2
    + (semester <= student.currentSemester ? 1 : 0)

  return {
    recommendation: {
      courseId: course.id,
      name: course.name,
      credits: course.credits,
      semester,
      classification,
      reason,
      canAdvance,
      prerequisiteStatus: prerequisites,
      compatibleGroups: candidates.map(({ result }) => result),
      score,
    },
    candidates,
  }
}

function compareRecommendationItems(
  left: { course: Course; recommendation: IndividualRecommendation; candidates: Array<{ group: CourseGroup; result: GroupCompatibility }> },
  right: { course: Course; recommendation: IndividualRecommendation; candidates: Array<{ group: CourseGroup; result: GroupCompatibility }> },
  anchorDay: string | undefined,
  currentSemester: number,
): number {
  const classificationRank: Record<RecommendationClassification, number> = {
    compatible: 5,
    risk: 4,
    conflict: 3,
    no_viable: 2,
    no_seats: 1,
    blocked_prerequisite: 0,
  }
  const leftBest = left.candidates[0]
  const rightBest = right.candidates[0]
  const leftKey = [
    classificationRank[left.recommendation.classification],
    leftBest ? groupAnchorScore(leftBest.group, anchorDay) : 0,
    leftBest ? -presenceDays(leftBest.group) : 0,
    leftBest ? -groupRiskScore(leftBest.result) : 0,
    left.course.credits,
    (left.course.semester ?? currentSemester) <= currentSemester ? 1 : 0,
  ]
  const rightKey = [
    classificationRank[right.recommendation.classification],
    rightBest ? groupAnchorScore(rightBest.group, anchorDay) : 0,
    rightBest ? -presenceDays(rightBest.group) : 0,
    rightBest ? -groupRiskScore(rightBest.result) : 0,
    right.course.credits,
    (right.course.semester ?? currentSemester) <= currentSemester ? 1 : 0,
  ]
  for (let index = 0; index < leftKey.length; index += 1) {
    if (leftKey[index] !== rightKey[index]) return rightKey[index] - leftKey[index]
  }
  return left.course.id.localeCompare(right.course.id)
}
function isBetterPlan(left: PlanRecommendation, right: PlanRecommendation | undefined): boolean {
  if (!right) return true
  if (left.credits !== right.credits) return left.credits > right.credits
  if (left.score !== right.score) return left.score > right.score
  if (left.selectedCourseIds.length !== right.selectedCourseIds.length) {
    return left.selectedCourseIds.length > right.selectedCourseIds.length
  }
  return left.selectedGroupIds.join('|') < right.selectedGroupIds.join('|')
}

/** Build individual recommendations and a deterministic credit-maximising plan. */
export function recommendAcademicPlan(
  input: RecommendationInput,
  catalog: Catalog,
  student: StudentProfile,
  record: AcademicRecord,
): RecommendationResult {
  const requestedIds = input.selectedCourseIds ? new Set(input.selectedCourseIds) : undefined
  const selectedCourses = catalog.courses
    .filter((course) => !requestedIds || requestedIds.has(course.id))
    .sort((left, right) => left.id.localeCompare(right.id))
  const evaluated = selectedCourses.map((course) => ({
    course,
    ...makeIndividualRecommendation(course, catalog, input, record, student),
  }))
  const recommendations = evaluated
    .sort((left, right) => compareRecommendationItems(left, right, input.preferences?.anchorDay ?? input.workSchedule.anchorDay, student.currentSemester))
    .map(({ recommendation }) => recommendation)

  let bestPlan: PlanRecommendation | undefined
  const visit = (index: number, groups: CourseGroup[], courses: Course[], score: number): void => {
    if (index === evaluated.length) {
      const plan: PlanRecommendation = {
        selectedCourseIds: courses.map((course) => course.id),
        selectedGroupIds: groups.map((group) => group.id),
        credits: courses.reduce((total, course) => total + course.credits, 0),
        score,
        explanation: 'Esta combinación maximiza los créditos sin cruces de horario y respeta los prerrequisitos.',
        notIncluded: [],
      }
      if (isBetterPlan(plan, bestPlan)) bestPlan = plan
      return
    }

    const item = evaluated[index]
    visit(index + 1, groups, courses, score)
    if (item.recommendation.prerequisiteStatus.eligible) {
      for (const candidate of item.candidates) {
        const nextGroups = [...groups, candidate.group]
        const hasClassConflict = findPlanConflicts(input.workSchedule, nextGroups)
          .some((conflict) => conflict.type === 'class_class')
        const nextCredits = courses.reduce((total, course) => total + course.credits, 0) + item.course.credits
        if (!hasClassConflict && nextCredits <= input.maxCredits) {
          visit(index + 1, nextGroups, [...courses, item.course], score + item.recommendation.score)
        }
      }
    }
  }
  visit(0, [], [], 0)

  const plan = bestPlan ?? {
    selectedCourseIds: [],
    selectedGroupIds: [],
    credits: 0,
    score: 0,
    explanation: 'No encontramos una combinación que respete tu límite de créditos y horario.',
    notIncluded: [],
  }
  const selectedIds = new Set(plan.selectedCourseIds)
  plan.notIncluded = recommendations
    .filter((recommendation) => !selectedIds.has(recommendation.courseId))
    .map((recommendation) => {
      if (recommendation.classification === 'blocked_prerequisite') return { courseId: recommendation.courseId, reason: recommendation.reason }
      if (recommendation.classification === 'no_seats') return { courseId: recommendation.courseId, reason: recommendation.reason }
      if (recommendation.credits + plan.credits > input.maxCredits) return { courseId: recommendation.courseId, reason: 'Superaría tu límite de créditos.' }
      return { courseId: recommendation.courseId, reason: 'Se excluyó para evitar choques con la combinación recomendada.' }
    })

  return { recommendations, plan }
}

/** Short alias for consumers that only need the recommendation engine. */
export const recommendCourses = recommendAcademicPlan
