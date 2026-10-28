import { describe, expect, it } from 'vitest'
import { catalog } from '@/data/catalog'
import { demoSelectedCourseIds, demoWorkSchedule } from '@/data/demo'
import { GET as getCatalog } from './catalog/route'
import { POST as postCompatibility } from './compatibility/route'
import { POST as postSuggest } from './plan/suggest/route'
import { POST as postRecommendations } from './recommendations/route'
import { POST as postValidate } from './plan/validate/route'

const jsonRequest = (path: string, body: unknown) => new Request(`http://localhost${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

describe('P0 API route handlers', () => {
  it('returns the fictitious catalog with curriculum metadata', async () => {
    const response = getCatalog()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(catalog)
    expect(body.courses.find((course: { id: string }) => course.id === 'estadistica-aplicada')).toMatchObject({
      name: 'Métodos Numéricos',
      code: 'ET0189',
      semester: 5,
      credits: 2,
      prerequisite: 'FB0008',
    })
    expect(body.courses.find((course: { id: string }) => course.id === 'bases-datos-ii')).toMatchObject({
      name: 'Álgebra Lineal',
      code: 'ET0113',
      semester: 5,
      credits: 4,
      prerequisite: 'FB0006',
    })
  })

  it('returns golden compatibility results', async () => {
    const response = await postCompatibility(jsonRequest('/api/compatibility', {
      workSchedule: demoWorkSchedule,
      courseIds: [...demoSelectedCourseIds],
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.courses.find((course: { courseId: string }) => course.courseId === 'estadistica-aplicada')).toMatchObject({ status: 'no_viable' })
    expect(body.courses.find((course: { courseId: string }) => course.courseId === 'bases-datos-ii').groups[0]).toMatchObject({ status: 'risk' })
  })

  it('normalizes invalid bodies and unknown IDs', async () => {
    const invalid = await postCompatibility(jsonRequest('/api/compatibility', { courseIds: [] }))
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } })

    const unknown = await postCompatibility(jsonRequest('/api/compatibility', {
      workSchedule: demoWorkSchedule,
      courseIds: ['does-not-exist'],
    }))
    expect(unknown.status).toBe(404)
    expect(await unknown.json()).toMatchObject({ error: { code: 'CATALOG_ITEM_NOT_FOUND' } })

    const invalidTime = await postCompatibility(jsonRequest('/api/compatibility', {
      workSchedule: { blocks: [{ day: 'mon', start: '14:00', end: '13:00' }], commuteMinutes: 0 },
      courseIds: ['bases-datos-ii'],
    }))
    expect(invalidTime.status).toBe(400)
    expect(await invalidTime.json()).toMatchObject({ error: { code: 'INVALID_TIME_BLOCK' } })
  })

  it('validates class conflicts without server state', async () => {
    const body = {
      workSchedule: demoWorkSchedule,
      groupIds: ['bases-datos-ii-g2', 'ingenieria-requisitos-g1'],
    }
    const first = await postValidate(jsonRequest('/api/plan/validate', body))
    const second = await postValidate(jsonRequest('/api/plan/validate', { ...body, groupIds: ['ingenieria-requisitos-g2'] }))
    expect(first.status).toBe(200)
    expect(await first.json()).toMatchObject({ isValid: false, conflicts: [{ type: 'class_class' }] })
    expect(await second.json()).toMatchObject({ isValid: true, conflicts: [] })
  })

  it('suggests the golden plan and honors pinned groups', async () => {
    const response = await postSuggest(jsonRequest('/api/plan/suggest', {
      workSchedule: demoWorkSchedule,
      courseIds: [...demoSelectedCourseIds],
      pinnedGroupIds: ['bases-datos-ii-g2'],
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.plan).toMatchObject({ credits: 12, isValid: true })
    expect(body.plan.groupIds).toContain('bases-datos-ii-g2')
  })

  it('accepts an empty pinned group list and suggests the golden plan', async () => {
    const response = await postSuggest(jsonRequest('/api/plan/suggest', {
      workSchedule: demoWorkSchedule,
      courseIds: [...demoSelectedCourseIds],
      pinnedGroupIds: [],
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.plan).toMatchObject({ credits: 12, isValid: true })
    expect(body.plan.groupIds).toEqual([
      'bases-datos-ii-g2',
      'ingenieria-requisitos-g2',
      'desarrollo-web-g1',
      'ingles-v-g1',
    ])
  })
})


describe('academic recommendations API', () => {
  it('returns stateless recommendations with prerequisite and modality data', async () => {
    const response = await postRecommendations(jsonRequest('/api/recommendations', {
      studentId: 'camilo-ospina',
      maxCredits: 12,
      workSchedule: demoWorkSchedule,
      preferences: { anchorDay: 'sat' },
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.recommendations).toEqual(expect.arrayContaining([
      expect.objectContaining({ courseId: 'inteligencia-negocios', canAdvance: true }),
    ]))
    expect(body.plan.credits).toBeLessThanOrEqual(12)
    expect(body.plan.selectedGroupIds).not.toContain('estadistica-aplicada-g1')
  })

  it('returns uniform errors for unknown students and invalid recommendation input', async () => {
    const unknown = await postRecommendations(jsonRequest('/api/recommendations', {
      studentId: 'unknown-student',
      workSchedule: { blocks: [], commuteMinutes: 0 },
    }))
    expect(unknown.status).toBe(404)
    expect(await unknown.json()).toMatchObject({ error: { code: 'STUDENT_NOT_FOUND' } })

    const invalid = await postRecommendations(jsonRequest('/api/recommendations', {
      studentId: 'camilo-ospina',
      maxCredits: 0,
      workSchedule: { blocks: [], commuteMinutes: 0 },
    }))
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  })
})
