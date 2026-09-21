'use client';

import * as React from 'react';
import { HomeworkItem, HomeworkFilterState } from '../types';
import { mockRepository } from '@/features/shared/mock-repository';

export function useHomework() {
  const [allHomework, setAllHomework] = React.useState<HomeworkItem[]>(() =>
    mockRepository.getHomeworkList()
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const [filters, setFilters] = React.useState<HomeworkFilterState>({
    searchQuery: '',
    subjectId: '',
    classId: '',
    sectionId: '',
    status: 'ALL',
    dueDate: '',
  });

  const loadHomework = React.useCallback(() => {
    setIsLoading(true);
    const data = mockRepository.getHomeworkList();
    setAllHomework(data);
    setIsLoading(false);
  }, []);

  // Filtered list
  const filteredHomework = React.useMemo(() => {
    return allHomework.filter((hw) => {
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = hw.title.toLowerCase().includes(q);
        const matchDesc = hw.description.toLowerCase().includes(q);
        const matchTeacher = hw.teacherName.toLowerCase().includes(q);
        const matchSubject = hw.subjectName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTeacher && !matchSubject) return false;
      }

      if (filters.classId && hw.classId !== filters.classId) return false;
      if (filters.subjectId && hw.subjectId !== filters.subjectId) return false;
      if (filters.status !== 'ALL' && hw.status !== filters.status) return false;

      return true;
    });
  }, [allHomework, filters]);

  const handleUpdateFilters = (updates: Partial<HomeworkFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      subjectId: '',
      classId: '',
      sectionId: '',
      status: 'ALL',
      dueDate: '',
    });
  };

  const handleSaveHomework = (homework: HomeworkItem, isPublish: boolean) => {
    const itemToSave: HomeworkItem = {
      ...homework,
      status: isPublish ? 'PUBLISHED' : homework.status,
    };

    const exists = allHomework.some((h) => h.id === itemToSave.id);
    if (exists) {
      mockRepository.updateHomework(itemToSave);
    } else {
      mockRepository.addHomework(itemToSave);
    }
    loadHomework();
  };

  const handleDeleteHomework = (id: string) => {
    mockRepository.deleteHomework(id);
    loadHomework();
  };

  const handleToggleStatus = (item: HomeworkItem) => {
    const newStatus = item.status === 'CLOSED' ? 'PUBLISHED' : 'CLOSED';
    mockRepository.updateHomework({ ...item, status: newStatus });
    loadHomework();
  };

  // Metrics calculation
  const metrics = React.useMemo(() => {
    const totalCount = allHomework.length;
    const publishedCount = allHomework.filter((h) => h.status === 'PUBLISHED').length;
    const draftsCount = allHomework.filter((h) => h.status === 'DRAFT').length;
    const totalAssigned = allHomework.reduce((acc, h) => acc + h.totalStudents, 0);
    const totalCompleted = allHomework.reduce((acc, h) => acc + h.completedCount, 0);
    const avgCompletion = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    return {
      totalCount,
      publishedCount,
      draftsCount,
      avgCompletion,
    };
  }, [allHomework]);

  return {
    allHomework,
    filteredHomework,
    filters,
    isLoading,
    metrics,
    setFilters: handleUpdateFilters,
    resetFilters: handleResetFilters,
    saveHomework: handleSaveHomework,
    deleteHomework: handleDeleteHomework,
    toggleStatus: handleToggleStatus,
    refresh: loadHomework,
  };
}
