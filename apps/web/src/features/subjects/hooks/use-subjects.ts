'use client';

import * as React from 'react';
import { SubjectDetail, SubjectFilterState } from '../types';
import { mockRepository } from '@/features/shared/mock-repository';

const defaultFilters: SubjectFilterState = {
  searchQuery: '',
  type: 'ALL',
  department: 'ALL',
  className: 'ALL',
  status: 'ALL',
};

export function useSubjects() {
  const [subjects, setSubjects] = React.useState<SubjectDetail[]>(() => mockRepository.getSubjects());
  const [filters, setFilters] = React.useState<SubjectFilterState>(defaultFilters);
  const [isLoading, setIsLoading] = React.useState(false);

  const departments = React.useMemo(() => {
    return Array.from(new Set(subjects.map((s) => s.department))).filter(Boolean);
  }, [subjects]);

  const classes = React.useMemo(() => {
    const list: string[] = [];
    subjects.forEach((s) => s.applicableClassNames.forEach((c) => list.push(c)));
    return Array.from(new Set(list)).filter(Boolean);
  }, [subjects]);

  const filteredSubjects = React.useMemo(() => {
    return subjects.filter((item) => {
      if (filters.type !== 'ALL' && item.type !== filters.type) return false;
      if (filters.department !== 'ALL' && item.department !== filters.department) return false;
      if (filters.status !== 'ALL' && item.status !== filters.status) return false;
      if (filters.className !== 'ALL' && !item.applicableClassNames.includes(filters.className)) return false;

      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesTeacher = item.qualifiedTeacherNames.some((t) => t.toLowerCase().includes(query));

        if (!matchesName && !matchesCode && !matchesTeacher) {
          return false;
        }
      }

      return true;
    });
  }, [subjects, filters]);

  const handleFilterChange = <K extends keyof SubjectFilterState>(key: K, value: SubjectFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleSaveSubject = (subject: SubjectDetail) => {
    mockRepository.saveSubject(subject);
    setSubjects(mockRepository.getSubjects());
  };

  return {
    subjects,
    filteredSubjects,
    filters,
    departments,
    classes,
    isLoading,
    setIsLoading,
    handleFilterChange,
    handleClearFilters,
    handleSaveSubject,
  };
}
