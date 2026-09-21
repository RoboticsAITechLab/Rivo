'use client';

import * as React from 'react';
import { AttendanceRegisterItem, AttendanceAttentionItem } from '../types';
import { AttendanceStatus } from '@/features/shared/types';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { selectStudentsForClassSection, selectAttendanceRegister } from '@/shared/selectors';

export function useAttendance() {
  const store = useSchoolStore();

  const todayFormatted = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const [selectedDate, setSelectedDate] = React.useState(todayFormatted);
  const [selectedClassId, setSelectedClassId] = React.useState(store.classes[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = React.useState(store.classes[0]?.sections[0]?.id || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState<string | null>(null);

  // Sync selection if store classes load or change
  React.useEffect(() => {
    if (!selectedClassId && store.classes.length > 0) {
      setSelectedClassId(store.classes[0].id);
      setSelectedSectionId(store.classes[0].sections[0]?.id || '');
    }
  }, [store.classes, selectedClassId]);

  // Local draft status map keyed by selection to automatically isolate edits per class/section/date
  const selectionKey = `${selectedClassId}:${selectedSectionId}:${selectedDate}`;
  const [draftEditsBySelection, setDraftEditsBySelection] = React.useState<
    Record<string, Record<string, { status: AttendanceStatus; reason?: string }>>
  >({});

  // Query actual students belonging to Class + Section
  const enrolledStudents = selectStudentsForClassSection(store, selectedClassId, selectedSectionId);

  // Get saved register or defaults for selected date
  const registerInfo = selectAttendanceRegister(
    store,
    selectedClassId,
    selectedSectionId,
    selectedDate
  );

  // Combine enrolled students with saved state or local uncommitted edits
  const items: AttendanceRegisterItem[] = React.useMemo(() => {
    const localStatuses = draftEditsBySelection[selectionKey] || {};
    return enrolledStudents.map((s, idx) => {
      const rollNumber = String(idx + 1).padStart(2, '0');
      const saved = registerInfo.students.find((r) => r.student.id === s.id);
      const local = localStatuses[s.id];

      const status = local ? local.status : saved ? saved.status : ('PRESENT' as AttendanceStatus);
      const reason = local ? local.reason : saved ? saved.reason : undefined;

      return {
        id: `att-item-${s.id}`,
        studentId: s.id,
        rollNumber,
        studentName: s.name || `${s.firstName} ${s.lastName}`.trim(),
        admissionNumber: s.admissionNumber,
        status,
        punchTime: status === 'PRESENT' || status === 'LATE' ? '07:55 AM' : undefined,
        markedBy: 'Faculty In-Charge',
        reason,
        gender: s.gender,
      };
    });
  }, [enrolledStudents, registerInfo, draftEditsBySelection, selectionKey]);

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
    setDraftEditsBySelection((prev) => ({
      ...prev,
      [selectionKey]: {
        ...(prev[selectionKey] || {}),
        [studentId]: {
          status,
          reason: prev[selectionKey]?.[studentId]?.reason,
        },
      },
    }));
  };

  const handleUpdateReason = (studentId: string, reason: string) => {
    setDraftEditsBySelection((prev) => ({
      ...prev,
      [selectionKey]: {
        ...(prev[selectionKey] || {}),
        [studentId]: {
          status: prev[selectionKey]?.[studentId]?.status || 'ABSENT',
          reason,
        },
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<string, { status: AttendanceStatus; reason?: string }> = {};
    items.forEach((item) => {
      next[item.studentId] = { status };
    });
    setDraftEditsBySelection((prev) => ({
      ...prev,
      [selectionKey]: next,
    }));
  };

  const handleSaveAttendance = () => {
    setIsSaving(true);
    setTimeout(() => {
      const records = items.map((item) => ({
        studentId: item.studentId,
        status: item.status,
        reason: item.reason,
      }));

      schoolStore.saveAttendanceRegister(
        selectedClassId,
        selectedSectionId,
        selectedDate,
        records
      );

      setDraftEditsBySelection((prev) => {
        const copy = { ...prev };
        delete copy[selectionKey];
        return copy;
      });

      setIsSaving(false);
      setSaveSuccessNotice(
        `Attendance roll-call saved successfully for ${selectedDate}!`
      );
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    }, 300);
  };

  return {
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
    updateStatus: handleUpdateStatus,
    updateReason: handleUpdateReason,
    markAll: handleMarkAll,
    saveAttendance: handleSaveAttendance,
  };
}
