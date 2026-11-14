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
import { Columns3, RefreshCcw } from 'lucide-react';

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
        className="flex items-center gap-1.5 text-xs text-slate-300 border-slate-700 bg-slate-900 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Columns3 className="h-3.5 w-3.5 text-emerald-400" />
        <span>Columns &amp; View</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-xl z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              Visible columns
            </span>
            <button
              type="button"
              onClick={() => dispatch(resetColumnPreferences())}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </label>
              );
            })}
          </div>

          {/* Density & Rendering Preferences */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Table density</span>
              <div className="flex gap-1">
                {(['compact', 'standard', 'spacious'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => dispatch(setTableDensity(d))}
                    className={`px-1.5 py-0.5 text-xs rounded capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      tableDensity === d
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">DOM virtualization</span>
              <button
                type="button"
                onClick={() => dispatch(toggleVirtualization())}
                className={`px-2 py-0.5 text-xs rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  useVirtualization ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {useVirtualization ? 'Enabled' : 'Standard'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Search highlight</span>
              <button
                type="button"
                onClick={() => dispatch(toggleHighlightMatches())}
                className={`px-2 py-0.5 text-xs rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  highlightMatches ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold' : 'bg-slate-800 text-slate-400'
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
