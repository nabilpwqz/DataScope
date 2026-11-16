import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { Dataset } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;
    const auth = await authorize(req, { datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();
    const dsRes = await client.query('SELECT * FROM datasets WHERE id = $1 OR slug = $1', [datasetId]);
    const row = dsRes.rows[0];

    if (!row) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const fieldsRes = await client.query('SELECT * FROM dataset_fields WHERE dataset_id = $1 ORDER BY created_at ASC', [row.id]);
    const countRes = await client.query('SELECT COUNT(*)::int as count FROM dataset_records WHERE dataset_id = $1', [row.id]);

    const fields = fieldsRes.rows.map((f: any) => ({
      id: f.id,
      datasetId: f.dataset_id,
      fieldName: f.field_name,
      displayName: f.display_name,
      dataType: f.data_type,
      isFilterable: f.is_filterable,
      isSearchable: f.is_searchable,
      isSortable: f.is_sortable,
      isPrimary: f.is_primary,
      sampleValues: typeof f.sample_values === 'string' ? JSON.parse(f.sample_values) : f.sample_values || [],
    }));

    const dataset: Dataset = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      category: row.category,
      dataSource: row.data_source,
      totalRecords: countRes.rows[0]?.count || row.total_records,
      accessLevel: row.access_level,
      fields,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    };

    return NextResponse.json(dataset);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve dataset' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;
    const auth = await authorize(req, { role: 'admin', datasetId, action: 'manage' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status || 403 });
    }

    const body = await req.json();
    const { name, description, category, accessLevel, dataSource } = body;
    const client = await getRawClient();

    const updateRes = await client.query(
      `
      UPDATE datasets
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        access_level = COALESCE($4, access_level),
        data_source = COALESCE($5, data_source),
        updated_at = NOW()
      WHERE id = $6 OR slug = $6
      RETURNING *;
      `,
      [name || null, description || null, category || null, accessLevel || null, dataSource || null, datasetId]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const updated = updateRes.rows[0];

    // Log update in audit trail with real authenticated identity
    const auditId = `aud-${crypto.randomBytes(4).toString('hex')}`;
    await client.query(
      `
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `,
      [
        auditId,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        'DATASET_METADATA_UPDATE',
        `Dataset:${updated.id}`,
        updated.id,
        JSON.stringify({ name: updated.name, accessLevel: updated.access_level, category: updated.category }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
        'SUCCESS',
      ]
    );

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      category: updated.category,
      dataSource: updated.data_source,
      totalRecords: updated.total_records,
      accessLevel: updated.access_level,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (err: any) {
    console.error('Update dataset error:', err);
    return NextResponse.json({ error: 'Failed to update dataset' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;
    const auth = await authorize(req, { role: 'admin', datasetId, action: 'manage' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status || 403 });
    }

    const client = await getRawClient();

    // Delete records and fields associated with this dataset
    await client.query('DELETE FROM dataset_records WHERE dataset_id = $1', [datasetId]);
    await client.query('DELETE FROM dataset_fields WHERE dataset_id = $1', [datasetId]);
    await client.query('DELETE FROM data_quality_issues WHERE dataset_id = $1', [datasetId]);
    await client.query('DELETE FROM access_permissions WHERE dataset_id = $1', [datasetId]);
    const delRes = await client.query('DELETE FROM datasets WHERE id = $1 RETURNING id, name', [datasetId]);

    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const deleted = delRes.rows[0];

    // Log deletion in audit trail with real authenticated user
    const auditId = `aud-${crypto.randomBytes(4).toString('hex')}`;
    await client.query(
      `
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `,
      [
        auditId,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        'DATASET_DELETE',
        `Dataset:${deleted.id}`,
        deleted.id,
        JSON.stringify({ deletedName: deleted.name }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
        'SUCCESS',
      ]
    );

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (err: any) {
    console.error('Delete dataset error:', err);
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
  }
}
