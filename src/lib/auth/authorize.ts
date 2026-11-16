import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { verifyToken, TokenPayload } from '@/lib/auth/jwt';
import { getRawClient } from '@/lib/db';
import { UserRole } from '@/types';

export interface AuthorizeOptions {
  role?: UserRole;
  datasetId?: string;
  action?: 'read' | 'write' | 'export' | 'manage';
}

export interface AuthorizeResult {
  authorized: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    department?: string;
  };
  error?: string;
  status: number;
}

export async function authorize(
  sessionOrReq: NextRequest | any,
  options: AuthorizeOptions = {}
): Promise<AuthorizeResult> {
  let user: AuthorizeResult['user'] | null = null;

  // Case 1: NextRequest passed
  if (sessionOrReq && typeof sessionOrReq.headers?.get === 'function') {
    const req = sessionOrReq as NextRequest;

    // First attempt NextAuth session via getServerSession
    try {
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user) {
        user = {
          id: (nextAuthSession.user as any).id || (nextAuthSession.user as any).userId,
          email: nextAuthSession.user.email || '',
          name: nextAuthSession.user.name || '',
          role: ((nextAuthSession.user as any).role as UserRole) || 'viewer',
          department: (nextAuthSession.user as any).department,
        };
      }
    } catch (_) {}

    // Fallback: check Bearer header or cookie token
    if (!user) {
      const authHeader = req.headers.get('authorization');
      const cookieToken = req.cookies.get('datascope_token')?.value || req.cookies.get('next-auth.session-token')?.value;
      const rawToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;

      if (rawToken) {
        const payload = await verifyToken(rawToken);
        if (payload) {
          user = {
            id: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            department: payload.department,
          };
        }
      }
    }
  } else if (sessionOrReq && sessionOrReq.user) {
    // Case 2: NextAuth Session object
    user = {
      id: sessionOrReq.user.id || sessionOrReq.user.userId,
      email: sessionOrReq.user.email,
      name: sessionOrReq.user.name,
      role: sessionOrReq.user.role || 'viewer',
      department: sessionOrReq.user.department,
    };
  } else if (sessionOrReq && sessionOrReq.userId && sessionOrReq.role) {
    // Case 3: TokenPayload object
    user = {
      id: sessionOrReq.userId,
      email: sessionOrReq.email,
      name: sessionOrReq.name,
      role: sessionOrReq.role,
      department: sessionOrReq.department,
    };
  }

  // If no authenticated identity found
  if (!user || !user.id) {
    return {
      authorized: false,
      error: 'Unauthorized: valid authentication session or token is required',
      status: 401,
    };
  }

  const userRole = user.role;

  // 1. Role-level enforcement
  if (options.role) {
    if (options.role === 'admin' && userRole !== 'admin') {
      return {
        authorized: false,
        user,
        error: 'Forbidden: administrator privileges required',
        status: 403,
      };
    }

    if (options.role === 'analyst' && userRole === 'viewer') {
      return {
        authorized: false,
        user,
        error: 'Forbidden: analyst or administrator role required',
        status: 403,
      };
    }
  }

  // 2. Action-level checks
  const action = options.action || 'read';
  if (action === 'manage' && userRole !== 'admin') {
    return {
      authorized: false,
      user,
      error: 'Forbidden: administrative management permission required',
      status: 403,
    };
  }

  if (action === 'export' && userRole === 'viewer') {
    return {
      authorized: false,
      user,
      error: 'Forbidden: viewers are not permitted to export data',
      status: 403,
    };
  }

  if (action === 'write' && userRole === 'viewer') {
    return {
      authorized: false,
      user,
      error: 'Forbidden: viewers have read-only access',
      status: 403,
    };
  }

  // 3. Dataset-level access permissions check via database table
  if (options.datasetId) {
    // Admin has universal dataset access
    if (userRole === 'admin') {
      return {
        authorized: true,
        user,
        status: 200,
      };
    }

    const client = await getRawClient();
    const permRes = await client.query(
      `SELECT can_read, can_write, can_export, can_manage
       FROM access_permissions
       WHERE dataset_id = $1
         AND (user_id = $2 OR role = $3)
       ORDER BY can_manage DESC, can_write DESC, can_export DESC, can_read DESC
       LIMIT 1;`,
      [options.datasetId, user.id, userRole]
    );

    const permission = permRes.rows[0];

    if (!permission) {
      return {
        authorized: false,
        user,
        error: `Forbidden: role '${userRole}' has not been granted access to dataset '${options.datasetId}'`,
        status: 403,
      };
    }

    if (action === 'manage' && !permission.can_manage) {
      return {
        authorized: false,
        user,
        error: `Forbidden: manage permission denied for dataset '${options.datasetId}'`,
        status: 403,
      };
    }

    if (action === 'write' && !permission.can_write) {
      return {
        authorized: false,
        user,
        error: `Forbidden: write permission denied for dataset '${options.datasetId}'`,
        status: 403,
      };
    }

    if (action === 'export' && !permission.can_export) {
      return {
        authorized: false,
        user,
        error: `Forbidden: export permission denied for dataset '${options.datasetId}'`,
        status: 403,
      };
    }

    if (action === 'read' && !permission.can_read) {
      return {
        authorized: false,
        user,
        error: `Forbidden: read access denied for dataset '${options.datasetId}'`,
        status: 403,
      };
    }
  }

  return {
    authorized: true,
    user,
    status: 200,
  };
}
