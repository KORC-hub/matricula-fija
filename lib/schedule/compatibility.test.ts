import { describe, expect, it } from 'vitest'
import { catalog } from '@/data/catalog'
import { demoWorkSchedule } from '@/data/demo'
import { classifyGroup, summarizeCourse } from './compatibility'
import type { CourseGroup, WorkSchedule } from './types'

const group = (overrides: Partial<CourseGroup>): CourseGroup => ({
  id: 'test-g1',
  courseId: 'test-course',
  label: 'G1',
  blocks: [{ day: 'mon', start: '15:00', end: '16:00' }],
  seatsLeft: 10,
  ...overrides,
})

describe('schedule compatibility', () => {
  it('classifies the golden case with conflict, risk, and compatibility', () => {
    const numericalMethods = catalog.groups.find((item) => item.id === 'estadistica-aplicada-g1')!
    const linearAlgebraRisk = catalog.groups.find((item) => item.id === 'bases-datos-ii-g1')!
    const linearAlgebraCompatible = catalog.groups.find((item) => item.id === 'bases-datos-ii-g2')!

    expect(classifyGroup(numericalMethods, demoWorkSchedule).status).toBe('conflict')
    expect(classifyGroup(linearAlgebraRisk, demoWorkSchedule)).toMatchObject({
      status: 'risk',
      reason: {
        code: 'COMMUTE_TOO_SHORT',
        message: 'Termina tu turno a las 2:00 p. m. y la clase empieza a las 2:00 p. m.; necesitas aproximadamente 45 minutos para llegar.',
      },
    })
    expect(classifyGroup(linearAlgebraCompatible, demoWorkSchedule).status).toBe('compatible')
  })

  it('uses course precedence and handles a course without groups', () => {
    const course = { id: 'test-course', name: 'Curso de prueba', credits: 3, groupIds: [] }
    const noGroups = summarizeCourse(course, [], demoWorkSchedule)
    expect(noGroups).toMatchObject({ status: 'no_viable', reason: { code: 'NO_GROUPS' } })

    const riskGroup = group({ blocks: [{ day: 'mon', start: '14:00', end: '15:00' }] })
    const compatibleGroup = group({ id: 'test-g2', blocks: [{ day: 'sat', start: '14:00', end: '15:00' }] })
    expect(summarizeCourse(course, [riskGroup, compatibleGroup], demoWorkSchedule).status).toBe('compatible')
  })

  it('accepts zero commute and the exact commute boundary', () => {
    const schedule: WorkSchedule = {
      blocks: [{ day: 'mon', start: '06:00', end: '14:00' }],
      commuteMinutes: 0,
    }
    expect(classifyGroup(group({ blocks: [{ day: 'mon', start: '14:00', end: '15:00' }] }), schedule).status).toBe('compatible')

    const fortyFiveMinutes: WorkSchedule = { ...schedule, commuteMinutes: 45 }
    expect(classifyGroup(group({ blocks: [{ day: 'mon', start: '14:45', end: '15:00' }] }), fortyFiveMinutes).status).toBe('compatible')
    expect(classifyGroup(group({ blocks: [{ day: 'mon', start: '14:44', end: '15:00' }] }), fortyFiveMinutes).status).toBe('risk')
  })

  it('detects risk when class finishes before work starts', () => {
    const schedule: WorkSchedule = {
      blocks: [{ day: 'mon', start: '14:00', end: '18:00' }],
      commuteMinutes: 45,
    }
    expect(classifyGroup(group({ blocks: [{ day: 'mon', start: '13:30', end: '13:45' }] }), schedule)).toMatchObject({
      status: 'risk',
      reason: { code: 'COMMUTE_TOO_SHORT' },
    })
  })

  it('reports zero-seat groups separately from schedule compatibility', () => {
    expect(classifyGroup(group({ seatsLeft: 0 }), demoWorkSchedule)).toMatchObject({
      status: 'no_seats',
      reason: { code: 'NO_SEATS' },
    })
  })

  it('treats an empty work schedule as compatible', () => {
    expect(classifyGroup(group({ blocks: [{ day: 'mon', start: '06:00', end: '07:00' }] }), { blocks: [], commuteMinutes: 45 }).status).toBe('compatible')
  })
})
