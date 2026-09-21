import { useSyncExternalStore } from 'react';
import {
  AcademicSession,
  Teacher,
  SchoolClass,
  Section,
  Subject,
  Room,
  House,
  PeriodSchedule,
  ScheduleBlock,
  TimetableEntry,
  Student,
  AttendanceRegister,
  AttendanceRecord,
  Homework,
  TeacherId,
  ClassId,
  SectionId,
  SubjectId,
  RoomId,
  HouseId,
  ScheduleId,
  PeriodId,
  AcademicSessionId,
  TimetableEntryId,
  HomeworkId,
  StudentId,
  Campus,
  Stream,
  ClassRollAssignment,
  ExamRollAssignment,
  RollAllocationConfig,
  Exam,
  ExamPaper,
  ExamScheduleEntry,
  ExamAttendance,
  ExamMark,
  ExamResult,
  ExamId,
  ExamPaperId,
  ExamScheduleId,
  ExamStatus,
  ResultStatus,
} from '../types';

import { initialMockTeachers } from '@/features/teachers/data/mock-teachers';
import { initialMockClasses } from '@/features/classes/data/mock-classes';
import { initialMockSubjects } from '@/features/subjects/data/mock-subjects';
import { initialMockStudents } from '@/data/mock-students';
import { initialMockHouses } from '@/data/mock-houses';
import {
  initialCampuses,
  initialStreams,
  initialRollAllocationConfig,
  seedExamAndRollData,
} from './initial-exam-data';

import {
  SchoolProfile,
  SchoolBranding,
  AttendanceSettings,
  TimetableSettings,
  HomeworkSettings,
  ExamTypeConfig,
  ExamTimeSlot,
  GradingScheme,
  ExamRulesConfig,
  ResultSettings,
  UserAccount,
  RoleDefinition,
  Invitation,
  AuthSettings,
  PasswordPolicy,
  ActiveUserSession,
  MFASettings,
  AccountRecoverySettings,
  NoticeSettings,
  NotificationSettings,
  DocumentTemplate,
  PrintSettings,
  ImportLog,
  ExportLog,
  PermissionAction,
} from '@/features/settings/types';

export interface SchoolStoreState {
  academicSessions: AcademicSession[];
  activeSessionId: AcademicSessionId;
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  rooms: Room[];
  houses: House[];
  schedules: PeriodSchedule[];
  activeScheduleId: ScheduleId;
  timetable: TimetableEntry[];
  students: Student[];
  attendanceRegisters: Record<string, AttendanceRegister>; // key: `${classId}:${sectionId}:${date}`
  homework: Homework[];
  // Examination & Dual Roll Number System
  campuses: Campus[];
  streams: Stream[];
  classRollAssignments: ClassRollAssignment[];
  examRollAssignments: ExamRollAssignment[];
  rollAllocationConfig: RollAllocationConfig;
  exams: Exam[];
  examPapers: ExamPaper[];
  examSchedule: ExamScheduleEntry[];
  examAttendances: ExamAttendance[];
  examMarks: ExamMark[];
  examResults: ExamResult[];
  // MVP Settings & School Control Center
  schoolProfile: SchoolProfile;
  branding: SchoolBranding;
  attendanceSettings: AttendanceSettings;
  timetableSettings: TimetableSettings;
  homeworkSettings: HomeworkSettings;
  examTypes: ExamTypeConfig[];
  examTimeSlots: ExamTimeSlot[];
  gradingSchemes: GradingScheme[];
  examRules: ExamRulesConfig;
  resultSettings: ResultSettings;
  users: UserAccount[];
  roles: RoleDefinition[];
  permissions: Record<string, Record<string, Record<PermissionAction, boolean>>>;
  invitations: Invitation[];
  authSettings: AuthSettings;
  passwordPolicy: PasswordPolicy;
  sessions: ActiveUserSession[];
  mfaSettings: MFASettings;
  recoverySettings: AccountRecoverySettings;
  noticeSettings: NoticeSettings;
  notificationSettings: NotificationSettings;
  documentTemplates: DocumentTemplate[];
  printSettings: PrintSettings;
  importHistory: ImportLog[];
  exportHistory: ExportLog[];
}

// Purged: All initial entities initialized to clean empty arrays
const initialAcademicSessions: AcademicSession[] = [];
const initialRooms: Room[] = [];
const initialSchedules: PeriodSchedule[] = [];
const initialCanonicalTeachers: Teacher[] = [];
const initialCanonicalClasses: SchoolClass[] = [];
const initialCanonicalSubjects: Subject[] = [];
const initialCanonicalHouses: House[] = [];
const initialCanonicalStudents: Student[] = [];
const initialCanonicalTimetable: TimetableEntry[] = [];
const initialCanonicalHomework: Homework[] = [];

// Singleton store instance with pub/sub
class SchoolCentralStore {
  private state: SchoolStoreState = {
    academicSessions: [],
    activeSessionId: '',
    teachers: [],
    classes: [],
    subjects: [],
    rooms: [],
    houses: [],
    schedules: [],
    activeScheduleId: '',
    timetable: [],
    students: [],
    attendanceRegisters: {},
    homework: [],
    campuses: [],
    streams: [],
    classRollAssignments: [],
    examRollAssignments: [],
    rollAllocationConfig: { ...initialRollAllocationConfig },
    exams: [],
    examPapers: [],
    examSchedule: [],
    examAttendances: [],
    examMarks: [],
    examResults: [],
    schoolProfile: {
      schoolName: '',
      shortName: '',
      schoolCode: '',
      affiliation: '',
      registrationNumber: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
    },
    branding: {},
    attendanceSettings: {
      attendanceEnabled: true,
      teacherCanMark: true,
      adminCanCorrect: true,
      lockPreviousRecords: false,
      supportedStatuses: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    },
    timetableSettings: {
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      teacherConflictDetection: true,
      roomConflictDetection: true,
      classConflictDetection: true,
    },
    homeworkSettings: {
      teacherCanCreate: true,
      attachmentsEnabled: true,
      parentVisibility: true,
      studentStatusTracking: true,
      maxAttachmentSizeMB: 10,
    },
    examTypes: [],
    examTimeSlots: [],
    gradingSchemes: [],
    examRules: {
      multiplePapersPerDay: false,
      multipleSessionsPerDay: false,
      scheduleConflictDetection: true,
      roomConflictDetection: true,
      candidateValidationRequired: true,
      attendanceRequirementPercentage: 75,
      publishResultsImmediately: false,
    },
    resultSettings: {
      publicationBehavior: 'MANUAL',
      resultVisibility: 'ADMIN_ONLY',
      lockPublishedResults: true,
    },
    users: [],
    roles: [
      { id: 'role-admin', name: 'School Admin', isSystem: true, description: 'Full administrative access across all school configuration & data', userCount: 0 },
      { id: 'role-teacher', name: 'Teacher', isSystem: true, description: 'Access to assigned classes, timetable, attendance and homework', userCount: 0 },
      { id: 'role-student', name: 'Student', isSystem: true, description: 'Personal access to view assignments, timetable, and published results', userCount: 0 },
      { id: 'role-parent', name: 'Parent', isSystem: true, description: 'Access to linked children progress, attendance alerts, and circulars', userCount: 0 },
    ],
    permissions: {},
    invitations: [],
    authSettings: {
      passwordLoginEnabled: true,
      emailVerificationEnabled: true,
      roleAccess: {
        schoolAdmin: true,
        teacher: true,
        student: false,
        parent: false,
      },
      sessionTimeoutMinutes: 30,
    },
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true,
    },
    sessions: [],
    mfaSettings: {
      mfaAvailable: false,
      requireForAdmin: false,
      requireForSensitiveActions: false,
    },
    recoverySettings: {
      forgotPasswordEnabled: true,
      emailRecoveryEnabled: true,
      tokenExpiryHours: 24,
      notifyOnRecovery: true,
    },
    noticeSettings: {
      teacherCanCreate: true,
      teacherCanPublish: false,
      defaultAudience: 'ALL',
      allowScheduling: true,
      allowAttachments: true,
    },
    notificationSettings: {
      events: {
        homeworkAssigned: { inApp: true, email: false, push: false },
        attendanceAlert: { inApp: true, email: false, push: false },
        resultPublished: { inApp: true, email: false, push: false },
        noticePublished: { inApp: true, email: false, push: false },
        examUpdate: { inApp: true, email: false, push: false },
      },
    },
    documentTemplates: [
      { id: 'tmpl-admit-card', type: 'ADMIT_CARD', name: 'Official Examination Admit Card', description: 'Student admit pass with exam timetable and desk verification code', status: 'ACTIVE' },
      { id: 'tmpl-marksheet', type: 'MARKSHEET', name: 'Standard Academic Marksheet', description: 'Term marks report with subject breakdown and grade calculation', status: 'ACTIVE' },
      { id: 'tmpl-timetable', type: 'EXAM_TIMETABLE', name: 'Consolidated Datesheet Matrix', description: 'Schedule circular with paper codes, dates, times and rooms', status: 'ACTIVE' },
    ],
    printSettings: {
      pageSize: 'A4',
      orientation: 'PORTRAIT',
      marginTop: 15,
      marginBottom: 15,
      marginLeft: 15,
      marginRight: 15,
      showHeader: true,
      showFooter: true,
      showSeal: true,
      showSignature: true,
    },
    importHistory: [],
    exportHistory: [],
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    // Initialized in clean empty state ready for real school data & API integration
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): SchoolStoreState => {
    return this.state;
  };

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error executing store subscriber:', err);
      }
    });
  }

  // ==========================================
  // TEACHERS
  // ==========================================
  public createTeacher(data: Omit<Teacher, 'id'> & { id?: TeacherId }): Teacher {
    const id = data.id || `tch-${Date.now()}`;
    const newTeacher: Teacher = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      teachers: [newTeacher, ...this.state.teachers],
    };
    this.notify();
    return newTeacher;
  }

  public updateTeacher(teacher: Teacher): Teacher {
    const updated = { ...teacher, updatedAt: new Date().toISOString() };
    this.state = {
      ...this.state,
      teachers: this.state.teachers.map((t) => (t.id === teacher.id ? updated : t)),
    };
    this.notify();
    return updated;
  }

  public archiveTeacher(id: TeacherId): void {
    this.state = {
      ...this.state,
      teachers: this.state.teachers.map((t) =>
        t.id === id ? { ...t, status: 'INACTIVE', updatedAt: new Date().toISOString() } : t
      ),
    };
    this.notify();
  }

  // ==========================================
  // SUBJECTS
  // ==========================================
  public createSubject(data: Omit<Subject, 'id'> & { id?: SubjectId }): Subject {
    const id = data.id || `sub-${Date.now()}`;
    const newSubject: Subject = { ...data, id };
    this.state = {
      ...this.state,
      subjects: [...this.state.subjects, newSubject],
    };
    this.notify();
    return newSubject;
  }

  public updateSubject(subject: Subject): Subject {
    this.state = {
      ...this.state,
      subjects: this.state.subjects.map((s) => (s.id === subject.id ? subject : s)),
    };
    this.notify();
    return subject;
  }

  // ==========================================
  // CLASSES & SECTIONS
  // ==========================================
  public createClass(data: Omit<SchoolClass, 'id'> & { id?: ClassId }): SchoolClass {
    const id = data.id || `cls-${Date.now()}`;
    const newClass: SchoolClass = { ...data, id };
    this.state = {
      ...this.state,
      classes: [...this.state.classes, newClass],
    };
    this.notify();
    return newClass;
  }

  public updateClass(schoolClass: SchoolClass): SchoolClass {
    this.state = {
      ...this.state,
      classes: this.state.classes.map((c) => (c.id === schoolClass.id ? schoolClass : c)),
    };
    this.notify();
    return schoolClass;
  }

  public createSection(classId: ClassId, sectionData: Omit<Section, 'id' | 'classId'>): Section {
    const sectionId = `sec-${classId}-${Date.now()}`;
    const newSection: Section = {
      ...sectionData,
      id: sectionId,
      classId,
    };

    this.state = {
      ...this.state,
      classes: this.state.classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            sections: [...c.sections, newSection],
          };
        }
        return c;
      }),
    };
    this.notify();
    return newSection;
  }

  public updateSection(classIdOrSection: string | Section, maybeSection?: Section): Section {
    const section = typeof classIdOrSection === 'string' ? maybeSection! : classIdOrSection;
    const targetClassId = typeof classIdOrSection === 'string' ? classIdOrSection : section.classId;

    this.state = {
      ...this.state,
      classes: this.state.classes.map((c) => {
        if (c.id === targetClassId) {
          return {
            ...c,
            sections: c.sections.map((s) => (s.id === section.id ? section : s)),
          };
        }
        return c;
      }),
    };
    this.notify();
    return section;
  }

  // ==========================================
  // ACADEMIC SESSIONS
  // ==========================================
  public createAcademicSession(data: Omit<AcademicSession, 'id'> & { id?: string }): AcademicSession {
    const id = data.id || `session-${Date.now()}`;
    const newSession: AcademicSession = { ...data, id };
    this.state = {
      ...this.state,
      academicSessions: [...this.state.academicSessions, newSession],
      activeSessionId: this.state.activeSessionId || newSession.id,
    };
    this.notify();
    return newSession;
  }

  public updateAcademicSession(session: AcademicSession): AcademicSession {
    this.state = {
      ...this.state,
      academicSessions: this.state.academicSessions.map((s) => (s.id === session.id ? session : s)),
    };
    this.notify();
    return session;
  }

  public setActiveSession(id: string): void {
    this.state = {
      ...this.state,
      activeSessionId: id,
    };
    this.notify();
  }

  // ==========================================
  // ROOMS
  // ==========================================
  public createRoom(data: Omit<Room, 'id'> & { id?: RoomId }): Room {
    const id = data.id || `rm-${Date.now()}`;
    const newRoom: Room = { ...data, id };
    this.state = {
      ...this.state,
      rooms: [...this.state.rooms, newRoom],
    };
    this.notify();
    return newRoom;
  }

  public updateRoom(room: Room): Room {
    this.state = {
      ...this.state,
      rooms: this.state.rooms.map((r) => (r.id === room.id ? room : r)),
    };
    this.notify();
    return room;
  }

  // ==========================================
  // HOUSES
  // ==========================================
  public createHouse(data: Omit<House, 'id'> & { id?: HouseId }): House {
    const id = data.id || `house-${Date.now()}`;
    const newHouse: House = { ...data, id };
    this.state = {
      ...this.state,
      houses: [...this.state.houses, newHouse],
    };
    this.notify();
    return newHouse;
  }

  public updateHouse(house: House): House {
    this.state = {
      ...this.state,
      houses: this.state.houses.map((h) => (h.id === house.id ? house : h)),
    };
    this.notify();
    return house;
  }

  // ==========================================
  // PERIOD SCHEDULES & BLOCKS
  // ==========================================
  public createSchedule(data: Omit<PeriodSchedule, 'id'> & { id?: ScheduleId }): PeriodSchedule {
    const id = data.id || `sch-${Date.now()}`;
    const newSchedule: PeriodSchedule = { ...data, id };
    this.state = {
      ...this.state,
      schedules: [...this.state.schedules, newSchedule],
    };
    this.notify();
    return newSchedule;
  }

  public updateSchedule(schedule: PeriodSchedule): PeriodSchedule {
    const exists = this.state.schedules.some((s) => s.id === schedule.id);
    this.state = {
      ...this.state,
      schedules: exists
        ? this.state.schedules.map((s) => (s.id === schedule.id ? schedule : s))
        : [...this.state.schedules, schedule],
      activeScheduleId: this.state.activeScheduleId || schedule.id,
    };
    this.notify();
    return schedule;
  }

  public createScheduleBlock(scheduleId: ScheduleId, blockData: Omit<ScheduleBlock, 'id' | 'scheduleId'>): ScheduleBlock {
    const blockId = `blk-${Date.now()}`;
    const newBlock: ScheduleBlock = {
      ...blockData,
      id: blockId,
      scheduleId,
    };

    this.state = {
      ...this.state,
      schedules: this.state.schedules.map((s) => {
        if (s.id === scheduleId) {
          return {
            ...s,
            blocks: [...s.blocks, newBlock].sort((a, b) => a.order - b.order),
          };
        }
        return s;
      }),
    };
    this.notify();
    return newBlock;
  }

  public updateScheduleBlock(scheduleId: ScheduleId, block: ScheduleBlock): ScheduleBlock {
    this.state = {
      ...this.state,
      schedules: this.state.schedules.map((s) => {
        if (s.id === scheduleId) {
          return {
            ...s,
            blocks: s.blocks.map((b) => (b.id === block.id ? block : b)).sort((a, b) => a.order - b.order),
          };
        }
        return s;
      }),
    };
    this.notify();
    return block;
  }

  public deleteScheduleBlock(scheduleId: ScheduleId, blockId: PeriodId): boolean {
    this.state = {
      ...this.state,
      schedules: this.state.schedules.map((s) => {
        if (s.id === scheduleId) {
          return {
            ...s,
            blocks: s.blocks.filter((b) => b.id !== blockId),
          };
        }
        return s;
      }),
    };
    this.notify();
    return true;
  }

  // ==========================================
  // TIMETABLE
  // ==========================================
  public createTimetableEntry(data: Omit<TimetableEntry, 'id'> & { id?: TimetableEntryId }): TimetableEntry {
    const id = data.id || `tt-${Date.now()}`;
    const newEntry: TimetableEntry = { ...data, id };
    this.state = {
      ...this.state,
      timetable: [...this.state.timetable, newEntry],
    };
    this.notify();
    return newEntry;
  }

  public updateTimetableEntry(entry: TimetableEntry): TimetableEntry {
    this.state = {
      ...this.state,
      timetable: this.state.timetable.map((e) => (e.id === entry.id ? entry : e)),
    };
    this.notify();
    return entry;
  }

  public deleteTimetableEntry(id: TimetableEntryId): boolean {
    const before = this.state.timetable.length;
    this.state = {
      ...this.state,
      timetable: this.state.timetable.filter((e) => e.id !== id),
    };
    this.notify();
    return this.state.timetable.length < before;
  }

  // ==========================================
  // STUDENTS
  // ==========================================
  public createStudent(data: Omit<Student, 'id'> & { id?: StudentId }): Student {
    const id = data.id || `stu-${Date.now()}`;
    const newStudent: Student = { ...data, id };
    this.state = {
      ...this.state,
      students: [newStudent, ...this.state.students],
    };
    this.notify();
    return newStudent;
  }

  public updateStudent(student: Student): Student {
    this.state = {
      ...this.state,
      students: this.state.students.map((s) => (s.id === student.id ? student : s)),
    };
    this.notify();
    return student;
  }

  public archiveStudent(id: StudentId): void {
    this.state = {
      ...this.state,
      students: this.state.students.filter((s) => s.id !== id),
    };
    this.notify();
  }

  // ==========================================
  // ATTENDANCE
  // ==========================================
  public saveAttendanceRegister(
    classId: ClassId,
    sectionId: SectionId,
    date: string,
    records: AttendanceRecord[]
  ): AttendanceRegister {
    const key = `${classId}:${sectionId}:${date}`;
    const register: AttendanceRegister = {
      id: `att-${classId}-${sectionId}-${date}`,
      classId,
      sectionId,
      date,
      academicSessionId: this.state.activeSessionId,
      records: [...records],
      updatedAt: new Date().toISOString(),
    };

    this.state = {
      ...this.state,
      attendanceRegisters: {
        ...this.state.attendanceRegisters,
        [key]: register,
      },
    };
    this.notify();
    return register;
  }

  // ==========================================
  // HOMEWORK
  // ==========================================
  public createHomework(data: Omit<Homework, 'id'> & { id?: HomeworkId }): Homework {
    const id = data.id || `hw-${Date.now()}`;
    const newHomework: Homework = { ...data, id };
    this.state = {
      ...this.state,
      homework: [newHomework, ...this.state.homework],
    };
    this.notify();
    return newHomework;
  }

  public updateHomework(homework: Homework): Homework {
    this.state = {
      ...this.state,
      homework: this.state.homework.map((h) => (h.id === homework.id ? homework : h)),
    };
    this.notify();
    return homework;
  }

  public deleteHomework(id: HomeworkId): boolean {
    const before = this.state.homework.length;
    this.state = {
      ...this.state,
      homework: this.state.homework.filter((h) => h.id !== id),
    };
    this.notify();
    return this.state.homework.length < before;
  }

  // ==========================================
  // CAMPUS MANAGEMENT
  // ==========================================
  public createCampus(data: Omit<Campus, 'id'>): Campus {
    const newCampus: Campus = {
      ...data,
      id: `cmp-${Math.random().toString(36).substring(2, 8)}`,
    };
    this.state = {
      ...this.state,
      campuses: [...this.state.campuses, newCampus],
    };
    this.notify();
    return newCampus;
  }

  public updateCampus(campus: Campus): Campus {
    this.state = {
      ...this.state,
      campuses: this.state.campuses.map((c) => (c.id === campus.id ? campus : c)),
    };
    this.notify();
    return campus;
  }

  // ==========================================
  // STREAM MANAGEMENT (11 & 12)
  // ==========================================
  public createStream(data: Omit<Stream, 'id' | 'schoolId'> & { id?: string; schoolId?: string }): Stream {
    const newStream: Stream = {
      schoolId: data.schoolId || 'school-main',
      ...data,
      id: data.id || `stm-${Math.random().toString(36).substring(2, 8)}`,
    };
    this.state = {
      ...this.state,
      streams: [...this.state.streams, newStream],
    };
    this.notify();
    return newStream;
  }

  public updateStream(stream: Stream): Stream {
    this.state = {
      ...this.state,
      streams: this.state.streams.map((s) => (s.id === stream.id ? stream : s)),
    };
    this.notify();
    return stream;
  }

  // ==========================================
  // DUAL ROLL NUMBER & ALLOCATION ENGINE
  // ==========================================
  public updateRollAllocationConfig(config: Partial<RollAllocationConfig>): RollAllocationConfig {
    const updated = { ...this.state.rollAllocationConfig, ...config, lastUpdated: new Date().toISOString() };
    this.state = {
      ...this.state,
      rollAllocationConfig: updated,
    };
    this.notify();
    return updated;
  }

  public allocateExamRollNumber(studentId: StudentId, explicitRoll?: string): ExamRollAssignment {
    const student = this.state.students.find((s) => s.id === studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    const existing = this.state.examRollAssignments.find((a) => a.studentId === studentId);
    if (existing && !explicitRoll) {
      return existing;
    }

    let allocatedNumber = explicitRoll;
    if (!allocatedNumber) {
      const isSenior = student.classId === 'cls-11' || student.classId === 'cls-12';
      if (isSenior && student.streamId && this.state.rollAllocationConfig.class11_12Rule.streamAware) {
        const rule = this.state.rollAllocationConfig.class11_12Rule.streamRules[student.streamId] || { startNumber: 1101, prefix: 'SCI-' };
        const existingStreamRolls = this.state.examRollAssignments
          .filter((a) => a.streamId === student.streamId)
          .map((a) => parseInt(a.examRollNumber.replace(/\D/g, ''), 10))
          .filter((n) => !isNaN(n));
        const maxNum = existingStreamRolls.length > 0 ? Math.max(...existingStreamRolls) : rule.startNumber - 1;
        allocatedNumber = `${rule.prefix || ''}${maxNum + 1}`;
      } else {
        const existingCentral = this.state.examRollAssignments
          .map((a) => parseInt(a.examRollNumber, 10))
          .filter((n) => !isNaN(n));
        const maxCentral = existingCentral.length > 0 ? Math.max(...existingCentral) : this.state.rollAllocationConfig.class1_10Rule.startNumber - 1;
        let candidate = maxCentral + 1;
        while (this.state.rollAllocationConfig.reservedNumbers.includes(candidate)) {
          candidate++;
        }
        allocatedNumber = String(candidate);
      }
    }

    const now = new Date().toISOString();
    let assignment: ExamRollAssignment;

    if (existing) {
      assignment = {
        ...existing,
        examRollNumber: allocatedNumber,
        history: [
          ...existing.history,
          {
            id: `hist-${Date.now()}`,
            oldRoll: existing.examRollNumber,
            newRoll: allocatedNumber,
            reason: 'Administrative manual allocation update',
            changedAt: now,
            changedBy: 'System Administrator',
          },
        ],
      };
      this.state = {
        ...this.state,
        examRollAssignments: this.state.examRollAssignments.map((a) => (a.id === existing.id ? assignment : a)),
        students: this.state.students.map((s) => (s.id === studentId ? { ...s, examRollNumber: allocatedNumber } : s)),
      };
    } else {
      assignment = {
        id: `e-roll-${studentId}-${Date.now()}`,
        studentId,
        schoolId: 'school-gwa',
        academicSessionId: student.academicSessionId || this.state.activeSessionId,
        campusId: student.campusId || 'cmp-main',
        classId: student.classId,
        sectionId: student.sectionId,
        streamId: student.streamId,
        examRollNumber: allocatedNumber,
        status: 'ACTIVE',
        assignedAt: now,
        assignedBy: 'System Administrator',
        history: [
          {
            id: `hist-${Date.now()}`,
            oldRoll: null,
            newRoll: allocatedNumber,
            reason: 'Session allocation for newly admitted student',
            changedAt: now,
            changedBy: 'Admissions Desk',
          },
        ],
      };
      this.state = {
        ...this.state,
        examRollAssignments: [...this.state.examRollAssignments, assignment],
        students: this.state.students.map((s) => (s.id === studentId ? { ...s, examRollNumber: allocatedNumber } : s)),
      };
    }

    this.notify();
    return assignment;
  }

  public bulkAllocateExamRolls(studentIds: StudentId[]): ExamRollAssignment[] {
    const results: ExamRollAssignment[] = [];
    studentIds.forEach((id) => {
      results.push(this.allocateExamRollNumber(id));
    });
    return results;
  }

  public manualReassignExamRoll(
    studentId: StudentId,
    newRoll: string,
    reason: string,
    adminName = 'Super Administrator'
  ): ExamRollAssignment {
    const existing = this.state.examRollAssignments.find((a) => a.studentId === studentId);
    if (!existing) throw new Error(`No existing roll assignment found for student ${studentId}`);

    const now = new Date().toISOString();
    const updated: ExamRollAssignment = {
      ...existing,
      examRollNumber: newRoll.trim(),
      history: [
        ...existing.history,
        {
          id: `hist-${Date.now()}`,
          oldRoll: existing.examRollNumber,
          newRoll: newRoll.trim(),
          reason: reason.trim(),
          changedAt: now,
          changedBy: adminName,
        },
      ],
    };

    this.state = {
      ...this.state,
      examRollAssignments: this.state.examRollAssignments.map((a) => (a.id === existing.id ? updated : a)),
      students: this.state.students.map((s) => (s.id === studentId ? { ...s, examRollNumber: newRoll.trim() } : s)),
    };
    this.notify();
    return updated;
  }

  // ==========================================
  // FORMAL EXAMINATION CYCLES
  // ==========================================
  public createExam(data: Omit<Exam, 'id'>): Exam {
    const newExam: Exam = {
      ...data,
      id: `ex-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      exams: [newExam, ...this.state.exams],
    };
    this.notify();
    return newExam;
  }

  public updateExam(exam: Exam): Exam {
    this.state = {
      ...this.state,
      exams: this.state.exams.map((e) => (e.id === exam.id ? exam : e)),
    };
    this.notify();
    return exam;
  }

  public changeExamStatus(examId: ExamId, status: ExamStatus): Exam {
    const exam = this.state.exams.find((e) => e.id === examId);
    if (!exam) throw new Error(`Exam ${examId} not found`);
    const updated = { ...exam, status };
    this.state = {
      ...this.state,
      exams: this.state.exams.map((e) => (e.id === examId ? updated : e)),
    };
    this.notify();
    return updated;
  }

  public deleteExam(id: ExamId): boolean {
    const before = this.state.exams.length;
    this.state = {
      ...this.state,
      exams: this.state.exams.filter((e) => e.id !== id),
      examPapers: this.state.examPapers.filter((p) => p.examId !== id),
      examSchedule: this.state.examSchedule.filter((s) => s.examId !== id),
      examAttendances: this.state.examAttendances.filter((a) => a.examId !== id),
      examMarks: this.state.examMarks.filter((m) => m.examId !== id),
      examResults: this.state.examResults.filter((r) => r.examId !== id),
    };
    this.notify();
    return this.state.exams.length < before;
  }

  // ==========================================
  // EXAM PAPERS
  // ==========================================
  public createExamPaper(data: Omit<ExamPaper, 'id'>): ExamPaper {
    const newPaper: ExamPaper = {
      ...data,
      id: `ppr-${Math.random().toString(36).substring(2, 8)}`,
    };
    this.state = {
      ...this.state,
      examPapers: [...this.state.examPapers, newPaper],
    };
    this.notify();
    return newPaper;
  }

  public updateExamPaper(paper: ExamPaper): ExamPaper {
    this.state = {
      ...this.state,
      examPapers: this.state.examPapers.map((p) => (p.id === paper.id ? paper : p)),
    };
    this.notify();
    return paper;
  }

  public deleteExamPaper(id: ExamPaperId): boolean {
    const before = this.state.examPapers.length;
    this.state = {
      ...this.state,
      examPapers: this.state.examPapers.filter((p) => p.id !== id),
      examSchedule: this.state.examSchedule.filter((s) => s.paperId !== id),
    };
    this.notify();
    return this.state.examPapers.length < before;
  }

  // ==========================================
  // EXAM SCHEDULE
  // ==========================================
  public createExamScheduleEntry(data: Omit<ExamScheduleEntry, 'id'>): ExamScheduleEntry {
    const newEntry: ExamScheduleEntry = {
      ...data,
      id: `sch-entry-${Math.random().toString(36).substring(2, 8)}`,
    };
    this.state = {
      ...this.state,
      examSchedule: [...this.state.examSchedule, newEntry],
    };
    this.notify();
    return newEntry;
  }

  public updateExamScheduleEntry(entry: ExamScheduleEntry): ExamScheduleEntry {
    this.state = {
      ...this.state,
      examSchedule: this.state.examSchedule.map((s) => (s.id === entry.id ? entry : s)),
    };
    this.notify();
    return entry;
  }

  public deleteExamScheduleEntry(id: ExamScheduleId): boolean {
    const before = this.state.examSchedule.length;
    this.state = {
      ...this.state,
      examSchedule: this.state.examSchedule.filter((s) => s.id !== id),
    };
    this.notify();
    return this.state.examSchedule.length < before;
  }

  // ==========================================
  // EXAM ATTENDANCE & MARKS
  // ==========================================
  public saveExamAttendanceRecord(attendance: ExamAttendance): ExamAttendance {
    const index = this.state.examAttendances.findIndex(
      (a) => a.examId === attendance.examId && a.paperId === attendance.paperId && a.studentId === attendance.studentId
    );
    let updatedList: ExamAttendance[];
    if (index >= 0) {
      updatedList = [...this.state.examAttendances];
      updatedList[index] = attendance;
    } else {
      updatedList = [...this.state.examAttendances, attendance];
    }
    this.state = { ...this.state, examAttendances: updatedList };
    this.notify();
    return attendance;
  }

  public bulkSaveExamAttendance(attendances: ExamAttendance[]): ExamAttendance[] {
    const map = new Map<string, ExamAttendance>();
    this.state.examAttendances.forEach((a) => map.set(`${a.examId}:${a.paperId}:${a.studentId}`, a));
    attendances.forEach((a) => map.set(`${a.examId}:${a.paperId}:${a.studentId}`, a));
    this.state = { ...this.state, examAttendances: Array.from(map.values()) };
    this.notify();
    return attendances;
  }

  public saveExamMarks(marks: ExamMark[]): ExamMark[] {
    const map = new Map<string, ExamMark>();
    this.state.examMarks.forEach((m) => map.set(`${m.examId}:${m.paperId}:${m.studentId}`, m));
    marks.forEach((m) => map.set(`${m.examId}:${m.paperId}:${m.studentId}`, m));
    this.state = { ...this.state, examMarks: Array.from(map.values()) };
    this.notify();
    return marks;
  }

  // ==========================================
  // EXAM RESULT ENGINE & CALCULATIONS
  // ==========================================
  public calculateAndSaveExamResults(examId: ExamId): ExamResult[] {
    const exam = this.state.exams.find((e) => e.id === examId);
    if (!exam) throw new Error(`Exam ${examId} not found`);

    const papers = this.state.examPapers.filter((p) => p.examId === examId);
    if (papers.length === 0) return [];

    const examMarks = this.state.examMarks.filter((m) => m.examId === examId);
    const candidateStudents = this.state.students.filter((s) => exam.classIds.includes(s.classId));

    const results: ExamResult[] = candidateStudents.map((std) => {
      const studentMarks = examMarks.filter((m) => m.studentId === std.id);
      let totalMarks = 0;
      let maxTotalMarks = 0;
      let failedSubjectsCount = 0;

      const subjectResults = papers.map((paper) => {
        const markRecord = studentMarks.find((m) => m.paperId === paper.id);
        const marksObtained = markRecord ? markRecord.marksObtained : 0;
        totalMarks += marksObtained;
        maxTotalMarks += paper.maxMarks;
        const isPass = marksObtained >= paper.passingMarks;
        if (!isPass) failedSubjectsCount++;

        const pct = paper.maxMarks > 0 ? (marksObtained / paper.maxMarks) * 100 : 0;
        const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 33 ? 'D' : 'F';

        return {
          subjectId: paper.subjectId,
          paperId: paper.id,
          marksObtained,
          maxMarks: paper.maxMarks,
          grade,
          status: (isPass ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
        };
      });

      const percentage = maxTotalMarks > 0 ? Number(((totalMarks / maxTotalMarks) * 100).toFixed(1)) : 0;
      const overallGrade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 33 ? 'D' : 'F';
      const overallStatus = failedSubjectsCount === 0 ? 'PASS' : failedSubjectsCount === 1 ? 'COMPARTMENT' : 'FAIL';

      return {
        id: `res-${examId}-${std.id}`,
        examId,
        studentId: std.id,
        examRollNumber: std.examRollNumber || '1000',
        academicSessionId: exam.academicSessionId,
        campusId: std.campusId || 'cmp-main',
        classId: std.classId,
        sectionId: std.sectionId,
        streamId: std.streamId,
        totalMarks,
        maxTotalMarks,
        percentage,
        grade: overallGrade,
        overallStatus,
        status: 'PUBLISHED',
        subjectResults,
        publishedAt: new Date().toISOString(),
      };
    });

    const otherResults = this.state.examResults.filter((r) => r.examId !== examId);
    this.state = {
      ...this.state,
      examResults: [...otherResults, ...results],
    };
    this.notify();
    return results;
  }

  public changeExamResultStatus(examId: ExamId, status: ResultStatus): void {
    this.state = {
      ...this.state,
      examResults: this.state.examResults.map((r) => (r.examId === examId ? { ...r, status } : r)),
    };
    this.notify();
  }

  // ==========================================
  // SETTINGS & CONTROL CENTER MUTATIONS
  // ==========================================
  public savePeriodSchedule(schedule: PeriodSchedule): PeriodSchedule {
    return this.updateSchedule(schedule);
  }

  public updateSchoolProfile(profile: Partial<SchoolProfile>): SchoolProfile {
    const updated = { ...this.state.schoolProfile, ...profile };
    this.state = { ...this.state, schoolProfile: updated };
    this.notify();
    return updated;
  }

  public updateBranding(branding: Partial<SchoolBranding>): SchoolBranding {
    const updated = { ...this.state.branding, ...branding };
    this.state = { ...this.state, branding: updated };
    this.notify();
    return updated;
  }

  public updateAttendanceSettings(settings: Partial<AttendanceSettings>): AttendanceSettings {
    const updated = { ...this.state.attendanceSettings, ...settings };
    this.state = { ...this.state, attendanceSettings: updated };
    this.notify();
    return updated;
  }

  public updateTimetableSettings(settings: Partial<TimetableSettings>): TimetableSettings {
    const updated = { ...this.state.timetableSettings, ...settings };
    this.state = { ...this.state, timetableSettings: updated };
    this.notify();
    return updated;
  }

  public updateHomeworkSettings(settings: Partial<HomeworkSettings>): HomeworkSettings {
    const updated = { ...this.state.homeworkSettings, ...settings };
    this.state = { ...this.state, homeworkSettings: updated };
    this.notify();
    return updated;
  }

  public createExamType(data: Omit<ExamTypeConfig, 'id'>): ExamTypeConfig {
    const newType: ExamTypeConfig = {
      ...data,
      id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.state = { ...this.state, examTypes: [...this.state.examTypes, newType] };
    this.notify();
    return newType;
  }

  public updateExamType(type: ExamTypeConfig): ExamTypeConfig {
    this.state = {
      ...this.state,
      examTypes: this.state.examTypes.map((t) => (t.id === type.id ? type : t)),
    };
    this.notify();
    return type;
  }

  public deleteExamType(id: string): boolean {
    this.state = {
      ...this.state,
      examTypes: this.state.examTypes.filter((t) => t.id !== id),
    };
    this.notify();
    return true;
  }

  public createExamTimeSlot(data: Omit<ExamTimeSlot, 'id'>): ExamTimeSlot {
    const newSlot: ExamTimeSlot = {
      ...data,
      id: `slt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.state = { ...this.state, examTimeSlots: [...this.state.examTimeSlots, newSlot] };
    this.notify();
    return newSlot;
  }

  public updateExamTimeSlot(slot: ExamTimeSlot): ExamTimeSlot {
    this.state = {
      ...this.state,
      examTimeSlots: this.state.examTimeSlots.map((s) => (s.id === slot.id ? slot : s)),
    };
    this.notify();
    return slot;
  }

  public deleteExamTimeSlot(id: string): boolean {
    this.state = {
      ...this.state,
      examTimeSlots: this.state.examTimeSlots.filter((s) => s.id !== id),
    };
    this.notify();
    return true;
  }

  public createGradingScheme(data: Omit<GradingScheme, 'id'>): GradingScheme {
    const newScheme: GradingScheme = {
      ...data,
      id: `grd-sch-${Date.now()}`,
    };
    this.state = {
      ...this.state,
      gradingSchemes: [...this.state.gradingSchemes, newScheme],
    };
    this.notify();
    return newScheme;
  }

  public updateGradingScheme(scheme: GradingScheme): GradingScheme {
    this.state = {
      ...this.state,
      gradingSchemes: this.state.gradingSchemes.map((s) => (s.id === scheme.id ? scheme : s)),
    };
    this.notify();
    return scheme;
  }

  public deleteGradingScheme(id: string): boolean {
    this.state = {
      ...this.state,
      gradingSchemes: this.state.gradingSchemes.filter((s) => s.id !== id),
    };
    this.notify();
    return true;
  }

  public updateExamRules(rules: Partial<ExamRulesConfig>): ExamRulesConfig {
    const updated = { ...this.state.examRules, ...rules };
    this.state = { ...this.state, examRules: updated };
    this.notify();
    return updated;
  }

  public updateResultSettings(settings: Partial<ResultSettings>): ResultSettings {
    const updated = { ...this.state.resultSettings, ...settings };
    this.state = { ...this.state, resultSettings: updated };
    this.notify();
    return updated;
  }

  public inviteUser(data: Omit<Invitation, 'id' | 'createdAt' | 'status'>): Invitation {
    const newInvitation: Invitation = {
      ...data,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      invitations: [...this.state.invitations, newInvitation],
    };
    this.notify();
    return newInvitation;
  }

  public revokeInvitation(id: string): boolean {
    this.state = {
      ...this.state,
      invitations: this.state.invitations.map((inv) =>
        inv.id === id ? { ...inv, status: 'REVOKED' as const } : inv
      ),
    };
    this.notify();
    return true;
  }

  public updateUser(user: UserAccount): UserAccount {
    this.state = {
      ...this.state,
      users: this.state.users.map((u) => (u.id === user.id ? user : u)),
    };
    this.notify();
    return user;
  }

  public createRole(data: Omit<RoleDefinition, 'id' | 'isSystem' | 'userCount'>): RoleDefinition {
    const newRole: RoleDefinition = {
      ...data,
      id: `role-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isSystem: false,
      userCount: 0,
    };
    this.state = { ...this.state, roles: [...this.state.roles, newRole] };
    this.notify();
    return newRole;
  }

  public updateRole(role: RoleDefinition): RoleDefinition {
    this.state = {
      ...this.state,
      roles: this.state.roles.map((r) => (r.id === role.id ? role : r)),
    };
    this.notify();
    return role;
  }

  public updateRolePermissions(
    roleId: string,
    permissions: Record<string, Record<PermissionAction, boolean>>
  ): void {
    this.state = {
      ...this.state,
      permissions: {
        ...this.state.permissions,
        [roleId]: permissions,
      },
    };
    this.notify();
  }

  public updateAuthSettings(settings: Partial<AuthSettings>): AuthSettings {
    const updated = { ...this.state.authSettings, ...settings };
    this.state = { ...this.state, authSettings: updated };
    this.notify();
    return updated;
  }

  public updatePasswordPolicy(policy: Partial<PasswordPolicy>): PasswordPolicy {
    const updated = { ...this.state.passwordPolicy, ...policy };
    this.state = { ...this.state, passwordPolicy: updated };
    this.notify();
    return updated;
  }

  public revokeSession(id: string): boolean {
    this.state = {
      ...this.state,
      sessions: this.state.sessions.filter((s) => s.id !== id),
    };
    this.notify();
    return true;
  }

  public revokeOtherSessions(): boolean {
    this.state = {
      ...this.state,
      sessions: this.state.sessions.filter((s) => s.isCurrent),
    };
    this.notify();
    return true;
  }

  public updateMFASettings(settings: Partial<MFASettings>): MFASettings {
    const updated = { ...this.state.mfaSettings, ...settings };
    this.state = { ...this.state, mfaSettings: updated };
    this.notify();
    return updated;
  }

  public updateRecoverySettings(settings: Partial<AccountRecoverySettings>): AccountRecoverySettings {
    const updated = { ...this.state.recoverySettings, ...settings };
    this.state = { ...this.state, recoverySettings: updated };
    this.notify();
    return updated;
  }

  public updateNoticeSettings(settings: Partial<NoticeSettings>): NoticeSettings {
    const updated = { ...this.state.noticeSettings, ...settings };
    this.state = { ...this.state, noticeSettings: updated };
    this.notify();
    return updated;
  }

  public updateNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
    const updated = { ...this.state.notificationSettings, ...settings };
    this.state = { ...this.state, notificationSettings: updated };
    this.notify();
    return updated;
  }

  public updatePrintSettings(settings: Partial<PrintSettings>): PrintSettings {
    const updated = { ...this.state.printSettings, ...settings };
    this.state = { ...this.state, printSettings: updated };
    this.notify();
    return updated;
  }

  // ==========================================
  // RESET TO DEFAULT
  // ==========================================
  public resetData(): void {
    const reseeded = seedExamAndRollData(
      initialCanonicalStudents,
      initialCanonicalClasses,
      initialCanonicalSubjects
    );
    this.state = {
      ...this.state,
      academicSessions: [...initialAcademicSessions],
      activeSessionId: 'session-2025-26',
      teachers: [...initialCanonicalTeachers],
      classes: [...initialCanonicalClasses],
      subjects: [...initialCanonicalSubjects],
      rooms: [...initialRooms],
      houses: [...initialCanonicalHouses],
      schedules: [...initialSchedules],
      activeScheduleId: 'sch-regular',
      timetable: [...initialCanonicalTimetable],
      students: [...reseeded.enrichedStudents],
      attendanceRegisters: {},
      homework: [...initialCanonicalHomework],
      campuses: [...initialCampuses],
      streams: [...initialStreams],
      classRollAssignments: [...reseeded.classRollAssignments],
      examRollAssignments: [...reseeded.examRollAssignments],
      rollAllocationConfig: { ...initialRollAllocationConfig },
      exams: [...reseeded.exams],
      examPapers: [...reseeded.examPapers],
      examSchedule: [...reseeded.examSchedule],
      examAttendances: [...reseeded.examAttendances],
      examMarks: [...reseeded.examMarks],
      examResults: [...reseeded.examResults],
    };
    this.notify();
  }
}

// Global Singleton Instance
export const schoolStore = new SchoolCentralStore();

/**
 * React Hook for reactive subscription to the Central School Store
 */
export function useSchoolStore<T = SchoolStoreState>(
  selector: (state: SchoolStoreState) => T = (s) => s as unknown as T
): T {
  const getSelectedSnapshot = () => selector(schoolStore.getSnapshot());
  return useSyncExternalStore(
    schoolStore.subscribe,
    getSelectedSnapshot,
    getSelectedSnapshot
  );
}
