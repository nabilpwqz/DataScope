'use client';

import React, { useState } from 'react';
import { useGetUsersQuery, useUpdateUserRoleMutation } from '@/store/services/dataScopeApi';
import { useAppSelector } from '@/store';
import { UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconUsers,
  IconShield,
  IconCheck,
  IconRefresh,
  IconLock,
} from '@/components/ui/icons';

export default function UsersPage() {
  const { data, isLoading, isFetching, refetch } = useGetUsersQuery();
  const [updateUserRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();
  const { activeRole } = useAppSelector((state) => state.auth);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const users = data?.users || [];
  const isAdmin = activeRole === 'admin';

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setStatusMsg(null);
      await updateUserRole({ userId, role: newRole }).unwrap();
      setStatusMsg(`Successfully updated user permissions to ${newRole}.`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      setStatusMsg(err?.data?.error || 'Failed to update user role');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'analyst':
        return 'success';
      case 'viewer':
      default:
        return 'default';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <IconUsers className="h-6 w-6 text-emerald-400" />
              <span>Users & Role-Based Access Control</span>
            </h1>
            <Badge variant="success" size="sm">
              RBAC Enforced
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Enterprise identity governance, role provisioning, and server-validated permission enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="items-center gap-1.5 text-xs text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <IconRefresh className={`h-3.5 w-3.5 ${isFetching ? 'motion-safe:animate-spin' : ''}`} />
            <span>Refresh Roster</span>
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <IconCheck className="h-4 w-4 text-emerald-400" />
            {statusMsg}
          </span>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Administrator Role</span>
            <Badge variant="danger" size="sm">
              Unrestricted
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Full authority over user lifecycle, role modification, dataset configuration, and audit logs.
          </p>
          <div className="text-[11px] text-slate-500">
            Active: {users.filter((u) => u.role === 'admin').length} accounts
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Data Analyst Role</span>
            <Badge variant="success" size="sm">
              Analytic Scope
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Search execution, parameterized filtering, custom views creation, and streaming data export.
          </p>
          <div className="text-[11px] text-slate-500">
            Active: {users.filter((u) => u.role === 'analyst').length} accounts
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Viewer Role</span>
            <Badge variant="default" size="sm">
              Read Only
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Read-only exploration of public datasets with sensitive financial columns automatically masked.
          </p>
          <div className="text-[11px] text-slate-500">
            Active: {users.filter((u) => u.role === 'viewer').length} accounts
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Platform Identity Directory</h2>
            <p className="text-[11px] text-slate-400">
              {isAdmin ? 'Administrators can modify active user roles below.' : 'Read-only view for non-admin accounts.'}
            </p>
          </div>
          <span className="text-xs text-slate-400">{users.length} registered identities</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Loading directory identities from security database...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="px-4 py-3">User & Contact</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Permission Level</th>
                  <th className="px-4 py-3 text-right">Role Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                      {u.department}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {u.permissionsCount} Policies
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {isAdmin ? (
                        <select
                          value={u.role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="analyst">Analyst</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-slate-500 text-xs flex items-center justify-end gap-1">
                          <IconLock className="h-3.5 w-3.5" />
                          Restricted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permission Capability Matrix Card */}
      <div className="p-4 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
        <h3 className="text-xs font-semibold text-white flex items-center gap-2">
          <IconShield className="h-4 w-4 text-emerald-400" />
          <span>Server Enforced Capability Matrix</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded border border-slate-800 bg-slate-950 space-y-1.5">
            <div className="font-semibold text-emerald-400">Admin Privileges</div>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Manage users & modify role assignments</li>
              <li>Read & export security audit logs</li>
              <li>Alter dataset schema metadata</li>
              <li>Access admin-only and restricted tables</li>
            </ul>
          </div>
          <div className="p-3 rounded border border-slate-800 bg-slate-950 space-y-1.5">
            <div className="font-semibold text-emerald-400">Analyst Privileges</div>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Execute parametric queries & full-text search</li>
              <li>Save, publish, and delete personal views</li>
              <li>Trigger background CSV streaming exports</li>
              <li>Add investigation comments to records</li>
            </ul>
          </div>
          <div className="p-3 rounded border border-slate-800 bg-slate-950 space-y-1.5">
            <div className="font-semibold text-emerald-400">Viewer Privileges</div>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Read-only search on public datasets</li>
              <li>Inspect dataset overview and schema types</li>
              <li>Sensitive financial columns auto-masked</li>
              <li>Exports and role modifications blocked</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
