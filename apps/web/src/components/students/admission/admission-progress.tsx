'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Circle, Sparkles, Clock } from 'lucide-react';

export interface AdmissionSectionStatus {
  id: string;
  title: string;
  isComplete: boolean;
  isRequired: boolean;
  hasErrors?: boolean;
}

interface AdmissionProgressProps {
  sections: AdmissionSectionStatus[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  completionPercentage: number;
  lastSavedAt?: string;
  isSavingDraft?: boolean;
}

export function AdmissionProgress({
  sections,
  activeSectionId,
  onSelectSection,
  completionPercentage,
  lastSavedAt,
  isSavingDraft,
}: AdmissionProgressProps) {
  return (
    <div className="w-full sm:w-72 md:w-80 shrink-0 border-r border-slate-200/80 bg-slate-50/50 p-5 flex flex-col justify-between">
      <div className="space-y-6">
        {/* HEADER & PROGRESS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Intake Progress
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {completionPercentage}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {isSavingDraft ? (
                <span className="text-amber-600 font-medium">Autosaving draft...</span>
              ) : lastSavedAt ? (
                <span>Saved at {lastSavedAt}</span>
              ) : (
                <span>Unsaved draft</span>
              )}
            </span>
          </div>
        </div>

        {/* SECTION NAV LIST */}
        <nav className="space-y-1.5" aria-label="Admission form sections">
          {sections.map((sec, idx) => {
            const isActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectSection(sec.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-emerald-900 font-bold shadow-xs border border-emerald-500/30'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className={`text-[10px] font-mono font-bold w-4 text-center shrink-0 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{sec.title}</span>
                </div>

                <div className="shrink-0">
                  {sec.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : sec.hasErrors ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : sec.isRequired ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  ) : (
                    <Circle className="w-3 h-3 text-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* QUICK COMPLIANCE HINT */}
      <div className="pt-4 border-t border-slate-200/80 mt-6">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admission Tip</span>
          </div>
          <p className="text-emerald-800 leading-tight">
            You can save as <strong>Draft</strong> at any stage to preserve progress and resume later.
          </p>
        </div>
      </div>
    </div>
  );
}
