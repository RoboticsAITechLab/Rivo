import {
  SchoolStoreState,
} from '../mock-store/school-store';
import {
  Teacher,
  SchoolClass,
  Section,
  Subject,
  Room,
  House,
  AcademicSession,
  PeriodSchedule,
  ScheduleBlock,
  Student,
  TimetableEntry,
  Homework,
  TeacherId,
  ClassId,
  SectionId,
  SubjectId,
  RoomId,
  HouseId,
  PeriodId,
  ScheduleId,
} from '../types';

// ==========================================
// TEACHERS SELECTORS
// ==========================================
export function selectTeachers(
  state: SchoolStoreState,
  options?: { includeInactive?: boolean }
): Teacher[] {
  if (options?.includeInactive) {
    return state.teachers;
  }
  return state.teachers.filter((t) => t.status === 'ACTIVE' || t.status === 'ON_LEAVE');
}

export function selectTeacherById(state: SchoolStoreState, id?: TeacherId | null): Teacher | undefined {
  if (!id) return undefined;
  return state.teachers.find((t) => t.id === id);
}

export function selectTeachersForSubject(
  state: SchoolStoreState,
  subjectId?: SubjectId | null,
  options?: { includeInactive?: boolean }
): { relevant: Teacher[]; others: Teacher[] } {
  const allActive = selectTeachers(state, options);
  if (!subjectId) {
    return { relevant: allActive, others: [] };
  }

  const relevant = allActive.filter((t) =>
    t.assignments.some((a) => a.subjectId === subjectId)
  );
  const others = allActive.filter((t) => !relevant.includes(t));

  return { relevant, others };
}

// ==========================================
// CLASSES & SECTIONS SELECTORS
// ==========================================
export function selectClasses(state: SchoolStoreState): SchoolClass[] {
  return state.classes.filter((c) => c.status === 'ACTIVE');
}

export function selectClassById(state: SchoolStoreState, id?: ClassId | null): SchoolClass | undefined {
  if (!id) return undefined;
  return state.classes.find((c) => c.id === id);
}

export function selectSectionsForClass(state: SchoolStoreState, classId?: ClassId | null): Section[] {
  if (!classId) return [];
  const schoolClass = selectClassById(state, classId);
  return schoolClass ? schoolClass.sections : [];
}

export function selectSectionById(
  state: SchoolStoreState,
  classId?: ClassId | null,
  sectionId?: SectionId | null
): Section | undefined {
  if (!classId || !sectionId) return undefined;
  const sections = selectSectionsForClass(state, classId);
  return sections.find((s) => s.id === sectionId);
}

// ==========================================
// SUBJECTS SELECTORS
// ==========================================
export function selectSubjects(
  state: SchoolStoreState,
  options?: { includeInactive?: boolean }
): Subject[] {
  if (options?.includeInactive) {
    return state.subjects;
  }
  return state.subjects.filter((s) => s.status === 'ACTIVE');
}

export function selectSubjectById(state: SchoolStoreState, id?: SubjectId | null): Subject | undefined {
  if (!id) return undefined;
  return state.subjects.find((s) => s.id === id);
}

export function selectSubjectsForClass(
  state: SchoolStoreState,
  classId?: ClassId | null,
  options?: { includeInactive?: boolean }
): { relevant: Subject[]; others: Subject[] } {
  const allActive = selectSubjects(state, options);
  if (!classId) {
    return { relevant: allActive, others: [] };
  }

  const relevant = allActive.filter((s) =>
    s.applicableClassIds.length === 0 || s.applicableClassIds.includes(classId)
  );
  const others = allActive.filter((s) => !relevant.includes(s));

  return { relevant, others };
}

// ==========================================
// ROOMS SELECTORS
// ==========================================
export function selectRooms(
  state: SchoolStoreState,
  options?: { includeInactive?: boolean }
): Room[] {
  if (options?.includeInactive) {
    return state.rooms;
  }
  return state.rooms.filter((r) => r.status === 'ACTIVE');
}

export function selectRoomById(state: SchoolStoreState, id?: RoomId | null): Room | undefined {
  if (!id) return undefined;
  return state.rooms.find((r) => r.id === id);
}

// ==========================================
// HOUSES SELECTORS
// ==========================================
export function selectHouses(state: SchoolStoreState): House[] {
  return state.houses.filter((h) => h.status === 'ACTIVE');
}

export function selectHouseById(state: SchoolStoreState, id?: HouseId | null): House | undefined {
  if (!id) return undefined;
  return state.houses.find((h) => h.id === id);
}

// ==========================================
// ACADEMIC SESSIONS SELECTORS
// ==========================================
export function selectAcademicSessions(state: SchoolStoreState): AcademicSession[] {
  return state.academicSessions;
}

export function selectActiveAcademicSession(state: SchoolStoreState): AcademicSession | undefined {
  return (
    state.academicSessions.find((s) => s.id === state.activeSessionId) ||
    state.academicSessions.find((s) => s.isCurrent) ||
    state.academicSessions[0]
  );
}

// ==========================================
// PERIOD SCHEDULES SELECTORS
// ==========================================
export function selectSchedules(state: SchoolStoreState): PeriodSchedule[] {
  return state.schedules;
}

export function selectActiveSchedule(state: SchoolStoreState): PeriodSchedule | undefined {
  return (
    state.schedules.find((s) => s.id === state.activeScheduleId) ||
    state.schedules.find((s) => s.status === 'ACTIVE') ||
    state.schedules[0]
  );
}

export function selectScheduleBlocks(
  state: SchoolStoreState,
  scheduleId?: ScheduleId | null
): ScheduleBlock[] {
  const schedule = scheduleId
    ? state.schedules.find((s) => s.id === scheduleId)
    : selectActiveSchedule(state);

  return schedule ? [...schedule.blocks].sort((a, b) => a.order - b.order) : [];
}

export function selectTeachingPeriods(
  state: SchoolStoreState,
  scheduleId?: ScheduleId | null
): ScheduleBlock[] {
  const blocks = selectScheduleBlocks(state, scheduleId);
  return blocks.filter((b) => b.type === 'TEACHING' || b.type === 'ACTIVITY');
}

export function selectPeriodById(
  state: SchoolStoreState,
  periodId?: PeriodId | null,
  scheduleId?: ScheduleId | null
): ScheduleBlock | undefined {
  if (!periodId) return undefined;
  const blocks = selectScheduleBlocks(state, scheduleId);
  return blocks.find((b) => b.id === periodId);
}

// ==========================================
// STUDENTS SELECTORS
// ==========================================
export function selectStudents(state: SchoolStoreState): Student[] {
  return state.students;
}

export function selectStudentById(state: SchoolStoreState, id?: string | null): Student | undefined {
  if (!id) return undefined;
  return state.students.find((s) => s.id === id);
}

export function selectStudentsForClassSection(
  state: SchoolStoreState,
  classId?: ClassId | null,
  sectionId?: SectionId | null
): Student[] {
  if (!classId) return [];
  return state.students.filter((s) => {
    if (s.classId !== classId) return false;
    if (sectionId && s.sectionId !== sectionId) return false;
    return true;
  });
}

// ==========================================
// ATTENDANCE SELECTORS
// ==========================================
export function selectAttendanceRegister(
  state: SchoolStoreState,
  classId: ClassId,
  sectionId: SectionId,
  date: string
): {
  students: {
    student: Student;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EXCUSED';
    reason?: string;
  }[];
  isSaved: boolean;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  lateCount: number;
  excusedCount: number;
  ratePercentage: number;
} {
  const classStudents = selectStudentsForClassSection(state, classId, sectionId);
  const key = `${classId}:${sectionId}:${date}`;
  const savedRegister = state.attendanceRegisters[key];

  const studentsWithStatus = classStudents.map((s) => {
    const record = savedRegister?.records.find((r) => r.studentId === s.id);
    return {
      student: s,
      status: record ? record.status : ('PRESENT' as const),
      reason: record?.reason,
    };
  });

  const totalEnrolled = studentsWithStatus.length;
  const presentCount = studentsWithStatus.filter((s) => s.status === 'PRESENT').length;
  const absentCount = studentsWithStatus.filter((s) => s.status === 'ABSENT').length;
  const leaveCount = studentsWithStatus.filter((s) => s.status === 'LEAVE').length;
  const lateCount = studentsWithStatus.filter((s) => s.status === 'LATE').length;
  const excusedCount = studentsWithStatus.filter((s) => s.status === 'EXCUSED').length;

  const ratePercentage =
    totalEnrolled > 0
      ? Math.round(((presentCount + lateCount) / totalEnrolled) * 1000) / 10
      : 0;

  return {
    students: studentsWithStatus,
    isSaved: Boolean(savedRegister),
    totalEnrolled,
    presentCount,
    absentCount,
    leaveCount,
    lateCount,
    excusedCount,
    ratePercentage,
  };
}

// ==========================================
// TIMETABLE SELECTORS
// ==========================================
export function selectTimetable(
  state: SchoolStoreState,
  filters?: {
    classId?: ClassId;
    sectionId?: SectionId;
    teacherId?: TeacherId;
    roomId?: RoomId;
    day?: string;
  }
): TimetableEntry[] {
  return state.timetable.filter((entry) => {
    if (filters?.classId && entry.classId !== filters.classId) return false;
    if (filters?.sectionId && entry.sectionId !== filters.sectionId) return false;
    if (filters?.teacherId && entry.teacherId !== filters.teacherId) return false;
    if (filters?.roomId && entry.roomId !== filters.roomId) return false;
    if (filters?.day && entry.day !== filters.day) return false;
    return true;
  });
}

// ==========================================
// HOMEWORK SELECTORS
// ==========================================
export function selectHomework(
  state: SchoolStoreState,
  filters?: {
    classId?: ClassId;
    sectionId?: SectionId;
    subjectId?: SubjectId;
    teacherId?: TeacherId;
    status?: string;
  }
): Homework[] {
  return state.homework.filter((hw) => {
    if (filters?.classId && filters.classId !== 'ALL' && hw.classId !== filters.classId) return false;
    if (filters?.sectionId && filters.sectionId !== 'ALL' && hw.sectionId !== filters.sectionId) return false;
    if (filters?.subjectId && filters.subjectId !== 'ALL' && hw.subjectId !== filters.subjectId) return false;
    if (filters?.teacherId && filters.teacherId !== 'ALL' && hw.teacherId !== filters.teacherId) return false;
    if (filters?.status && filters.status !== 'ALL' && hw.status !== filters.status) return false;
    return true;
  });
}

// ==========================================
// DISPLAY RESOLVERS (IDs -> Human Labels)
// ==========================================
export function resolveTeacherName(state: SchoolStoreState, teacherId?: TeacherId | null): string {
  if (!teacherId) return 'Unassigned';
  const teacher = selectTeacherById(state, teacherId);
  if (!teacher) return 'Teacher';
  return `${teacher.personal.firstName} ${teacher.personal.lastName}`.trim();
}

export function resolveSubjectName(state: SchoolStoreState, subjectId?: SubjectId | null): string {
  if (!subjectId) return 'Subject';
  const subject = selectSubjectById(state, subjectId);
  return subject ? subject.name : 'Subject';
}

export function resolveClassName(state: SchoolStoreState, classId?: ClassId | null): string {
  if (!classId) return 'Class';
  const schoolClass = selectClassById(state, classId);
  return schoolClass ? schoolClass.className : 'Class';
}

export function resolveSectionName(
  state: SchoolStoreState,
  classId?: ClassId | null,
  sectionId?: SectionId | null
): string {
  if (!classId || !sectionId) return 'Section';
  const section = selectSectionById(state, classId, sectionId);
  return section ? section.name : 'A';
}

export function resolveRoomName(state: SchoolStoreState, roomId?: RoomId | null): string {
  if (!roomId) return 'Unassigned Room';
  const room = selectRoomById(state, roomId);
  return room ? room.name : roomId;
}

export function resolveHouseName(state: SchoolStoreState, houseId?: HouseId | null): string {
  if (!houseId) return 'No House';
  const house = selectHouseById(state, houseId);
  return house ? house.name : 'No House';
}

export function resolvePeriodDetails(
  state: SchoolStoreState,
  periodId?: PeriodId | null,
  scheduleId?: ScheduleId | null
): {
  name: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  slotLabel: string;
  order: number;
} {
  const period = selectPeriodById(state, periodId, scheduleId);
  if (!period) {
    return {
      name: 'Period',
      startTime: '08:00',
      endTime: '08:45',
      timeRange: '08:00 – 08:45',
      slotLabel: 'Period (08:00 – 08:45)',
      order: 1,
    };
  }

  return {
    name: period.name,
    startTime: period.startTime,
    endTime: period.endTime,
    timeRange: `${period.startTime} – ${period.endTime}`,
    slotLabel: `${period.name} • ${period.startTime}–${period.endTime}`,
    order: period.order,
  };
}

// ==========================================
// EXAMINATION & DUAL ROLL NUMBER SELECTORS
// ==========================================
export * from './exam-selectors';

