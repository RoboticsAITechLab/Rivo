export interface PermissionDef {
  code: string;
  module: string;
  action: string;
  name: string;
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionDef[] = [
  // Attendance
  {
    code: 'attendance.view',
    module: 'attendance',
    action: 'view',
    name: 'View Attendance',
    description: 'View daily classroom attendance registers and rosters',
  },
  {
    code: 'attendance.take',
    module: 'attendance',
    action: 'take',
    name: 'Take Attendance',
    description: 'Mark and submit daily classroom attendance for assigned classes',
  },
  {
    code: 'attendance.edit',
    module: 'attendance',
    action: 'edit',
    name: 'Edit Attendance',
    description: 'Modify or correct past attendance records',
  },

  // School Timetable (Normal Weekly Schedule)
  {
    code: 'school_timetable.view',
    module: 'school_timetable',
    action: 'view',
    name: 'View School Timetable',
    description: 'View daily and weekly classroom timetable schedules',
  },
  {
    code: 'school_timetable.create',
    module: 'school_timetable',
    action: 'create',
    name: 'Create Timetable Slots',
    description: 'Create weekly periods, teacher allocations, and classroom schedules',
  },
  {
    code: 'school_timetable.edit',
    module: 'school_timetable',
    action: 'edit',
    name: 'Edit Timetable Slots',
    description: 'Modify weekly periods, room numbers, and subject assignments',
  },
  {
    code: 'school_timetable.delete',
    module: 'school_timetable',
    action: 'delete',
    name: 'Delete Timetable Slots',
    description: 'Remove regular weekly timetable periods',
  },

  // Exam Timetable (Formal Examination Schedule - Decoupled)
  {
    code: 'exam_timetable.view',
    module: 'exam_timetable',
    action: 'view',
    name: 'View Exam Timetable',
    description: 'View formal examination terms, papers, and date-sheets',
  },
  {
    code: 'exam_timetable.create',
    module: 'exam_timetable',
    action: 'create',
    name: 'Create Exam Timetable',
    description: 'Create exam date-sheets, timing slots, and seating allocations',
  },
  {
    code: 'exam_timetable.edit',
    module: 'exam_timetable',
    action: 'edit',
    name: 'Edit Exam Timetable',
    description: 'Reschedule exam dates, papers, and venues',
  },
  {
    code: 'exam_timetable.delete',
    module: 'exam_timetable',
    action: 'delete',
    name: 'Delete Exam Timetable',
    description: 'Cancel or delete exam date-sheets and papers',
  },

  // Students
  {
    code: 'students.view',
    module: 'students',
    action: 'view',
    name: 'View Students',
    description: 'View student directory, enrollment records, and basic profiles',
  },
  {
    code: 'students.create',
    module: 'students',
    action: 'create',
    name: 'Admit Students',
    description: 'Complete student admission workflows and generate student records',
  },
  {
    code: 'students.edit',
    module: 'students',
    action: 'edit',
    name: 'Edit Students',
    description: 'Update student profiles, family contacts, and documents',
  },
  {
    code: 'students.delete',
    module: 'students',
    action: 'delete',
    name: 'Archive/Delete Students',
    description: 'Transfer, suspend, or archive student records',
  },

  // Teachers
  {
    code: 'teachers.view',
    module: 'teachers',
    action: 'view',
    name: 'View Teachers',
    description: 'View faculty directory and contact information',
  },
  {
    code: 'teachers.create',
    module: 'teachers',
    action: 'create',
    name: 'Onboard Teachers',
    description: 'Add new teachers and configure teacher accounts',
  },
  {
    code: 'teachers.edit',
    module: 'teachers',
    action: 'edit',
    name: 'Edit Teachers',
    description: 'Update teacher profiles, employment details, and assignments',
  },
  {
    code: 'teachers.delete',
    module: 'teachers',
    action: 'delete',
    name: 'Deactivate Teachers',
    description: 'Terminate or archive teacher records',
  },

  // Exams
  {
    code: 'exams.view',
    module: 'exams',
    action: 'view',
    name: 'View Exams',
    description: 'View examination terms and paper lists',
  },
  {
    code: 'exams.create',
    module: 'exams',
    action: 'create',
    name: 'Create Exams',
    description: 'Create exam series and define grading structures',
  },
  {
    code: 'exams.edit',
    module: 'exams',
    action: 'edit',
    name: 'Edit Exams',
    description: 'Modify exam details and paper parameters',
  },
  {
    code: 'exams.delete',
    module: 'exams',
    action: 'delete',
    name: 'Delete Exams',
    description: 'Remove exam terms and papers',
  },

  // Results
  {
    code: 'results.view',
    module: 'results',
    action: 'view',
    name: 'View Results',
    description: 'View exam marks, grades, and grade cards',
  },
  {
    code: 'results.enter_marks',
    module: 'results',
    action: 'enter_marks',
    name: 'Enter Marks',
    description: 'Enter marks and scores for students in assigned subjects',
  },
  {
    code: 'results.publish',
    module: 'results',
    action: 'publish',
    name: 'Publish Results',
    description: 'Publish exam results to parents and students',
  },
];
