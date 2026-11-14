'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  toggleColumnVisibility,
  setTableDensity,
  toggleVirtualization,
  toggleHighlightMatches,
  resetColumnPreferences,
} from '@/store/slices/uiPreferenceSlice';
import { Button } from '../ui/button';
import { Columns3, Check, Sliders, Sparkles, RefreshCcw } from 'lucide-react';

interface ColumnDef {
  key: string;
  label: string;
}

const availableColumns: ColumnDef[] = [
  { key: 'recordKey', label: 'Account Key' },
  { key: 'title', label: 'Company / Title' },
  { key: 'category', label: 'Segment' },
  { key: 'status', label: 'Status' },
  { key: 'numericValue', label: 'Revenue ($)' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'recordDate', label: 'Date' },
];

export const ColumnVisibilityDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { visibleColumns, tableDensity, useVirtualization, highlightMatches } = useAppSelector(
    (state) => state.uiPreference
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-slate-300 border-slate-700 bg-slate-900/80 hover:bg-slate-800"
      >
        <Columns3 className="h-3.5 w-3.5 text-blue-400" />
        <span>Columns & View</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-xl ring-1 ring-black ring-opacity-5 z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Visible Columns
            </span>
            <button
              onClick={() => dispatch(resetColumnPreferences())}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <RefreshCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <div className="py-2 space-y-1">
            {availableColumns.map((col) => {
              const isChecked = visibleColumns[col.key] !== false;
              return (
                <label
                  key={col.key}
                  className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-900 rounded cursor-pointer transition-colors"
                >
                  <span>{col.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => dispatch(toggleColumnVisibility(col.key))}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                </label>
              );
            })}
          </div>

          {/* Density & Rendering Preferences */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Table Density</span>
              <div className="flex gap-1">
                {(['compact', 'standard', 'spacious'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => dispatch(setTableDensity(d))}
                    className={`px-1.5 py-0.5 text-[10px] rounded capitalize ${
                      tableDensity === d
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">DOM Virtualization</span>
              <button
                onClick={() => dispatch(toggleVirtualization())}
                className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                  useVirtualization ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {useVirtualization ? '60fps Enabled' : 'Standard'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Search Highlight</span>
              <button
                onClick={() => dispatch(toggleHighlightMatches())}
                className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                  highlightMatches ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {highlightMatches ? 'Active' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
