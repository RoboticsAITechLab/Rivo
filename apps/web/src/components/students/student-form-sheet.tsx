'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { buildStudentDetail } from '@/lib/student-utils';

interface StudentFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: StudentDetail | null;
  onSave: (student: StudentDetail) => void;
}

function getInitialFormData(studentToEdit?: StudentDetail | null) {
  if (studentToEdit) {
    return {
      firstName: studentToEdit.firstName,
      middleName: studentToEdit.middleName || '',
      lastName: studentToEdit.lastName,
      dateOfBirth: studentToEdit.dateOfBirth,
      gender: studentToEdit.gender,
      email: studentToEdit.email,
      phone: studentToEdit.phone,
      street: studentToEdit.address.street,
      city: studentToEdit.address.city,
      state: studentToEdit.address.state,
      postalCode: studentToEdit.address.postalCode,
      academicSession: studentToEdit.academicSession,
      className: studentToEdit.className,
      section: studentToEdit.section,
      rollNumber: studentToEdit.rollNumber,
      admissionNumber: studentToEdit.admissionNumber,
      guardianName: studentToEdit.primaryGuardian.name,
      guardianRelation: (studentToEdit.primaryGuardian.relationship as 'Father' | 'Mother' | 'Legal Guardian') || 'Father',
      guardianPhone: studentToEdit.primaryGuardian.phone,
      guardianEmail: studentToEdit.primaryGuardian.email,
    };
  }
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '2010-05-15',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    email: '',
    phone: '+91 98',
    street: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380015',
    academicSession: '2026-27',
    className: 'Class 10',
    section: 'A',
    rollNumber: '15',
    admissionNumber: 'AUTO',
    guardianName: '',
    guardianRelation: 'Father' as 'Father' | 'Mother' | 'Legal Guardian',
    guardianPhone: '+91 98',
    guardianEmail: '',
  };
}

export function StudentFormSheet({
  isOpen,
  onClose,
  studentToEdit,
  onSave,
}: StudentFormSheetProps) {
  const isEditing = Boolean(studentToEdit);

  // Form state
  const [formData, setFormData] = React.useState(() => getInitialFormData(studentToEdit));
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Sync state if student changes
  const prevStudentIdRef = React.useRef(studentToEdit?.id);
  if (studentToEdit?.id !== prevStudentIdRef.current) {
    prevStudentIdRef.current = studentToEdit?.id;
    setFormData(getInitialFormData(studentToEdit));
    setErrors({});
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    // Admission number is auto-generated if left empty or 'AUTO'
    if (!formData.guardianName.trim()) newErrors.guardianName = 'Guardian name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing && studentToEdit) {
      const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
      const updatedStudent: StudentDetail = {
        ...studentToEdit,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        name: fullName,
        admissionNumber: formData.admissionNumber,
        className: formData.className,
        section: formData.section,
        rollNumber: formData.rollNumber,
        academicSession: formData.academicSession,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@student.institution.edu`,
        phone: formData.phone,
        address: {
          street: formData.street || studentToEdit.address.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        },
        primaryGuardian: {
          ...studentToEdit.primaryGuardian,
          name: formData.guardianName,
          relationship: formData.guardianRelation,
          phone: formData.guardianPhone,
          email: formData.guardianEmail || `${formData.guardianName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        },
        guardianName: `${formData.guardianName} (${formData.guardianRelation})`,
        guardianPhone: formData.guardianPhone,
      };
      onSave(updatedStudent);
    } else {
      const newStudent = buildStudentDetail({
        id: `std-${Date.now().toString().slice(-4)}`,
        admissionNumber: formData.admissionNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        className: formData.className,
        section: formData.section,
        rollNumber: formData.rollNumber,
        status: 'ACTIVE',
        gender: formData.gender,
        dob: formData.dateOfBirth,
        email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@student.institution.edu`,
        phone: formData.phone || '+91 98765 00000',
        bloodGroup: 'B+',
        street: formData.street || 'Institutional Campus',
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        guardianName: formData.guardianName,
        guardianRelation: formData.guardianRelation,
        guardianPhone: formData.guardianPhone || '+91 98765 11111',
        guardianEmail: formData.guardianEmail || `${formData.guardianName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        guardianOccupation: 'Professional',
        secGuardianName: 'Parent Contact',
        secGuardianRelation: 'Mother',
        secGuardianPhone: '+91 98765 22222',
        teacher: 'Neha Sharma',
        attendance: 95.0,
        presentDays: 180,
        absentDays: 8,
        lateDays: 2,
        hwCompleted: 12,
        hwTotal: 14,
        avgMarks: 85.0,
        enrollDate: new Date().toISOString().split('T')[0],
      });
      onSave(newStudent);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-4 sm:p-6"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-bold">
            {isEditing ? `Edit Student: ${studentToEdit?.name}` : 'New Student Admission'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {isEditing
              ? 'Update student demographics, contact coordinates and guardian information.'
              : 'Register a new pupil into the institutional academic roster.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pb-6 text-xs">
          {/* Section A: Student Information */}
          <FormSection
            title="A. Student Information"
            description="Official name, date of birth, and gender."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="First Name" required error={errors.firstName} htmlFor="fn">
                <Input
                  id="fn"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="e.g. Aarav"
                />
              </FormField>

              <FormField label="Middle Name" htmlFor="mn">
                <Input
                  id="mn"
                  value={formData.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  placeholder="Optional"
                />
              </FormField>

              <FormField label="Last Name" required error={errors.lastName} htmlFor="ln">
                <Input
                  id="ln"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="e.g. Patel"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <FormField label="Date of Birth" required htmlFor="dob">
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </FormField>

              <FormField label="Gender" required htmlFor="gender">
                <select
                  id="gender"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
            </div>
          </FormSection>

          {/* Section B: Contact */}
          <FormSection
            title="B. Contact & Address"
            description="Student email, personal phone, and residential address."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Student Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="student@institution.edu"
                />
              </FormField>

              <FormField label="Student Phone" htmlFor="phone">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </FormField>
            </div>

            <div className="mt-3 space-y-3">
              <FormField label="Residential Street Address" htmlFor="street">
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  placeholder="Flat No, Building, Street Area"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="City" htmlFor="city">
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                  />
                </FormField>

                <FormField label="State" htmlFor="state">
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                  />
                </FormField>

                <FormField label="Postal Code" htmlFor="postalCode">
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder="380015"
                  />
                </FormField>
              </div>
            </div>
          </FormSection>

          {/* Section C: Academic Enrollment */}
          <FormSection
            title="C. Academic Enrollment"
            description="Class allocation, roll number, and admission register ID."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Academic Session" required htmlFor="session">
                <select
                  id="session"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.academicSession}
                  onChange={(e) => handleChange('academicSession', e.target.value)}
                >
                  <option value="2026-27">2026-27 (Current)</option>
                  <option value="2025-26">2025-26</option>
                </select>
              </FormField>

              <FormField label="Class" required htmlFor="class">
                <select
                  id="class"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.className}
                  onChange={(e) => handleChange('className', e.target.value)}
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </FormField>

              <FormField label="Section" required htmlFor="section">
                <select
                  id="section"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.section}
                  onChange={(e) => handleChange('section', e.target.value)}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <FormField label="Roll Number" required htmlFor="roll">
                <Input
                  id="roll"
                  value={formData.rollNumber}
                  onChange={(e) => handleChange('rollNumber', e.target.value)}
                  placeholder="e.g. 14"
                />
              </FormField>

              <FormField label="Admission Number" required error={errors.admissionNumber} htmlFor="adm">
                <Input
                  id="adm"
                  value={formData.admissionNumber}
                  onChange={(e) => handleChange('admissionNumber', e.target.value.toUpperCase())}
                  placeholder="AUTO (system-generated) or manual code"
                  className="font-mono uppercase"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Keep as &apos;AUTO&apos; for system-generated ID, or specify manual number.
                </span>
              </FormField>
            </div>
          </FormSection>

          {/* Section D: Guardian */}
          <FormSection
            title="D. Primary Guardian Information"
            description="Parent / guardian emergency contacts and correspondence coordinates."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Guardian Name" required error={errors.guardianName} htmlFor="gname">
                <Input
                  id="gname"
                  value={formData.guardianName}
                  onChange={(e) => handleChange('guardianName', e.target.value)}
                  placeholder="e.g. Rajesh Patel"
                />
              </FormField>

              <FormField label="Relationship" required htmlFor="grel">
                <select
                  id="grel"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.guardianRelation}
                  onChange={(e) => handleChange('guardianRelation', e.target.value)}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <FormField label="Guardian Phone" required htmlFor="gphone">
                <Input
                  id="gphone"
                  value={formData.guardianPhone}
                  onChange={(e) => handleChange('guardianPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </FormField>

              <FormField label="Guardian Email" htmlFor="gemail">
                <Input
                  id="gemail"
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => handleChange('guardianEmail', e.target.value)}
                  placeholder="guardian@example.com"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Form Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-xs py-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {isEditing ? 'Save Changes' : 'Save Student'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
