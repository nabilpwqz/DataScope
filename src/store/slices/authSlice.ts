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

const defaultAdminUser: User = {
  id: 'usr-admin-01',
  name: 'Elena Rostova',
  email: 'admin@datascope.io',
  role: 'admin',
  department: 'Enterprise Architecture',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  createdAt: '2024-01-01T00:00:00Z',
};

const defaultAnalystUser: User = {
  id: 'usr-analyst-01',
  name: 'Marcus Vance',
  email: 'analyst@datascope.io',
  role: 'analyst',
  department: 'Strategic Intelligence',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  createdAt: '2024-01-01T00:00:00Z',
};

const defaultViewerUser: User = {
  id: 'usr-viewer-01',
  name: 'Sarah Lin',
  email: 'viewer@datascope.io',
  role: 'viewer',
  department: 'Product Operations',
  avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  createdAt: '2024-01-01T00:00:00Z',
};

const initialRole: UserRole = 'admin';

const initialState: AuthState = {
  user: defaultAdminUser,
  token: 'mock-jwt-admin-token',
  isAuthenticated: true,
  activeRole: initialRole,
  permissions: getRolePermissions(initialRole),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.activeRole = action.payload.user.role;
      state.permissions = getRolePermissions(action.payload.user.role);
    },
    switchRole: (state, action: PayloadAction<UserRole>) => {
      state.activeRole = action.payload;
      state.permissions = getRolePermissions(action.payload);
      if (action.payload === 'admin') {
        state.user = defaultAdminUser;
        state.token = 'mock-jwt-admin-token';
      } else if (action.payload === 'analyst') {
        state.user = defaultAnalystUser;
        state.token = 'mock-jwt-analyst-token';
      } else {
        state.user = defaultViewerUser;
        state.token = 'mock-jwt-viewer-token';
      }
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

export const { setUser, switchRole, logout } = authSlice.actions;
export default authSlice.reducer;
