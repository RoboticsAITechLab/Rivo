'use client';

import * as React from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { useAttendance } from '@/features/attendance/hooks/use-attendance';
import { AttendanceDashboard } from '@/features/attendance/components/attendance-dashboard';
import { AttendanceRegister } from '@/features/attendance/components/attendance-register';
import { AttendanceMobileCard } from '@/features/attendance/components/attendance-mobile-card';
import { AttendanceStatusDialog } from '@/features/attendance/components/attendance-status-dialog';
import { AttendanceHistorySheet } from '@/features/attendance/components/attendance-history-sheet';
import { AttendanceAlertsCard } from '@/features/attendance/components/attendance-alerts-card';
import { AttendanceRegisterItem } from '@/features/attendance/types';

export default function AttendancePage() {
  const {
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
    updateStatus,
    updateReason,
    markAll,
    saveAttendance,
  } = useAttendance();

  const [activeReasonStudent, setActiveReasonStudent] = React.useState<AttendanceRegisterItem | null>(null);
  const [historyStudent, setHistoryStudent] = React.useState<{
    id: string;
    name: string;
    admissionNumber: string;
  } | null>(null);

  const handleExport = () => {
    window.print();
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        title="Attendance & Punctuality"
        description="Daily roll call management, automated biometric scanning, student attendance records, and chronic absence tracking."
        icon={CalendarCheck}
        badge="Session 2025-26"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Export Report</span>
            </Button>
          </div>
        }
      />

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className="p-3 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-2 shadow-2xs animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveSuccessNotice}</span>
        </div>
      )}

      {/* 2. Attendance Dashboard (Selectors, Date Bar & Live Metric Cards) */}
      <AttendanceDashboard
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        selectedSectionId={selectedSectionId}
        onSectionChange={setSelectedSectionId}
        metrics={metrics}
        onSaveAttendance={saveAttendance}
        isSaving={isSaving}
      />

      {/* 3. Attention & Compliance Section */}
      <AttendanceAlertsCard
        alerts={attentionItems}
        onSelectStudent={(id, name, admNo) => setHistoryStudent({ id, name, admissionNumber: admNo })}
      />

      {/* 4. Attendance Roll Call Register */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">
            Daily Roll-Call Register
          </h3>
          <span className="text-xs text-muted-foreground">
            Section 10-A • Neha Sharma (Class Teacher)
          </span>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <AttendanceRegister
            items={items}
            onUpdateStatus={updateStatus}
            onOpenReason={(item) => setActiveReasonStudent(item)}
            onOpenHistory={(item) =>
              setHistoryStudent({
                id: item.studentId,
                name: item.studentName,
                admissionNumber: item.admissionNumber,
              })
            }
            onMarkAll={markAll}
          />
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-2.5">
          {items.map((item) => (
            <AttendanceMobileCard
              key={item.id}
              item={item}
              onUpdateStatus={updateStatus}
              onOpenReason={(it) => setActiveReasonStudent(it)}
              onOpenHistory={(it) =>
                setHistoryStudent({
                  id: it.studentId,
                  name: it.studentName,
                  admissionNumber: it.admissionNumber,
                })
              }
            />
          ))}
        </div>
      </div>

      {/* 5. Status Reason Dialog */}
      <AttendanceStatusDialog
        isOpen={Boolean(activeReasonStudent)}
        onClose={() => setActiveReasonStudent(null)}
        student={activeReasonStudent}
        onSaveReason={(studentId, reason) => {
          updateReason(studentId, reason);
          setActiveReasonStudent(null);
        }}
      />

      {/* 6. Student 360 Attendance Profile Sheet */}
      <AttendanceHistorySheet
        isOpen={Boolean(historyStudent)}
        onClose={() => setHistoryStudent(null)}
        studentId={historyStudent?.id || null}
        studentName={historyStudent?.name}
        admissionNumber={historyStudent?.admissionNumber}
      />
    </PageContainer>
  );
}
