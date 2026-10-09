'use client';

import * as React from 'react';
import { HomeworkItem, HomeworkFilterState } from '../types';
import { toast } from 'sonner';

export function useHomework() {
  const [allHomework, setAllHomework] = React.useState<HomeworkItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<HomeworkFilterState>({
    searchQuery: '',
    subjectId: '',
    classId: '',
    sectionId: '',
    status: 'ALL',
    dueDate: '',
  });

  const loadHomework = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/homework');
      if (!res.ok) {
        throw new Error('Failed to load homework assignments');
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.homework)) {
        setAllHomework(data.homework);
      }
    } catch (err: any) {
      console.error('Error fetching homework from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadHomework();
  }, [loadHomework]);

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

  const handleSaveHomework = async (homework: HomeworkItem, isPublish: boolean) => {
    const isNew = !homework.id || homework.id.startsWith('hw-');
    const status = isPublish ? 'PUBLISHED' : (homework.status || 'DRAFT');

    try {
      if (isNew) {
        const res = await fetch('/api/homework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: homework.title,
            description: homework.description,
            classId: homework.classId,
            sectionId: homework.sectionId || undefined,
            subjectId: homework.subjectId,
            teacherId: homework.teacherId || undefined,
            assignedDate: homework.assignedDate || new Date().toISOString().split('T')[0],
            dueDate: homework.dueDate,
            attachments: homework.attachments || [],
            status,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to create homework');
        }

        toast.success(isPublish ? 'Homework published successfully!' : 'Homework draft saved!');
      } else {
        const res = await fetch('/api/homework', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: homework.id,
            title: homework.title,
            description: homework.description,
            dueDate: homework.dueDate,
            status,
            attachments: homework.attachments,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to update homework');
        }

        toast.success('Homework updated successfully!');
      }

      await loadHomework();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save homework');
      throw err;
    }
  };

  const handleDeleteHomework = async (id: string) => {
    try {
      const res = await fetch(`/api/homework?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete homework');
      }

      toast.success('Homework deleted successfully.');
      await loadHomework();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete homework');
    }
  };

  const handleToggleStatus = async (item: HomeworkItem) => {
    const newStatus = item.status === 'CLOSED' ? 'PUBLISHED' : 'CLOSED';
    try {
      const res = await fetch('/api/homework', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Homework marked as ${newStatus.toLowerCase()}.`);
      await loadHomework();
    } catch (err: any) {
      toast.error('Failed to update homework status');
    }
  };

  // Metrics calculation
  const metrics = React.useMemo(() => {
    const totalCount = allHomework.length;
    const publishedCount = allHomework.filter((h) => h.status === 'PUBLISHED').length;
    const draftsCount = allHomework.filter((h) => h.status === 'DRAFT').length;
    const totalAssigned = allHomework.reduce((acc, h) => acc + (h.totalStudents || 0), 0);
    const totalCompleted = allHomework.reduce((acc, h) => acc + (h.completedCount || 0), 0);
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
