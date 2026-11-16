import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { ExportRequestSchema } from '@/lib/validation/schemas';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id;

    // Verify dataset access and export permissions
    const auth = await authorize(req, { datasetId, action: 'export' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: viewers are not permitted to export dataset records' },
        { status: auth.status || 403 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsed = ExportRequestSchema.safeParse({ ...rawBody, datasetId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid export request payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const client = await getRawClient();
    const limit = parsed.data.limit || 10000;
    const isAsync = limit > 50000;
    const status = isAsync ? 'queued' : 'completed';

    // Create export job record
    const exportId = `exp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const downloadUrl = `/api/datasets/${datasetId}/export?exportId=${exportId}&limit=${limit}`;

    await client.query(
      `INSERT INTO export_jobs (id, user_id, dataset_id, format, status, filter_criteria, total_rows, file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        exportId,
        auth.user.id,
        datasetId,
        parsed.data.format || 'csv',
        status,
        JSON.stringify(parsed.data.filters || []),
        limit,
        isAsync ? null : downloadUrl,
      ]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status)
       VALUES ($1, $2, $3, $4, 'DATA_EXPORT', $5, $6, $7, $8, 'SUCCESS')`,
      [
        `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        `Dataset:${datasetId}`,
        exportId,
        JSON.stringify({ format: parsed.data.format, rows: limit, isAsync }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
      ]
    ).catch(() => {});

    if (isAsync) {
      return NextResponse.json({
        exportId,
        status: 'queued',
        totalRows: limit,
        mode: 'async',
        message: 'Large export (>50,000 rows) queued in background. Progress tracked under export_jobs.',
      });
    }

    return NextResponse.json({
      exportId,
      status: 'completed',
      downloadUrl,
      totalRows: limit,
      mode: 'stream',
      message: 'Export file prepared successfully for chunked cursor streaming.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to initiate export' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id;
    const auth = await authorize(req, { datasetId, action: 'export' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: viewers are not permitted to export data' },
        { status: auth.status || 403 }
      );
    }

    const client = await getRawClient();
    const url = new URL(req.url);
    const parsedLimit = parseInt(url.searchParams.get('limit') || '10000', 10);
    const limit = Math.max(1, Math.min(50000, isNaN(parsedLimit) ? 10000 : parsedLimit));

    const encoder = new TextEncoder();

    // Stream CSV data in keyset-paginated chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const header = 'Record Key,Title,Category,Status,Revenue/Amount,Country,Region,Date\n';
          controller.enqueue(encoder.encode(header));

          const batchSize = 2500;
          let fetched = 0;
          let lastDate: string | null = null;
          let lastId: string | null = null;

          while (fetched < limit) {
            const currentLimit = Math.min(batchSize, limit - fetched);
            let queryText = '';
            let paramsArr: any[] = [];

            if (!lastDate || !lastId) {
              queryText = `
                SELECT id, record_key, title, category, status, numeric_value, country, region, record_date
                FROM dataset_records
                WHERE dataset_id = $1
                ORDER BY record_date DESC, id DESC
                LIMIT $2
              `;
              paramsArr = [datasetId, currentLimit];
            } else {
              queryText = `
                SELECT id, record_key, title, category, status, numeric_value, country, region, record_date
                FROM dataset_records
                WHERE dataset_id = $1
                  AND (record_date, id) < ($2, $3)
                ORDER BY record_date DESC, id DESC
                LIMIT $4
              `;
              paramsArr = [datasetId, lastDate, lastId, currentLimit];
            }

            const res = await client.query(queryText, paramsArr);
            const rows = res.rows || [];

            if (rows.length === 0) {
              break;
            }

            let chunkStr = '';
            for (const r of rows) {
              const escapedTitle = `"${(r.title || '').replace(/"/g, '""')}"`;
              const formattedDate =
                r.record_date instanceof Date
                  ? r.record_date.toISOString().split('T')[0]
                  : String(r.record_date || '');
              chunkStr += `${r.record_key},${escapedTitle},${r.category},${r.status},${r.numeric_value},${r.country},${r.region},${formattedDate}\n`;
            }

            controller.enqueue(encoder.encode(chunkStr));
            fetched += rows.length;

            const lastRow = rows[rows.length - 1];
            lastDate =
              lastRow.record_date instanceof Date
                ? lastRow.record_date.toISOString()
                : String(lastRow.record_date);
            lastId = lastRow.id;

            if (rows.length < currentLimit) {
              break;
            }
          }

          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="datascope-export-${datasetId}-${Date.now()}.csv"`,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to stream export CSV' }, { status: 500 });
  }
}
