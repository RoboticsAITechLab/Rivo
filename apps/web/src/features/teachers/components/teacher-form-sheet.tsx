'use client';

import * as React from 'react';
import { TeacherDetail, TeachingAssignment } from '../types';
import { validateTeacherForm, TeacherValidationErrors } from '../validation/teacher-schema';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { Plus, Trash2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { EmploymentType } from '@/features/shared/types';

interface TeacherFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  teacherToEdit?: TeacherDetail | null;
  existingTeachers: TeacherDetail[];
  onSaveTeacher: (teacher: TeacherDetail) => void;
}

export function TeacherFormSheet({
  isOpen,
  onClose,
  teacherToEdit,
  existingTeachers,
  onSaveTeacher,
}: TeacherFormSheetProps) {
  const [showUnsavedModal, setShowUnsavedModal] = React.useState(false);

  if (!isOpen && !showUnsavedModal) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
        if (!open) {
          setShowUnsavedModal(true);
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col">
          <TeacherFormWizard
            key={teacherToEdit?.id ?? 'new'}
            onClose={onClose}
            onPromptClose={() => setShowUnsavedModal(true)}
            teacherToEdit={teacherToEdit}
            existingTeachers={existingTeachers}
            onSaveTeacher={onSaveTeacher}
          />
        </SheetContent>
      </Sheet>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedModal} onOpenChange={setShowUnsavedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in this teacher record. If you exit now, any modifications will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowUnsavedModal(false)}>
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowUnsavedModal(false);
                onClose();
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TeacherFormWizard({
  onClose,
  onPromptClose,
  teacherToEdit,
  existingTeachers,
  onSaveTeacher,
}: {
  onClose: () => void;
  onPromptClose: () => void;
  teacherToEdit?: TeacherDetail | null;
  existingTeachers: TeacherDetail[];
  onSaveTeacher: (teacher: TeacherDetail) => void;
}) {
  const [storeClasses, setStoreClasses] = React.useState<any[]>([]);
  const [storeSubjects, setStoreSubjects] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setStoreClasses(
            data.classes.map((c: any) => ({
              id: c.id,
              className: c.name,
              sections: (c.sections || []).map((s: any) => ({ id: s.id, name: s.name })),
            }))
          );
        }
      })
      .catch(() => {});

    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects) {
          setStoreSubjects(
            data.subjects.map((s: any) => ({
              id: s.id,
              name: s.name,
              code: s.code,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Form State
  const [firstName, setFirstName] = React.useState(teacherToEdit?.personal.firstName || '');
  const [middleName, setMiddleName] = React.useState(teacherToEdit?.personal.middleName || '');
  const [lastName, setLastName] = React.useState(teacherToEdit?.personal.lastName || '');
  const [dob, setDob] = React.useState(teacherToEdit?.personal.dateOfBirth || '');
  const [gender, setGender] = React.useState<'Male' | 'Female' | 'Other'>(teacherToEdit?.personal.gender || 'Male');
  const [bloodGroup, setBloodGroup] = React.useState(teacherToEdit?.personal.bloodGroup || 'O+');
  const [phone, setPhone] = React.useState(teacherToEdit?.personal.phone || '');
  const [email, setEmail] = React.useState(teacherToEdit?.personal.email || '');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Employment
  const [employeeId, setEmployeeId] = React.useState(
    teacherToEdit?.employment.employeeId || 'AUTO'
  );
  const [joiningDate, setJoiningDate] = React.useState(
    teacherToEdit?.employment.joiningDate || new Date().toISOString().split('T')[0]
  );
  const [employmentType, setEmploymentType] = React.useState<EmploymentType>(
    teacherToEdit?.employment.employmentType || 'FULL_TIME'
  );
  const [department, setDepartment] = React.useState(teacherToEdit?.employment.department || 'Mathematics');
  const [designation, setDesignation] = React.useState(teacherToEdit?.employment.designation || 'Teacher');
  const [qualification, setQualification] = React.useState(teacherToEdit?.employment.qualification || '');
  const [experienceYears, setExperienceYears] = React.useState(teacherToEdit?.employment.experienceYears || 5);

  // Address
  const [street, setStreet] = React.useState(teacherToEdit?.address.street || '');
  const [city, setCity] = React.useState(teacherToEdit?.address.city || '');
  const [stateName, setStateName] = React.useState(teacherToEdit?.address.state || '');
  const [postalCode, setPostalCode] = React.useState(teacherToEdit?.address.postalCode || '');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = React.useState(teacherToEdit?.emergencyContact.name || '');
  const [emergencyRelation, setEmergencyRelation] = React.useState(teacherToEdit?.emergencyContact.relationship || 'Spouse');
  const [emergencyPhone, setEmergencyPhone] = React.useState(teacherToEdit?.emergencyContact.phone || '');

  // Assignments
  const [assignments, setAssignments] = React.useState<TeachingAssignment[]>(() =>
    teacherToEdit?.assignments || [
      {
        id: 'asg-new-1',
        classId: 'cls-10',
        className: 'Class 10',
        sectionId: 'sec-10-a',
        sectionName: 'A',
        subjectId: 'sub-mat-101',
        subjectName: 'Mathematics',
        periodsPerWeek: 6,
      },
    ]
  );

  const [errors, setErrors] = React.useState<TeacherValidationErrors>({});
  const safeErrors = errors || {};
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5>(1);

  const handleAddAssignment = () => {
    setAssignments((prev) => [
      ...prev,
      {
        id: `asg-${Date.now()}`,
        classId: 'cls-10',
        className: 'Class 10',
        sectionId: 'sec-10-b',
        sectionName: 'B',
        subjectId: 'sub-mat-101',
        subjectName: 'Mathematics',
        periodsPerWeek: 4,
      },
    ]);
  };

  const handleRemoveAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAssignmentChange = (
    id: string,
    field: keyof TeachingAssignment,
    value: string | number | boolean
  ) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (field === 'classId') {
          const cls = storeClasses.find((c) => c.id === value);
          const firstSec = cls?.sections[0];
          return {
            ...a,
            classId: value as string,
            className: cls?.className || 'Class',
            sectionId: firstSec?.id || 'sec-10-a',
            sectionName: firstSec?.name || 'A',
          };
        }
        if (field === 'sectionId') {
          const cls = storeClasses.find((c) => c.id === a.classId);
          const sec = cls?.sections.find((s) => s.id === value);
          return {
            ...a,
            sectionId: value as string,
            sectionName: sec?.name || 'A',
          };
        }
        if (field === 'subjectId') {
          const sub = storeSubjects.find((s) => s.id === value);
          return {
            ...a,
            subjectId: value as string,
            subjectName: sub?.name || 'Subject',
          };
        }
        return { ...a, [field]: value };
      })
    );
  };

  const handleNextStep = () => {
    if (step < 5) setStep((s) => Math.min(5, s + 1) as 1 | 2 | 3 | 4 | 5);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const candidateData = {
      personal: {
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth: dob,
      },
      employment: {
        employeeId,
        department,
        designation,
        joiningDate,
      },
    };

    const validationErrors = validateTeacherForm(candidateData, existingTeachers, teacherToEdit?.id) || {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (
        validationErrors.firstName ||
        validationErrors.lastName ||
        validationErrors.email ||
        validationErrors.password ||
        validationErrors.phone
      ) {
        setStep(1);
      } else if (
        validationErrors.employeeId ||
        validationErrors.department ||
        validationErrors.designation ||
        validationErrors.joiningDate
      ) {
        setStep(2);
      }
      return;
    }

    const totalWeeklyPeriods = assignments.reduce((acc, a) => acc + (a.periodsPerWeek || 0), 0);
    const uniqueClasses = new Set(assignments.map((a) => a.className)).size;

    const payload: TeacherDetail = {
      id: teacherToEdit?.id || `tch-${Date.now()}`,
      status: teacherToEdit?.status || 'ACTIVE',
      personal: {
        firstName,
        middleName,
        lastName,
        dateOfBirth: dob,
        gender,
        bloodGroup,
        phone,
        email,
        password,
      },
      employment: {
        employeeId,
        joiningDate,
        employmentType,
        department,
        designation,
        qualification,
        experienceYears: Number(experienceYears),
      },
      address: {
        street,
        city,
        state: stateName,
        postalCode,
      },
      emergencyContact: {
        name: emergencyName,
        relationship: emergencyRelation,
        phone: emergencyPhone,
      },
      assignments,
      weeklyPeriods: totalWeeklyPeriods,
      totalClassesCount: uniqueClasses,
      totalStudentsCount: uniqueClasses * 42,
      attendanceRate: teacherToEdit?.attendanceRate || 96.5,
      createdAt: teacherToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveTeacher(payload);
    onClose();
  };

  return (
    <>
      <SheetHeader className="p-6 border-b bg-card">
        <div className="flex items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold text-foreground">
              {teacherToEdit ? 'Edit Faculty Record' : 'Add New Teacher'}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              {teacherToEdit
                ? `Updating profile and assignments for ${teacherToEdit.personal.firstName} ${teacherToEdit.personal.lastName}`
                : 'Complete the steps below to onboard and assign faculty to divisions.'}
            </SheetDescription>
          </div>
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center gap-1.5 pt-4 overflow-x-auto text-xs">
          {[
            { n: 1, label: 'Personal' },
            { n: 2, label: 'Employment' },
            { n: 3, label: 'Contact' },
            { n: 4, label: 'Assignments' },
            { n: 5, label: 'Review' },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n as 1 | 2 | 3 | 4 | 5)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                step === s.n
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : step > s.n
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                {s.n}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <FormSection title="Identity & Demographics" description="Primary personal details of the faculty member.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="First Name" required error={safeErrors.firstName}>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="text-xs"
                  />
                </FormField>
                <FormField label="Middle Name">
                  <Input
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Optional"
                    className="text-xs"
                  />
                </FormField>
                <FormField label="Last Name" required error={safeErrors.lastName}>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="text-xs"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <FormField label="Date of Birth" required>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="text-xs"
                  />
                </FormField>
                <FormField label="Gender" required>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </FormField>
                <FormField label="Blood Group">
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <FormField label="Primary Phone" required error={safeErrors.phone}>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="text-xs font-mono"
                  />
                </FormField>
                <FormField label="Official / Login Email" required error={safeErrors.email}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul.sharma@rivoschool.edu"
                    className="text-xs font-mono"
                  />
                </FormField>
              </div>

              {/* Login Password Configuration for Teacher Account */}
              <div className="mt-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Teacher Portal Login Credentials</span>
                </div>
                <FormField
                  label={teacherToEdit ? 'New Password (Leave blank to keep current)' : 'Account Login Password'}
                  required={!teacherToEdit}
                  error={safeErrors.password}
                  description="This password will be used by the teacher along with their email to log into this school's portal."
                >
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={teacherToEdit ? '••••••••' : 'Enter strong password (min 6 chars)'}
                      className="text-xs font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </FormField>
              </div>
            </FormSection>
          </div>
        )}

        {/* STEP 2: Employment Info */}
        {step === 2 && (
          <div className="space-y-4">
            <FormSection title="Employment & Department Allocation" description="Staff credentials, tenure, and official designation.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Employee ID / Staff Code" required error={safeErrors.employeeId}>
                  <Input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    placeholder="AUTO (system-generated) or manual code"
                    readOnly={Boolean(teacherToEdit)}
                    disabled={Boolean(teacherToEdit)}
                    className="bg-muted/40 text-xs font-mono uppercase"
                  />
                  {!teacherToEdit && (
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Leave as &apos;AUTO&apos; for system-generated ID, or enter custom code.
                    </span>
                  )}
                </FormField>
                <FormField label="Date of Joining" required error={safeErrors.joiningDate}>
                  <Input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="text-xs"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <FormField label="Employment Type" required>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contractual</option>
                    <option value="VISITING">Visiting Faculty</option>
                  </select>
                </FormField>
                <FormField label="Academic Department" required error={safeErrors.department}>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Physical Education">Physical Education</option>
                  </select>
                </FormField>
                <FormField label="Designation" required error={safeErrors.designation}>
                  <Input
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior PGT Teacher"
                    className="text-xs"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <FormField label="Highest Qualification" required>
                  <Input
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. M.Sc. Mathematics, B.Ed"
                    className="text-xs"
                  />
                </FormField>
                <FormField label="Total Teaching Experience (Years)" required>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </FormField>
              </div>
            </FormSection>
          </div>
        )}

        {/* STEP 3: Contact & Emergency */}
        {step === 3 && (
          <div className="space-y-4">
            <FormSection title="Residential Address" description="Current residential address for correspondence.">
              <FormField label="Street Address" required>
                <Input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Apartment, building, street..."
                  className="text-xs"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <FormField label="City" required>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="text-xs"
                  />
                </FormField>
                <FormField label="State" required>
                  <Input
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="text-xs"
                  />
                </FormField>
                <FormField label="Postal Code" required>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="110001"
                    className="text-xs font-mono"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Emergency Contact" description="Designated emergency contact person.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Contact Person Name" required>
                  <Input
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Sunita Sharma"
                    className="text-xs"
                  />
                </FormField>
                <FormField label="Relationship" required>
                  <Input
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="Spouse / Parent / Sibling"
                    className="text-xs"
                  />
                </FormField>
                <FormField label="Emergency Contact Phone" required>
                  <Input
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 98111 22233"
                    className="text-xs font-mono"
                  />
                </FormField>
              </div>
            </FormSection>
          </div>
        )}

        {/* STEP 4: Teaching Assignments */}
        {step === 4 && (
          <div className="space-y-4">
            <FormSection title="Teaching Assignments" description="Class, section, and subject workload allocation.">
              <div className="space-y-3">
                {assignments.map((asg, index) => (
                  <div key={asg.id} className="rounded-lg border bg-card p-3 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Assignment #{index + 1}
                      </span>
                      {assignments.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveAssignment(asg.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <FormField label="Class">
                        <select
                          value={asg.classId}
                          onChange={(e) => handleAssignmentChange(asg.id, 'classId', e.target.value)}
                          className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {storeClasses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.className}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Section">
                        <select
                          value={asg.sectionId}
                          onChange={(e) => handleAssignmentChange(asg.id, 'sectionId', e.target.value)}
                          className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {(storeClasses.find((c) => c.id === asg.classId)?.sections || []).map((s) => (
                            <option key={s.id} value={s.id}>
                              Section {s.name}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Subject">
                        <select
                          value={asg.subjectId}
                          onChange={(e) => handleAssignmentChange(asg.id, 'subjectId', e.target.value)}
                          className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {storeSubjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} ({sub.code})
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Periods / Week">
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={asg.periodsPerWeek}
                          onChange={(e) => handleAssignmentChange(asg.id, 'periodsPerWeek', Number(e.target.value))}
                          className="h-8.5 text-xs font-mono"
                        />
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs border-dashed"
                onClick={handleAddAssignment}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Teaching Assignment
              </Button>
            </FormSection>
          </div>
        )}

        {/* STEP 5: Review & Confirm */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <h4 className="font-bold text-sm text-foreground">Summary Review</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Full Name:</span>
                  <span className="font-semibold text-foreground">{firstName} {middleName} {lastName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Employee ID:</span>
                  <span className="font-mono font-semibold text-foreground">{employeeId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Department:</span>
                  <span className="font-semibold text-foreground">{department}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Designation:</span>
                  <span className="font-semibold text-foreground">{designation}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Contact Phone:</span>
                  <span className="font-mono text-foreground">{phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Email Address:</span>
                  <span className="font-mono text-foreground">{email}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h4 className="font-bold text-sm text-foreground">Allocated Workload</h4>
              <p className="text-muted-foreground text-[11px]">
                {assignments.length} assignments assigned •{' '}
                {assignments.reduce((acc, a) => acc + (a.periodsPerWeek || 0), 0)} periods total per week.
              </p>
              <div className="space-y-1.5 pt-2">
                {assignments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b last:border-b-0">
                    <span className="font-medium text-foreground">{a.className}-{a.sectionName} ({a.subjectName})</span>
                    <span className="font-mono text-muted-foreground">{a.periodsPerWeek} Periods/wk</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={handlePrevStep}>
                ← Previous
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={onPromptClose}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <Button type="button" size="sm" onClick={handleNextStep}>
                Next Step →
              </Button>
            ) : (
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {teacherToEdit ? 'Save Faculty Record' : 'Create Teacher Record'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
