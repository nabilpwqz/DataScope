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

export const SIGNED_USER_TOKENS: Record<UserRole, string> = {
  admin: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c3ItYWRtaW4tMDEiLCJlbWFpbCI6ImFkbWluQGRhdGFzY29wZS5pbyIsIm5hbWUiOiJFbGVuYSBSb3N0b3ZhIiwicm9sZSI6ImFkbWluIiwiZGVwYXJ0bWVudCI6IkVudGVycHJpc2UgQXJjaGl0ZWN0dXJlIiwiaWF0IjoxNzk0NzgxOTg0LCJleHAiOjE3OTUzODY3ODR9.mlzQUeivagxX9PQweRUIAs9V3JP9HKZXC2_CYHalC7o',
  analyst: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c3ItYW5hbHlzdC0wMSIsImVtYWlsIjoiYW5hbHlzdEBkYXRhc2NvcGUuaW8iLCJuYW1lIjoiTWFyY3VzIFZhbmNlIiwicm9sZSI6ImFuYWx5c3QiLCJkZXBhcnRtZW50IjoiU3RyYXRlZ2ljIEludGVsbGlnZW5jZSIsImlhdCI6MTc5NDc4MTk4NCwiZXhwIjoxNzk1Mzg2Nzg0fQ.MZYWYMopi39tEtJIflrg5IoywXkFfeSDq5YmmkdpsRs',
  viewer: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c3Itdmlld2VyLTAxIiwiZW1haWwiOiJ2aWV3ZXJAZGF0YXNjb3BlLmlvIiwibmFtZSI6IlNhcmFoIExpbiIsInJvbGUiOiJ2aWV3ZXIiLCJkZXBhcnRtZW50IjoiUHJvZHVjdCBPcGVyYXRpb25zIiwiaWF0IjoxNzk0NzgxOTg0LCJleHAiOjE3OTUzODY3ODR9.o_O0wcQee3VjCocSOtpkWmEeOhk0uWueVPM6Kth7iAM',
};

const initialState: AuthState = {
  user: defaultAdminUser,
  token: SIGNED_USER_TOKENS.admin,
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
        state.token = SIGNED_USER_TOKENS.admin;
      } else if (action.payload === 'analyst') {
        state.user = defaultAnalystUser;
        state.token = SIGNED_USER_TOKENS.analyst;
      } else {
        state.user = defaultViewerUser;
        state.token = SIGNED_USER_TOKENS.viewer;
      }
      // Also sync session cookie in browser environment
      if (typeof window !== 'undefined') {
        fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: action.payload }),
        }).catch(() => {});
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

