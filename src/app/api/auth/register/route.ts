import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid work email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().optional().default('Strategic Operations'),
  role: z.enum(['admin', 'analyst', 'viewer']).optional().default('analyst'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid registration payload' },
        { status: 400 }
      );
    }

    const { name, email, password, department, role } = parsed.data;
    const client = await getRawClient();

    // Check if email already registered
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows && existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `usr-reg-${crypto.randomBytes(4).toString('hex')}`;
    const avatarUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`;

    const insertRes = await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, department, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, department, avatar_url, created_at;`,
      [userId, name, email, passwordHash, role, department, avatarUrl]
    );

    const newUser = insertRes.rows[0];

    // Seed default preferences for the new user
    await client.query(
      `INSERT INTO user_preferences (id, user_id, table_density, theme, auto_refresh, refresh_interval_sec, default_page_size, notifications_enabled)
       VALUES ($1, $2, 'standard', 'dark', false, 30, 25, true)
       ON CONFLICT (user_id) DO NOTHING;`,
      [`pref-${Date.now()}`, userId]
    ).catch(() => { });

    // Log registration in immutable audit log
    await client.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, details, status)
       VALUES ($1, $2, $3, $4, 'USER_REGISTER', 'users', $5, 'success');`,
      [
        crypto.randomUUID(),
        userId,
        name,
        role,
        JSON.stringify({ email, department, role }),
      ]
    ).catch(() => { });

    // Generate real HS256 signed JWT
    const token = await signToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as UserRole,
      department: newUser.department,
    });

    const response = NextResponse.json(
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          avatarUrl: newUser.avatar_url,
          createdAt: newUser.created_at,
        },
        token,
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('datascope_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal registration failure. Please try again later.' },
      { status: 500 }
    );
  }
}

