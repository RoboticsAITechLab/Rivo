'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore } from '../mock-store/school-store';
import { selectAcademicSessions } from '../selectors';
import { AcademicSession, AcademicSessionId } from '../types';

export interface AcademicSessionSelectProps {
  value?: AcademicSessionId | null;
  onChange: (sessionId: AcademicSessionId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function AcademicSessionSelect({
  value,
  onChange,
  label = 'Academic Session',
  required,
  disabled,
  allowClear = false,
  placeholder = 'Select academic session...',
  className,
}: AcademicSessionSelectProps) {
  const store = useSchoolStore();

  const options: SelectorOption<AcademicSession>[] = React.useMemo(() => {
    const sessions = selectAcademicSessions(store);
    return sessions.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: `${s.code} • ${s.startDate} to ${s.endDate}`,
      badge: s.isCurrent ? (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
          Current
        </span>
      ) : undefined,
      raw: s,
    }));
  }, [store]);

  return (
    <UniversalSelector<AcademicSession>
      value={value}
      onChange={(id) => onChange(id)}
      options={options}
      label={label}
      required={required}
      disabled={disabled}
      allowClear={allowClear}
      placeholder={placeholder}
      searchPlaceholder="Search session..."
      emptyMessage="No academic sessions found."
      className={className}
    />
  );
}
