import {
  Campus,
  Stream,
  Exam,
  ExamPaper,
  ExamScheduleEntry,
  ExamAttendance,
  ExamMark,
  ExamResult,
  ExamRollAssignment,
  ClassRollAssignment,
} from '../types';
import { SchoolStoreState } from '../mock-store/school-store';

export function selectCampuses(store: SchoolStoreState, includeInactive = false): Campus[] {
  if (includeInactive) return store.campuses;
  return store.campuses.filter((c) => c.status === 'ACTIVE');
}

export function selectCampusById(store: SchoolStoreState, id?: string | null): Campus | undefined {
  if (!id) return undefined;
  return store.campuses.find((c) => c.id === id);
}

export function selectStreams(store: SchoolStoreState, includeInactive = false): Stream[] {
  if (includeInactive) return store.streams;
  return store.streams.filter((s) => s.status === 'ACTIVE');
}

export function selectStreamById(store: SchoolStoreState, id?: string | null): Stream | undefined {
  if (!id) return undefined;
  return store.streams.find((s) => s.id === id);
}

export function selectClassRollByStudent(
  store: SchoolStoreState,
  studentId: string
): ClassRollAssignment | undefined {
  return store.classRollAssignments.find((a) => a.studentId === studentId && a.status === 'ACTIVE');
}

export function selectExamRollByStudent(
  store: SchoolStoreState,
  studentId: string
): ExamRollAssignment | undefined {
  return store.examRollAssignments.find((a) => a.studentId === studentId && a.status === 'ACTIVE');
}

export function selectExams(store: SchoolStoreState): Exam[] {
  return store.exams;
}

export function selectExamById(store: SchoolStoreState, id?: string | null): Exam | undefined {
  if (!id) return undefined;
  return store.exams.find((e) => e.id === id);
}

export function selectExamPapers(store: SchoolStoreState, examId: string): ExamPaper[] {
  return store.examPapers.filter((p) => p.examId === examId);
}

export function selectExamPaperById(store: SchoolStoreState, id?: string | null): ExamPaper | undefined {
  if (!id) return undefined;
  return store.examPapers.find((p) => p.id === id);
}

export function selectExamSchedule(store: SchoolStoreState, examId: string): ExamScheduleEntry[] {
  return store.examSchedule
    .filter((s) => s.examId === examId)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
}

export interface CandidateFilters {
  campusId?: string;
  classId?: string;
  sectionId?: string;
  streamId?: string;
  search?: string;
}

export interface ResolvedExamCandidate {
  studentId: string;
  name: string;
  admissionNumber: string;
  permanentId: string;
  campusId: string;
  campusName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  streamId?: string | null;
  streamName?: string;
  classRollNumber: number;
  examRollNumber: string;
  status: string;
  isEligible: boolean;
  photoUrl?: string;
}

export function selectExamCandidates(
  store: SchoolStoreState,
  examId: string,
  filters?: CandidateFilters
): ResolvedExamCandidate[] {
  const exam = selectExamById(store, examId);
  if (!exam) return [];

  // Students belonging to the exam's applicable classes
  return store.students
    .filter((std) => {
      if (!exam.classIds.includes(std.classId)) return false;

      // Filter by campus (supports All Campuses vs specific campus)
      if (filters?.campusId && filters.campusId !== 'ALL' && std.campusId !== filters.campusId) {
        return false;
      }
      if (filters?.classId && filters.classId !== 'ALL' && std.classId !== filters.classId) {
        return false;
      }
      if (filters?.sectionId && filters.sectionId !== 'ALL' && std.sectionId !== filters.sectionId) {
        return false;
      }
      if (filters?.streamId && filters.streamId !== 'ALL' && std.streamId !== filters.streamId) {
        return false;
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchesName = std.name.toLowerCase().includes(q);
        const matchesAdm = std.admissionNumber.toLowerCase().includes(q);
        const matchesExamRoll = (std.examRollNumber || '').toLowerCase().includes(q);
        const matchesClassRoll = String(std.classRollNumber || '').includes(q);
        if (!matchesName && !matchesAdm && !matchesExamRoll && !matchesClassRoll) {
          return false;
        }
      }
      return true;
    })
    .map((std) => {
      const campus = selectCampusById(store, std.campusId);
      const cls = store.classes.find((c) => c.id === std.classId);
      const sec = cls?.sections.find((s) => s.id === std.sectionId);
      const stream = selectStreamById(store, std.streamId);
      const classRoll = selectClassRollByStudent(store, std.id)?.rollNumber ?? (std.classRollNumber || 0);
      const examRoll = selectExamRollByStudent(store, std.id)?.examRollNumber ?? (std.examRollNumber || 'N/A');

      return {
        studentId: std.id,
        name: std.name,
        admissionNumber: std.admissionNumber,
        permanentId: std.id,
        campusId: std.campusId || 'cmp-main',
        campusName: campus?.name || 'Main Campus',
        classId: std.classId,
        className: cls?.className || 'Class',
        sectionId: std.sectionId,
        sectionName: sec?.name || 'A',
        streamId: std.streamId,
        streamName: stream?.name,
        classRollNumber: classRoll,
        examRollNumber: examRoll,
        status: std.status,
        isEligible: std.status === 'ACTIVE',
        photoUrl: std.photoUrl,
      };
    })
    .sort((a, b) => a.examRollNumber.localeCompare(b.examRollNumber, undefined, { numeric: true }));
}

export function selectExamAttendance(
  store: SchoolStoreState,
  examId: string,
  paperId?: string
): ExamAttendance[] {
  return store.examAttendances.filter((a) => {
    if (a.examId !== examId) return false;
    if (paperId && a.paperId !== paperId) return false;
    return true;
  });
}

export function selectExamMarks(
  store: SchoolStoreState,
  examId: string,
  paperId?: string
): ExamMark[] {
  return store.examMarks.filter((m) => {
    if (m.examId !== examId) return false;
    if (paperId && m.paperId !== paperId) return false;
    return true;
  });
}

export function selectExamResults(
  store: SchoolStoreState,
  examId: string,
  filters?: { campusId?: string; classId?: string; sectionId?: string; streamId?: string; search?: string }
): ExamResult[] {
  return store.examResults.filter((r) => {
    if (r.examId !== examId) return false;
    if (filters?.campusId && filters.campusId !== 'ALL' && r.campusId !== filters.campusId) {
      return false;
    }
    if (filters?.classId && filters.classId !== 'ALL' && r.classId !== filters.classId) {
      return false;
    }
    if (filters?.sectionId && filters.sectionId !== 'ALL' && r.sectionId !== filters.sectionId) {
      return false;
    }
    if (filters?.streamId && filters.streamId !== 'ALL' && r.streamId !== filters.streamId) {
      return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const student = store.students.find((s) => s.id === r.studentId);
      const matchesName = student?.name.toLowerCase().includes(q) || false;
      const matchesRoll = r.examRollNumber.toLowerCase().includes(q);
      if (!matchesName && !matchesRoll) return false;
    }
    return true;
  });
}

export interface AllCampusResultSummary {
  examId: string;
  totalCandidates: number;
  totalAppeared: number;
  totalPassed: number;
  totalFailed: number;
  totalCompartment: number;
  schoolPassPercentage: number;
  schoolAveragePercentage: number;
  highestPercentage: number;
  topperStudent?: {
    name: string;
    examRollNumber: string;
    campusName: string;
    percentage: number;
  };
  campusBreakdowns: Array<{
    campusId: string;
    campusName: string;
    candidates: number;
    passed: number;
    failed: number;
    passPercentage: number;
    averageScore: number;
  }>;
  streamBreakdowns: Array<{
    streamId: string;
    streamName: string;
    candidates: number;
    passPercentage: number;
    averageScore: number;
  }>;
}

export function calculateAllCampusResultSummary(
  store: SchoolStoreState,
  examId: string
): AllCampusResultSummary {
  const allResults = store.examResults.filter((r) => r.examId === examId);
  const totalCandidates = allResults.length;
  const totalPassed = allResults.filter((r) => r.overallStatus === 'PASS').length;
  const totalFailed = allResults.filter((r) => r.overallStatus === 'FAIL').length;
  const totalCompartment = allResults.filter((r) => r.overallStatus === 'COMPARTMENT').length;

  const sumPct = allResults.reduce((acc, curr) => acc + curr.percentage, 0);
  const schoolAveragePercentage = totalCandidates > 0 ? Number((sumPct / totalCandidates).toFixed(1)) : 0;
  const schoolPassPercentage = totalCandidates > 0 ? Number(((totalPassed / totalCandidates) * 100).toFixed(1)) : 0;

  let highestPercentage = 0;
  let topperStudent: AllCampusResultSummary['topperStudent'];

  allResults.forEach((res) => {
    if (res.percentage > highestPercentage) {
      highestPercentage = res.percentage;
      const std = store.students.find((s) => s.id === res.studentId);
      const cmp = selectCampusById(store, res.campusId);
      topperStudent = {
        name: std?.name || 'Student',
        examRollNumber: res.examRollNumber,
        campusName: cmp?.name || 'Campus',
        percentage: res.percentage,
      };
    }
  });

  // Campus breakdowns across all campuses
  const campusBreakdowns = store.campuses.map((campus) => {
    const campusResults = allResults.filter((r) => r.campusId === campus.id);
    const count = campusResults.length;
    const passed = campusResults.filter((r) => r.overallStatus === 'PASS').length;
    const failed = campusResults.filter((r) => r.overallStatus === 'FAIL').length;
    const passPct = count > 0 ? Number(((passed / count) * 100).toFixed(1)) : 0;
    const avgScore = count > 0 ? Number((campusResults.reduce((a, c) => a + c.percentage, 0) / count).toFixed(1)) : 0;

    return {
      campusId: campus.id,
      campusName: campus.name,
      candidates: count,
      passed,
      failed,
      passPercentage: passPct,
      averageScore: avgScore,
    };
  });

  // Stream breakdowns for senior classes
  const streamBreakdowns = store.streams.map((stream) => {
    const streamResults = allResults.filter((r) => r.streamId === stream.id);
    const count = streamResults.length;
    const passed = streamResults.filter((r) => r.overallStatus === 'PASS').length;
    const passPct = count > 0 ? Number(((passed / count) * 100).toFixed(1)) : 0;
    const avgScore = count > 0 ? Number((streamResults.reduce((a, c) => a + c.percentage, 0) / count).toFixed(1)) : 0;

    return {
      streamId: stream.id,
      streamName: stream.name,
      candidates: count,
      passPercentage: passPct,
      averageScore: avgScore,
    };
  });

  return {
    examId,
    totalCandidates,
    totalAppeared: totalCandidates,
    totalPassed,
    totalFailed,
    totalCompartment,
    schoolPassPercentage,
    schoolAveragePercentage,
    highestPercentage,
    topperStudent,
    campusBreakdowns,
    streamBreakdowns,
  };
}
