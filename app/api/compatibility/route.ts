import { NextResponse } from 'next/server'
import { catalog, catalogByCourseId } from '@/data/catalog'
import { CompatibilityRequestSchema } from '@/lib/api/contracts'
import { apiErrorResponse, catalogItemNotFound, readValidatedJson } from '@/lib/api/errors'
import { summarizeCourse } from '@/lib/schedule'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await readValidatedJson(request, CompatibilityRequestSchema)
    const courses = body.courseIds.map((courseId) => {
      const course = catalogByCourseId.get(courseId)
      if (!course) throw catalogItemNotFound('materia', courseId)
      return course
    })

    return NextResponse.json({
      courses: courses.map((course) => {
        const groups = course.groupIds
          .map((groupId) => catalog.groups.find((group) => group.id === groupId))
          .filter((group): group is (typeof catalog.groups)[number] => Boolean(group))
        return summarizeCourse(course, groups, body.workSchedule)
      }),
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
