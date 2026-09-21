'use client';

import * as React from 'react';
import { ClassItem, SectionItem } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Users, User, MapPin } from 'lucide-react';
import { useSchoolStore } from '@/shared/mock-store/school-store';

interface SectionDetailDialogProps {
  classItem: ClassItem | null;
  section: SectionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SectionDetailDialog({
  classItem,
  section,
  isOpen,
  onClose,
}: SectionDetailDialogProps) {
  const store = useSchoolStore();
  if (!classItem || !section) return null;

  // Filter real students from central store matching this class and section
  const sectionStudents = store.students.filter(
    (s) =>
      s.classId === classItem.id ||
      (s.className?.toLowerCase() === classItem.className.toLowerCase() &&
       s.sectionId === section.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {section.name}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {classItem.className} • Section {section.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <User className="h-3 w-3 text-primary" /> Teacher: {section.classTeacherName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {section.roomNumber || 'Room 204'}
                </span>
                <span>•</span>
                <span>Attendance: {section.attendanceRate}%</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Student List Table */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              Enrolled Students ({sectionStudents.length > 0 ? sectionStudents.length : section.studentCount})
            </span>
            <span className="text-muted-foreground">Session {classItem.academicSession}</span>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                  <th className="py-2 px-3 w-16">Roll</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Admission No</th>
                  <th className="py-2 px-3">Gender</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sectionStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-mono font-semibold text-primary">#{stu.rollNumber}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{stu.name}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">{stu.admissionNumber}</td>
                    <td className="py-2 px-3 text-muted-foreground">{stu.gender}</td>
                    <td className="py-2 px-3">
                      <StatusBadge status={stu.status} />
                    </td>
                  </tr>
                ))}
                {sectionStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                      No students currently enrolled in this section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
