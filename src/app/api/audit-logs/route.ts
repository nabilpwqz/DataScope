import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { AuditLog } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, { role: 'analyst' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const actionParam = searchParams.get('action');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');

    const limit = Math.min(Math.max(parseInt(limitParam || '100', 10), 10), 500);

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (actionParam && actionParam !== 'ALL') {
      conditions.push(`action = $${idx++}`);
      values.push(actionParam);
    }

    if (statusParam && statusParam !== 'ALL') {
      conditions.push(`status = $${idx++}`);
      values.push(statusParam);
    }

    if (searchParam && searchParam.trim()) {
      conditions.push(`(user_name ILIKE $${idx} OR resource ILIKE $${idx} OR action ILIKE $${idx})`);
      values.push(`%${searchParam.trim()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx};
    `;
    values.push(limit);

    const res = await client.query(query, values);

    const logs: AuditLog[] = res.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userRole: row.user_role,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details || {},
      ipAddress: row.ip_address,
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }));

    return NextResponse.json({
      logs,
      totalCount: logs.length,
      viewerRole: auth.user.role,
    });
  } catch (err: any) {
    console.error('Fetch audit logs error:', err);
    return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();
    const body = await req.json();
    const { action, resource, resourceId, details, status = 'SUCCESS' } = body;

    if (!action || !resource) {
      return NextResponse.json({ error: 'action and resource are required fields' }, { status: 400 });
    }

    const logId = `aud-${crypto.randomBytes(4).toString('hex')}`;
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    await client.query(
      `
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `,
      [
        logId,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        action,
        resource,
        resourceId || null,
        JSON.stringify(details || {}),
        ipAddress,
        status,
      ]
    );

    return NextResponse.json({ success: true, logId }, { status: 201 });
  } catch (err: any) {
    console.error('Create audit log error:', err);
    return NextResponse.json({ error: 'Failed to record audit event' }, { status: 500 });
  }
}
