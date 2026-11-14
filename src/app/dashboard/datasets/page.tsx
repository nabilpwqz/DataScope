'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import { useGetDatasetsQuery } from '@/store/services/dataScopeApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatDate } from '@/lib/utils';
import {
  Database,
  Plus,
  Table,
  Lock,
  Globe,
  Shield,
  Layers,
  ArrowRight,
  Server,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function DatasetsPage() {
  const dispatch = useAppDispatch();
  const { data: datasets = [], isLoading } = useGetDatasetsQuery();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { activeRole, permissions } = useAppSelector((state) => state.auth);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newCategory, setNewCategory] = useState('Sales & Revenue');
  const [newAccess, setNewAccess] = useState<'public' | 'restricted' | 'admin_only'>('public');

  const handleSelect = (id: string) => {
    dispatch(setSelectedDatasetId(id));
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            <span>Dataset Collections</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, manage, and configure access permissions across enterprise data sources.
          </p>
        </div>

        {permissions.canManageDatasets && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create Dataset
          </Button>
        )}
      </div>

      {/* Datasets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {datasets.map((d) => {
          const isSelected = selectedDatasetId === d.id;
          return (
            <div
              key={d.id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all bg-slate-900/50 ${
                isSelected
                  ? 'border-blue-500/80 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      d.accessLevel === 'public'
                        ? 'success'
                        : d.accessLevel === 'restricted'
                        ? 'warning'
                        : 'purple'
                    }
                    size="sm"
                  >
                    {d.accessLevel.toUpperCase()}
                  </Badge>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-blue-400 font-bold">
                      <CheckCircle className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">{d.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                {/* Metadata Details */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Indexed Rows:</span>
                    <span className="font-mono font-bold text-white">
                      {d.totalRecords.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-300">{d.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source:</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[160px]">
                      {d.dataSource}
                    </span>
                  </div>
                </div>

                {/* Fields count */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 font-medium">Fields ({d.fields?.length || 0}):</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {d.fields?.slice(0, 5).map((f) => (
                      <span
                        key={f.id}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                      >
                        {f.fieldName}
                      </span>
                    ))}
                    {(d.fields?.length || 0) > 5 && (
                      <span className="text-[10px] text-slate-500 px-1 py-0.5">
                        +{d.fields.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <Button
                  variant={isSelected ? 'secondary' : 'outline'}
                  size="xs"
                  onClick={() => handleSelect(d.id)}
                  className="text-xs flex-1"
                >
                  {isSelected ? 'Selected' : 'Set Active'}
                </Button>

                <Link href="/dashboard/explorer">
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleSelect(d.id)}
                    className="text-xs gap-1"
                  >
                    <span>Explorer</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
