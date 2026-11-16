import { useAppSelector, useAppDispatch } from '@/store';
import {
  setTableDensity,
  setTheme,
  toggleColumnVisibility,
  setVisibleColumns,
  setColumnWidth,
  toggleSidebar,
  setSidebarCollapsed,
  toggleHighlightMatches,
  toggleVirtualization,
  resetColumnPreferences,
} from '@/store/slices/uiPreferenceSlice';
import { useGetUsersQuery, useUpdateUserRoleMutation } from '@/store/services/dataScopeApi';

export function useUIPreferences() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((state) => state.uiPreference);

  return {
    ...ui,
    setTableDensity: (density: 'compact' | 'standard' | 'spacious') =>
      dispatch(setTableDensity(density)),
    setTheme: (theme: 'dark' | 'light') => dispatch(setTheme(theme)),
    toggleColumnVisibility: (col: string) => dispatch(toggleColumnVisibility(col)),
    setVisibleColumns: (cols: Record<string, boolean>) => dispatch(setVisibleColumns(cols)),
    setColumnWidth: (column: string, width: number) =>
      dispatch(setColumnWidth({ column, width })),
    toggleSidebar: () => dispatch(toggleSidebar()),
    setSidebarCollapsed: (c: boolean) => dispatch(setSidebarCollapsed(c)),
    toggleHighlightMatches: () => dispatch(toggleHighlightMatches()),
    toggleVirtualization: () => dispatch(toggleVirtualization()),
    resetColumnPreferences: () => dispatch(resetColumnPreferences()),
  };
}

export function useUserManagement() {
  const query = useGetUsersQuery();
  const [updateRole, updateStatus] = useUpdateUserRoleMutation();

  return {
    ...query,
    users: query.data?.users || [],
    updateRole: (userId: string, role: 'admin' | 'analyst' | 'viewer') =>
      updateRole({ userId, role }).unwrap(),
    isUpdating: updateStatus.isLoading,
  };
}

