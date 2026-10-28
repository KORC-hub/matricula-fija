import curriculumJson from './curriculum.json'

export type CurriculumSubject = {
  code: string
  name: string
  semester: number
  credits: number
  tps: number
  tis: number
  tpt: number
  tit: number
  prerequisite: string | null
}

// JSON is the source of truth; this adapter preserves the existing TypeScript API.
export const curriculum: CurriculumSubject[] = curriculumJson as CurriculumSubject[]

export const curriculumByCode = new Map(curriculum.map((subject) => [subject.code, subject]))

export function getCurriculumSubject(code: string): CurriculumSubject | undefined {
  return curriculumByCode.get(code)
}
