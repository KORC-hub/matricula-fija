import { describe, expect, it } from 'vitest'
import { catalog } from '@/data/catalog'
import { demoWorkSchedule } from '@/data/demo'
import { recommendAvailableCourses } from './recommend'
import type { Catalog } from './types'

describe('semester course recommendations', () => {
  it('recommends offered fifth-semester courses with seats', () => {
    expect(recommendAvailableCourses(5, catalog).map((course) => course.code)).toEqual([
      'ET0189',
      'ET0113',
      'ET0191',
      'ET0192',
      'FB0083',
    ])
  })

  it('filters only work conflicts when a schedule is provided', () => {
    const recommendations = recommendAvailableCourses(5, catalog, demoWorkSchedule)
    expect(recommendations.map((course) => course.code)).toEqual(['ET0113', 'ET0191', 'ET0192', 'FB0083'])
  })

  it('does not recommend a full group', () => {
    const fullCatalog: Catalog = {
      courses: [{ id: 'full', name: 'Materia llena', credits: 2, semester: 5, groupIds: ['full-g1'] }],
      groups: [{ id: 'full-g1', courseId: 'full', label: 'G1', blocks: [], seatsLeft: 0 }],
    }
    expect(recommendAvailableCourses(5, fullCatalog)).toEqual([])
  })
})
