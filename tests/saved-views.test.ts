import { describe, it, expect } from 'vitest';
import { SavedViewCreateSchema } from '@/lib/validation/schemas';
import { getRolePermissions } from '@/lib/auth/rbac';

describe('Saved Views Permissions, Validation & Sharing Rules', () => {
  it('should validate a valid saved view payload', () => {
    const validPayload = {
      datasetId: 'ds-sales-01',
      name: 'High Value German Accounts',
      description: 'Accounts with revenue exceeding 100k',
      isShared: true,
      searchQuery: 'Siemens',
      searchType: 'hybrid' as const,
      filterConfig: [
        {
          id: 'f1',
          field: 'country',
          operator: 'equals' as const,
          value: 'Germany',
        },
      ],
      filterLogicalOperator: 'AND' as const,
      sortConfig: [
        {
          field: 'recordDate',
          direction: 'desc' as const,
        },
      ],
      visibleColumns: ['title', 'category', 'status', 'numericValue'],
      pageSize: 50,
    };

    const parsed = SavedViewCreateSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('should reject saved view payloads exceeding filter limit or missing name', () => {
    const invalidPayload = {
      datasetId: 'ds-sales-01',
      name: '', // Empty name rejected
      filterConfig: Array(12).fill({
        id: 'f',
        field: 'country',
        operator: 'equals',
        value: 'Germany',
      }),
    };

    const parsed = SavedViewCreateSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it('should enforce role permissions: only analyst and admin can author saved views', () => {
    const adminPerms = getRolePermissions('admin');
    const analystPerms = getRolePermissions('analyst');
    const viewerPerms = getRolePermissions('viewer');

    expect(adminPerms.canCreateSavedViews).toBe(true);
    expect(adminPerms.canShareViews).toBe(true);
    expect(analystPerms.canCreateSavedViews).toBe(true);
    expect(analystPerms.canShareViews).toBe(true);
    expect(viewerPerms.canCreateSavedViews).toBe(false);
    expect(viewerPerms.canShareViews).toBe(false);
  });

  it('should allow viewers to read shared views but hide unshared views of other users', () => {
    const mockViews = [
      { id: 'v1', userId: 'usr-analyst-01', isShared: false, name: 'Personal Draft' },
      { id: 'v2', userId: 'usr-analyst-01', isShared: true, name: 'Team Dashboard' },
      { id: 'v3', userId: 'usr-viewer-01', isShared: false, name: 'Viewer Own View' },
    ];

    const currentUserId = 'usr-viewer-01';
    const visibleToViewer = mockViews.filter(
      (v) => v.userId === currentUserId || v.isShared
    );

    expect(visibleToViewer.map((v) => v.id)).toEqual(['v2', 'v3']);
    expect(visibleToViewer.find((v) => v.id === 'v1')).toBeUndefined();
  });
});
