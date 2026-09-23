'use client';

import * as React from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Download,
  Plus,
  ShieldCheck,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { useTimetable } from '@/features/timetable/hooks/use-timetable';
import { TimetableViewToggle } from '@/features/timetable/components/timetable-view-toggle';
import { TimetableGrid } from '@/features/timetable/components/timetable-grid';
import { TimetableMobileList } from '@/features/timetable/components/timetable-mobile-list';
import { TimetableAddDialog } from '@/features/timetable/components/timetable-add-dialog';
import { TimetableScheduleSettingsModal } from '@/features/timetable/components/timetable-schedule-settings-modal';
import { TimetablePeriod } from '@/features/timetable/types';
import { DayOfWeek } from '@/features/shared/types';

export default function TimetablePage() {
  const {
    classes,
    teachers,
    subjects,
    isLoading,
    errorMessage,
    displayedPeriods,
    filters,
    metrics,
    scheduleBlocks,
    workingDays,
    setFilters,
    savePeriod,
    deletePeriod,
    duplicatePeriod,
  } = useTimetable();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimetablePeriod | null>(null);
  const [defaultSlotDay, setDefaultSlotDay] = React.useState<DayOfWeek>('MON');
  const [defaultSlotPeriodId, setDefaultSlotPeriodId] = React.useState<string | undefined>(undefined);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);

  const handleOpenAdd = (day: DayOfWeek = 'MON', _time?: string, periodId?: string) => {
    setSelectedPeriod(null);
    setDefaultSlotDay(day);
    setDefaultSlotPeriodId(periodId);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (period: TimetablePeriod) => {
    setSelectedPeriod(period);
    setDefaultSlotDay(period.day);
    setDefaultSlotPeriodId(undefined);
    setIsAddOpen(true);
  };

  const handleExportPDF = () => {
    setExportNotice('Preparing print-ready PDF timetable schedule...');
    setTimeout(() => {
      window.print();
      setExportNotice(null);
    }, 600);
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        title="Timetable & Period Schedules"
        description="Design conflict-free academic schedules across divisions, faculty workloads, and laboratory facilities."
        icon={Clock}
        badge="Session 2025-26"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="gap-1.5 text-xs shadow-2xs cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Bell Schedule Settings</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="gap-1.5 text-xs shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Export / Print</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenAdd('MON')}
              className="gap-1.5 text-xs shadow-2xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Entry</span>
            </Button>
          </div>
        }
      />

      {exportNotice && (
        <div className="p-3 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-between animate-fade-in">
          <span>{exportNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 text-xs bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 rounded-lg flex items-center justify-between animate-fade-in">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Live Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{metrics.scheduledCount}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Scheduled Periods</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{metrics.freeSlots}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Available Open Slots</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{metrics.uniqueSubjects}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Active Subjects</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">0</span>
                <Badge variant="success" className="text-[9px] px-1.5 py-0">Clean</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Collision Conflicts</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. View Switcher & Filters */}
      <TimetableViewToggle
        filters={filters}
        onFilterChange={setFilters}
        classes={classes}
        teachers={teachers}
      />

      {/* 4. Timetable Schedule Display (Desktop Dynamic Matrix vs Mobile View) */}
      <div className="hidden md:block">
        <TimetableGrid
          periods={displayedPeriods}
          scheduleBlocks={scheduleBlocks}
          workingDays={workingDays}
          onAddSlot={handleOpenAdd}
          onEditPeriod={handleOpenEdit}
          onDuplicatePeriod={duplicatePeriod}
          onDeletePeriod={(p) => deletePeriod(p.id)}
        />
      </div>

      <div className="block md:hidden">
        <TimetableMobileList
          periods={displayedPeriods}
          workingDays={workingDays}
          onAddSlot={handleOpenAdd}
          onEditPeriod={handleOpenEdit}
          onDuplicatePeriod={duplicatePeriod}
          onDeletePeriod={(p) => deletePeriod(p.id)}
        />
      </div>

      {/* 5. Add / Edit Timetable Period Dialog with Universal Searchable Selectors */}
      <TimetableAddDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        scheduleBlocks={scheduleBlocks}
        workingDays={workingDays}
        periodToEdit={selectedPeriod}
        defaultDay={defaultSlotDay}
        defaultPeriodId={defaultSlotPeriodId}
        onSavePeriod={savePeriod}
      />

      {/* 6. Period Bell Schedule & Working Days Configuration Modal */}
      <TimetableScheduleSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </PageContainer>
  );
}
