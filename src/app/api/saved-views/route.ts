import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { SavedView, UserRole } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const datasetId = url.searchParams.get('datasetId');
    const client = await getRawClient();

    let userId = 'usr-admin-01';
    let userRole: UserRole = 'admin';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        userId = payload.userId;
        userRole = payload.role;
      }
    }

    let query: string;
    let params: any[];

    if (datasetId) {
      // Views that are either created by this user OR shared with the team
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
    const body = await req.json();
    const client = await getRawClient();

    let userId = 'usr-analyst-01';
    let authorName = 'Marcus Vance';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        userId = payload.userId;
        authorName = payload.name;
      }
    }

    const id = `view-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await client.query(
      `INSERT INTO saved_views (
        id, user_id, dataset_id, name, description, is_shared, author_name,
        search_query, search_type, filter_config, filter_logical_operator, sort_config, visible_columns, page_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        userId,
        body.datasetId,
        body.name,
        body.description || '',
        Boolean(body.isShared),
        authorName,
        body.searchQuery || '',
        body.searchType || 'hybrid',
        JSON.stringify(body.filterConfig || []),
        body.filterLogicalOperator || 'AND',
        JSON.stringify(body.sortConfig || []),
        JSON.stringify(body.visibleColumns || []),
        body.pageSize || 25,
      ]
    );

    return NextResponse.json({ id, name: body.name, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Save view error:', err);
    return NextResponse.json({ error: 'Failed to create saved view' }, { status: 500 });
  }
}

