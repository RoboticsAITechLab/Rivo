'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { TeacherOnboardingWorkspace } from '@/features/teachers/components/teacher-onboarding-workspace';

function EditTeacherPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const teacherId = params?.id as string;

  const handleSuccess = (teacher: any) => {
    toast(
      'Teacher Updated Successfully',
      `${teacher.firstName || teacher.name} has been updated in the institutional faculty roster.`
    );
    router.push('/school/teachers');
  };

  const handleCancel = () => {
    router.push('/school/teachers');
  };

  if (!teacherId) {
    return null;
  }

  return (
    <PageContainer>
      <TeacherOnboardingWorkspace
        teacherIdToEdit={teacherId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
}

export default function EditTeacherPage() {
  return (
    <ToastProvider>
      <EditTeacherPageContent />
    </ToastProvider>
  );
}
