import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { SearchHistoryEntry } from '@/types';
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

    const client = await getRawClient();

    const query = datasetId
      ? `SELECT sh.*, d.name as dataset_name
         FROM search_history sh
         JOIN datasets d ON sh.dataset_id = d.id
         WHERE sh.dataset_id = $1 AND (sh.user_id = $2 OR $3 = 'admin')
         ORDER BY sh.created_at DESC
         LIMIT 30;`
      : `SELECT sh.*, d.name as dataset_name
         FROM search_history sh
         JOIN datasets d ON sh.dataset_id = d.id
         WHERE sh.user_id = $1 OR $2 = 'admin'
         ORDER BY sh.created_at DESC
         LIMIT 30;`;

    const params = datasetId
      ? [datasetId, auth.user.id, auth.user.role]
      : [auth.user.id, auth.user.role];

    const res = await client.query(query, params);

    const entries: SearchHistoryEntry[] = res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      datasetId: r.dataset_id,
      datasetName: r.dataset_name,
      queryText: r.query_text,
      searchType: r.search_type,
      filterSummary: typeof r.filter_summary === 'string' ? JSON.parse(r.filter_summary) : r.filter_summary || [],
      resultCount: r.result_count,
      executionTimeMs: r.execution_time_ms,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    }));

    return NextResponse.json(entries);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve search history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await authorize(req, body.datasetId ? { datasetId: body.datasetId, action: 'read' } : {});
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();
    const id = `sh-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    await client.query(
      `INSERT INTO search_history (id, user_id, dataset_id, query_text, search_type, filter_summary, result_count, execution_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        auth.user.id,
        body.datasetId,
        body.queryText || '',
        body.searchType || 'hybrid',
        JSON.stringify(body.filterSummary || []),
        body.resultCount || 0,
        body.executionTimeMs || 0,
      ]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to log search history' }, { status: 500 });
  }
}
