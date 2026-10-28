import { z } from 'zod'
import type {
  Catalog,
  CourseCompatibility,
  Plan,
  SuggestionResult,
} from '@/lib/schedule/types'
import type { Time } from '@/lib/schedule/types'

export type {
  AcademicOffering,
  AcademicRecord,
  Catalog,
  AcademicRecordEntry,
  AcademicStatus,
  CompatibilityReason,
  Conflict,
  Course,
  CourseCompatibility,
  CourseGroup,
  CourseStatus,
  CurriculumMetadata,
  GroupCompatibility,
  IndividualRecommendation,
  Modality,
  Plan,
  PlanRecommendation,
  PrerequisiteStatus,
  RecommendationClassification,
  RecommendationInput,
  RecommendationPreferences,
  RecommendationResult,
  SuggestionResult,
  TimeBlock,
  WorkDayPreference,
  WorkMode,
  WorkSchedule,
} from '@/lib/schedule/types'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const DaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

export const TimeSchema = z.string().regex(TIME_PATTERN, 'La hora debe tener formato HH:mm.') as z.ZodType<Time>

export const TimeBlockSchema = z
  .object({
    day: DaySchema,
    start: TimeSchema,
    end: TimeSchema,
  })
  .strict()
  .superRefine((block, context) => {
    if (block.start >= block.end) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La hora de salida debe ser después de la hora de inicio.',
        path: ['end'],
      })
    }
  })

export const WorkDayPreferenceSchema = z
  .object({
    day: DaySchema,
    start: TimeSchema,
    end: TimeSchema,
    workMode: z.enum(['office', 'remote', 'off']),
  })
  .strict()
  .superRefine((block, context) => {
    if (block.start >= block.end) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La hora de salida debe ser después de la hora de inicio.',
        path: ['end'],
      })
    }
  })

export const WorkScheduleSchema = z
  .object({
    blocks: z.array(TimeBlockSchema),
    commuteMinutes: z.number().int().min(0, 'El tiempo de desplazamiento no puede ser negativo.'),
    dayPreferences: z.array(WorkDayPreferenceSchema).optional(),
    anchorDay: DaySchema.optional(),
  })
  .strict()

const IdListSchema = z
  .array(z.string().trim().min(1))
  .min(1, 'La lista no puede estar vacía.')
  .refine(
    (ids) => new Set(ids).size === ids.length,
    'La lista no puede contener identificadores repetidos.',
  )

const OptionalIdListSchema = z
  .array(z.string().trim().min(1))
  .refine(
    (ids) => new Set(ids).size === ids.length,
    'La lista no puede contener identificadores repetidos.',
  )

export const CompatibilityRequestSchema = z
  .object({
    workSchedule: WorkScheduleSchema,
    courseIds: IdListSchema,
  })
  .strict()

export const PlanValidateRequestSchema = z
  .object({
    workSchedule: WorkScheduleSchema,
    groupIds: IdListSchema,
  })
  .strict()

export const PlanSuggestRequestSchema = z
  .object({
    workSchedule: WorkScheduleSchema,
    courseIds: IdListSchema,
    pinnedGroupIds: OptionalIdListSchema.optional(),
  })
  .strict()

export const RecommendationRequestSchema = z
  .object({
    studentId: z.string().trim().min(1, 'Indica el estudiante.'),
    selectedCourseIds: OptionalIdListSchema.optional(),
    maxCredits: z.number().int().positive('El límite de créditos debe ser positivo.').max(60).default(30),
    workSchedule: WorkScheduleSchema,
    preferences: z.object({ anchorDay: DaySchema.optional() }).strict().optional(),
  })
  .strict()

export type CompatibilityRequest = z.infer<typeof CompatibilityRequestSchema>
export type PlanValidateRequest = z.infer<typeof PlanValidateRequestSchema>
export type PlanSuggestRequest = z.infer<typeof PlanSuggestRequestSchema>
export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>

export type CatalogResponse = Catalog
export type CompatibilityResponse = { courses: CourseCompatibility[] }
export type PlanValidateResponse = Pick<Plan, 'isValid' | 'conflicts'>
export type PlanSuggestResponse = SuggestionResult

export type RecommendationResponse = import('@/lib/schedule/types').RecommendationResult

export type ApiError = {
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = T | ApiError
