'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addFilter,
  removeFilter,
  clearFilters,
  setFilters,
  setFilterLogicalOperator,
} from '@/store/slices/searchConfigSlice';
import { FilterCondition } from '@/types';
import { Button } from '../ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  Filter,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface DynamicFilterBarProps {
  onOpenAdvancedBuilder: () => void;
}

export const DynamicFilterBar: React.FC<DynamicFilterBarProps> = ({
  onOpenAdvancedBuilder,
}) => {
  const dispatch = useAppDispatch();
  const { filters, filterLogicalOperator } = useAppSelector((state) => state.searchConfig);

  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const quickPresets = [
    { label: 'Status = Active', field: 'status', operator: 'equals' as const, value: 'Active' },
    { label: 'Country = Germany', field: 'country', operator: 'equals' as const, value: 'Germany' },
    { label: 'Revenue > $10k', field: 'numericValue', operator: 'greater_than' as const, value: 10000 },
    { label: 'Created > Last 30 Days', field: 'recordDate', operator: 'greater_than' as const, value: thirtyDaysAgoStr },
    { label: 'Americas Region', field: 'region', operator: 'equals' as const, value: 'Americas' },
    { label: 'Status = Flagged', field: 'status', operator: 'equals' as const, value: 'Flagged' },
  ];

  const isSpecBenchmarkApplied =
    filters.length === 4 &&
    filterLogicalOperator === 'AND' &&
    filters.some((f) => f.field === 'status' && f.value === 'Active') &&
    filters.some((f) => f.field === 'country' && f.value === 'Germany') &&
    filters.some((f) => f.field === 'numericValue' && f.value === 10000) &&
    filters.some((f) => f.field === 'recordDate' && f.value === thirtyDaysAgoStr);

  const handleApplySpecBenchmark = () => {
    dispatch(setFilterLogicalOperator('AND'));
    dispatch(
      setFilters([
        { id: 'spec-1', field: 'status', operator: 'equals', value: 'Active' },
        { id: 'spec-2', field: 'country', operator: 'equals', value: 'Germany' },
        { id: 'spec-3', field: 'numericValue', operator: 'greater_than', value: 10000 },
        { id: 'spec-4', field: 'recordDate', operator: 'greater_than', value: thirtyDaysAgoStr },
      ])
    );
  };

  const handleAddPreset = (preset: (typeof quickPresets)[0]) => {
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
    <div className="flex flex-col gap-2.5 px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3 text-emerald-400" />
            Quick filters:
          </span>
          {quickPresets.map((preset, idx) => {
            const isApplied = filters.some(
              (f) => f.field === preset.field && f.value === preset.value && f.operator === preset.operator
            );
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isApplied
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 cursor-default'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {isApplied && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleApplySpecBenchmark}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isSpecBenchmarkApplied
                ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
            }`}
            title="Applies Status=Active, Country=Germany, Revenue>10k, Date>Last 30 Days"
          >
            {isSpecBenchmarkApplied ? (
              <CheckCircle2 className="h-3 w-3 text-white" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
            Spec Benchmark (Active + Germany + &gt;$10k + 30 Days)
          </button>
        </div>

        {/* Right: Advanced Query Builder trigger & clear */}
        <div className="flex items-center gap-2">
          {filters.length > 1 && (
            <div className="flex items-center rounded border border-slate-800 bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => dispatch(setFilterLogicalOperator('AND'))}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  filterLogicalOperator === 'AND'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => dispatch(setFilterLogicalOperator('OR'))}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  filterLogicalOperator === 'OR'
                    ? 'bg-emerald-600 text-white font-bold'
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
            className="text-xs gap-1.5 text-slate-300 border-slate-700 bg-slate-900 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Visual Query Builder</span>
            {filters.length > 0 && (
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[10px] font-mono">
                {filters.length}
              </span>
            )}
          </Button>

          {filters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearFilters())}
              className="text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
          <span className="text-xs text-slate-400">Active criteria:</span>
          {filters.map((f, i) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-emerald-200 text-xs shadow-sm"
            >
              <span>{formatFilterDisplay(f)}</span>
              <button
                type="button"
                onClick={() => dispatch(removeFilter(f.id))}
                className="text-emerald-400 hover:text-white hover:bg-emerald-800 rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
              {i < filters.length - 1 && (
                <span className="text-slate-400 font-medium text-xs ml-1">
                  {filterLogicalOperator.toLowerCase()}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
