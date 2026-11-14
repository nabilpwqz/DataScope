import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { canAccessDataset } from '@/lib/auth/rbac';
import { Dataset, UserRole } from '@/types';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const client = await getRawClient();

    // Determine user role (from token or fallback to admin in dev/preview)
    let userRole: UserRole = 'admin';
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token);
      if (payload) {
        userRole = payload.role;
      }
    }

    // Fetch datasets and their fields
    const dsRes = await client.query(`
      SELECT 
        d.id, d.name, d.slug, d.description, d.category, d.data_source, 
        d.total_records, d.access_level, d.schema_definition, d.created_at, d.updated_at,
        COUNT(r.id)::int as actual_records_count
      FROM datasets d
      LEFT JOIN dataset_records r ON d.id = r.dataset_id
      GROUP BY d.id
      ORDER BY d.created_at ASC;
    `);

    const fieldsRes = await client.query(`
      SELECT id, dataset_id, field_name, display_name, data_type, is_filterable, is_searchable, is_sortable, is_primary, sample_values, created_at
      FROM dataset_fields
      ORDER BY created_at ASC;
    `);

    const allFields = fieldsRes.rows || [];

    const datasets: Dataset[] = dsRes.rows
      .filter((row: any) => canAccessDataset(userRole, row.access_level))
      .map((row: any) => {
        const fields = allFields
          .filter((f: any) => f.dataset_id === row.id)
          .map((f: any) => ({
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

        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          category: row.category,
          dataSource: row.data_source,
          totalRecords: row.actual_records_count || row.total_records,
          accessLevel: row.access_level,
          fields,
          createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
          updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
        };
      });

    return NextResponse.json(datasets);
  } catch (err: any) {
    console.error('Datasets fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let userRole: UserRole = 'admin';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) userRole = payload.role;
    }

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Only Administrators can create new datasets' }, { status: 403 });
    }

    const body = await req.json();
    const id = `ds-${Date.now()}`;
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const client = await getRawClient();

    await client.query(
      `INSERT INTO datasets (id, name, slug, description, category, data_source, total_records, access_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        body.name,
        slug,
        body.description || '',
        body.category || 'General',
        body.dataSource || 'Internal Postgres',
        0,
        body.accessLevel || 'public',
      ]
    );

    return NextResponse.json({ id, name: body.name, slug, success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

