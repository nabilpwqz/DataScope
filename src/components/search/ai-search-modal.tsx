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
  ShieldCheck,
} from 'lucide-react';

export const AISearchModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAiModalOpen } = useAppSelector((state) => state.savedViews);
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);

  const [prompt, setPrompt] = useState(
    'Find active customers from Germany with revenue greater than $10,000'
  );

  const [parseSearch, { data, isLoading }] = useParseNaturalLanguageSearchMutation();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 motion-safe:animate-in motion-safe:fade-in-50">
      <div className="flex flex-col w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>AI Natural Language Search Assistant</span>
                <Badge variant="emerald" size="sm">
                  Validated NLQ
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Converts English business requests into validated, SQL-optimized filter parameters.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setAiModalOpen(false))}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 font-sans"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Click a sample or type your custom requirement:
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                className="text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-300" />
                Parse &amp; validate
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
                className="text-xs text-left px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                &ldquo;{sp}&rdquo;
              </button>
            ))}
          </div>

          {/* AI Parsing & Guardrails Output */}
          {data && (
            <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3 motion-safe:animate-in motion-safe:fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Validated interpretation
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">
                  Confidence: {Math.round(data.confidence * 100)}%
                </span>
              </div>

              <p className="text-xs text-emerald-200 bg-slate-950 p-2.5 rounded border border-slate-800">
                {data.interpretedIntent}
              </p>

              {/* Extracted filters count */}
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Extracted conditions:{' '}
                  <strong className="text-white">
                    {data.queryConfig.filters?.length || 0}
                  </strong>{' '}
                  filters
                </span>
                <span className="text-xs">
                  Logic: <strong>{data.queryConfig.filterLogicalOperator}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(setAiModalOpen(false))}
            className="text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={!data?.queryConfig}
            onClick={handleApply}
            className="text-xs font-semibold px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Play className="h-3.5 w-3.5 mr-1 fill-current" />
            Apply to Explorer table
          </Button>
        </div>
      </div>
    </div>
  );
};
