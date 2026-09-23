'use client';

import * as React from 'react';
import { ClassItem, ClassFilterState } from '../types';

const defaultFilters: ClassFilterState = {
  searchQuery: '',
  session: 'ALL',
  grade: 'ALL',
  status: 'ALL',
};

export function useClasses() {
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [filters, setFilters] = React.useState<ClassFilterState>(defaultFilters);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchClasses = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/classes');
      if (!res.ok) {
        throw new Error('Failed to fetch classes.');
      }
      const data = await res.json();
      const rawClasses: any[] = data.classes || [];

      const formatted: ClassItem[] = rawClasses.map((c) => ({
        id: c.id,
        academicSession: 'Current Session',
        className: c.name,
        displayName: c.name,
        gradeLevel: parseInt(c.name.replace(/\D/g, ''), 10) || 1,
        status: 'ACTIVE',
        sections: (c.sections || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          classTeacherId: '',
          classTeacherName: 'Assigned Faculty',
          studentCount: s.studentCount || 0,
          subjectsCount: 0,
          attendanceRate: 100,
        })),
        totalStudents: c.totalStudents || 0,
        totalSections: c.totalSections || (c.sections ? c.sections.length : 0),
        primaryClassTeacher: 'Faculty Head',
        createdAt: c.createdAt || new Date().toISOString(),
      }));

      setClasses(formatted);
    } catch (err: any) {
      console.error('Error loading classes:', err);
      setError(err?.message || 'Error loading classes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = React.useMemo(() => {
    return classes.filter((item) => {
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = item.className.toLowerCase().includes(query);
        const matchesDisplay = item.displayName.toLowerCase().includes(query);
        if (!matchesName && !matchesDisplay) {
          return false;
        }
      }
      return true;
    });
  }, [classes, filters]);

  const handleFilterChange = <K extends keyof ClassFilterState>(key: K, value: ClassFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveClass = async (classItem: Partial<ClassItem>) => {
    try {
      setIsLoading(true);
      const sectionNames = classItem.sections?.map((s) => s.name) || ['A'];

      if (classItem.id && !classItem.id.startsWith('cls-temp-') && !classItem.id.startsWith('mock-')) {
        // Update existing class
        const res = await fetch(`/api/classes/${classItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: classItem.className,
            displayOrder: classItem.gradeLevel || 0,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to update class.');
        }
      } else {
        // Create new class
        const res = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: classItem.className,
            displayOrder: classItem.gradeLevel || 0,
            sections: sectionNames,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to create class.');
        }
      }
      await fetchClasses();
    } catch (err: any) {
      console.error('Error saving class:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    classes,
    filteredClasses,
    filters,
    isLoading,
    error,
    setIsLoading,
    handleFilterChange,
    handleSaveClass,
    refreshClasses: fetchClasses,
  };
}
