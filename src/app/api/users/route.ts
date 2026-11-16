import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { UserSummary, UserRole } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, { role: 'analyst' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();

    const res = await client.query(`
      SELECT id, name, email, role, department, created_at, updated_at
      FROM users
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'analyst' THEN 2 
          ELSE 3 
        END ASC,
        name ASC;
    `);

    const users: UserSummary[] = res.rows.map((row: any) => {
      let permissionsCount = 4;
      if (row.role === 'admin') permissionsCount = 12;
      else if (row.role === 'analyst') permissionsCount = 8;

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role as UserRole,
        department: row.department,
        status: 'Active',
        lastActive: 'Active today',
        permissionsCount,
      };
    });

    return NextResponse.json({
      users,
      totalCount: users.length,
      viewerRole: auth.user.role,
    });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Failed to retrieve platform users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authorize(req, { role: 'admin', action: 'manage' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status || 403 });
    }

    const client = await getRawClient();
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !['admin', 'analyst', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid userId or role provided' }, { status: 400 });
    }

    const updateRes = await client.query(
      `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, role, department;
      `,
      [role, userId]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = updateRes.rows[0];

    // Audit log the permission alteration with real user
    const auditId = `aud-${crypto.randomBytes(4).toString('hex')}`;
    await client.query(
      `
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `,
      [
        auditId,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        'USER_ROLE_UPDATE',
        `User:${userId}`,
        userId,
        JSON.stringify({ updatedUser: updatedUser.name, newRole: role }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
        'SUCCESS',
      ]
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Update user role error:', err);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
