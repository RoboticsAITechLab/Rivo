'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { AdmissionWorkspace } from '@/components/students/admission/admission-workspace';
import { StudentDetail } from '@/types/student';

function AddStudentPageContent() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaveStudent = async (studentData: StudentDetail) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionNumber: studentData.admissionNumber,
          firstName: studentData.firstName || studentData.name.split(' ')[0] || 'Student',
          lastName: studentData.lastName || studentData.name.split(' ').slice(1).join(' ') || '',
          gender: studentData.gender,
          dateOfBirth: studentData.dateOfBirth,
          bloodGroup: studentData.bloodGroup,
          status: studentData.status,
          email: studentData.email,
          phone: studentData.phone,
          address: typeof studentData.address === 'string' ? studentData.address : (studentData.address?.street || ''),
          className: studentData.className,
          sectionName: studentData.section,
          rollNumber: studentData.rollNumber,
          rollNumberMode: (studentData as any).rollNumberMode || 'AUTO',
          photoUrl: studentData.photoUrl,
          houseId: studentData.houseId,
          stream: (studentData as any).stream,
          campusId: (studentData as any).campusId,
          guardians: (studentData as any).guardians,
          documents: (studentData as any).documents,
          guardian: (studentData as any).primaryGuardian || (studentData as any).guardians?.[0],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to enroll student');
      }

      toast(
        'Student Enrolled Successfully',
        `${studentData.name || studentData.firstName} has been synchronized with the database roster.`
      );
      router.push('/school/students');
    } catch (err: unknown) {
      toast('Operation Failed', err instanceof Error ? err.message : 'Could not enroll student');
    }
  };

  const handleCancel = () => {
    router.push('/school/students');
  };

  return (
    <PageContainer>
      <AdmissionWorkspace
        isOpen={true}
        isModal={false}
        onClose={handleCancel}
        onSaveStudent={handleSaveStudent}
        onViewStudentProfile={(student) => router.push(`/school/students/${student.id}`)}
      />
    </PageContainer>
  );
}

export default function AddStudentPage() {
  return (
    <ToastProvider>
      <AddStudentPageContent />
    </ToastProvider>
  );
}
