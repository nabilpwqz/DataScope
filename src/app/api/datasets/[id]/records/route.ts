import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search/search-engine';
import { authorize } from '@/lib/auth/authorize';
import { SearchQuerySchema } from '@/lib/validation/schemas';
import { getRawClient } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;

    // 1. Authorize user and verify dataset access from access_permissions table
    const auth = await authorize(req, { datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: insufficient permissions for this dataset' },
        { status: auth.status || 403 }
      );
    }

    // 2. Strict Zod validation: caps pageSize at 100, filters at 10, search at 100 chars
    const rawBody = await req.json();
    const parsed = SearchQuerySchema.safeParse({ ...rawBody, datasetId });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed: Invalid query parameters',
          details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const queryRequest = parsed.data;

    // 3. Execute search via search engine
    const response = await SearchEngine.executeQuery(queryRequest as any);

    // 4. Asynchronously log query to search_history if filters or search are active
    if (queryRequest.search || (queryRequest.filters && queryRequest.filters.length > 0)) {
      (async () => {
        try {
          const filterSummary = (queryRequest.filters || []).map((f) => `${f.field} ${f.operator} ${f.value}`);
          const histId = `sh-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          const dbClient = await getRawClient();
          await dbClient.query(
            `INSERT INTO search_history (id, user_id, dataset_id, query_text, search_type, filter_summary, result_count, execution_time_ms)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              histId,
              auth.user!.id,
              datasetId,
              queryRequest.search || '(filters applied)',
              queryRequest.searchType || 'hybrid',
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
