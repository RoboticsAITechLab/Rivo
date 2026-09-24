'use client';

import * as React from 'react';
import { TimetablePeriod, TimetableFilterState } from '../types';
import { DayOfWeek } from '@/features/shared/types';
import { ScheduleBlock } from '@/shared/types';

export const DEFAULT_WORKING_DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { id: 'blk-p1', scheduleId: 'sch-regular', name: 'Period 1', type: 'TEACHING', order: 1, startTime: '08:00', endTime: '08:45', status: 'ACTIVE' },
  { id: 'blk-p2', scheduleId: 'sch-regular', name: 'Period 2', type: 'TEACHING', order: 2, startTime: '08:45', endTime: '09:30', status: 'ACTIVE' },
  { id: 'blk-p3', scheduleId: 'sch-regular', name: 'Period 3', type: 'TEACHING', order: 3, startTime: '09:30', endTime: '10:15', status: 'ACTIVE' },
  { id: 'blk-rec', scheduleId: 'sch-regular', name: 'Morning Break', type: 'BREAK', order: 4, startTime: '10:15', endTime: '10:35', status: 'ACTIVE' },
  { id: 'blk-p4', scheduleId: 'sch-regular', name: 'Period 4', type: 'TEACHING', order: 5, startTime: '10:35', endTime: '11:20', status: 'ACTIVE' },
  { id: 'blk-p5', scheduleId: 'sch-regular', name: 'Period 5', type: 'TEACHING', order: 6, startTime: '11:20', endTime: '12:05', status: 'ACTIVE' },
  { id: 'blk-lun', scheduleId: 'sch-regular', name: 'Lunch Break', type: 'LUNCH', order: 7, startTime: '12:05', endTime: '12:45', status: 'ACTIVE' },
  { id: 'blk-p6', scheduleId: 'sch-regular', name: 'Period 6', type: 'TEACHING', order: 8, startTime: '12:45', endTime: '01:30', status: 'ACTIVE' },
  { id: 'blk-p7', scheduleId: 'sch-regular', name: 'Period 7', type: 'TEACHING', order: 9, startTime: '01:30', endTime: '02:15', status: 'ACTIVE' },
  { id: 'blk-p8', scheduleId: 'sch-regular', name: 'Period 8', type: 'TEACHING', order: 10, startTime: '02:15', endTime: '03:00', status: 'ACTIVE' },
];

export interface TimetableClass {
  id: string;
  name: string;
  gradeLevel: number;
  sections: Array<{ id: string; name: string }>;
}

export interface TimetableTeacher {
  id: string;
  name: string;
  department: string;
}

export interface TimetableSubject {
  id: string;
  name: string;
  code: string;
}

export function useTimetable() {
  const [classes, setClasses] = React.useState<TimetableClass[]>([]);
  const [teachers, setTeachers] = React.useState<TimetableTeacher[]>([]);
  const [subjects, setSubjects] = React.useState<TimetableSubject[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState<TimetableFilterState>({
    academicSession: '2025-26',
    viewMode: 'CLASS',
    classId: '',
    sectionId: '',
    teacherId: '',
    room: 'Room 204',
    selectedWeek: 'Current Week',
  });

  const [allPeriods, setAllPeriods] = React.useState<TimetablePeriod[]>([]);

  // 1. Initial metadata loading (classes, teachers, subjects)
  React.useEffect(() => {
    let isMounted = true;
    async function initMetadata() {
      setIsLoading(true);
      try {
        const [classesRes, teachersRes, subjectsRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/teachers'),
          fetch('/api/subjects'),
        ]);

        if (isMounted) {
          if (classesRes.ok) {
            const data = await classesRes.json();
            const clsList: TimetableClass[] = (data.classes || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              gradeLevel: c.gradeLevel,
              sections: c.sections || [],
            }));
            setClasses(clsList);
            if (clsList.length > 0) {
              setFilters((prev) => ({
                ...prev,
                classId: prev.classId || clsList[0].id,
                sectionId: prev.sectionId || clsList[0].sections[0]?.id || '',
              }));
            }
          }

          if (teachersRes.ok) {
            const data = await teachersRes.json();
            const tchList: TimetableTeacher[] = (data.teachers || []).map((t: any) => ({
              id: t.id,
              name: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() || t.id,
              department: t.department || 'General',
            }));
            setTeachers(tchList);
            if (tchList.length > 0) {
              setFilters((prev) => ({
                ...prev,
                teacherId: prev.teacherId || tchList[0].id,
              }));
            }
          }

          if (subjectsRes.ok) {
            const data = await subjectsRes.json();
            const subList: TimetableSubject[] = (data.subjects || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              code: s.code || '',
            }));
            setSubjects(subList);
          }
        }
      } catch (err) {
        console.error('Failed to load timetable metadata:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    initMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch live timetable slots from /api/timetable/school
  const fetchSlots = React.useCallback(async () => {
    try {
      const res = await fetch('/api/timetable/school');
      if (res.ok) {
        const data = await res.json();
        const mapped: TimetablePeriod[] = (data.slots || []).map((s: any) => ({
          id: s.id,
          day: s.dayOfWeek as DayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          periodSlot: `${s.startTime} - ${s.endTime}`,
          periodIndex: s.periodNumber,
          classId: s.classId || '',
          className: s.className || '',
          sectionId: s.sectionId || '',
          sectionName: s.sectionName || '',
          subjectId: s.subjectId || '',
          subjectName: s.subjectName || '',
          teacherId: s.teacherId || '',
          teacherName: s.teacherName || '',
          room: s.roomNumber || 'Standard Classroom',
        }));
        setAllPeriods(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch timetable slots:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Filter periods based on current view mode
  const displayedPeriods = React.useMemo(() => {
    return allPeriods.filter((p) => {
      if (filters.viewMode === 'CLASS') {
        const classMatch = !filters.classId || p.classId === filters.classId;
        const sectionMatch = !filters.sectionId || p.sectionId === filters.sectionId;
        return classMatch && sectionMatch;
      }
      if (filters.viewMode === 'TEACHER') {
        return !filters.teacherId || p.teacherId === filters.teacherId;
      }
      if (filters.viewMode === 'ROOM') {
        return !filters.room || p.room.toLowerCase().trim() === filters.room.toLowerCase().trim();
      }
      return true;
    });
  }, [allPeriods, filters]);

  const handleUpdateFilters = (updates: Partial<TimetableFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleSavePeriod = async (payload: {
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
    roomNumber: string;
  }) => {
    try {
      const res = await fetch('/api/timetable/school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to save timetable slot' }));
        throw new Error(err.message || 'Failed to save timetable slot');
      }

      await fetchSlots();
      return true;
    } catch (err: any) {
      setErrorMessage(err.message);
      throw err;
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    try {
      const res = await fetch(`/api/timetable/school?id=${periodId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to delete timetable slot' }));
        throw new Error(err.message || 'Failed to delete slot');
      }
      setAllPeriods((prev) => prev.filter((p) => p.id !== periodId));
    } catch (err: any) {
      console.error('Delete slot error:', err);
      setErrorMessage(err.message);
    }
  };

  const handleDuplicatePeriod = async (period: TimetablePeriod) => {
    const workingDays = DEFAULT_WORKING_DAYS;
    const currentIdx = workingDays.indexOf(period.day);
    const nextDay = workingDays[(currentIdx + 1) % workingDays.length];

    try {
      await handleSavePeriod({
        classId: period.classId,
        sectionId: period.sectionId,
        subjectId: period.subjectId,
        teacherId: period.teacherId,
        dayOfWeek: nextDay,
        periodNumber: period.periodIndex,
        startTime: period.startTime,
        endTime: period.endTime,
        roomNumber: period.room,
      });
    } catch (err) {
      console.error('Failed to duplicate timetable period:', err);
    }
  };

  // Metrics summary
  const metrics = React.useMemo(() => {
    const teachingCount = DEFAULT_SCHEDULE_BLOCKS.filter((b) => b.type === 'TEACHING').length;
    const daysCount = DEFAULT_WORKING_DAYS.length;
    const totalWeeklySlots = teachingCount * daysCount;

    const scheduledCount = displayedPeriods.filter((p) => !p.isBreak).length;
    const freeSlots = Math.max(0, totalWeeklySlots - scheduledCount);
    const uniqueSubjects = new Set(displayedPeriods.map((p) => p.subjectName)).size;

    return {
      scheduledCount,
      freeSlots,
      uniqueSubjects,
      totalSlots: totalWeeklySlots,
    };
  }, [displayedPeriods]);

  return {
    classes,
    teachers,
    subjects,
    isLoading,
    errorMessage,
    allPeriods,
    displayedPeriods,
    filters,
    metrics,
    scheduleBlocks: DEFAULT_SCHEDULE_BLOCKS,
    workingDays: DEFAULT_WORKING_DAYS,
    setFilters: handleUpdateFilters,
    savePeriod: handleSavePeriod,
    deletePeriod: handleDeletePeriod,
    duplicatePeriod: handleDuplicatePeriod,
    refreshSlots: fetchSlots,
  };
}
