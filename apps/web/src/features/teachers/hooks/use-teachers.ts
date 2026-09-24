'use client';

import * as React from 'react';
import { TeacherDetail, TeacherFilterState } from '../types';

const defaultFilters: TeacherFilterState = {
  searchQuery: '',
  department: 'ALL',
  subject: 'ALL',
  className: 'ALL',
  status: 'ALL',
  employmentType: 'ALL',
};

function mapApiTeacherToDetail(t: any): TeacherDetail {
  const assignments = (t.assignments || []).map((a: any) => ({
    id: a.id,
    classId: a.classId,
    className: a.className,
    sectionId: a.sectionId,
    sectionName: a.sectionName,
    subjectId: a.subjectId,
    subjectName: a.subjectName,
    periodsPerWeek: a.periodsPerWeek || 5,
  }));

  const totalPeriodsCount = assignments.reduce((acc: number, a: any) => acc + (a.periodsPerWeek || 0), 0);
  const totalClassesCount = new Set(assignments.map((a: any) => a.className)).size;

  const names = (t.name || '').split(' ');
  const firstName = t.firstName || names[0] || 'Teacher';
  const lastName = t.lastName || names.slice(1).join(' ') || '';

  return {
    id: t.id,
    status: t.status || 'ACTIVE',
    personal: {
      firstName,
      lastName,
      email: t.email || '',
      phone: t.phone || '',
      gender: 'Male',
      bloodGroup: 'O+',
      dateOfBirth: '1985-05-15',
    },
    employment: {
      employeeId: t.employeeId || 'TCH-000',
      department: t.department || 'General',
      designation: t.designation || 'Faculty Member',
      joiningDate: t.createdAt ? t.createdAt.split('T')[0] : '2024-01-01',
      qualification: t.qualification || 'Master of Education',
      experienceYears: 5,
      employmentType: 'FULL_TIME',
    },
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    assignments,
    totalClassesCount: totalClassesCount || t.totalClassesCount || 0,
    weeklyPeriods: totalPeriodsCount,
    totalStudentsCount: 0,
    attendanceRate: 96,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.createdAt || new Date().toISOString(),
  };
}

export function useTeachers() {
  const [teachers, setTeachers] = React.useState<TeacherDetail[]>([]);
  const [filters, setFilters] = React.useState<TeacherFilterState>(defaultFilters);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [simulatedError, setSimulatedError] = React.useState(false);

  const fetchTeachers = React.useCallback(async () => {
    setIsLoading(true);
    setSimulatedError(false);
    try {
      const params = new URLSearchParams();
      if (filters.searchQuery.trim()) {
        params.set('search', filters.searchQuery.trim());
      }
      if (filters.status && filters.status !== 'ALL') {
        params.set('status', filters.status);
      }

      const res = await fetch(`/api/teachers?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load teachers roster (${res.status})`);
      }
      const data = await res.json();
      const mapped = (data.teachers || []).map(mapApiTeacherToDetail);
      setTeachers(mapped);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setSimulatedError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filters.searchQuery, filters.status]);

  React.useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Derived filter options
  const departments = React.useMemo(() => {
    return Array.from(new Set(teachers.map((t) => t.employment.department))).filter(Boolean);
  }, [teachers]);

  const subjects = React.useMemo(() => {
    const list: string[] = [];
    teachers.forEach((t) => t.assignments.forEach((a) => list.push(a.subjectName)));
    return Array.from(new Set(list)).filter(Boolean);
  }, [teachers]);

  const classes = React.useMemo(() => {
    const list: string[] = [];
    teachers.forEach((t) => t.assignments.forEach((a) => list.push(a.className)));
    return Array.from(new Set(list)).filter(Boolean);
  }, [teachers]);

  // Filtered teachers
  const filteredTeachers = React.useMemo(() => {
    return teachers.filter((teacher) => {
      // 1. Search Query
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const fullName = `${teacher.personal.firstName} ${teacher.personal.lastName}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesEmpId = teacher.employment.employeeId.toLowerCase().includes(query);
        const matchesEmail = teacher.personal.email.toLowerCase().includes(query);
        const matchesDesignation = teacher.employment.designation.toLowerCase().includes(query);

        if (!matchesName && !matchesEmpId && !matchesEmail && !matchesDesignation) {
          return false;
        }
      }

      // 2. Department
      if (filters.department !== 'ALL' && teacher.employment.department !== filters.department) {
        return false;
      }

      // 3. Subject
      if (filters.subject !== 'ALL') {
        const teachesSubject = teacher.assignments.some((a) => a.subjectName === filters.subject);
        if (!teachesSubject) return false;
      }

      // 4. Class
      if (filters.className !== 'ALL') {
        const teachesClass = teacher.assignments.some((a) => a.className === filters.className);
        if (!teachesClass) return false;
      }

      // 5. Status
      if (filters.status !== 'ALL' && teacher.status !== filters.status) {
        return false;
      }

      // 6. Employment Type
      if (filters.employmentType !== 'ALL' && teacher.employment.employmentType !== filters.employmentType) {
        return false;
      }

      return true;
    });
  }, [teachers, filters]);

  const handleFilterChange = <K extends keyof TeacherFilterState>(key: K, value: TeacherFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    const currentIds = filteredTeachers.map((t) => t.id);
    const allSelected = currentIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleSaveTeacher = async (teacher: TeacherDetail) => {
    const exists = teachers.some((t) => t.id === teacher.id && !t.id.startsWith('tch-temp-'));
    const assignments = teacher.assignments.map((a) => ({
      classId: a.classId,
      sectionId: a.sectionId,
      subjectId: a.subjectId,
      periodsPerWeek: a.periodsPerWeek,
    }));

    if (exists) {
      await fetch(`/api/teachers/${teacher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: teacher.personal.firstName,
          lastName: teacher.personal.lastName,
          phone: teacher.personal.phone,
          department: teacher.employment.department,
          designation: teacher.employment.designation,
          qualification: teacher.employment.qualification,
          status: teacher.status,
        }),
      });
    } else {
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: teacher.personal.firstName,
          lastName: teacher.personal.lastName,
          email: teacher.personal.email,
          password: teacher.personal.password || 'Password@123',
          employeeId: teacher.employment.employeeId,
          phone: teacher.personal.phone,
          department: teacher.employment.department,
          designation: teacher.employment.designation,
          qualification: teacher.employment.qualification,
          assignments,
        }),
      });
    }

    await fetchTeachers();
  };

  const handleUpdateStatus = async (id: string, status: TeacherDetail['status']) => {
    try {
      await fetch(`/api/teachers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchTeachers();
    } catch (err) {
      console.error('Error updating teacher status:', err);
    }
  };

  const handleArchiveTeacher = async (id: string) => {
    try {
      await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
      });
      await fetchTeachers();
    } catch (err) {
      console.error('Error archiving teacher:', err);
    }
  };

  return {
    teachers,
    filteredTeachers,
    filters,
    selectedIds,
    departments,
    subjects,
    classes,
    isLoading,
    simulatedError,
    setSimulatedError,
    setIsLoading,
    handleFilterChange,
    handleClearFilters,
    handleSelectRow,
    handleSelectAll,
    handleClearSelection,
    handleSaveTeacher,
    handleUpdateStatus,
    handleArchiveTeacher,
  };
}
