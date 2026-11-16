import { describe, it, expect } from 'vitest';
import { getRolePermissions, canAccessDataset } from '@/lib/auth/rbac';
import { signToken, verifyToken } from '@/lib/auth/jwt';
import { authorize } from '@/lib/auth/authorize';

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

  describe('Server-Side authorize() Helper & AccessPermissions Table Enforcement', () => {
    const viewerSession = {
      user: {
        id: 'usr-viewer-01',
        email: 'viewer@datascope.io',
        name: 'Viewer User',
        role: 'viewer' as const,
        department: 'Product Operations',
      },
    };

    const analystSession = {
      user: {
        id: 'usr-analyst-01',
        email: 'analyst@datascope.io',
        name: 'Analyst User',
        role: 'analyst' as const,
        department: 'Strategic Intelligence',
      },
    };

    const adminSession = {
      user: {
        id: 'usr-admin-01',
        email: 'admin@datascope.io',
        name: 'Admin User',
        role: 'admin' as const,
        department: 'Enterprise Architecture',
      },
    };

    it('rejects unauthenticated requests with 401', async () => {
      const res = await authorize(null);
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(401);
    });

    it('allows Viewer to access permitted public dataset (ds-sales-01)', async () => {
      const res = await authorize(viewerSession, { datasetId: 'ds-sales-01', action: 'read' });
      expect(res.authorized).toBe(true);
      expect(res.status).toBe(200);
    });

    it('PROVES: Viewer gets 403 on restricted dataset (ds-telemetry-02) even when datasetId is changed in request', async () => {
      // Simulating a Viewer attempting to access restricted telemetry dataset
      const res = await authorize(viewerSession, { datasetId: 'ds-telemetry-02', action: 'read' });
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
      expect(res.error).toContain('not been granted access');
    });

    it('PROVES: Viewer gets 403 on admin-only dataset (ds-finance-03) even when datasetId is changed in request', async () => {
      // Simulating a Viewer attempting to access financial ledger dataset
      const res = await authorize(viewerSession, { datasetId: 'ds-finance-03', action: 'read' });
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
      expect(res.error).toContain('not been granted access');
    });

    it('PROVES: Viewer gets 403 on export action even for permitted dataset', async () => {
      const res = await authorize(viewerSession, { datasetId: 'ds-sales-01', action: 'export' });
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
    });

    it('PROVES: Analyst gets 403 on admin-only dataset (ds-finance-03)', async () => {
      const res = await authorize(analystSession, { datasetId: 'ds-finance-03', action: 'read' });
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
    });

    it('allows Analyst to read and export permitted datasets', async () => {
      const readRes = await authorize(analystSession, { datasetId: 'ds-telemetry-02', action: 'read' });
      expect(readRes.authorized).toBe(true);
      expect(readRes.status).toBe(200);

      const expRes = await authorize(analystSession, { datasetId: 'ds-sales-01', action: 'export' });
      expect(expRes.authorized).toBe(true);
      expect(expRes.status).toBe(200);
    });

    it('allows Admin full access across all datasets and actions', async () => {
      const res = await authorize(adminSession, { datasetId: 'ds-finance-03', action: 'manage' });
      expect(res.authorized).toBe(true);
      expect(res.status).toBe(200);
    });
  });
});

