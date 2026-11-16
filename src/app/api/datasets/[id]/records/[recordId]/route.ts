import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { queryCache } from '@/lib/cache/lru-cache';
import { authorize } from '@/lib/auth/authorize';
import { DatasetRecord, RecordHistoryItem, RecordRelationship } from '@/types';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const RecordPatchSchema = z
  .object({
    status: z.enum(['Active', 'Pending', 'Archived', 'Suspended', 'Completed', 'Flagged']),
    reason: z.string().max(256).optional(),
  })
  .strict();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const { id: datasetId, recordId } = params;

    // Verify dataset-level access
    const auth = await authorize(req, { datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();

    // 1. Fetch primary record
    const recRes = await client.query(
      `SELECT * FROM dataset_records WHERE id = $1 AND dataset_id = $2`,
      [recordId, datasetId]
    );

    const r = recRes.rows[0];
    if (!r) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const record: DatasetRecord = {
      id: r.id,
      datasetId: r.dataset_id,
      recordKey: r.record_key,
      title: r.title,
      category: r.category,
      status: r.status,
      numericValue: parseFloat(r.numeric_value),
      country: r.country,
      region: r.region,
      recordDate: r.record_date instanceof Date ? r.record_date.toISOString() : r.record_date,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    };

    // 2. Fetch related records
    const relRes = await client.query(
      `SELECT 
        rel.id, rel.source_record_id, rel.target_record_id, rel.relationship_type, rel.metadata,
        tr.record_key as target_key, tr.title as target_title, tr.status as target_status,
        tr.numeric_value as target_value, tr.country as target_country
       FROM record_relationships rel
       LEFT JOIN dataset_records tr ON rel.target_record_id = tr.id
       WHERE rel.source_record_id = $1 OR rel.target_record_id = $1`,
      [recordId]
    );

    const relatedRecords: RecordRelationship[] = relRes.rows.map((row: any) => ({
      id: row.id,
      sourceRecordId: row.source_record_id,
      targetRecordId: row.target_record_id,
      relationshipType: row.relationship_type,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      targetRecord: row.target_title
        ? ({
            id: row.target_record_id,
            recordKey: row.target_key,
            title: row.target_title,
            status: row.target_status,
            numericValue: parseFloat(row.target_value),
            country: row.target_country,
          } as any)
        : undefined,
    }));

    // 3. Fetch record change history
    const histRes = await client.query(
      `SELECT id, record_id, changed_by_user_id, changed_by_name, change_type, diff_payload, created_at
       FROM record_history
       WHERE record_id = $1
       ORDER BY created_at DESC`,
      [recordId]
    );

    const history: RecordHistoryItem[] = histRes.rows.map((h: any) => ({
      id: h.id,
      recordId: h.record_id,
      changedByUserId: h.changed_by_user_id,
      changedByName: h.changed_by_name,
      changeType: h.change_type,
      diffPayload: typeof h.diff_payload === 'string' ? JSON.parse(h.diff_payload) : h.diff_payload,
      createdAt: h.created_at instanceof Date ? h.created_at.toISOString() : h.created_at,
    }));

    return NextResponse.json({
      record,
      relatedRecords,
      history,
    });
  } catch (err: any) {
    console.error('Fetch record details error:', err);
    return NextResponse.json({ error: 'Failed to retrieve record details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const { id: datasetId, recordId } = params;

    // Verify modify permissions
    const auth = await authorize(req, { role: 'admin', datasetId, action: 'write' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: administrator role required to modify records' },
        { status: auth.status || 403 }
      );
    }

    const rawBody = await req.json();
    const parsed = RecordPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid record update payload', details: parsed.error.issues }, { status: 400 });
    }

    const { status, reason } = parsed.data;
    const client = await getRawClient();

    // Get current status
    const currentRes = await client.query(
      'SELECT status FROM dataset_records WHERE id = $1 AND dataset_id = $2',
      [recordId, datasetId]
    );
    if (!currentRes.rows[0]) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const oldStatus = currentRes.rows[0].status;

    // Update status
    await client.query(
      'UPDATE dataset_records SET status = $1, updated_at = NOW() WHERE id = $2 AND dataset_id = $3',
      [status, recordId, datasetId]
    );

    // Record audit trail with real user
    await client.query(
      `INSERT INTO record_history (id, record_id, changed_by_user_id, changed_by_name, change_type, diff_payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        crypto.randomUUID(),
        recordId,
        auth.user.id,
        auth.user.name,
        'STATUS_CHANGE',
        JSON.stringify({ field: 'status', oldValue: oldStatus, newValue: status, reason: reason || 'Manual update' }),
      ]
    );

    // Invalidate cache for this dataset
    queryCache.invalidateDataset(datasetId);

    return NextResponse.json({ success: true, recordId, oldStatus, newStatus: status });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}
