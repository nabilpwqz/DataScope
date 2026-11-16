import type { User, UserRole } from '@/types';
import type { AuthState } from '@/store/slices/authSlice';

export type { User, UserRole, AuthState };
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
