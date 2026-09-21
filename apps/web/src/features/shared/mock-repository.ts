import { TeacherDetail } from '@/features/teachers/types';
import { ClassItem } from '@/features/classes/types';
import { SubjectDetail } from '@/features/subjects/types';
import { TimetablePeriod, TimetableConflict } from '@/features/timetable/types';
import { AttendanceRegisterItem, ClassAttendanceSummary, AttendanceAttentionItem, StudentAttendanceHistory } from '@/features/attendance/types';
import { HomeworkItem } from '@/features/homework/types';

import { initialMockTeachers } from '@/features/teachers/data/mock-teachers';
import { initialMockClasses } from '@/features/classes/data/mock-classes';
import { initialMockSubjects } from '@/features/subjects/data/mock-subjects';
import { initialMockTimetable } from '@/features/timetable/data/mock-timetable';
import { initialMockAttendanceRegister, initialMockAttendanceSummaries, initialMockAttendanceAlerts } from '@/features/attendance/data/mock-attendance';
import { initialMockHomeworkList } from '@/features/homework/data/mock-homework';

class SchoolMockRepository {
  private teachers: TeacherDetail[] = [...initialMockTeachers];
  private classes: ClassItem[] = [...initialMockClasses];
  private subjects: SubjectDetail[] = [...initialMockSubjects];
  private timetable: TimetablePeriod[] = [...initialMockTimetable];
  private attendanceRegisters: Map<string, AttendanceRegisterItem[]> = new Map();
  private attendanceSummaries: ClassAttendanceSummary[] = [...initialMockAttendanceSummaries];
  private attendanceAlerts: AttendanceAttentionItem[] = [...initialMockAttendanceAlerts];
  private homeworkList: HomeworkItem[] = [...initialMockHomeworkList];

  constructor() {
    // Empty initial state
  }

  // ==========================================
  // TEACHERS API
  // ==========================================
  getTeachers(): TeacherDetail[] {
    return [...this.teachers];
  }

  getTeacherById(id: string): TeacherDetail | undefined {
    return this.teachers.find((t) => t.id === id);
  }

  saveTeacher(teacher: TeacherDetail): TeacherDetail {
    const index = this.teachers.findIndex((t) => t.id === teacher.id);
    if (index >= 0) {
      this.teachers[index] = { ...teacher, updatedAt: new Date().toISOString() };
    } else {
      this.teachers.unshift(teacher);
    }
    return teacher;
  }

  updateTeacherStatus(id: string, status: TeacherDetail['status']): boolean {
    const teacher = this.teachers.find((t) => t.id === id);
    if (teacher) {
      teacher.status = status;
      teacher.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // ==========================================
  // CLASSES API
  // ==========================================
  getClasses(): ClassItem[] {
    return [...this.classes];
  }

  getClassById(id: string): ClassItem | undefined {
    return this.classes.find((c) => c.id === id);
  }

  saveClass(classItem: ClassItem): ClassItem {
    const index = this.classes.findIndex((c) => c.id === classItem.id);
    if (index >= 0) {
      this.classes[index] = classItem;
    } else {
      this.classes.push(classItem);
    }
    return classItem;
  }

  // ==========================================
  // SUBJECTS API
  // ==========================================
  getSubjects(): SubjectDetail[] {
    return [...this.subjects];
  }

  getSubjectById(id: string): SubjectDetail | undefined {
    return this.subjects.find((s) => s.id === id);
  }

  saveSubject(subject: SubjectDetail): SubjectDetail {
    const index = this.subjects.findIndex((s) => s.id === subject.id);
    if (index >= 0) {
      this.subjects[index] = subject;
    } else {
      this.subjects.push(subject);
    }
    return subject;
  }

  // ==========================================
  // TIMETABLE API & CONFLICT ENGINE
  // ==========================================
  getTimetable(filters?: { classId?: string; sectionId?: string; teacherId?: string; room?: string }): TimetablePeriod[] {
    return this.timetable.filter((period) => {
      if (filters?.classId && period.classId !== filters.classId) return false;
      if (filters?.sectionId && period.sectionId !== filters.sectionId) return false;
      if (filters?.teacherId && period.teacherId !== filters.teacherId) return false;
      if (filters?.room && period.room !== filters.room) return false;
      return true;
    });
  }

  checkTimetableConflicts(candidate: Omit<TimetablePeriod, 'id'>, excludeId?: string): TimetableConflict | null {
    for (const existing of this.timetable) {
      if (excludeId && existing.id === excludeId) continue;
      if (existing.day !== candidate.day) continue;

      // Check slot / time collision
      const isTimeOverlap = existing.startTime === candidate.startTime || existing.endTime === candidate.endTime;
      if (!isTimeOverlap) continue;

      // 1. Teacher busy
      if (existing.teacherId === candidate.teacherId) {
        return {
          type: 'TEACHER_BUSY',
          message: `${candidate.teacherName} is already scheduled for ${existing.subjectName} in ${existing.className}-${existing.sectionName} (${existing.periodSlot}).`,
          existingPeriod: existing,
        };
      }

      // 2. Class & Section occupied
      if (existing.classId === candidate.classId && existing.sectionId === candidate.sectionId) {
        return {
          type: 'CLASS_OCCUPIED',
          message: `${candidate.className}-${candidate.sectionName} already has ${existing.subjectName} with ${existing.teacherName} scheduled at ${existing.periodSlot}.`,
          existingPeriod: existing,
        };
      }

      // 3. Room occupied
      if (candidate.room && existing.room && existing.room.toLowerCase() === candidate.room.toLowerCase()) {
        return {
          type: 'ROOM_OCCUPIED',
          message: `${candidate.room} is already occupied by ${existing.className}-${existing.sectionName} (${existing.subjectName}) at ${existing.periodSlot}.`,
          existingPeriod: existing,
        };
      }
    }
    return null;
  }

  saveTimetablePeriod(period: TimetablePeriod): TimetablePeriod {
    const index = this.timetable.findIndex((p) => p.id === period.id);
    if (index >= 0) {
      this.timetable[index] = period;
    } else {
      this.timetable.push(period);
    }
    return period;
  }

  addTimetablePeriod(period: TimetablePeriod): TimetablePeriod {
    return this.saveTimetablePeriod(period);
  }

  updateTimetablePeriod(period: TimetablePeriod): TimetablePeriod {
    return this.saveTimetablePeriod(period);
  }

  deleteTimetablePeriod(id: string): boolean {
    const before = this.timetable.length;
    this.timetable = this.timetable.filter((p) => p.id !== id);
    return this.timetable.length < before;
  }

  // ==========================================
  // ATTENDANCE API
  // ==========================================
  getAttendanceRegister(classId: string = 'cls-10', sectionId: string = 'sec-10-a', date: string = 'Sep 19, 2025'): AttendanceRegisterItem[] {
    const key = `${classId}:${sectionId}:${date}`;
    if (this.attendanceRegisters.has(key)) {
      return [...(this.attendanceRegisters.get(key) || [])];
    }
    return [];
  }

  saveAttendanceRegister(
    itemsOrClassId: string | AttendanceRegisterItem[],
    sectionId?: string,
    date?: string,
    itemsParam?: AttendanceRegisterItem[]
  ): boolean {
    let classId = 'cls-10';
    let secId = 'sec-10-a';
    let attDate = 'Sep 19, 2025';
    let items: AttendanceRegisterItem[] = [];

    if (Array.isArray(itemsOrClassId)) {
      items = itemsOrClassId;
    } else {
      classId = itemsOrClassId;
      secId = sectionId || 'sec-10-a';
      attDate = date || 'Sep 19, 2025';
      items = itemsParam || [];
    }

    const key = `${classId}:${secId}:${attDate}`;
    this.attendanceRegisters.set(key, [...items]);

    // Update summary counts
    const presentCount = items.filter((i) => i.status === 'PRESENT').length;
    const absentCount = items.filter((i) => i.status === 'ABSENT').length;
    const leaveCount = items.filter((i) => i.status === 'LEAVE').length;
    const lateCount = items.filter((i) => i.status === 'LATE').length;
    const excusedCount = items.filter((i) => i.status === 'EXCUSED').length;
    const totalEnrolled = items.length;
    const ratePercentage = totalEnrolled > 0 ? Math.round(((presentCount + lateCount + excusedCount) / totalEnrolled) * 1000) / 10 : 0;

    const summaryIndex = this.attendanceSummaries.findIndex((s) => s.classId === classId && s.sectionId === secId && s.date === attDate);
    const updatedSummary: ClassAttendanceSummary = {
      id: `att-sum-${classId}-${secId}-${attDate}`,
      classId,
      className: items[0]?.studentName ? 'Class' : 'Class',
      sectionId: secId,
      sectionName: 'A',
      date: attDate,
      totalEnrolled,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      excusedCount,
      ratePercentage,
      status: 'COMPLETED',
    };

    if (summaryIndex >= 0) {
      this.attendanceSummaries[summaryIndex] = updatedSummary;
    } else {
      this.attendanceSummaries.push(updatedSummary);
    }
    return true;
  }

  getAttendanceSummaries(date: string): ClassAttendanceSummary[] {
    return this.attendanceSummaries.filter((s) => s.date === date || !date);
  }

  getAttendanceAlerts(): AttendanceAttentionItem[] {
    return [...this.attendanceAlerts];
  }

  getAttendanceAttentionItems(): AttendanceAttentionItem[] {
    return this.getAttendanceAlerts();
  }

  getStudentAttendanceHistory(studentId: string): StudentAttendanceHistory {
    return {
      studentId,
      studentName: 'Student',
      admissionNumber: '',
      className: 'Class',
      section: '',
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      lateDays: 0,
      ratePercentage: 0,
      monthlyTrend: [],
    };
  }

  // ==========================================
  // HOMEWORK API
  // ==========================================
  getHomeworkList(filters?: { subjectId?: string; classId?: string; sectionId?: string; status?: string }): HomeworkItem[] {
    return this.homeworkList.filter((hw) => {
      if (filters?.subjectId && filters.subjectId !== 'ALL' && hw.subjectId !== filters.subjectId) return false;
      if (filters?.classId && filters.classId !== 'ALL' && hw.classId !== filters.classId) return false;
      if (filters?.sectionId && filters.sectionId !== 'ALL' && hw.sectionId !== filters.sectionId) return false;
      if (filters?.status && filters.status !== 'ALL' && hw.status !== filters.status) return false;
      return true;
    });
  }

  getHomeworkById(id: string): HomeworkItem | undefined {
    return this.homeworkList.find((h) => h.id === id);
  }

  saveHomework(homework: HomeworkItem): HomeworkItem {
    const index = this.homeworkList.findIndex((h) => h.id === homework.id);
    if (index >= 0) {
      this.homeworkList[index] = homework;
    } else {
      this.homeworkList.unshift(homework);
    }
    return homework;
  }

  addHomework(homework: HomeworkItem): HomeworkItem {
    return this.saveHomework(homework);
  }

  updateHomework(homework: HomeworkItem): HomeworkItem {
    return this.saveHomework(homework);
  }

  deleteHomework(id: string): boolean {
    const before = this.homeworkList.length;
    this.homeworkList = this.homeworkList.filter((h) => h.id !== id);
    return this.homeworkList.length < before;
  }
}

// Singleton export
export const mockRepository = new SchoolMockRepository();
