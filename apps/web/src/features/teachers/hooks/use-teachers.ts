'use client';

import * as React from 'react';
import { TeacherDetail, TeacherFilterState } from '../types';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { selectTeachers, resolveClassName, resolveSectionName, resolveSubjectName } from '@/shared/selectors';

const defaultFilters: TeacherFilterState = {
  searchQuery: '',
  department: 'ALL',
  subject: 'ALL',
  className: 'ALL',
  status: 'ALL',
  employmentType: 'ALL',
};

export function useTeachers() {
  const store = useSchoolStore();

  // Map canonical store Teacher into legacy TeacherDetail view model
  const teachers: TeacherDetail[] = React.useMemo(() => {
    return selectTeachers(store, { includeInactive: true }).map((t) => {
      const assignments = t.assignments.map((a) => ({
        id: a.id,
        classId: a.classId,
        className: resolveClassName(store, a.classId),
        sectionId: a.sectionId,
        sectionName: resolveSectionName(store, a.classId, a.sectionId),
        subjectId: a.subjectId,
        subjectName: resolveSubjectName(store, a.subjectId),
        periodsPerWeek: a.periodsPerWeek,
      }));

      const totalPeriodsCount = assignments.reduce((acc, a) => acc + a.periodsPerWeek, 0);
      const totalClassesCount = new Set(assignments.map((a) => a.className)).size;

      return {
        id: t.id,
        status: t.status,
        personal: { ...t.personal },
        employment: {
          employeeId: t.employment.employeeId,
          department: t.employment.department,
          designation: t.employment.designation,
          joiningDate: t.employment.joiningDate,
          qualification: t.employment.qualification || 'Master of Education',
          experienceYears: t.employment.experienceYears || 5,
          employmentType: t.employment.employmentType || 'FULL_TIME',
        },
        address: { ...t.address },
        emergencyContact: { ...t.emergencyContact },
        assignments,
        totalClassesCount,
        totalPeriodsCount,
        weeklyPeriods: totalPeriodsCount,
        totalStudentsCount: 0,
        rating: 0,
        attendanceRate: 0,
        createdAt: t.updatedAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
      };
    });
  }, [store]);

  const [filters, setFilters] = React.useState<TeacherFilterState>(defaultFilters);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [simulatedError, setSimulatedError] = React.useState(false);

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
    const exists = store.teachers.some((t) => t.id === teacher.id);
    const assignments = teacher.assignments.map((a) => ({
      id: a.id,
      classId: a.classId || 'cls-10',
      sectionId: a.sectionId || 'sec-10-a',
      subjectId: a.subjectId || 'sub-mat-101',
      periodsPerWeek: a.periodsPerWeek,
    }));

    // If new teacher, also persist real login credentials via /api/teachers
    if (!exists) {
      try {
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
      } catch (err) {
        console.error('Error posting teacher account to database:', err);
      }
    }

    if (exists) {
      schoolStore.updateTeacher({
        id: teacher.id,
        status: teacher.status,
        personal: { ...teacher.personal, bloodGroup: teacher.personal.bloodGroup || 'O+' },
        employment: { ...teacher.employment },
        address: { ...teacher.address },
        emergencyContact: { ...teacher.emergencyContact },
        assignments,
      });
    } else {
      schoolStore.createTeacher({
        id: teacher.id,
        status: teacher.status,
        personal: { ...teacher.personal, bloodGroup: teacher.personal.bloodGroup || 'O+' },
        employment: { ...teacher.employment },
        address: { ...teacher.address },
        emergencyContact: { ...teacher.emergencyContact },
        assignments,
      });
    }
  };

  const handleUpdateStatus = (id: string, status: TeacherDetail['status']) => {
    const teacher = store.teachers.find((t) => t.id === id);
    if (teacher) {
      schoolStore.updateTeacher({
        ...teacher,
        status,
      });
    }
  };

  const handleArchiveTeacher = (id: string) => {
    schoolStore.archiveTeacher(id);
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
