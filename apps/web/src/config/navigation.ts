import { UserRole } from '@/types';

export type NavGroupId = 'OVERVIEW' | 'PEOPLE' | 'ACADEMICS' | 'ASSESSMENT' | 'COMMUNICATION' | 'SYSTEM';

export interface AppNavItem {
  title: string;
  href: string;
  iconName: string;
  group: NavGroupId;
  badge?: string;
  description?: string;
  roles?: UserRole[];
  keywords?: string[];
}

export interface AppNavGroup {
  group: NavGroupId;
  label: string;
  items: AppNavItem[];
}

export const APP_NAVIGATION: AppNavItem[] = [
  // OVERVIEW
  {
    title: 'Dashboard',
    href: '/school',
    iconName: 'LayoutDashboard',
    group: 'OVERVIEW',
    description: 'Executive overview, metrics & operational activity',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['home', 'overview', 'analytics', 'kpi', 'stats', 'control center'],
  },

  // PEOPLE
  {
    title: 'Students',
    href: '/school/students',
    iconName: 'GraduationCap',
    group: 'PEOPLE',
    description: 'Student directory, admissions, enrollment & parent contacts',
    roles: ['SCHOOL_ADMIN', 'TEACHER'],
    keywords: ['pupil', 'admission', 'enrollment', 'directory', 'children', 'guardian'],
  },
  {
    title: 'Teachers',
    href: '/school/teachers',
    iconName: 'Users',
    group: 'PEOPLE',
    description: 'Faculty roster, department assignments & teaching workloads',
    roles: ['SCHOOL_ADMIN'],
    keywords: ['faculty', 'staff', 'instructors', 'educators', 'workload'],
  },

  // ACADEMICS
  {
    title: 'Classes',
    href: '/school/classes',
    iconName: 'Layers',
    group: 'ACADEMICS',
    description: 'Academic grade levels, division sections & class teachers',
    roles: ['SCHOOL_ADMIN', 'TEACHER'],
    keywords: ['grades', 'sections', 'divisions', 'classrooms', 'roster'],
  },
  {
    title: 'Subjects',
    href: '/school/subjects',
    iconName: 'BookOpen',
    group: 'ACADEMICS',
    description: 'Curriculum subjects, codes & assigned instructors',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['courses', 'curriculum', 'syllabus', 'department', 'codes'],
  },
  {
    title: 'Timetable',
    href: '/school/timetable',
    iconName: 'Clock',
    group: 'ACADEMICS',
    description: 'Weekly schedule matrix, room allocations & conflict detection',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['schedule', 'periods', 'routine', 'calendar', 'slots', 'rooms'],
  },
  {
    title: 'Attendance',
    href: '/school/attendance',
    iconName: 'CalendarCheck',
    group: 'ACADEMICS',
    description: 'Daily roll call registers, punch times & absence summaries',
    roles: ['SCHOOL_ADMIN', 'TEACHER'],
    keywords: ['roll call', 'present', 'absent', 'registers', 'leave', 'punctuality'],
  },
  {
    title: 'Homework',
    href: '/school/homework',
    iconName: 'FileText',
    group: 'ACADEMICS',
    description: 'Class assignments, submission trackers & teacher review queue',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['assignments', 'tasks', 'coursework', 'projects', 'review queue'],
  },

  // ASSESSMENT
  {
    title: 'Exams',
    href: '/school/exams',
    iconName: 'Award',
    group: 'ASSESSMENT',
    description: 'Examination datesheets, examination halls & invigilation',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['tests', 'assessments', 'midterm', 'finals', 'halls', 'invigilator'],
  },
  {
    title: 'Results',
    href: '/school/results',
    iconName: 'BarChart2',
    group: 'ASSESSMENT',
    description: 'Academic mark entry, moderation review & report card publishing',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['grades', 'marks', 'report cards', 'scores', 'gpa', 'moderation'],
  },

  // COMMUNICATION
  {
    title: 'Notices',
    href: '/school/notices',
    iconName: 'Bell',
    group: 'COMMUNICATION',
    description: 'Official circulars, administrative alerts & school broadcasts',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['announcements', 'circulars', 'bulletins', 'news', 'broadcast'],
  },
  {
    title: 'Groups',
    href: '/school/communication/groups',
    iconName: 'Users',
    group: 'COMMUNICATION',
    description: 'Dynamic parent, class, and faculty communication groups',
    roles: ['SCHOOL_ADMIN', 'TEACHER'],
    keywords: ['groups', 'audiences', 'parents', 'teachers', 'cohorts'],
  },
  {
    title: 'Notifications',
    href: '/school/notifications',
    iconName: 'Inbox',
    group: 'COMMUNICATION',
    description: 'Administrative notification stream & operational alerts',
    roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
    keywords: ['alerts', 'inbox', 'messages', 'updates', 'unread'],
  },

  // SYSTEM
  {
    title: 'Settings',
    href: '/school/settings',
    iconName: 'Settings',
    group: 'SYSTEM',
    description: 'School institutional profile, academic sessions & security',
    roles: ['SCHOOL_ADMIN'],
    keywords: ['configuration', 'preferences', 'session', 'tenant', 'setup', 'profile'],
  },
];

export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    group: 'OVERVIEW',
    label: 'Overview',
    items: APP_NAVIGATION.filter((item) => item.group === 'OVERVIEW'),
  },
  {
    group: 'PEOPLE',
    label: 'People',
    items: APP_NAVIGATION.filter((item) => item.group === 'PEOPLE'),
  },
  {
    group: 'ACADEMICS',
    label: 'Academics',
    items: APP_NAVIGATION.filter((item) => item.group === 'ACADEMICS'),
  },
  {
    group: 'ASSESSMENT',
    label: 'Assessment',
    items: APP_NAVIGATION.filter((item) => item.group === 'ASSESSMENT'),
  },
  {
    group: 'COMMUNICATION',
    label: 'Communication',
    items: APP_NAVIGATION.filter((item) => item.group === 'COMMUNICATION'),
  },
  {
    group: 'SYSTEM',
    label: 'System',
    items: APP_NAVIGATION.filter((item) => item.group === 'SYSTEM'),
  },
];

/**
 * Filter navigation items based on current active user role.
 */
export function getNavForRole(role: UserRole): AppNavGroup[] {
  return APP_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || item.roles.includes(role),
    ),
  })).filter((group) => group.items.length > 0);
}
