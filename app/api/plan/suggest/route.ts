import { NextResponse } from 'next/server'
import { catalog, catalogByCourseId, catalogByGroupId } from '@/data/catalog'
import { PlanSuggestRequestSchema } from '@/lib/api/contracts'
import { apiErrorResponse, catalogItemNotFound, inconsistentPlan, readValidatedJson } from '@/lib/api/errors'
import { suggestPlan } from '@/lib/schedule'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await readValidatedJson(request, PlanSuggestRequestSchema)
    for (const courseId of body.courseIds) {
      if (!catalogByCourseId.has(courseId)) throw catalogItemNotFound('materia', courseId)
    }
    for (const groupId of body.pinnedGroupIds ?? []) {
      if (!catalogByGroupId.has(groupId)) throw catalogItemNotFound('grupo', groupId)
      const group = catalogByGroupId.get(groupId)
      if (group && !body.courseIds.includes(group.courseId)) {
        throw inconsistentPlan('Un grupo fijado debe pertenecer a una materia elegida.')
      }
    }

    return NextResponse.json(suggestPlan(body, catalog))
  } catch (error) {
    return apiErrorResponse(error)
  }
}
