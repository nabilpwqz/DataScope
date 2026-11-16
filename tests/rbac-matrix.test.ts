import { describe, it, expect } from 'vitest';
import { hasPermission, getRoleCapabilities } from '@/lib/auth/rbac-matrix';

describe('RBAC Permission Matrix', () => {
  it('enforces administrative superuser permissions', () => {
    expect(hasPermission('admin', 'manage_users')).toBe(true);
    expect(hasPermission('admin', 'manage_datasets')).toBe(true);
    expect(hasPermission('admin', 'export')).toBe(true);
  });

  it('restricts analyst to analytical exploration and export', () => {
    expect(hasPermission('analyst', 'read')).toBe(true);
    expect(hasPermission('analyst', 'export')).toBe(true);
    expect(hasPermission('analyst', 'save_views')).toBe(true);
    expect(hasPermission('analyst', 'manage_users')).toBe(false);
  });

  it('restricts viewer strictly to read actions', () => {
    expect(hasPermission('viewer', 'read')).toBe(true);
    expect(hasPermission('viewer', 'export')).toBe(false);
    expect(hasPermission('viewer', 'manage_datasets')).toBe(false);
  });
});
