'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { TeacherOnboardingWorkspace } from '@/features/teachers/components/teacher-onboarding-workspace';

function AddTeacherPageContent() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSuccess = (teacher: any) => {
    toast(
      'Teacher Onboarded Successfully',
      `${teacher.firstName} ${teacher.lastName} has been added to the institutional faculty roster.`
    );
  };

  const handleCancel = () => {
    router.push('/school/teachers');
  };

  return (
    <PageContainer>
      <TeacherOnboardingWorkspace onSuccess={handleSuccess} onCancel={handleCancel} />
    </PageContainer>
  );
}

export default function AddTeacherPage() {
  return (
    <ToastProvider>
      <AddTeacherPageContent />
    </ToastProvider>
  );
}
