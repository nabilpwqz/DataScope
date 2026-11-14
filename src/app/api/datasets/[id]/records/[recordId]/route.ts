import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { queryCache } from '@/lib/cache/lru-cache';
import { verifyToken } from '@/lib/auth/jwt';
import { getRolePermissions } from '@/lib/auth/rbac';
import { DatasetRecord, RecordHistoryItem, RecordRelationship, UserRole } from '@/types';
import crypto from 'crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const { id: datasetId, recordId } = params;
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
    const body = await req.json();
    const { status, reason } = body;

    let userRole: UserRole = 'admin';
    let userName = 'Elena Rostova';
    let userId = 'usr-admin-01';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        userRole = payload.role;
        userName = payload.name;
        userId = payload.userId;
      }
    }

    const perms = getRolePermissions(userRole);
    if (!perms.canModifyRecords) {
      return NextResponse.json({ error: 'Role unauthorized to modify records' }, { status: 403 });
    }

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

    // Record audit trail
    await client.query(
      `INSERT INTO record_history (id, record_id, changed_by_user_id, changed_by_name, change_type, diff_payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        crypto.randomUUID(),
        recordId,
        userId,
        userName,
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
