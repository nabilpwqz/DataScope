import { describe, it, expect } from 'vitest';
import { getRolePermissions, canAccessDataset } from '@/lib/auth/rbac';
import { signToken, verifyToken } from '@/lib/auth/jwt';

describe('Authentication & Role-Based Access Control (RBAC)', () => {
  it('should enforce proper permissions for Administrator', () => {
    const adminPerms = getRolePermissions('admin');
    expect(adminPerms.canManageUsers).toBe(true);
    expect(adminPerms.canManageDatasets).toBe(true);
    expect(adminPerms.canExportData).toBe(true);
    expect(adminPerms.canAccessAdminOnlyDatasets).toBe(true);
  });

  it('should enforce proper permissions for Data Analyst', () => {
    const analystPerms = getRolePermissions('analyst');
    expect(analystPerms.canManageUsers).toBe(false);
    expect(analystPerms.canManageDatasets).toBe(false);
    expect(analystPerms.canExportData).toBe(true);
    expect(analystPerms.canCreateSavedViews).toBe(true);
    expect(analystPerms.canAccessRestrictedDatasets).toBe(true);
    expect(analystPerms.canAccessAdminOnlyDatasets).toBe(false);
  });

  it('should restrict Viewer from export and dataset creation', () => {
    const viewerPerms = getRolePermissions('viewer');
    expect(viewerPerms.canManageUsers).toBe(false);
    expect(viewerPerms.canManageDatasets).toBe(false);
    expect(viewerPerms.canExportData).toBe(false);
    expect(viewerPerms.canModifyRecords).toBe(false);
    expect(viewerPerms.canAccessRestrictedDatasets).toBe(false);
    expect(viewerPerms.canAccessAdminOnlyDatasets).toBe(false);
  });

  it('should validate dataset level access based on role', () => {
    expect(canAccessDataset('viewer', 'public')).toBe(true);
    expect(canAccessDataset('viewer', 'restricted')).toBe(false);
    expect(canAccessDataset('viewer', 'admin_only')).toBe(false);

    expect(canAccessDataset('analyst', 'public')).toBe(true);
    expect(canAccessDataset('analyst', 'restricted')).toBe(true);
    expect(canAccessDataset('analyst', 'admin_only')).toBe(false);

    expect(canAccessDataset('admin', 'public')).toBe(true);
    expect(canAccessDataset('admin', 'restricted')).toBe(true);
    expect(canAccessDataset('admin', 'admin_only')).toBe(true);
  });

  it('should sign and verify JWT tokens accurately', async () => {
    const token = await signToken({
      id: 'usr-test-1',
      email: 'test@datascope.io',
      name: 'Test Analyst',
      role: 'analyst',
      department: 'Intelligence',
    });

    expect(typeof token).toBe('string');
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.email).toBe('test@datascope.io');
    expect(payload?.role).toBe('analyst');
  });
});

