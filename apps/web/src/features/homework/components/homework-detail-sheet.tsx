'use client';

import * as React from 'react';
import { HomeworkItem, HomeworkStudentSubmission } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Paperclip,
  Clock,
  Download,
  Edit3,
} from 'lucide-react';

interface HomeworkDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  homework: HomeworkItem | null;
  onEdit: (item: HomeworkItem) => void;
  onToggleStatus: (item: HomeworkItem) => void;
}

const submissions: HomeworkStudentSubmission[] = [];


export function HomeworkDetailSheet({
  isOpen,
  onClose,
  homework,
  onEdit,
  onToggleStatus,
}: HomeworkDetailSheetProps) {
  if (!homework) return null;

  const completionPercent =
    homework.totalStudents > 0
      ? Math.round((homework.completedCount / homework.totalStudents) * 100)
      : 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 border-b bg-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">
                  {homework.className}-{homework.sectionName}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {homework.subjectName}
                </Badge>
                {homework.status === 'PUBLISHED' && (
                  <Badge variant="success" className="text-[10px]">
                    Published
                  </Badge>
                )}
                {homework.status === 'CLOSED' && (
                  <Badge variant="outline" className="text-[10px]">
                    Closed
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-xl font-bold text-foreground">
                {homework.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Assigned by {homework.teacherName} on {homework.assignedDate}
              </SheetDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(homework);
              }}
              className="gap-1 text-xs shrink-0"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6 flex-1">
          {/* Submission Metrics Banner */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-foreground">{homework.totalStudents}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Assigned</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {homework.completedCount}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Submitted</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {homework.pendingCount}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Pending</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {homework.overdueCount}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Overdue</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="rounded-lg border bg-card p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Cohort Submission Progress</span>
              <span className="font-mono text-muted-foreground">{completionPercent}% Completed</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Description / Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignment Instructions
            </h4>
            <div className="rounded-lg border bg-card p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap shadow-2xs">
              {homework.description}
            </div>
          </div>

          {/* Attachments Section */}
          {homework.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reference Documents ({homework.attachments.length})
              </h4>
              <div className="space-y-1.5">
                {homework.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-2.5 shadow-2xs text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">{att.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({att.size})</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Submissions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Student Submissions & Grading Status
              </h4>
              <Badge variant="outline" className="text-[10px]">
                {submissions.length} Submissions
              </Badge>
            </div>

            {submissions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
                No student submissions recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={sub.studentId}
                    className="rounded-lg border bg-card p-3 shadow-2xs flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-muted-foreground">#{sub.rollNumber}</span>
                        <span className="font-bold text-foreground">{sub.studentName}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{sub.admissionNumber}</span>
                      </div>

                      <div>
                        {sub.status === 'COMPLETED' && (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">
                            Completed {sub.grade ? `(${sub.grade})` : ''}
                          </Badge>
                        )}
                        {sub.status === 'ASSIGNED' && (
                          <Badge variant="info" className="text-[10px] px-1.5 py-0">
                            Assigned
                          </Badge>
                        )}
                        {sub.status === 'PENDING' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Pending
                          </Badge>
                        )}
                        {sub.status === 'OVERDUE' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>

                    {sub.submittedAt && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground/80" />
                        <span>Turned in {sub.submittedAt}</span>
                      </div>
                    )}

                    {sub.feedback && (
                      <div className="text-[11px] bg-muted/30 border border-border/50 rounded p-1.5 text-muted-foreground">
                        <span className="font-semibold text-foreground">Feedback: </span>
                        {sub.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(homework)}
            className="text-xs"
          >
            {homework.status === 'CLOSED' ? 'Reopen Assignment' : 'Close Assignment'}
          </Button>
          <Button size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
