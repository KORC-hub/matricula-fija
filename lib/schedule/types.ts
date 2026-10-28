export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type Time = `${number}:${number}`

export type TimeBlock = {
  day: Day
  start: Time
  end: Time
}

export type WorkMode = 'office' | 'remote' | 'off'

export type WorkDayPreference = TimeBlock & {
  workMode: WorkMode
}

export type WorkSchedule = {
  blocks: TimeBlock[]
  commuteMinutes: number
  /** Optional per-day detail. Legacy callers can continue sending only blocks. */
  dayPreferences?: WorkDayPreference[]
  /** A preferred in-person class day used only to rank recommendations. */
  anchorDay?: Day
}

export type CurriculumMetadata = {
  code: string
  semester: number
  tps: number
  tis: number
  tpt: number
  tit: number
  prerequisite: string | null
}

export type Modality = 'presencial' | 'virtual' | 'mixta'
export type AcademicBlockModality = Exclude<Modality, 'mixta'>

export type Course = {
  id: string
  name: string
  credits: number
  groupIds: string[]
  /** Optional to keep custom catalogs backwards-compatible with the original mock contract. */
  code?: string
  semester?: number
  tps?: number
  tis?: number
  tpt?: number
  tit?: number
  prerequisite?: string | null
  prerequisiteCodes?: string[]
  modality?: Modality
}

/** AcademicOffering is the domain name used by recommendation consumers. */
export type AcademicOffering = Course

export type ModalityBlock = TimeBlock & {
  modality: AcademicBlockModality
}

export type CourseGroup = {
  id: string
  courseId: string
  label: string
  blocks: TimeBlock[]
  seatsLeft: number
  modality?: Modality
  modalityBlocks?: ModalityBlock[]
  campus?: string
  metadata?: Record<string, string>
}

export type Catalog = {
  courses: Course[]
  groups: CourseGroup[]
}

export type AcademicStatus = 'aprobado' | 'pendiente' | 'reprobado' | 'homologado'

export type AcademicRecordEntry = {
  courseId: string
  status: AcademicStatus
  grade?: number
}

export type AcademicRecord = {
  studentId: string
  entries: AcademicRecordEntry[]
}

export type StudentProfile = {
  id: string
  name: string
  email: string
  university: string
  program: string
  currentSemester: number
}

export type CompatibilityStatus = 'compatible' | 'risk' | 'conflict'
export type CourseStatus = 'compatible' | 'risk' | 'no_viable'
export type ConflictType = 'work_class' | 'class_class'

export type CompatibilityReason = {
  code: string
  message: string
  relatedBlock?: TimeBlock
}

export type GroupCompatibility = {
  groupId: string
  courseId: string
  status: CompatibilityStatus | 'no_seats'
  reason: CompatibilityReason
  seatsLeft: number
}

export type CourseCompatibility = {
  courseId: string
  status: CourseStatus
  groups: GroupCompatibility[]
  reason: CompatibilityReason
}

export type Conflict = {
  type: ConflictType
  groupIds: string[]
  courseIds: string[]
  message: string
  blocks: TimeBlock[]
}

export type Plan = {
  groupIds: string[]
  courseIds: string[]
  credits: number
  conflicts: Conflict[]
  isValid: boolean
}

export type SuggestPlanInput = {
  workSchedule: WorkSchedule
  courseIds: string[]
  pinnedGroupIds?: string[]
}

export type SuggestionResult = {
  plan?: Plan
  blockedCourses: Array<{
    courseId: string
    reason: string
  }>
  explanation?: string
}

export type PrerequisiteStatus = {
  required: string[]
  satisfied: string[]
  missing: string[]
  eligible: boolean
}

export type RecommendationClassification =
  | 'compatible'
  | 'risk'
  | 'conflict'
  | 'no_seats'
  | 'blocked_prerequisite'
  | 'no_viable'

export type RecommendationPreferences = {
  anchorDay?: Day
}

export type RecommendationInput = {
  studentId: string
  selectedCourseIds?: string[]
  maxCredits: number
  workSchedule: WorkSchedule
  preferences?: RecommendationPreferences
}

export type IndividualRecommendation = {
  courseId: string
  name: string
  credits: number
  semester: number
  classification: RecommendationClassification
  reason: string
  canAdvance: boolean
  prerequisiteStatus: PrerequisiteStatus
  compatibleGroups: GroupCompatibility[]
  score: number
}

export type PlanRecommendation = {
  selectedCourseIds: string[]
  selectedGroupIds: string[]
  credits: number
  score: number
  explanation: string
  notIncluded: Array<{ courseId: string; reason: string }>
}

export type RecommendationResult = {
  recommendations: IndividualRecommendation[]
  plan: PlanRecommendation
}
