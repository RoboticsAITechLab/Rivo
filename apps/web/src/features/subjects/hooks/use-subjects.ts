'use client';

import * as React from 'react';
import { SubjectDetail, SubjectFilterState } from '../types';

const defaultFilters: SubjectFilterState = {
  searchQuery: '',
  type: 'ALL',
  department: 'ALL',
  className: 'ALL',
  status: 'ALL',
};

export function useSubjects() {
  const [subjects, setSubjects] = React.useState<SubjectDetail[]>([]);
  const [filters, setFilters] = React.useState<SubjectFilterState>(defaultFilters);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSubjects = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/subjects');
      if (!res.ok) {
        throw new Error('Failed to fetch subjects.');
      }
      const data = await res.json();
      const rawSubjects: any[] = data.subjects || [];

      const formatted: SubjectDetail[] = rawSubjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code || '',
        type: 'CORE',
        department: 'General Academics',
        description: '',
        applicableClassIds: [],
        applicableClassNames: [],
        qualifiedTeacherIds: [],
        qualifiedTeacherNames: [],
        weeklyPeriods: s.timetableSlotCount || 5,
        status: 'ACTIVE',
        createdAt: s.createdAt || new Date().toISOString(),
      }));

      setSubjects(formatted);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err?.message || 'Error fetching subjects.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

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
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode = item.code.toLowerCase().includes(query);
        if (!matchesName && !matchesCode) {
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

  const handleSaveSubject = async (subject: Partial<SubjectDetail>) => {
    try {
      setIsLoading(true);
      if (subject.id && !subject.id.startsWith('sub-temp-') && !subject.id.startsWith('mock-')) {
        const res = await fetch(`/api/subjects/${subject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subject.name,
            code: subject.code,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to update subject.');
        }
      } else {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subject.name,
            code: subject.code,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to create subject.');
        }
      }
      await fetchSubjects();
    } catch (err: any) {
      console.error('Error saving subject:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subjects,
    filteredSubjects,
    filters,
    departments,
    classes,
    isLoading,
    error,
    handleFilterChange,
    handleClearFilters,
    handleSaveSubject,
    refreshSubjects: fetchSubjects,
  };
}
