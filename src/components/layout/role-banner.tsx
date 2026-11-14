'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { switchRole } from '@/store/slices/authSlice';
import { ShieldAlert, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

export const RoleBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeRole, permissions } = useAppSelector((state) => state.auth);

  if (activeRole === 'admin') {
    return null; // Silent for Admin
  }

  return (
    <div
      className={`px-4 py-2 border-b flex items-center justify-between text-xs transition-colors ${
        activeRole === 'viewer'
          ? 'bg-amber-950/40 border-amber-800/50 text-amber-200'
          : 'bg-blue-950/40 border-blue-800/50 text-blue-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {activeRole === 'viewer' ? (
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
        ) : (
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
        )}
        <span>
          <strong>Simulating {activeRole.toUpperCase()} Role:</strong>{' '}
          {activeRole === 'viewer'
            ? 'Read-only mode. Bulk export, saved view authoring, and admin-only datasets are restricted.'
            : 'Analyst mode. Full search, multi-filter, custom views, and data export enabled.'}
        </span>
      </div>

      <Button
        variant="ghost"
        size="xs"
        onClick={() => dispatch(switchRole('admin'))}
        className="text-[11px] font-semibold underline hover:bg-transparent hover:text-white"
      >
        Restore Admin Permissions
      </Button>
    </div>
  );
};

