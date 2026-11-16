import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { signToken } from '@/lib/auth/jwt';
import { LoginSchema } from '@/lib/validation/schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email and password are required and must be valid format' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const client = await getRawClient();
    const res = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = res.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    });

    // Asynchronously log login event to audit_logs
    client.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, details, ip_address, status)
       VALUES ($1, $2, $3, $4, 'USER_LOGIN', 'auth', $5, $6, 'success')`,
      [
        `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        user.id,
        user.name,
        user.role,
        JSON.stringify({ email: user.email }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
      ]
    ).catch(() => {});

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

    response.cookies.set('datascope_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
