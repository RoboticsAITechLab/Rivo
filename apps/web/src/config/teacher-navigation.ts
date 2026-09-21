import { NavGroupId } from './navigation';

export interface TeacherNavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export const TEACHER_NAVIGATION: TeacherNavItem[] = [
  {
    title: 'Dashboard',
    href: '/teacher/dashboard',
    iconName: 'LayoutDashboard',
    description: 'Overview of assigned classes, schedule, and attendance status',
  },
  {
    title: 'Attendance',
    href: '/teacher/attendance',
    iconName: 'CalendarCheck',
    description: 'Mark and submit daily roll-call attendance for assigned classes',
  },
  {
    title: 'My Classes',
    href: '/teacher/classes',
    iconName: 'Layers',
    description: 'Classes and divisions assigned to your academic portfolio',
  },
  {
    title: 'Students',
    href: '/teacher/students',
    iconName: 'GraduationCap',
    description: 'Enrolled students roster in your assigned sections',
  },
  {
    title: 'Timetable',
    href: '/teacher/timetable',
    iconName: 'Clock',
    description: 'Your weekly teaching periods schedule',
  },
];
