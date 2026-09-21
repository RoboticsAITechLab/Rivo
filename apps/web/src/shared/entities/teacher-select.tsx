'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption, SelectorGroup } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectTeachersForSubject, selectTeachers } from '../selectors';
import { Teacher, TeacherId, SubjectId } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { UserCheck, AlertTriangle } from 'lucide-react';
import { detectTeacherDuplicate } from '../validation/duplicate-detector';

export interface TeacherSelectProps {
  value?: TeacherId | null;
  onChange: (teacherId: TeacherId) => void;
  subjectId?: SubjectId | null;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function TeacherSelect({
  value,
  onChange,
  subjectId,
  label = 'Assigned Faculty / Teacher',
  required,
  disabled,
  allowClear = true,
  placeholder = 'Select faculty member...',
  className,
}: TeacherSelectProps) {
  const store = useSchoolStore();
  const [showInactive, setShowInactive] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Group teachers into Relevant (teaches subject) and Others
  const groups: SelectorGroup<Teacher>[] = React.useMemo(() => {
    if (subjectId) {
      const { relevant, others } = selectTeachersForSubject(store, subjectId, {
        includeInactive: showInactive,
      });

      const mapToOption = (t: Teacher): SelectorOption<Teacher> => ({
        id: t.id,
        title: `${t.personal.firstName} ${t.personal.lastName}`,
        subtitle: `${t.employment.employeeId} • ${t.employment.department}`,
        badge:
          t.status === 'INACTIVE' ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
              Inactive
            </span>
          ) : t.status === 'ON_LEAVE' ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-semibold">
              On Leave
            </span>
          ) : undefined,
        raw: t,
      });

      const res: SelectorGroup<Teacher>[] = [];
      if (relevant.length > 0) {
        res.push({
          label: 'Department / Subject Faculty',
          items: relevant.map(mapToOption),
        });
      }
      if (others.length > 0) {
        res.push({
          label: relevant.length > 0 ? 'Other Available Faculty' : 'All Faculty',
          items: others.map(mapToOption),
        });
      }
      return res;
    }

    const all = selectTeachers(store, { includeInactive: showInactive });
    return [
      {
        label: 'Faculty Members',
        items: all.map((t) => ({
          id: t.id,
          title: `${t.personal.firstName} ${t.personal.lastName}`,
          subtitle: `${t.employment.employeeId} • ${t.employment.department}`,
          badge:
            t.status === 'INACTIVE' ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                Inactive
              </span>
            ) : t.status === 'ON_LEAVE' ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-semibold">
                On Leave
              </span>
            ) : undefined,
          raw: t,
        })),
      },
    ];
  }, [store, subjectId, showInactive]);

  const handleTeacherCreated = (newTeacher: Teacher) => {
    onChange(newTeacher.id);
  };

  return (
    <>
      <UniversalSelector<Teacher>
        value={value}
        onChange={(id) => onChange(id)}
        groups={groups}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search faculty by name, ID or department..."
        emptyMessage="No faculty records configured."
        noResultsMessage="No matching teachers found."
        addNewLabel="+ Add New Teacher"
        onAddNew={() => setIsAddModalOpen(true)}
        showInactiveToggle={true}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        className={className}
      />

      {/* In-place Contextual Teacher Creation Dialog */}
      <QuickTeacherCreateDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultSubjectId={subjectId}
        onCreated={handleTeacherCreated}
      />
    </>
  );
}

function QuickTeacherCreateDialog({
  isOpen,
  onClose,
  defaultSubjectId,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: SubjectId | null;
  onCreated: (teacher: Teacher) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <QuickTeacherCreateModalInner
            onClose={onClose}
            defaultSubjectId={defaultSubjectId}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickTeacherCreateModalInner({
  onClose,
  defaultSubjectId,
  onCreated,
}: {
  onClose: () => void;
  defaultSubjectId?: SubjectId | null;
  onCreated: (teacher: Teacher) => void;
}) {
  const store = useSchoolStore();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState(() => `TCH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [department, setDepartment] = React.useState('Mathematics');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('+91 98765 43210');
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!firstName.trim() || !lastName.trim() || !employeeId.trim()) return;

    // Check duplicate
    const duplicate = detectTeacherDuplicate(store, {
      firstName,
      lastName,
      employeeId,
      email,
    });

    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(duplicate.message);
      return;
    }

    const newTeacher = schoolStore.createTeacher({
      status: 'ACTIVE',
      personal: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@institution.edu`,
        phone: phone.trim(),
        dateOfBirth: '1985-05-15',
        gender: 'Female',
        bloodGroup: 'B+',
      },
      employment: {
        employeeId: employeeId.trim(),
        department: department.trim(),
        designation: 'Faculty Educator',
        joiningDate: new Date().toISOString().slice(0, 10),
        qualification: 'Master of Education / Science',
        experienceYears: 5,
        employmentType: 'FULL_TIME',
      },
      address: {
        street: 'Institutional Enclave',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
      },
      emergencyContact: {
        name: 'Family Contact',
        relationship: 'Spouse',
        phone: '+91 98765 00000',
      },
      assignments: defaultSubjectId
        ? [
            {
              id: `asg-${Math.random().toString(36).substring(2, 9)}`,
              classId: 'cls-10',
              sectionId: 'sec-10-a',
              subjectId: defaultSubjectId,
              periodsPerWeek: 6,
            },
          ]
        : [],
    });

    onCreated(newTeacher);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add New Teacher</DialogTitle>
            <DialogDescription className="text-xs">
              Creates a faculty entity directly into the central store and selects it immediately.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        className="space-y-3 pt-2"
      >
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="First Name" required>
              <Input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setDuplicateWarning(null);
                }}
                placeholder="Rahul"
                className="h-8.5 text-xs"
                required
              />
            </FormField>
            <FormField label="Last Name" required>
              <Input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setDuplicateWarning(null);
                }}
                placeholder="Sharma"
                className="h-8.5 text-xs"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Employee ID" required>
              <Input
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setDuplicateWarning(null);
                }}
                placeholder="T-009"
                className="h-8.5 text-xs"
                required
              />
            </FormField>
            <FormField label="Department" required>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Languages">Languages</option>
                <option value="Social Sciences">Social Sciences</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Arts & Humanities">Arts &amp; Humanities</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Official Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@institution.edu"
                className="h-8.5 text-xs"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-8.5 text-xs"
              />
            </FormField>
          </div>

          {duplicateWarning && (
            <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Possible duplicate detected:</span>
                <p className="mt-0.5 text-[11px]">{duplicateWarning}</p>
                <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">
                  Click &ldquo;Create Anyway&rdquo; to bypass or modify the fields above.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              {duplicateWarning ? 'Create Anyway' : 'Save & Select Teacher'}
            </Button>
          </DialogFooter>
        </div>
    </>
  );
}
