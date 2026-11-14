'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addFilter,
  removeFilter,
  clearFilters,
  setFilterLogicalOperator,
} from '@/store/slices/searchConfigSlice';
import { FilterCondition } from '@/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  Filter,
  X,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import crypto from 'crypto';

interface DynamicFilterBarProps {
  onOpenAdvancedBuilder: () => void;
}

export const DynamicFilterBar: React.FC<DynamicFilterBarProps> = ({
  onOpenAdvancedBuilder,
}) => {
  const dispatch = useAppDispatch();
  const { filters, filterLogicalOperator } = useAppSelector((state) => state.searchConfig);

  // Quick preset pills to add with 1 click
  const quickPresets = [
    { label: 'Status = Active', field: 'status', operator: 'equals' as const, value: 'Active' },
    { label: 'Country = Germany', field: 'country', operator: 'equals' as const, value: 'Germany' },
    { label: 'Revenue > $10k', field: 'numericValue', operator: 'greater_than' as const, value: 10000 },
    { label: 'Americas Region', field: 'region', operator: 'equals' as const, value: 'Americas' },
    { label: 'Status = Flagged', field: 'status', operator: 'equals' as const, value: 'Flagged' },
  ];

  const handleAddPreset = (preset: (typeof quickPresets)[0]) => {
    // Avoid duplicate if already exists
    const exists = filters.some(
      (f) => f.field === preset.field && f.value === preset.value && f.operator === preset.operator
    );
    if (!exists) {
      dispatch(
        addFilter({
          id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          field: preset.field,
          operator: preset.operator,
          value: preset.value,
        })
      );
    }
  };

  const formatFilterDisplay = (f: FilterCondition) => {
    const fieldNames: Record<string, string> = {
      status: 'Status',
      country: 'Country',
      numericValue: 'Revenue',
      category: 'Segment',
      region: 'Region',
      recordDate: 'Date',
      title: 'Company',
      recordKey: 'Key',
    };
    const fName = fieldNames[f.field] || f.field;
    let valStr = String(f.value);
    if (f.field === 'numericValue' && typeof f.value === 'number') {
      valStr = formatCurrency(f.value);
    }
    if (f.operator === 'between' && f.valueTo !== undefined) {
      valStr = `${valStr} - ${f.valueTo}`;
    }
    return `${fName} ${f.operator.replace('_', ' ')} ${valStr}`;
  };

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3 bg-slate-900/60 border-b border-slate-800 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3 text-blue-400" />
            Quick Filters:
          </span>
          {quickPresets.map((preset, idx) => {
            const isApplied = filters.some(
              (f) => f.field === preset.field && f.value === preset.value && f.operator === preset.operator
            );
            return (
              <button
                key={idx}
                onClick={() => handleAddPreset(preset)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                  isApplied
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 cursor-default'
                    : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {isApplied && <CheckCircle2 className="h-3 w-3 text-blue-400" />}
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Right: Advanced Query Builder trigger & clear */}
        <div className="flex items-center gap-2">
          {filters.length > 1 && (
            <div className="flex items-center rounded border border-slate-800 bg-slate-950 p-0.5">
              <button
                onClick={() => dispatch(setFilterLogicalOperator('AND'))}
                className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${
                  filterLogicalOperator === 'AND'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AND
              </button>
              <button
                onClick={() => dispatch(setFilterLogicalOperator('OR'))}
                className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${
                  filterLogicalOperator === 'OR'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OR
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAdvancedBuilder}
            className="text-xs gap-1.5 text-slate-300 border-slate-700 bg-slate-900/90 hover:bg-slate-800"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Visual Query Builder</span>
            {filters.length > 0 && (
              <span className="rounded-full bg-blue-500/20 text-blue-300 px-1.5 py-0.2 text-[10px] font-mono">
                {filters.length}
              </span>
            )}
          </Button>

          {filters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearFilters())}
              className="text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              title="Clear all filters"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Applied Filters Badges Bar */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
          <span className="text-[11px] font-mono text-slate-400">Active Criteria:</span>
          {filters.map((f, i) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-950/70 border border-blue-700/50 text-blue-200 text-xs font-mono shadow-sm"
            >
              <span>{formatFilterDisplay(f)}</span>
              <button
                onClick={() => dispatch(removeFilter(f.id))}
                className="text-blue-400 hover:text-white hover:bg-blue-800 rounded p-0.5"
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
              {i < filters.length - 1 && (
                <span className="text-slate-500 font-bold text-[10px] uppercase ml-1">
                  {filterLogicalOperator}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

