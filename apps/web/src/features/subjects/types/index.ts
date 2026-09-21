import { SubjectType, SubjectStatus } from '@/features/shared/types';

export interface SubjectDetail {
  id: string;
  name: string;
  code: string;
  type: SubjectType;
  department: string;
  description?: string;
  applicableClassIds: string[];
  applicableClassNames: string[];
  qualifiedTeacherIds: string[];
  qualifiedTeacherNames: string[];
  weeklyPeriods: number;
  status: SubjectStatus;
  createdAt: string;
}

export interface SubjectFilterState {
  searchQuery: string;
  type: string;
  department: string;
  className: string;
  status: string;
}
