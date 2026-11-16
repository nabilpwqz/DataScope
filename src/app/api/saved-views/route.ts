import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { SavedViewCreateSchema } from '@/lib/validation/schemas';
import { SavedView } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const datasetId = url.searchParams.get('datasetId');

    const auth = await authorize(req, datasetId ? { datasetId, action: 'read' } : {});
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { id: userId } = auth.user;
    const client = await getRawClient();

    let query: string;
    let params: any[];

    if (datasetId) {
      query = `
        SELECT * FROM saved_views
        WHERE dataset_id = $1 AND (user_id = $2 OR is_shared = true)
        ORDER BY created_at DESC;
      `;
      params = [datasetId, userId];
    } else {
      query = `
        SELECT * FROM saved_views
        WHERE user_id = $1 OR is_shared = true
        ORDER BY created_at DESC;
      `;
      params = [userId];
    }

    const res = await client.query(query, params);

    const views: SavedView[] = res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      datasetId: r.dataset_id,
      name: r.name,
      description: r.description,
      isShared: r.is_shared,
      authorName: r.author_name,
      searchQuery: r.search_query,
      searchType: r.search_type,
      filterConfig: typeof r.filter_config === 'string' ? JSON.parse(r.filter_config) : r.filter_config || [],
      filterLogicalOperator: r.filter_logical_operator || 'AND',
      sortConfig: typeof r.sort_config === 'string' ? JSON.parse(r.sort_config) : r.sort_config || [],
      visibleColumns: typeof r.visible_columns === 'string' ? JSON.parse(r.visible_columns) : r.visible_columns || [],
      pageSize: r.page_size || 25,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    }));

    return NextResponse.json(views);
  } catch (err: any) {
    console.error('Fetch saved views error:', err);
    return NextResponse.json({ error: 'Failed to fetch saved views' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = SavedViewCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid saved view payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Viewers cannot create saved views (requires Analyst or Admin)
    const auth = await authorize(req, { role: 'analyst', datasetId: body.datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: Viewers are not permitted to author saved views' },
        { status: auth.status || 403 }
      );
    }

    const client = await getRawClient();
    const id = `view-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    await client.query(
      `INSERT INTO saved_views (
        id, user_id, dataset_id, name, description, is_shared, author_name,
        search_query, search_type, filter_config, filter_logical_operator, sort_config, visible_columns, page_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        auth.user.id,
        body.datasetId,
        body.name,
        body.description || '',
        Boolean(body.isShared),
        auth.user.name,
        body.searchQuery || '',
        body.searchType || 'hybrid',
        JSON.stringify(body.filterConfig || []),
        body.filterLogicalOperator || 'AND',
        JSON.stringify(body.sortConfig || []),
        JSON.stringify(body.visibleColumns || []),
        body.pageSize || 25,
      ]
    );

    // Audit trail
    await client.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status)
       VALUES ($1, $2, $3, $4, 'SAVED_VIEW_CREATE', $5, $6, $7, $8, 'SUCCESS')`,
      [
        `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        `SavedView:${body.datasetId}`,
        id,
        JSON.stringify({ name: body.name, isShared: body.isShared }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
      ]
    ).catch(() => {});

    return NextResponse.json({ id, name: body.name, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Save view error:', err);
    return NextResponse.json({ error: 'Failed to create saved view' }, { status: 500 });
  }
}
