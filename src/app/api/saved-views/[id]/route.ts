import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewId = params.id;
    const client = await getRawClient();

    let userId = 'usr-admin-01';
    let userRole = 'admin';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        userId = payload.userId;
        userRole = payload.role;
      }
    }

    if (userRole === 'admin') {
      await client.query('DELETE FROM saved_views WHERE id = $1', [viewId]);
    } else {
      await client.query('DELETE FROM saved_views WHERE id = $1 AND user_id = $2', [viewId, userId]);
    }

    return NextResponse.json({ success: true, id: viewId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete saved view' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewId = params.id;
    const body = await req.json();
    const client = await getRawClient();

    let userId = 'usr-admin-01';
    let userRole = 'admin';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        userId = payload.userId;
        userRole = payload.role;
      }
    }

    const existing = await client.query('SELECT * FROM saved_views WHERE id = $1', [viewId]);
    if (!existing.rows[0]) {
      return NextResponse.json({ error: 'Saved view not found' }, { status: 404 });
    }

    if (userRole !== 'admin' && existing.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: you cannot edit another user view' }, { status: 403 });
    }

    const name = body.name !== undefined ? body.name : existing.rows[0].name;
    const description = body.description !== undefined ? body.description : existing.rows[0].description;
    const isShared = body.isShared !== undefined ? body.isShared : existing.rows[0].is_shared;
    const queryConfig = body.queryConfig !== undefined ? JSON.stringify(body.queryConfig) : existing.rows[0].query_config;

    const updated = await client.query(
      `UPDATE saved_views 
       SET name = $1, description = $2, is_shared = $3, query_config = $4
       WHERE id = $5
       RETURNING *;`,
      [name, description, isShared, queryConfig, viewId]
    );

    const r = updated.rows[0];
    return NextResponse.json({
      id: r.id,
      name: r.name,
      description: r.description,
      datasetId: r.dataset_id,
      userId: r.user_id,
      isShared: r.is_shared,
      queryConfig: typeof r.query_config === 'string' ? JSON.parse(r.query_config) : r.query_config,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update saved view' }, { status: 500 });
  }
}
