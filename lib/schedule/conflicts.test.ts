import { describe, expect, it } from 'vitest'
import { findPlanConflicts } from './conflicts'
import type { CourseGroup, WorkSchedule } from './types'

const workSchedule: WorkSchedule = {
  blocks: [{ day: 'mon', start: '06:00', end: '14:00' }],
  commuteMinutes: 45,
}

const group = (id: string, courseId: string, start: string, end: string): CourseGroup => ({
  id,
  courseId,
  label: 'G1',
  blocks: [{ day: 'mon', start: start as CourseGroup['blocks'][number]['start'], end: end as CourseGroup['blocks'][number]['end'] }],
  seatsLeft: 10,
})

describe('plan conflicts', () => {
  it('detects work-class and class-class conflicts', () => {
    const conflicts = findPlanConflicts(workSchedule, [
      group('course-a-g1', 'course-a', '10:00', '12:00'),
      group('course-b-g1', 'course-b', '10:00', '12:00'),
    ])

    expect(conflicts).toHaveLength(3)
    expect(conflicts.filter((conflict) => conflict.type === 'work_class')).toHaveLength(2)
    expect(conflicts.find((conflict) => conflict.type === 'class_class')).toMatchObject({
      groupIds: ['course-a-g1', 'course-b-g1'],
      courseIds: ['course-a', 'course-b'],
    })
  })

  it('does not flag exact boundaries as class conflicts', () => {
    const conflicts = findPlanConflicts({ blocks: [], commuteMinutes: 0 }, [
      group('course-a-g1', 'course-a', '10:00', '12:00'),
      group('course-b-g1', 'course-b', '12:00', '14:00'),
    ])
    expect(conflicts).toEqual([])
  })
})
