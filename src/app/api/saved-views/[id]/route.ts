import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewId = params.id;
    const auth = await authorize(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();

    const existing = await client.query('SELECT user_id, dataset_id FROM saved_views WHERE id = $1', [viewId]);
    if (!existing.rows[0]) {
      return NextResponse.json({ error: 'Saved view not found' }, { status: 404 });
    }

    if (auth.user.role !== 'admin' && existing.rows[0].user_id !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: you can only delete your own saved views' },
        { status: 403 }
      );
    }

    await client.query('DELETE FROM saved_views WHERE id = $1', [viewId]);

    return NextResponse.json({ success: true, id: viewId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete saved view' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewId = params.id;
    const auth = await authorize(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const client = await getRawClient();

    const existing = await client.query('SELECT * FROM saved_views WHERE id = $1', [viewId]);
    if (!existing.rows[0]) {
      return NextResponse.json({ error: 'Saved view not found' }, { status: 404 });
    }

    if (auth.user.role !== 'admin' && existing.rows[0].user_id !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden: you cannot edit another user view' }, { status: 403 });
    }

    const name = body.name !== undefined ? body.name : existing.rows[0].name;
    const description = body.description !== undefined ? body.description : existing.rows[0].description;
    const isShared = body.isShared !== undefined ? Boolean(body.isShared) : existing.rows[0].is_shared;

    const updated = await client.query(
      `UPDATE saved_views 
       SET name = $1, description = $2, is_shared = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *;`,
      [name, description, isShared, viewId]
    );

    const r = updated.rows[0];
    return NextResponse.json({
      id: r.id,
      name: r.name,
      description: r.description,
      datasetId: r.dataset_id,
      userId: r.user_id,
      isShared: r.is_shared,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update saved view' }, { status: 500 });
  }
}
