export interface SectionItem {
  id: string;
  name: string;
  classTeacherId: string;
  classTeacherName: string;
  studentCount: number;
  subjectsCount: number;
  roomNumber?: string;
  attendanceRate: number;
}

export interface ClassItem {
  id: string;
  academicSession: string;
  className: string;
  displayName: string;
  gradeLevel: number;
  status: 'ACTIVE' | 'ARCHIVED';
  sections: SectionItem[];
  totalStudents: number;
  totalSections: number;
  primaryClassTeacher: string;
  createdAt: string;
}

export interface ClassFilterState {
  searchQuery: string;
  session: string;
  grade: string;
  status: string;
}
