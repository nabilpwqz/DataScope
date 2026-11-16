import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '@/types';
import { getRolePermissions, PermissionCheck } from '@/lib/auth/rbac';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  permissions: PermissionCheck;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  activeRole: 'viewer',
  permissions: getRolePermissions('viewer'),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token?: string | null }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.isAuthenticated = true;
      state.activeRole = action.payload.user.role;
      state.permissions = getRolePermissions(action.payload.user.role);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.activeRole = 'viewer';
      state.permissions = getRolePermissions('viewer');
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
