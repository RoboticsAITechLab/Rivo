import {
  Campus,
  Stream,
  RollAllocationConfig,
  ClassRollAssignment,
  ExamRollAssignment,
  Exam,
  ExamPaper,
  ExamScheduleEntry,
  ExamAttendance,
  ExamMark,
  ExamResult,
  Student,
  SchoolClass,
  Subject,
} from '../types';

// Purged: No hardcoded campus business records. Campuses start empty.
export const initialCampuses: Campus[] = [];

// Purged: No hardcoded streams. Streams start empty.
export const initialStreams: Stream[] = [];

// Default roll allocation configuration schema
export const initialRollAllocationConfig: RollAllocationConfig = {
  scope: 'SCHOOL_WIDE',
  class1_10Rule: {
    startNumber: 1,
    format: '1',
  },
  class11_12Rule: {
    streamAware: true,
    streamRules: {},
  },
  reservedNumbers: [],
  nextAvailableNumber: 1,
  lastUpdated: new Date().toISOString(),
};

// Purged: Zero seeded exam, marks, schedule, paper, and roll records
export function seedExamAndRollData(
  students: Student[],
  classes: SchoolClass[],
  subjects: Subject[]
) {
  const enrichedStudents: Student[] = [...students];
  const classRollAssignments: ClassRollAssignment[] = [];
  const examRollAssignments: ExamRollAssignment[] = [];
  const exams: Exam[] = [];
  const examPapers: ExamPaper[] = [];
  const examSchedule: ExamScheduleEntry[] = [];
  const examAttendances: ExamAttendance[] = [];
  const examMarks: ExamMark[] = [];
  const examResults: ExamResult[] = [];

  return {
    enrichedStudents,
    classRollAssignments,
    examRollAssignments,
    exams,
    examPapers,
    examSchedule,
    examAttendances,
    examMarks,
    examResults,
  };
}
