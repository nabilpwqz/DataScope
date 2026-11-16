import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { DatasetCreateSchema } from '@/lib/validation/schemas';
import { Dataset } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { role: userRole, id: userId } = auth.user;
    const client = await getRawClient();

    // Query datasets allowed by access_permissions table (admin sees all)
    let dsRes;
    if (userRole === 'admin') {
      dsRes = await client.query(`
        SELECT 
          d.id, d.name, d.slug, d.description, d.category, d.data_source, 
          d.total_records, d.access_level, d.schema_definition, d.created_at, d.updated_at,
          COALESCE(rc.cnt, d.total_records) AS actual_records_count
        FROM datasets d
        LEFT JOIN (
          SELECT dataset_id, count(*)::int AS cnt
          FROM dataset_records
          GROUP BY dataset_id
        ) rc ON d.id = rc.dataset_id
        ORDER BY d.created_at ASC;
      `);
    } else {
      dsRes = await client.query(
        `
        SELECT 
          d.id, d.name, d.slug, d.description, d.category, d.data_source, 
          d.total_records, d.access_level, d.schema_definition, d.created_at, d.updated_at,
          COALESCE(rc.cnt, d.total_records) AS actual_records_count
        FROM datasets d
        INNER JOIN access_permissions p ON d.id = p.dataset_id
        LEFT JOIN (
          SELECT dataset_id, count(*)::int AS cnt
          FROM dataset_records
          GROUP BY dataset_id
        ) rc ON d.id = rc.dataset_id
        WHERE p.can_read = true AND (p.user_id = $1 OR p.role = $2)
        ORDER BY d.created_at ASC;
      `,
        [userId, userRole]
      );
    }

    const fieldsRes = await client.query(`
      SELECT id, dataset_id, field_name, display_name, data_type, is_filterable, is_searchable, is_sortable, is_primary, sample_values, created_at
      FROM dataset_fields
      ORDER BY created_at ASC;
    `);

    const allFields = fieldsRes.rows || [];

    const datasets: Dataset[] = dsRes.rows.map((row: any) => {
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
    const auth = await authorize(req, { role: 'admin', action: 'manage' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status || 403 });
    }

    const rawBody = await req.json();
    const parsed = DatasetCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid dataset creation payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;
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
        body.accessLevel,
      ]
    );

    // Grant default admin permission to access_permissions
    await client.query(
      `INSERT INTO access_permissions (id, role, dataset_id, can_read, can_write, can_export, can_manage)
       VALUES ($1, 'admin', $2, true, true, true, true)`,
      [`perm-admin-${id}`, id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, details, ip_address, status)
       VALUES ($1, $2, $3, $4, 'DATASET_CREATE', $5, $6, $7, 'success')`,
      [
        `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        `Dataset:${id}`,
        JSON.stringify({ name: body.name, slug, accessLevel: body.accessLevel }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
      ]
    ).catch(() => {});

    return NextResponse.json({ id, name: body.name, slug, success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
