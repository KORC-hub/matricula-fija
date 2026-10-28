import { NextResponse } from 'next/server'
import { academicRecordsByStudentId, studentsById } from '@/data/academic'
import { catalog, catalogByCourseId } from '@/data/catalog'
import { RecommendationRequestSchema } from '@/lib/api/contracts'
import { apiErrorResponse, catalogItemNotFound, readValidatedJson, studentNotFound } from '@/lib/api/errors'
import { recommendAcademicPlan } from '@/lib/schedule'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await readValidatedJson(request, RecommendationRequestSchema)
    const student = studentsById.get(body.studentId)
    const record = academicRecordsByStudentId.get(body.studentId)
    if (!student || !record) throw studentNotFound(body.studentId)
    for (const courseId of body.selectedCourseIds ?? []) {
      if (!catalogByCourseId.has(courseId)) throw catalogItemNotFound('materia', courseId)
    }

    const result = recommendAcademicPlan({ ...body, maxCredits: body.maxCredits ?? 30 }, catalog, student, record)
    return NextResponse.json(result)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
