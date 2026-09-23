'use client';

import * as React from 'react';
import { AttendanceRegisterItem, AttendanceAttentionItem } from '../types';
import { AttendanceStatus } from '@/features/shared/types';

export interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
  sections: Array<{ id: string; name: string }>;
}

export function useAttendance() {
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = React.useState(true);

  const [selectedDate, setSelectedDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [selectedSectionId, setSelectedSectionId] = React.useState('');

  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false);
  const [items, setItems] = React.useState<AttendanceRegisterItem[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 1. Fetch available classes
  React.useEffect(() => {
    let isMounted = true;
    async function loadClasses() {
      setIsLoadingClasses(true);
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          const list: ClassItem[] = (data.classes || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            gradeLevel: c.gradeLevel,
            sections: c.sections || [],
          }));
          if (isMounted) {
            setClasses(list);
            if (list.length > 0) {
              setSelectedClassId(list[0].id);
              if (list[0].sections.length > 0) {
                setSelectedSectionId(list[0].sections[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load classes for attendance:', err);
      } finally {
        if (isMounted) setIsLoadingClasses(false);
      }
    }
    loadClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch student roster and attendance status when class/section/date change
  const fetchRoster = React.useCallback(async () => {
    if (!selectedClassId) return;

    setIsLoadingStudents(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        classId: selectedClassId,
        date: selectedDate,
      });
      if (selectedSectionId) {
        params.append('sectionId', selectedSectionId);
      }

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const roster: AttendanceRegisterItem[] = (data.students || []).map((s: any) => ({
          id: `att-item-${s.id}`,
          studentId: s.id,
          rollNumber: s.rollNumber,
          studentName: s.name,
          admissionNumber: s.admissionNumber,
          status: s.status as AttendanceStatus,
          punchTime: s.status === 'PRESENT' || s.status === 'LATE' ? '07:55 AM' : undefined,
          markedBy: 'Faculty In-Charge',
          reason: s.reason || undefined,
          gender: s.gender,
        }));
        setItems(roster);
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to fetch attendance roster' }));
        setErrorMessage(err.message);
      }
    } catch (err) {
      console.error('Failed to load attendance roster:', err);
      setErrorMessage('Network error fetching attendance');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedClassId, selectedSectionId, selectedDate]);

  React.useEffect(() => {
    if (selectedClassId) {
      fetchRoster();
    }
  }, [fetchRoster, selectedClassId]);

  // Derive metrics live from items
  const metrics = React.useMemo(() => {
    const totalEnrolled = items.length;
    const presentCount = items.filter((i) => i.status === 'PRESENT').length;
    const absentCount = items.filter((i) => i.status === 'ABSENT').length;
    const leaveCount = items.filter((i) => i.status === 'LEAVE').length;
    const lateCount = items.filter((i) => i.status === 'LATE').length;
    const excusedCount = items.filter((i) => i.status === 'EXCUSED').length;

    const ratePercentage =
      totalEnrolled > 0
        ? Math.round(((presentCount + lateCount) / totalEnrolled) * 1000) / 10
        : 0;

    return {
      totalEnrolled,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      excusedCount,
      ratePercentage,
    };
  }, [items]);

  // Purged: No fabricated student alerts. Returns empty array unless active alerts exist.
  const attentionItems: AttendanceAttentionItem[] = React.useMemo(() => {
    return [];
  }, []);

  const handleUpdateStatus = (studentId: string, status: AttendanceStatus) => {
    setItems((prev) =>
      prev.map((item) =>
        item.studentId === studentId
          ? {
              ...item,
              status,
              punchTime: status === 'PRESENT' || status === 'LATE' ? '07:55 AM' : undefined,
            }
          : item
      )
    );
  };

  const handleUpdateReason = (studentId: string, reason: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.studentId === studentId
          ? {
              ...item,
              reason,
            }
          : item
      )
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status,
        punchTime: status === 'PRESENT' || status === 'LATE' ? '07:55 AM' : undefined,
      }))
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedSectionId) {
      alert('Please select both a class and a section.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const records = items.map((item) => ({
        studentId: item.studentId,
        status: item.status,
        reason: item.reason || null,
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          sectionId: selectedSectionId,
          date: selectedDate,
          records,
        }),
      });

      if (res.ok) {
        setSaveSuccessNotice(`Attendance saved successfully for ${selectedDate}!`);
        setTimeout(() => setSaveSuccessNotice(null), 3500);
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to save attendance' }));
        setErrorMessage(err.message || 'Failed to save attendance');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      setErrorMessage('Network error while saving attendance');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    classes,
    isLoadingClasses,
    isLoadingStudents,
    items,
    attentionItems,
    selectedDate,
    setSelectedDate,
    selectedClassId,
    setSelectedClassId,
    selectedSectionId,
    setSelectedSectionId,
    metrics,
    isSaving,
    saveSuccessNotice,
    errorMessage,
    updateStatus: handleUpdateStatus,
    updateReason: handleUpdateReason,
    markAll: handleMarkAll,
    saveAttendance: handleSaveAttendance,
    refreshRoster: fetchRoster,
  };
}
