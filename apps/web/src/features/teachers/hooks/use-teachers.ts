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
  campusId: 'ALL',
};

function mapApiTeacherToDetail(t: any): TeacherDetail {
  const assignments = (t.assignments || []).map((a: any) => ({
    id: a.id,
    classId: a.classId,
    className: a.className,
    sectionId: a.sectionId,
    sectionName: a.sectionName,
    streamId: a.streamId || null,
    subjectId: a.subjectId,
    subjectName: a.subjectName,
    periodsPerWeek: a.periodsPerWeek || 5,
  }));

  const totalPeriodsCount = assignments.reduce((acc: number, a: any) => acc + (a.periodsPerWeek || 0), 0);
  const totalClassesCount = new Set(assignments.map((a: any) => a.className)).size;

  const firstName = t.firstName || t.name?.split(' ')[0] || '';
  const lastName = t.lastName || t.name?.split(' ').slice(1).join(' ') || '';

  return {
    id: t.id,
    status: t.status || 'ACTIVE',
    personal: {
      firstName,
      lastName,
      email: t.email || '',
      phone: t.phone || '',
      photoUrl: t.photoUrl || null,
      gender: (t.gender as 'Male' | 'Female' | 'Other') || 'Male',
      dateOfBirth: t.dateOfBirth || '',
    },
    employment: {
      employeeId: t.employeeId || 'TCH-000',
      department: t.department || 'General',
      designation: t.designation || 'Faculty Member',
      joiningDate: t.joiningDate || (t.createdAt ? t.createdAt.split('T')[0] : ''),
      qualification: t.qualification || 'B.Ed / Masters',
      specialization: t.specialization || '',
      experienceYears: typeof t.experienceYears === 'number' ? t.experienceYears : 0,
      employmentType: t.employmentType || 'FULL_TIME',
      campusId: t.campusId || null,
      campusName: t.campusName || 'Main Campus',
    },
    address: {
      street: t.address || '',
      city: '',
      state: '',
      postalCode: '',
    },
    emergencyContact: {
      name: t.emergencyContactName || '',
      relationship: t.emergencyContactRelation || '',
      phone: t.emergencyContactPhone || '',
    },
    assignments,
    totalClassesCount: totalClassesCount || t.totalClassesCount || 0,
    weeklyPeriods: totalPeriodsCount,
    totalStudentsCount: 0,
    attendanceRate: 100,
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
      if (filters.campusId && filters.campusId !== 'ALL') {
        params.set('campusId', filters.campusId);
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
  }, [filters.searchQuery, filters.status, filters.campusId]);

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
      if (filters.department !== 'ALL') {
        if (teacher.employment.department !== filters.department) {
          return false;
        }
      }

      // 3. Subject
      if (filters.subject !== 'ALL') {
        const hasSubject = teacher.assignments.some((a) => a.subjectName === filters.subject);
        if (!hasSubject) {
          return false;
        }
      }

      // 4. Class
      if (filters.className !== 'ALL') {
        const hasClass = teacher.assignments.some((a) => a.className === filters.className);
        if (!hasClass) {
          return false;
        }
      }

      // 5. Status
      if (filters.status !== 'ALL') {
        if (teacher.status !== filters.status) {
          return false;
        }
      }

      // 6. Employment Type
      if (filters.employmentType !== 'ALL') {
        if (teacher.employment.employmentType !== filters.employmentType) {
          return false;
        }
      }

      return true;
    });
  }, [teachers, filters]);

  // Action Handlers
  const handleFilterChange = <K extends keyof TeacherFilterState>(key: K, value: TeacherFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids?: string[]) => {
    if (Array.isArray(ids) && ids.length > 0) {
      setSelectedIds(ids);
    } else if (selectedIds.length === teachers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(teachers.map((t) => t.id));
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
      streamId: a.streamId || null,
      subjectId: a.subjectId,
      periodsPerWeek: a.periodsPerWeek,
    }));

    const payload = {
      firstName: teacher.personal.firstName,
      lastName: teacher.personal.lastName,
      phone: teacher.personal.phone || null,
      photoUrl: teacher.personal.photoUrl || null,
      gender: teacher.personal.gender || null,
      dateOfBirth: teacher.personal.dateOfBirth || null,
      joiningDate: teacher.employment.joiningDate || null,
      employmentType: teacher.employment.employmentType || 'FULL_TIME',
      experienceYears: teacher.employment.experienceYears || 0,
      specialization: teacher.employment.specialization || null,
      department: teacher.employment.department || null,
      designation: teacher.employment.designation || null,
      qualification: teacher.employment.qualification || null,
      campusId: teacher.employment.campusId || null,
      emergencyContactName: teacher.emergencyContact?.name || null,
      emergencyContactPhone: teacher.emergencyContact?.phone || null,
      emergencyContactRelation: teacher.emergencyContact?.relationship || null,
      address: teacher.address?.street || null,
      status: teacher.status || 'ACTIVE',
    };

    if (exists) {
      await fetch(`/api/teachers/${teacher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          email: teacher.personal.email,
          password: teacher.personal.password || 'Password@123',
          employeeId: teacher.employment.employeeId,
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
    refetchTeachers: fetchTeachers,
  };
}
