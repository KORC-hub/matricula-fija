import { describe, expect, it } from 'vitest'
import { curriculum, curriculumByCode } from './curriculum'

describe('software engineering curriculum', () => {
  it('contains all ten semesters and the complete subject metadata', () => {
    expect(new Set(curriculum.map((subject) => subject.semester))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
    expect(curriculum).toHaveLength(56)
    expect(curriculum.every((subject) => subject.code && subject.name && subject.credits > 0)).toBe(true)
    expect(curriculumByCode.get('ET0113')).toMatchObject({
      name: 'Álgebra Lineal',
      semester: 5,
      credits: 4,
      tps: 4,
      tis: 8,
      tpt: 64,
      tit: 128,
      prerequisite: 'FB0006',
    })
  })
})
