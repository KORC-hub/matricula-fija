import recordsJson from './academic-records.json'
import studentsJson from './students.json'
import type { AcademicRecord, StudentProfile } from '@/lib/schedule/types'

export const students = studentsJson as StudentProfile[]
export const academicRecords = recordsJson as AcademicRecord[]
export const studentsById = new Map(students.map((student) => [student.id, student]))
export const academicRecordsByStudentId = new Map(academicRecords.map((record) => [record.studentId, record]))
