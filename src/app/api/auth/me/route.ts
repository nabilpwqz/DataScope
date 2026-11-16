import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/auth/authorize';
import { getRawClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();
    const res = await client.query(
      'SELECT id, name, email, role, department, avatar_url, created_at FROM users WHERE id = $1',
      [auth.user.id]
    );
    const user = res.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found in system' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
