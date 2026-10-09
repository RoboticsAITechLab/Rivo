import { UserRole } from '@/types';

export type NavGroupId = 'OVERVIEW' | 'PEOPLE' | 'ACADEMICS' | 'ASSESSMENT' | 'COMMUNICATION' | 'FINANCE' | 'SYSTEM';

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

const ALL_ADMIN_ROLES: UserRole[] = ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'];
const LEADERSHIP_ROLES: UserRole[] = ['DIRECTOR', 'PRINCIPAL', 'OWNER'];

export const APP_NAVIGATION: AppNavItem[] = [
  // OVERVIEW
  {
    title: 'Dashboard',
    href: '/school',
    iconName: 'LayoutDashboard',
    group: 'OVERVIEW',
    description: 'Executive overview, metrics & operational activity',
    roles: [...ALL_ADMIN_ROLES, 'STAFF'],
    keywords: ['home', 'overview', 'analytics', 'kpi', 'stats', 'control center'],
  },
  {
    title: 'Teacher Dashboard',
    href: '/teacher/dashboard',
    iconName: 'LayoutDashboard',
    group: 'OVERVIEW',
    description: 'My daily timetable, assigned classes & pending attendance',
    roles: ['TEACHER'],
    keywords: ['teacher', 'my classes', 'schedule', 'daily'],
  },
  {
    title: 'Fee Dashboard',
    href: '/school/fees',
    iconName: 'CreditCard',
    group: 'OVERVIEW',
    description: 'Today collections, outstanding dues & quick payment recording',
    roles: ['FEE_MANAGER'],
    keywords: ['fees', 'collections', 'cashier', 'bursar', 'payments'],
  },

  // PEOPLE
  {
    title: 'Students',
    href: '/school/students',
    iconName: 'GraduationCap',
    group: 'PEOPLE',
    description: 'Student directory, admissions, enrollment & parent contacts',
    roles: [...ALL_ADMIN_ROLES, 'FEE_MANAGER', 'STAFF'],
    keywords: ['pupil', 'admission', 'enrollment', 'directory', 'children', 'guardian'],
  },
  {
    title: 'My Students',
    href: '/teacher/students',
    iconName: 'GraduationCap',
    group: 'PEOPLE',
    description: 'Students assigned to my teaching division and classes',
    roles: ['TEACHER'],
    keywords: ['students', 'class roster', 'my students'],
  },
  {
    title: 'Teachers',
    href: '/school/teachers',
    iconName: 'Users',
    group: 'PEOPLE',
    description: 'Faculty roster, department assignments & teaching workloads',
    roles: ALL_ADMIN_ROLES,
    keywords: ['faculty', 'staff', 'instructors', 'educators', 'workload'],
  },

  // ACADEMICS
  {
    title: 'Classes',
    href: '/school/classes',
    iconName: 'Layers',
    group: 'ACADEMICS',
    description: 'Academic grade levels, division sections & class teachers',
    roles: ALL_ADMIN_ROLES,
    keywords: ['grades', 'sections', 'divisions', 'classrooms', 'roster'],
  },
  {
    title: 'My Classes',
    href: '/teacher/classes',
    iconName: 'Layers',
    group: 'ACADEMICS',
    description: 'My assigned classes and class teacher duties',
    roles: ['TEACHER'],
    keywords: ['classes', 'sections', 'teaching'],
  },
  {
    title: 'Subjects',
    href: '/school/subjects',
    iconName: 'BookOpen',
    group: 'ACADEMICS',
    description: 'Curriculum subjects, codes & assigned instructors',
    roles: LEADERSHIP_ROLES,
    keywords: ['courses', 'curriculum', 'syllabus', 'department', 'codes'],
  },
  {
    title: 'Timetable',
    href: '/school/timetable',
    iconName: 'Clock',
    group: 'ACADEMICS',
    description: 'Weekly schedule matrix, room allocations & conflict detection',
    roles: ALL_ADMIN_ROLES,
    keywords: ['schedule', 'periods', 'routine', 'calendar', 'slots', 'rooms'],
  },
  {
    title: 'My Timetable',
    href: '/teacher/timetable',
    iconName: 'Clock',
    group: 'ACADEMICS',
    description: 'My weekly period routine, room assignments & schedule',
    roles: ['TEACHER'],
    keywords: ['routine', 'timetable', 'periods', 'schedule'],
  },
  {
    title: 'Attendance',
    href: '/school/attendance',
    iconName: 'CalendarCheck',
    group: 'ACADEMICS',
    description: 'Daily roll call registers, punch times & absence summaries',
    roles: ALL_ADMIN_ROLES,
    keywords: ['roll call', 'present', 'absent', 'registers', 'leave', 'punctuality'],
  },
  {
    title: 'Take Attendance',
    href: '/teacher/attendance',
    iconName: 'CalendarCheck',
    group: 'ACADEMICS',
    description: 'Submit daily roll call register for assigned classes',
    roles: ['TEACHER'],
    keywords: ['mark attendance', 'roll call', 'present'],
  },
  {
    title: 'Homework',
    href: '/school/homework',
    iconName: 'FileText',
    group: 'ACADEMICS',
    description: 'Class assignments, submission trackers & teacher review queue',
    roles: [...LEADERSHIP_ROLES, 'TEACHER'],
    keywords: ['assignments', 'tasks', 'coursework', 'projects', 'review queue'],
  },

  // ASSESSMENT
  {
    title: 'Exams',
    href: '/school/exams',
    iconName: 'Award',
    group: 'ASSESSMENT',
    description: 'Examination datesheets, examination halls & invigilation',
    roles: ALL_ADMIN_ROLES,
    keywords: ['tests', 'assessments', 'midterm', 'finals', 'halls', 'invigilator'],
  },
  {
    title: 'Results',
    href: '/school/results',
    iconName: 'BarChart2',
    group: 'ASSESSMENT',
    description: 'Academic mark entry, moderation review & report card publishing',
    roles: ALL_ADMIN_ROLES,
    keywords: ['grades', 'marks', 'report cards', 'scores', 'gpa', 'moderation'],
  },

  // COMMUNICATION
  {
    title: 'Notices',
    href: '/school/notices',
    iconName: 'Bell',
    group: 'COMMUNICATION',
    description: 'Official circulars, administrative alerts & school broadcasts',
    roles: [...ALL_ADMIN_ROLES, 'TEACHER', 'FEE_MANAGER', 'STAFF'],
    keywords: ['announcements', 'circulars', 'bulletins', 'news', 'broadcast'],
  },
  {
    title: 'Groups',
    href: '/school/communication/groups',
    iconName: 'Users',
    group: 'COMMUNICATION',
    description: 'Dynamic parent, class, and faculty communication groups',
    roles: ALL_ADMIN_ROLES,
    keywords: ['groups', 'audiences', 'parents', 'teachers', 'cohorts'],
  },
  {
    title: 'Notifications',
    href: '/school/notifications',
    iconName: 'Inbox',
    group: 'COMMUNICATION',
    description: 'Administrative notification stream & operational alerts',
    roles: [...ALL_ADMIN_ROLES, 'STAFF'],
    keywords: ['alerts', 'inbox', 'messages', 'updates', 'unread'],
  },

  // FINANCE
  {
    title: 'Fee Management',
    href: '/school/fees',
    iconName: 'CreditCard',
    group: 'FINANCE',
    description: 'Fee collection, plans, student ledgers & financial receipts',
    roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    keywords: ['fees', 'payments', 'receipts', 'installments', 'dues', 'finance', 'ledger', 'concessions', 'bursar', 'cashier'],
  },

  // SYSTEM
  {
    title: 'Settings',
    href: '/school/settings',
    iconName: 'Settings',
    group: 'SYSTEM',
    description: 'School institutional profile, academic sessions & security',
    roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER', 'FEE_MANAGER'],
    keywords: ['configuration', 'preferences', 'session', 'tenant', 'setup', 'profile'],
  },
  {
    title: 'Staff Invitations',
    href: '/school/settings/invitations',
    iconName: 'UserPlus',
    group: 'SYSTEM',
    description: 'Manage staff and faculty onboarding invitations',
    roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    keywords: ['invite', 'faculty', 'onboarding', 'staff'],
  },
  {
    title: 'Testing & Observability',
    href: '/admin/testing',
    iconName: 'Activity',
    group: 'SYSTEM',
    description: 'Production testing, live health, benchmarks & observability center',
    roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    keywords: ['testing', 'health', 'observability', 'load test', 'benchmark', 'diagnostics'],
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
    group: 'FINANCE',
    label: 'Finance',
    items: APP_NAVIGATION.filter((item) => item.group === 'FINANCE'),
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
