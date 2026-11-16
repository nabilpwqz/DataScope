'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setFilters,
  setFilterLogicalOperator,
} from '@/store/slices/searchConfigSlice';
import { FilterCondition, FilterOperator } from '@/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Plus,
  Trash2,
  X,
  Play,
  Sparkles,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

interface FilterBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableFields = [
  { field: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Archived', 'Suspended', 'Completed', 'Flagged'] },
  { field: 'country', label: 'Country', type: 'select', options: ['Germany', 'United States', 'United Kingdom', 'France', 'Japan', 'Canada', 'Australia', 'Switzerland', 'Singapore'] },
  { field: 'category', label: 'Market Segment', type: 'select', options: ['Enterprise', 'Mid-Market', 'Tier 1 Partner', 'SMB', 'Strategic Wholesale', 'Public Sector'] },
  { field: 'region', label: 'Region', type: 'select', options: ['DACH', 'Americas', 'EMEA', 'APAC', 'Nordics'] },
  { field: 'numericValue', label: 'Revenue ($)', type: 'number' },
  { field: 'title', label: 'Company / Title', type: 'string' },
  { field: 'recordKey', label: 'Record Key', type: 'string' },
  { field: 'recordDate', label: 'Contract Date', type: 'date' },
];

export const FilterBuilder: React.FC<FilterBuilderProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { filters: currentFilters, filterLogicalOperator: currentOp } = useAppSelector(
    (state) => state.searchConfig
  );

  const [localFilters, setLocalFilters] = useState<FilterCondition[]>(
    currentFilters.length > 0
      ? currentFilters
      : [
        {
          id: `cond-1`,
          field: 'status',
          operator: 'equals',
          value: 'Active',
        },
      ]
  );
  const [localOp, setLocalOp] = useState<'AND' | 'OR'>(currentOp || 'AND');

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setLocalFilters([
      ...localFilters,
      {
        id: `cond-${Date.now()}`,
        field: 'country',
        operator: 'equals',
        value: 'Germany',
      },
    ]);
  };

  const handleUpdateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setLocalFilters(
      localFilters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveCondition = (id: string) => {
    setLocalFilters(localFilters.filter((f) => f.id !== id));
  };

  const handleApply = () => {
    dispatch(setFilters(localFilters));
    dispatch(setFilterLogicalOperator(localOp));
    onClose();
  };

  const handleLoadSpecPreset = () => {
    // Exact spec example: Status = Active, Country = Germany, Revenue > $10,000
    setLocalFilters([
      { id: 'p1', field: 'status', operator: 'equals', value: 'Active' },
      { id: 'p2', field: 'country', operator: 'equals', value: 'Germany' },
      { id: 'p3', field: 'numericValue', operator: 'greater_than', value: 10000 },
    ]);
    setLocalOp('AND');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
      <div className="flex flex-col w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-950 overflow-hidden motion-safe:animate-in motion-safe:fade-in-50 motion-safe:zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Visual Query Builder</h3>
              <p className="text-xs text-slate-400">
                Construct composite multi-field search conditions executed on the PostgreSQL backend.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Logical Match Operator Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-xs font-medium text-slate-300">
              Match records where <strong className="text-white">all</strong> or{' '}
              <strong className="text-white">any</strong> conditions apply:
            </span>
            <div className="flex items-center rounded border border-slate-700 bg-slate-950 p-0.5 w-full sm:w-auto">
              <button
                onClick={() => setLocalOp('AND')}
                className={`flex-1 sm:flex-initial px-3 py-1 text-xs rounded font-bold transition-colors ${localOp === 'AND'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                AND (All Must Match)
              </button>
              <button
                onClick={() => setLocalOp('OR')}
                className={`flex-1 sm:flex-initial px-3 py-1 text-xs rounded font-bold transition-colors ${localOp === 'OR'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                OR (Any May Match)
              </button>
            </div>
          </div>

          {/* Condition Rows */}
          <div className="space-y-3">
            {localFilters.map((cond, index) => {
              const fieldConfig = availableFields.find((f) => f.field === cond.field) || availableFields[0];

              return (
                <div
                  key={cond.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 sm:p-3 rounded-lg border border-slate-800/90 bg-slate-900/40 hover:border-slate-700 transition-colors"
                >
                  <span className="font-mono text-xs text-slate-500 font-bold w-6 shrink-0 self-center sm:self-auto">
                    #{index + 1}
                  </span>

                  {/* Field Selector */}
                  <select
                    value={cond.field}
                    onChange={(e) => {
                      const nextField = e.target.value;
                      const nextConfig = availableFields.find((f) => f.field === nextField);
                      let defaultVal: any = '';
                      if (nextConfig?.type === 'select' && nextConfig.options) {
                        defaultVal = nextConfig.options[0];
                      } else if (nextConfig?.type === 'number') {
                        defaultVal = 10000;
                      }
                      handleUpdateCondition(cond.id, {
                        field: nextField,
                        value: defaultVal,
                      });
                    }}
                    className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-full sm:w-44"
                  >
                    {availableFields.map((f) => (
                      <option key={f.field} value={f.field}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator Selector */}
                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      handleUpdateCondition(cond.id, {
                        operator: e.target.value as FilterOperator,
                      })
                    }
                    className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-full sm:w-36 font-mono"
                  >
                    <option value="equals">equals (=)</option>
                    <option value="contains">contains (ILIKE)</option>
                    <option value="starts_with">starts with</option>
                    <option value="greater_than">greater than (&gt;)</option>
                    <option value="less_than">less than (&lt;)</option>
                    <option value="between">between</option>
                    <option value="is_null">is empty (null)</option>
                    <option value="is_not_null">is not empty</option>
                  </select>

                  {/* Value Input */}
                  {cond.operator !== 'is_null' && cond.operator !== 'is_not_null' && (
                    <div className="w-full sm:flex-1 flex gap-2">
                      {fieldConfig.type === 'select' && fieldConfig.options ? (
                        <select
                          value={String(cond.value)}
                          onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                          className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {fieldConfig.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={fieldConfig.type === 'number' ? 'number' : fieldConfig.type === 'date' ? 'date' : 'text'}
                          value={cond.value !== undefined ? cond.value : ''}
                          onChange={(e) =>
                            handleUpdateCondition(cond.id, {
                              value: fieldConfig.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                            })
                          }
                          placeholder="Value..."
                          className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      )}

                      {cond.operator === 'between' && (
                        <input
                          type={fieldConfig.type === 'number' ? 'number' : 'text'}
                          value={cond.valueTo !== undefined ? cond.valueTo : ''}
                          onChange={(e) =>
                            handleUpdateCondition(cond.id, {
                              valueTo: fieldConfig.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                            })
                          }
                          placeholder="And value..."
                          className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      )}
                    </div>
                  )}

                  {/* Delete Condition Button */}
                  <button
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="h-9 w-9 shrink-0 self-end sm:self-center flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
                    title="Remove rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Condition
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadSpecPreset}
              className="text-xs text-amber-400 hover:bg-amber-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Load Spec Preset (Germany &gt; $10k Active)
            </Button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-slate-900/80">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="text-xs font-semibold px-5 gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Apply & Execute Query
          </Button>
        </div>
      </div>
    </div>
  );
};

