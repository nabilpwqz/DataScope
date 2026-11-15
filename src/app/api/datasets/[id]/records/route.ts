import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search/search-engine';
import { verifyToken } from '@/lib/auth/jwt';
import { canAccessDataset } from '@/lib/auth/rbac';
import { getRawClient } from '@/lib/db';
import { SearchQueryRequest, UserRole } from '@/types';

export const dynamic = 'force-dynamic';

const datasetAccessLevels = new Map<string, 'public' | 'restricted' | 'admin_only'>([
  ['ds-sales-01', 'public'],
  ['ds-telemetry-02', 'restricted'],
  ['ds-finance-03', 'admin_only'],
]);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;
    const body: SearchQueryRequest = await req.json();
    body.datasetId = datasetId;

    // Check permissions with in-memory access cache to avoid redundant cross-region round trips
    let accessLevel = datasetAccessLevels.get(datasetId);
    let client: any = null;

    if (!accessLevel) {
      client = await getRawClient();
      const dsRes = await client.query('SELECT access_level FROM datasets WHERE id = $1', [datasetId]);
      if (!dsRes.rows[0]) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
      }
      accessLevel = dsRes.rows[0].access_level as 'public' | 'restricted' | 'admin_only';
      datasetAccessLevels.set(datasetId, accessLevel);
    }

    let userRole: UserRole = 'viewer';
    let userId = 'usr-anonymous';

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('datascope_token')?.value;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : cookieToken;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userRole = payload.role;
        userId = payload.userId;
      }
    }

    if (!canAccessDataset(userRole, accessLevel!)) {
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
          const dbClient = client || (await getRawClient());
          await dbClient.query(
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

