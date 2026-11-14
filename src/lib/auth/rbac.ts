import { UserRole } from '@/types';

export interface PermissionCheck {
  canManageUsers: boolean;
  canManageDatasets: boolean;
  canExportData: boolean;
  canCreateSavedViews: boolean;
  canShareViews: boolean;
  canViewSystemAnalytics: boolean;
  canModifyRecords: boolean;
  canAccessRestrictedDatasets: boolean;
  canAccessAdminOnlyDatasets: boolean;
}

export function getRolePermissions(role: UserRole): PermissionCheck {
  switch (role) {
    case 'admin':
      return {
        canManageUsers: true,
        canManageDatasets: true,
        canExportData: true,
        canCreateSavedViews: true,
        canShareViews: true,
        canViewSystemAnalytics: true,
        canModifyRecords: true,
        canAccessRestrictedDatasets: true,
        canAccessAdminOnlyDatasets: true,
      };
    case 'analyst':
      return {
        canManageUsers: false,
        canManageDatasets: false,
        canExportData: true,
        canCreateSavedViews: true,
        canShareViews: true,
        canViewSystemAnalytics: true,
        canModifyRecords: false,
        canAccessRestrictedDatasets: true,
        canAccessAdminOnlyDatasets: false,
      };
    case 'viewer':
    default:
      return {
        canManageUsers: false,
        canManageDatasets: false,
        canExportData: false,
        canCreateSavedViews: false,
        canShareViews: false,
        canViewSystemAnalytics: false,
        canModifyRecords: false,
        canAccessRestrictedDatasets: false,
        canAccessAdminOnlyDatasets: false,
      };
  }
}

export function canAccessDataset(userRole: UserRole, accessLevel: 'public' | 'restricted' | 'admin_only'): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'analyst') return accessLevel === 'public' || accessLevel === 'restricted';
  // viewer
  return accessLevel === 'public';
}

