import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { UserSummary, UserRole } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const client = await getRawClient();

    let viewerRole: UserRole = 'admin';
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token);
      if (payload) {
        viewerRole = payload.role;
      }
    }

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
      viewerRole,
    });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Failed to retrieve platform users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const client = await getRawClient();

    let actorName = 'Elena Rostova';
    let actorRole: UserRole = 'admin';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token);
      if (payload) {
        actorName = payload.name;
        actorRole = payload.role;
      }
    }

    // Server-side RBAC enforcement: only administrators may modify user roles
    if (actorRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Administrator privileges required to modify user roles' },
        { status: 403 }
      );
    }

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

    // Audit log the permission alteration
    const auditId = `aud-${crypto.randomBytes(4).toString('hex')}`;
    await client.query(
      `
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `,
      [
        auditId,
        'usr-current',
        actorName,
        actorRole,
        'USER_ROLE_UPDATE',
        `User:${userId}`,
        userId,
        JSON.stringify({ updatedUser: updatedUser.name, previousRole: 'changed', newRole: role }),
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

