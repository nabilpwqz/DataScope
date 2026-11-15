import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role || !['admin', 'analyst', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Valid role (admin, analyst, viewer) is required' }, { status: 400 });
    }

    const client = await getRawClient();
    const res = await client.query('SELECT * FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1', [role]);
    let user = res.rows[0];

    if (!user) {
      // Fallback default users if table is being initialized
      const defaults: Record<UserRole, any> = {
        admin: {
          id: 'usr-admin-01',
          name: 'Elena Rostova',
          email: 'admin@datascope.io',
          role: 'admin',
          department: 'Enterprise Architecture',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          created_at: new Date().toISOString(),
        },
        analyst: {
          id: 'usr-analyst-01',
          name: 'Marcus Vance',
          email: 'analyst@datascope.io',
          role: 'analyst',
          department: 'Strategic Intelligence',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          created_at: new Date().toISOString(),
        },
        viewer: {
          id: 'usr-viewer-01',
          name: 'Sarah Lin',
          email: 'viewer@datascope.io',
          role: 'viewer',
          department: 'Product Operations',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          created_at: new Date().toISOString(),
        },
      };
      user = defaults[role as UserRole];
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      department: user.department,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
      token,
    });

    // Set HTTP-only session cookie as well
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Role switch error:', error);
    return NextResponse.json({ error: 'Failed to switch role' }, { status: 500 });
  }
}

