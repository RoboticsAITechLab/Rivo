'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore } from '../mock-store/school-store';
import { selectExams } from '../selectors';
import { Exam, ExamId } from '../types';

export interface ExamSelectProps {
  value?: ExamId | null;
  onChange: (examId: ExamId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function ExamSelect({
  value,
  onChange,
  label = 'Formal Examination Cycle',
  required,
  disabled,
  allowClear = false,
  placeholder = 'Select examination...',
  className,
}: ExamSelectProps) {
  const store = useSchoolStore();

  const options: SelectorOption<Exam>[] = React.useMemo(() => {
    const exams = selectExams(store);
    return exams.map((e) => {
      let badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' = 'default';
      if (e.status === 'COMPLETED' || e.status === 'PUBLISHED') badgeVariant = 'default';
      else if (e.status === 'ONGOING') badgeVariant = 'secondary';
      else if (e.status === 'SCHEDULED') badgeVariant = 'outline';

      return {
        id: e.id,
        title: e.name,
        subtitle: `${e.code} • ${e.startDate} to ${e.endDate} • ${e.classIds.length} classes`,
        badge: e.status.replace('_', ' '),
        badgeVariant,
        raw: e,
      };
    });
  }, [store]);

  return (
    <UniversalSelector<Exam>
      value={value}
      onChange={(id) => onChange(id)}
      options={options}
      label={label}
      required={required}
      disabled={disabled}
      allowClear={allowClear}
      placeholder={placeholder}
      searchPlaceholder="Search examination by name or code..."
      emptyMessage="No formal examinations found."
      className={className}
    />
  );
}
