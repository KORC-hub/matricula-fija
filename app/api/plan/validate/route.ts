import { NextResponse } from 'next/server'
import { catalogByGroupId } from '@/data/catalog'
import { PlanValidateRequestSchema } from '@/lib/api/contracts'
import { apiErrorResponse, catalogItemNotFound, inconsistentPlan, readValidatedJson } from '@/lib/api/errors'
import { findPlanConflicts } from '@/lib/schedule'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await readValidatedJson(request, PlanValidateRequestSchema)
    const groups = body.groupIds.map((groupId) => {
      const group = catalogByGroupId.get(groupId)
      if (!group) throw catalogItemNotFound('grupo', groupId)
      return group
    })

    const courseIds = groups.map((group) => group.courseId)
    if (new Set(courseIds).size !== courseIds.length) {
      throw inconsistentPlan('Solo puedes seleccionar un grupo por materia.')
    }

    const conflicts = findPlanConflicts(body.workSchedule, groups)
    return NextResponse.json({ isValid: conflicts.length === 0, conflicts })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
