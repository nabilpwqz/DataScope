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

    // Create an export job record
    const exportId = `exp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO export_jobs (id, user_id, dataset_id, format, status, filter_criteria, total_rows)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        exportId,
        auth.user.id,
        datasetId,
        parsed.data.format || 'csv',
        'completed',
        JSON.stringify(parsed.data.filters || []),
        1000,
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
        JSON.stringify({ format: parsed.data.format, rows: 1000 }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
      ]
    ).catch(() => {});

    const downloadUrl = `/api/datasets/${datasetId}/export?exportId=${exportId}&limit=1000`;

    return NextResponse.json({
      exportId,
      status: 'completed',
      downloadUrl,
      totalRows: 1000,
      message: 'Export file prepared successfully.',
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
    const limit = Math.min(10000, parseInt(url.searchParams.get('limit') || '1000', 10));

    // Fetch records in streaming/chunked fashion
    const recordsRes = await client.query(
      `SELECT record_key, title, category, status, numeric_value, country, region, record_date
       FROM dataset_records
       WHERE dataset_id = $1
       ORDER BY record_date DESC
       LIMIT $2`,
      [datasetId, limit]
    );

    const rows = recordsRes.rows || [];

    // Construct CSV Header and rows
    const csvHeader = 'Record Key,Title,Category,Status,Revenue/Amount,Country,Region,Date\n';
    const csvLines = rows.map((r: any) => {
      const escapedTitle = `"${(r.title || '').replace(/"/g, '""')}"`;
      return `${r.record_key},${escapedTitle},${r.category},${r.status},${r.numeric_value},${r.country},${r.region},${r.record_date}`;
    });

    const csvContent = csvHeader + csvLines.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="datascope-export-${datasetId}-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to stream export CSV' }, { status: 500 });
  }
}
