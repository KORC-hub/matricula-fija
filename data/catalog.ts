import offeringsJson from './course-offerings.json'
import { curriculumByCode } from '@/data/curriculum'
import type { Catalog, Course, CourseGroup } from '@/lib/schedule/types'

type OfferingSource = {
  courses: Array<{ id: string; code: string; groupIds: string[] }>
  groups: CourseGroup[]
}

const offeringSource = offeringsJson as OfferingSource

function offeredCourse(source: OfferingSource['courses'][number]): Course {
  const subject = curriculumByCode.get(source.code)
  if (!subject) throw new Error(`Missing curriculum subject ${source.code}`)

  return {
    id: source.id,
    name: subject.name,
    credits: subject.credits,
    groupIds: source.groupIds,
    code: subject.code,
    semester: subject.semester,
    tps: subject.tps,
    tis: subject.tis,
    tpt: subject.tpt,
    tit: subject.tit,
    prerequisite: subject.prerequisite,
  }
}

// Stable IDs and legacy metadata are retained while JSON is the offering source of truth.
export const courses: Course[] = offeringSource.courses.map(offeredCourse)
export const groups: CourseGroup[] = offeringSource.groups
export const catalog: Catalog = { courses, groups }

export const catalogByCourseId = new Map(courses.map((course) => [course.id, course]))
export const catalogByGroupId = new Map(groups.map((group) => [group.id, group]))
