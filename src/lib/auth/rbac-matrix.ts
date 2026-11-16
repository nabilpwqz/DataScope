/**
 * Granular Role-Based Access Control matrix evaluator.
 */

export type UserRole = 'admin' | 'analyst' | 'viewer';
export type AppAction = 'read' | 'write' | 'export' | 'manage_users' | 'manage_datasets' | 'save_views';

const ROLE_PERMISSIONS: Record<UserRole, AppAction[]> = {
  admin: ['read', 'write', 'export', 'manage_users', 'manage_datasets', 'save_views'],
  analyst: ['read', 'export', 'save_views'],
  viewer: ['read'],
};

export function hasPermission(role: UserRole | string, action: AppAction): boolean {
  const allowed = ROLE_PERMISSIONS[role as UserRole];
  if (!allowed) return false;
  return allowed.includes(action);
}

export function getRoleCapabilities(role: UserRole | string): string[] {
  return ROLE_PERMISSIONS[role as UserRole] || ['read'];
}
