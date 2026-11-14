import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { canAccessDataset } from '@/lib/auth/rbac';
import { Dataset, UserRole } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;
    const client = await getRawClient();

    let userRole: UserRole = 'admin';
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) userRole = payload.role;
    }

    const dsRes = await client.query('SELECT * FROM datasets WHERE id = $1 OR slug = $1', [datasetId]);
    const row = dsRes.rows[0];

    if (!row) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (!canAccessDataset(userRole, row.access_level)) {
      return NextResponse.json({ error: 'Access denied to this dataset under your current role' }, { status: 403 });
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
