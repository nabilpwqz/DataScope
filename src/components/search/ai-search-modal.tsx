'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAiModalOpen } from '@/store/slices/savedViewsSlice';
import {
  setFilters,
  setFilterLogicalOperator,
  setSearch,
  setDebouncedSearch,
} from '@/store/slices/searchConfigSlice';
import { useParseNaturalLanguageSearchMutation } from '@/store/services/dataScopeApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sparkles,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AISearchModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAiModalOpen } = useAppSelector((state) => state.savedViews);
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);

  const [prompt, setPrompt] = useState(
    'Find active customers from Germany with revenue greater than $10,000'
  );

  const [parseSearch, { data, isLoading, error }] = useParseNaturalLanguageSearchMutation();

  if (!isAiModalOpen) return null;

  const handleParse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    try {
      await parseSearch({ prompt, datasetId: selectedDatasetId }).unwrap();
    } catch (err) {
      console.error('AI parse error:', err);
    }
  };

  const handleApply = () => {
    if (!data?.queryConfig) return;
    const { filters, filterLogicalOperator, search } = data.queryConfig;
    if (filters) dispatch(setFilters(filters));
    if (filterLogicalOperator) dispatch(setFilterLogicalOperator(filterLogicalOperator));
    if (search !== undefined) {
      dispatch(setSearch(search));
      dispatch(setDebouncedSearch(search));
    }
    dispatch(setAiModalOpen(false));
  };

  const samplePrompts = [
    'Find active customers from Germany with revenue greater than $10,000',
    'Show suspended or flagged records in Americas with revenue over 50k',
    'Enterprise contracts created in the last 30 days',
    'Mid-market accounts in United Kingdom with revenue under $25,000',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-50">
      <div className="flex flex-col w-full max-w-2xl rounded-xl border border-blue-500/30 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-blue-950/60 to-indigo-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>AI Natural Language Search Assistant</span>
                <Badge variant="purple" size="sm">
                  Validated NLQ
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Converts English business requests into validated, SQL-optimized filter parameters.
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(setAiModalOpen(false))}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleParse} className="space-y-3">
            <label className="text-xs font-semibold text-slate-300">
              Describe your target search criteria in natural language:
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Find active customers from Germany with revenue greater than $10,000..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Click a sample or type your custom requirement:
              </span>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-300" />
                Parse & Validate
              </Button>
            </div>
          </form>

          {/* Prompt Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sp);
                }}
                className="text-[11px] text-left px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
              >
                &ldquo;{sp}&rdquo;
              </button>
            ))}
          </div>

          {/* AI Parsing & Guardrails Output */}
          {data && (
            <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Validated Interpretation
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Confidence: {Math.round(data.confidence * 100)}%
                </span>
              </div>

              <p className="text-xs text-blue-300 font-mono bg-blue-950/40 p-2.5 rounded border border-blue-800/40">
                {data.interpretedIntent}
              </p>

              {/* Extracted filters count */}
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Extracted Conditions:{' '}
                  <strong className="text-white">
                    {data.queryConfig.filters?.length || 0}
                  </strong>{' '}
                  filters
                </span>
                <span className="font-mono text-[11px]">
                  Logic: <strong>{data.queryConfig.filterLogicalOperator}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(setAiModalOpen(false))}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={!data?.queryConfig}
            onClick={handleApply}
            className="text-xs font-semibold px-5"
          >
            <Play className="h-3.5 w-3.5 mr-1 fill-current" />
            Apply to Explorer Table
          </Button>
        </div>
      </div>
    </div>
  );
};

