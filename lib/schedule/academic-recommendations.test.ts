import { describe, expect, it } from 'vitest'
import { academicRecordsByStudentId, studentsById } from '@/data/academic'
import { catalog } from '@/data/catalog'
import { demoWorkSchedule } from '@/data/demo'
import { classifyGroup } from './compatibility'
import { recommendAcademicPlan } from './recommend'
import type { AcademicRecord, Catalog, Course, CourseGroup, StudentProfile, WorkSchedule } from './types'

const student: StudentProfile = {
  id: 'test-student',
  name: 'Estudiante de prueba',
  email: 'test@example.local',
  university: 'Universidad de ejemplo',
  program: 'Ingeniería de Software',
  currentSemester: 5,
}
const record: AcademicRecord = {
  studentId: student.id,
  entries: [
    { courseId: 'PREREQ-OK', status: 'aprobado' },
    { courseId: 'PREREQ-HOMOLOGATED', status: 'homologado' },
    { courseId: 'ET0082', status: 'aprobado' },
  ],
}
const emptyWork: WorkSchedule = { blocks: [], commuteMinutes: 0 }

function course(overrides: Partial<Course> = {}): Course {
  return { id: 'course-a', name: 'Curso A', credits: 3, semester: 5, groupIds: ['group-a'], ...overrides }
}
function group(overrides: Partial<CourseGroup> = {}): CourseGroup {
  return {
    id: 'group-a',
    courseId: 'course-a',
    label: 'G1',
    modality: 'presencial',
    blocks: [{ day: 'mon', start: '14:00', end: '15:00' }],
    seatsLeft: 10,
    ...overrides,
  }
}
function customCatalog(courses: Course[], groups: CourseGroup[]): Catalog {
  return { courses, groups }
}

const recommendationInput = (overrides: Partial<Parameters<typeof recommendAcademicPlan>[0]> = {}) => ({
  studentId: student.id,
  maxCredits: 30,
  workSchedule: emptyWork,
  ...overrides,
})

describe('academic recommendation engine', () => {
  it('marks a future course advanceable only when prerequisites are satisfied', () => {
    const eligible = course({ id: 'future-ok', semester: 6, prerequisite: 'PREREQ-OK' })
    const blocked = course({ id: 'future-blocked', semester: 7, prerequisite: 'PREREQ-MISSING', groupIds: ['group-b'] })
    const result = recommendAcademicPlan(
      recommendationInput({ selectedCourseIds: [eligible.id, blocked.id] }),
      customCatalog([eligible, blocked], [group({ courseId: eligible.id }), group({ id: 'group-b', courseId: blocked.id })]),
      student,
      record,
    )

    expect(result.recommendations.find((item) => item.courseId === eligible.id)).toMatchObject({ canAdvance: true, classification: 'compatible' })
    expect(result.recommendations.find((item) => item.courseId === blocked.id)).toMatchObject({
      canAdvance: false,
      classification: 'blocked_prerequisite',
      prerequisiteStatus: { missing: ['PREREQ-MISSING'], eligible: false },
    })
  })

  it('accepts homologated prerequisites and rejects pending or failed ones', () => {
    const homologated = course({ id: 'homologated', semester: 6, prerequisite: 'PREREQ-HOMOLOGATED' })
    const pending = course({ id: 'pending', semester: 6, prerequisite: 'PREREQ-PENDING', groupIds: ['group-b'] })
    const failedRecord: AcademicRecord = {
      ...record,
      entries: [...record.entries, { courseId: 'PREREQ-PENDING', status: 'reprobado' }],
    }
    const result = recommendAcademicPlan(
      recommendationInput({ selectedCourseIds: [homologated.id, pending.id] }),
      customCatalog([homologated, pending], [group({ courseId: homologated.id }), group({ id: 'group-b', courseId: pending.id })]),
      student,
      failedRecord,
    )
    expect(result.recommendations.find((item) => item.courseId === homologated.id)?.canAdvance).toBe(true)
    expect(result.recommendations.find((item) => item.courseId === pending.id)?.classification).toBe('blocked_prerequisite')
  })

  it('changes commute risk for office versus remote and keeps commute zero compatible', () => {
    const classGroup = group({ blocks: [{ day: 'mon', start: '14:30', end: '15:30' }] })
    const office: WorkSchedule = {
      blocks: [{ day: 'mon', start: '06:00', end: '14:00' }],
      commuteMinutes: 45,
      dayPreferences: [{ day: 'mon', start: '06:00', end: '14:00', workMode: 'office' }],
    }
    const remote = { ...office, dayPreferences: [{ ...office.dayPreferences![0], workMode: 'remote' as const }] }
    expect(classifyGroup(classGroup, office).status).toBe('risk')
    expect(classifyGroup(classGroup, remote).status).toBe('compatible')
    expect(classifyGroup(classGroup, { ...office, commuteMinutes: 0 }).status).toBe('compatible')
  })

  it('uses anchor day only as a ranking preference', () => {
    const anchorCourse = course({ id: 'anchor-course', groupIds: ['anchor-other', 'anchor-day'] })
    const result = recommendAcademicPlan(
      recommendationInput({ selectedCourseIds: [anchorCourse.id], preferences: { anchorDay: 'sat' } }),
      customCatalog([anchorCourse], [
        group({ id: 'anchor-other', courseId: anchorCourse.id, blocks: [{ day: 'mon', start: '10:00', end: '11:00' }] }),
        group({ id: 'anchor-day', courseId: anchorCourse.id, blocks: [{ day: 'sat', start: '10:00', end: '11:00' }] }),
      ]),
      student,
      record,
    )
    expect(result.recommendations[0].classification).toBe('compatible')
    expect(result.recommendations[0].compatibleGroups[0].groupId).toBe('anchor-day')
  })

  it('never recommends groups without seats', () => {
    const full = course({ id: 'full-course' })
    const result = recommendAcademicPlan(
      recommendationInput({ selectedCourseIds: [full.id] }),
      customCatalog([full], [group({ courseId: full.id, seatsLeft: 0 })]),
      student,
      record,
    )
    expect(result.recommendations[0]).toMatchObject({ classification: 'no_seats' })
    expect(result.plan.selectedCourseIds).toEqual([])
  })

  it('maximizes credits under the limit and avoids class conflicts', () => {
    const first = course({ id: 'first', credits: 3, groupIds: ['first-group'] })
    const second = course({ id: 'second', credits: 2, groupIds: ['second-group'] })
    const third = course({ id: 'third', credits: 2, groupIds: ['third-group'] })
    const result = recommendAcademicPlan(
      recommendationInput({ selectedCourseIds: [first.id, second.id, third.id], maxCredits: 4 }),
      customCatalog([first, second, third], [
        group({ id: 'first-group', courseId: first.id }),
        group({ id: 'second-group', courseId: second.id, blocks: [{ day: 'tue', start: '10:00', end: '11:00' }] }),
        group({ id: 'third-group', courseId: third.id, blocks: [{ day: 'tue', start: '10:30', end: '11:30' }] }),
      ]),
      student,
      record,
    )
    expect(result.plan.credits).toBe(3)
    expect(result.plan.selectedCourseIds).toEqual(['first'])
    expect(result.plan.notIncluded.find((item) => item.courseId === second.id)?.reason).toContain('límite')
  })

  it('handles an empty schedule and exact commute boundary', () => {
    const exactGroup = group({ blocks: [{ day: 'mon', start: '14:45', end: '15:00' }] })
    const exactWork: WorkSchedule = {
      blocks: [{ day: 'mon', start: '06:00', end: '14:00' }],
      commuteMinutes: 45,
    }
    expect(classifyGroup(exactGroup, emptyWork).status).toBe('compatible')
    expect(classifyGroup(exactGroup, exactWork).status).toBe('compatible')
    expect(classifyGroup(group({ blocks: [{ day: 'mon', start: '14:44', end: '15:00' }] }), exactWork).status).toBe('risk')
  })

  it('loads JSON academic fixtures and offers future courses for Camilo', () => {
    const camilo = studentsById.get('camilo-ospina')!
    const camiloRecord = academicRecordsByStudentId.get('camilo-ospina')!
    const result = recommendAcademicPlan({
      studentId: camilo.id,
      maxCredits: 30,
      workSchedule: demoWorkSchedule,
    }, catalog, camilo, camiloRecord)
    expect(catalog.courses.filter((item) => (item.semester ?? 0) >= 5).length).toBeGreaterThan(5)
    expect(result.recommendations.some((item) => item.canAdvance)).toBe(true)
  })
})
