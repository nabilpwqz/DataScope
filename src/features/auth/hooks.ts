import { useAppSelector } from '@/store';

export function useAuth() {
  const authState = useAppSelector((state) => state.auth);
  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    role: authState.activeRole,
    permissions: authState.permissions,
  };
}
