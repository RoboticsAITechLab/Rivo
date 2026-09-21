'use daylight';
'use client';

import React from 'react';
import { CustomFieldDefinition } from '@/types/custom-fields';

interface CustomFieldRendererProps {
  field: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function CustomFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: CustomFieldRendererProps) {
  const { type, name, required, description, options } = field;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1">
          {name}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
          {type}
        </span>
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 leading-tight">{description}</p>
      )}

      {/* RENDERERS BASED ON FIELD TYPE */}
      {type === 'text' && (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${name.toLowerCase()}`}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'longtext' && (
        <textarea
          rows={3}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter detailed ${name.toLowerCase()}`}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'number' && (
        <input
          type="number"
          value={typeof value === 'number' || typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={disabled}
          placeholder="0"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'decimal' && (
        <input
          type="number"
          step="0.01"
          value={typeof value === 'number' || typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={disabled}
          placeholder="0.00"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'date' && (
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'datetime' && (
        <input
          type="datetime-local"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'select' && (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <option value="">Select an option</option>
          {(options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {type === 'multiselect' && (
        <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/50">
          {(options || []).map((opt) => {
            const selectedList = Array.isArray(value) ? (value as string[]) : [];
            const isSelected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (isSelected) {
                    onChange(selectedList.filter((item) => item !== opt));
                  } else {
                    onChange([...selectedList, opt]);
                  }
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSelected ? '✓ ' : '+ '}
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {type === 'yesno' && (
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
          <span className="text-xs font-medium text-slate-700">
            {Boolean(value) ? 'Yes / Enabled' : 'No / Disabled'}
          </span>
        </div>
      )}

      {type === 'phone' && (
        <input
          type="tel"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="+91 00000 00000"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'email' && (
        <input
          type="email"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="contact@domain.com"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {type === 'url' && (
        <input
          type="url"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://example.com"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      )}

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
