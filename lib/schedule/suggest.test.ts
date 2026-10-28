import { describe, expect, it } from 'vitest'
import { catalog } from '@/data/catalog'
import { demoSelectedCourseIds, demoWorkSchedule } from '@/data/demo'
import { suggestPlan } from './suggest'
import type { Catalog } from './types'

describe('deterministic plan suggestion', () => {
  it('returns the golden four-course, twelve-credit plan', () => {
    const result = suggestPlan({
      workSchedule: demoWorkSchedule,
      courseIds: [...demoSelectedCourseIds],
    }, catalog)

    expect(result.plan).toMatchObject({
      groupIds: [
        'bases-datos-ii-g2',
        'ingenieria-requisitos-g2',
        'desarrollo-web-g1',
        'ingles-v-g1',
      ],
      courseIds: ['bases-datos-ii', 'ingenieria-requisitos', 'desarrollo-web', 'ingles-v'],
      credits: 12,
      conflicts: [],
      isValid: true,
    })
    expect(result.blockedCourses).toEqual([
      { courseId: 'estadistica-aplicada', reason: 'Su oferta no tiene un grupo con cupos que evite el choque con tu horario laboral.' },
    ])
  })

  it('prefers the virtual group when compatible groups tie', () => {
    const result = suggestPlan({
      workSchedule: { blocks: [], commuteMinutes: 0 },
      courseIds: ['estadistica-probabilidad'],
    }, catalog)

    expect(result.plan?.groupIds).toEqual(['estadistica-probabilidad-g2'])
  })

  it('is deterministic and preserves a valid pinned group', () => {
    const input = { workSchedule: demoWorkSchedule, courseIds: [...demoSelectedCourseIds], pinnedGroupIds: ['bases-datos-ii-g2'] }
    const first = suggestPlan(input, catalog)
    const second = suggestPlan(input, catalog)
    expect(first).toEqual(second)
    expect(first.plan?.groupIds).toContain('bases-datos-ii-g2')
  })

  it('never suggests a group without seats', () => {
    const noSeatsCatalog: Catalog = {
      courses: [{ id: 'full-course', name: 'Curso lleno', credits: 3, groupIds: ['full-course-g1'] }],
      groups: [{ id: 'full-course-g1', courseId: 'full-course', label: 'G1', blocks: [{ day: 'sat', start: '08:00', end: '10:00' }], seatsLeft: 0 }],
    }
    const result = suggestPlan({ workSchedule: { blocks: [], commuteMinutes: 0 }, courseIds: ['full-course'] }, noSeatsCatalog)
    expect(result.plan).toBeUndefined()
    expect(result.blockedCourses[0].reason).toContain('cupos')
  })

  it('reports a course with all groups in a work conflict and a no-group course', () => {
    const noSolutionCatalog: Catalog = {
      courses: [
        { id: 'blocked', name: 'Bloqueada', credits: 3, groupIds: ['blocked-g1', 'blocked-g2'] },
        { id: 'empty', name: 'Sin grupos', credits: 2, groupIds: [] },
      ],
      groups: [
        { id: 'blocked-g1', courseId: 'blocked', label: 'G1', blocks: [{ day: 'mon', start: '08:00', end: '09:00' }], seatsLeft: 2 },
        { id: 'blocked-g2', courseId: 'blocked', label: 'G2', blocks: [{ day: 'mon', start: '10:00', end: '11:00' }], seatsLeft: 2 },
      ],
    }
    const result = suggestPlan({
      workSchedule: { blocks: [{ day: 'mon', start: '06:00', end: '14:00' }], commuteMinutes: 0 },
      courseIds: ['blocked', 'empty'],
    }, noSolutionCatalog)

    expect(result.plan).toBeUndefined()
    expect(result.blockedCourses).toHaveLength(2)
    expect(result.explanation).toContain('combinación completa')
  })
})
