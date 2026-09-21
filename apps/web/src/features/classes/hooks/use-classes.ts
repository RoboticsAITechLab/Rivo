'use client';

import * as React from 'react';
import { ClassItem, ClassFilterState } from '../types';
import { mockRepository } from '@/features/shared/mock-repository';

const defaultFilters: ClassFilterState = {
  searchQuery: '',
  session: '2026-27',
  grade: 'ALL',
  status: 'ALL',
};

export function useClasses() {
  const [classes, setClasses] = React.useState<ClassItem[]>(() => mockRepository.getClasses());
  const [filters, setFilters] = React.useState<ClassFilterState>(defaultFilters);
  const [isLoading, setIsLoading] = React.useState(false);

  const filteredClasses = React.useMemo(() => {
    return classes.filter((item) => {
      if (filters.session !== 'ALL' && item.academicSession !== filters.session) return false;
      if (filters.status !== 'ALL' && item.status !== filters.status) return false;
      if (filters.grade !== 'ALL' && item.gradeLevel.toString() !== filters.grade) return false;

      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = item.className.toLowerCase().includes(query);
        const matchesDisplay = item.displayName.toLowerCase().includes(query);
        const matchesTeacher = item.primaryClassTeacher.toLowerCase().includes(query);
        const matchesSectionTeacher = item.sections.some((s) => s.classTeacherName.toLowerCase().includes(query));

        if (!matchesName && !matchesDisplay && !matchesTeacher && !matchesSectionTeacher) {
          return false;
        }
      }

      return true;
    });
  }, [classes, filters]);

  const handleFilterChange = <K extends keyof ClassFilterState>(key: K, value: ClassFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveClass = (classItem: ClassItem) => {
    mockRepository.saveClass(classItem);
    setClasses(mockRepository.getClasses());
  };

  return {
    classes,
    filteredClasses,
    filters,
    isLoading,
    setIsLoading,
    handleFilterChange,
    handleSaveClass,
  };
}
