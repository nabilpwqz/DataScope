import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search/search-engine';
import { verifyToken } from '@/lib/auth/jwt';
import { canAccessDataset } from '@/lib/auth/rbac';
import { getRawClient } from '@/lib/db';
import { SearchQueryRequest, UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;
    const body: SearchQueryRequest = await req.json();
    body.datasetId = datasetId;

    // Check permissions
    const client = await getRawClient();
    const dsRes = await client.query('SELECT access_level FROM datasets WHERE id = $1', [datasetId]);
    if (!dsRes.rows[0]) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    let userRole: UserRole = 'admin';
    let userId = 'usr-admin-01';
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        userRole = payload.role;
        userId = payload.userId;
      }
    }

    if (!canAccessDataset(userRole, dsRes.rows[0].access_level)) {
      return NextResponse.json(
        { error: 'Unauthorized: insufficient permissions for this dataset' },
        { status: 403 }
      );
    }

    const response = await SearchEngine.executeQuery(body);

    // If query has search text or filters, log to search_history asynchronously
    if (body.search || (body.filters && body.filters.length > 0)) {
      (async () => {
        try {
          const filterSummary = (body.filters || []).map((f) => `${f.field} ${f.operator} ${f.value}`);
          const histId = `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          await client.query(
            `INSERT INTO search_history (id, user_id, dataset_id, query_text, search_type, filter_summary, result_count, execution_time_ms)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              histId,
              userId,
              datasetId,
              body.search || '(filters applied)',
              body.searchType || 'hybrid',
              JSON.stringify(filterSummary),
              response.totalRecords,
              response.executionTimeMs,
            ]
          );
        } catch (_) {}
      })();
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Record search error:', err);
    return NextResponse.json(
      { error: 'Search query execution failed', details: err.message },
      { status: 500 }
    );
  }
}

