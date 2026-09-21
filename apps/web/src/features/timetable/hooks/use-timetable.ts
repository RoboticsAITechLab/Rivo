'use client';

import * as React from 'react';
import { TimetablePeriod, TimetableFilterState } from '../types';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import {
  selectActiveSchedule,
  resolveTeacherName,
  resolveSubjectName,
  resolveClassName,
  resolveSectionName,
  resolveRoomName,
  resolvePeriodDetails,
} from '@/shared/selectors';

export function useTimetable() {
  const store = useSchoolStore();
  const activeSchedule = selectActiveSchedule(store);

  const [filters, setFilters] = React.useState<TimetableFilterState>({
    academicSession: '2025-26',
    viewMode: 'CLASS',
    classId: 'cls-10',
    sectionId: 'sec-10-a',
    teacherId: 'tch-001',
    room: 'Room 204',
    selectedWeek: 'Current Week (Sep 15 - Sep 20)',
  });

  // Map canonical TimetableEntry to view model with relational display resolution
  const allPeriods: TimetablePeriod[] = React.useMemo(() => {
    return store.timetable.map((entry) => {
      const periodDetails = resolvePeriodDetails(store, entry.periodId, activeSchedule?.id);
      const className = resolveClassName(store, entry.classId);
      const sectionName = resolveSectionName(store, entry.classId, entry.sectionId);
      const subjectName = resolveSubjectName(store, entry.subjectId);
      const teacherName = resolveTeacherName(store, entry.teacherId);
      const room = resolveRoomName(store, entry.roomId);

      return {
        id: entry.id,
        day: entry.day,
        startTime: periodDetails.startTime,
        endTime: periodDetails.endTime,
        periodSlot: `${periodDetails.startTime} - ${periodDetails.endTime}`,
        periodIndex: periodDetails.order,
        classId: entry.classId,
        className,
        sectionId: entry.sectionId,
        sectionName,
        subjectId: entry.subjectId,
        subjectName,
        teacherId: entry.teacherId,
        teacherName,
        room,
      };
    });
  }, [store, activeSchedule]);

  // Filter periods based on current view mode
  const displayedPeriods = React.useMemo(() => {
    return allPeriods.filter((p) => {
      if (filters.viewMode === 'CLASS') {
        const classMatch = p.classId === filters.classId;
        const sectionMatch = !filters.sectionId || p.sectionId === filters.sectionId;
        return classMatch && sectionMatch;
      }
      if (filters.viewMode === 'TEACHER') {
        return p.teacherId === filters.teacherId;
      }
      if (filters.viewMode === 'ROOM') {
        return p.room.toLowerCase().trim() === filters.room.toLowerCase().trim();
      }
      return true;
    });
  }, [allPeriods, filters]);

  const handleUpdateFilters = (updates: Partial<TimetableFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleSavePeriod = (_period: TimetablePeriod) => {
    void _period;
    // Handled by TimetableAddDialog directly in the store, but exposed here if needed
  };

  const handleDeletePeriod = (periodId: string) => {
    schoolStore.deleteTimetableEntry(periodId);
  };

  const handleDuplicatePeriod = (period: TimetablePeriod) => {
    const workingDays = activeSchedule?.workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentIdx = workingDays.indexOf(period.day);
    const nextDay = workingDays[(currentIdx + 1) % workingDays.length];

    // Find matching entry to clone
    const existingEntry = store.timetable.find((e) => e.id === period.id);
    if (existingEntry) {
      schoolStore.createTimetableEntry({
        ...existingEntry,
        day: nextDay,
      });
    }
  };

  // Metrics summary
  const metrics = React.useMemo(() => {
    const teachingCount = activeSchedule?.blocks.filter((b) => b.type === 'TEACHING').length || 6;
    const daysCount = activeSchedule?.workingDays.length || 6;
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
  }, [displayedPeriods, activeSchedule]);

  return {
    allPeriods,
    displayedPeriods,
    filters,
    metrics,
    setFilters: handleUpdateFilters,
    savePeriod: handleSavePeriod,
    deletePeriod: handleDeletePeriod,
    duplicatePeriod: handleDuplicatePeriod,
  };
}
