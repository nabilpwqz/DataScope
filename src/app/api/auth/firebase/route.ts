import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid, email, displayName, photoURL } = await req.json();

    if (!email || !uid) {
      return NextResponse.json(
        { error: 'Firebase authentication requires valid uid and email' },
        { status: 400 }
      );
    }

    const client = await getRawClient();

    // Check if user already exists in PostgreSQL
    const existingRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = existingRes.rows[0];

    if (!user) {
      // Create new persistent user account for Firebase authenticated user
      const newUserId = `usr-fb-${crypto.randomBytes(4).toString('hex')}`;
      const name = displayName || email.split('@')[0];
      const role: UserRole = 'analyst';
      const department = 'Intelligence Operations';
      const avatarUrl = photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

      const insertRes = await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, department, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *;`,
        [newUserId, name, email, `FIREBASE_AUTH_${uid}`, role, department, avatarUrl]
      );
      user = insertRes.rows[0];

      // Add default preferences
      await client.query(
        `INSERT INTO user_preferences (id, user_id, table_density, theme, auto_refresh, refresh_interval_sec, default_page_size, notifications_enabled)
         VALUES ($1, $2, 'standard', 'dark', false, 30, 25, true)
         ON CONFLICT (user_id) DO NOTHING;`,
        [`pref-${Date.now()}`, newUserId]
      );

      // Audit log entry
      await client.query(
        `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, details, status)
         VALUES ($1, $2, $3, $4, 'USER_REGISTER_FIREBASE', 'auth', $5, 'success');`,
        [
          crypto.randomUUID(),
          newUserId,
          name,
          role,
          JSON.stringify({ method: 'firebase', email, provider: 'firebase' }),
        ]
      ).catch(() => {});
    }

    // Sign DataScope JWT token
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
      authProvider: 'firebase',
    });

    // Set HTTP-only session cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Firebase server auth error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Firebase authentication session' },
      { status: 500 }
    );
  }
}

