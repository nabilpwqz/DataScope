import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { DataQualityIssue, DataQualityOverview } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, { role: 'analyst' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();

    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get('datasetId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (datasetId && datasetId !== 'ALL') {
      conditions.push(`dqi.dataset_id = $${idx++}`);
      values.push(datasetId);
    }

    if (status && status !== 'ALL') {
      conditions.push(`dqi.status = $${idx++}`);
      values.push(status);
    }

    if (severity && severity !== 'ALL') {
      conditions.push(`dqi.severity = $${idx++}`);
      values.push(severity);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const issuesRes = await client.query(
      `
      SELECT 
        dqi.id, dqi.dataset_id, dqi.record_id, dqi.field_name, dqi.issue_type,
        dqi.severity, dqi.description, dqi.status, dqi.created_at, dqi.resolved_at,
        d.name as dataset_name
      FROM data_quality_issues dqi
      LEFT JOIN datasets d ON dqi.dataset_id = d.id
      ${whereClause}
      ORDER BY 
        CASE dqi.severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END ASC,
        dqi.created_at DESC;
      `,
      values
    );

    const issues: DataQualityIssue[] = issuesRes.rows.map((row: any) => ({
      id: row.id,
      datasetId: row.dataset_id,
      datasetName: row.dataset_name || 'Global Enterprise Registry',
      recordId: row.record_id || undefined,
      fieldName: row.field_name,
      issueType: row.issue_type,
      severity: row.severity,
      description: row.description,
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      resolvedAt: row.resolved_at ? (row.resolved_at instanceof Date ? row.resolved_at.toISOString() : row.resolved_at) : undefined,
    }));

    // Calculate quality metrics dynamically from real database rows
    const countsRes = await client.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status != 'resolved')::int as critical_count,
        COUNT(*) FILTER (WHERE severity = 'high' AND status != 'resolved')::int as high_count,
        COUNT(*) FILTER (WHERE severity = 'medium' AND status != 'resolved')::int as medium_count,
        COUNT(*) FILTER (WHERE severity = 'low' AND status != 'resolved')::int as low_count,
        COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved_count
      FROM data_quality_issues;
    `);

    const stats = countsRes.rows[0] || {};
    const critical = stats.critical_count || 0;
    const high = stats.high_count || 0;
    const medium = stats.medium_count || 0;
    const low = stats.low_count || 0;
    const totalOpen = critical + high + medium + low;

    // Derived health score: 100 base minus severity weights
    const penalty = critical * 4.5 + high * 2.0 + medium * 0.8 + low * 0.3;
    const overallScore = Math.max(70, Math.min(99.6, Math.round((100 - penalty) * 10) / 10));

    const overview: DataQualityOverview = {
      overallScore,
      dimensions: {
        completeness: Math.max(85, Math.round((99.2 - high * 0.4) * 10) / 10),
        uniqueness: Math.max(90, Math.round((99.8 - critical * 0.5) * 10) / 10),
        validity: Math.max(80, Math.round((98.4 - medium * 0.5) * 10) / 10),
        consistency: Math.max(82, Math.round((97.9 - low * 0.3) * 10) / 10),
      },
      totalIssues: totalOpen,
      issuesBySeverity: {
        critical,
        high,
        medium,
        low,
      },
      issues,
    };

    return NextResponse.json(overview);
  } catch (err: any) {
    console.error('Fetch data quality error:', err);
    return NextResponse.json({ error: 'Failed to retrieve data quality overview' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authorize(req, { role: 'analyst', action: 'write' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status || 403 });
    }

    const client = await getRawClient();
    const body = await req.json();
    const { issueId, status } = body;

    if (!issueId || !status || !['open', 'reviewed', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid issueId or status' }, { status: 400 });
    }

    const resolvedAtSql = status === 'resolved' ? 'NOW()' : 'NULL';

    const updateRes = await client.query(
      `
      UPDATE data_quality_issues
      SET status = $1, resolved_at = ${resolvedAtSql}
      WHERE id = $2
      RETURNING id, dataset_id, field_name, severity, status;
      `,
      [status, issueId]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'Data quality issue not found' }, { status: 404 });
    }

    const updated = updateRes.rows[0];

    // Log this resolution action into audit logs with real identity
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
        'DATA_QUALITY_STATUS_UPDATE',
        `DataQualityIssue:${issueId}`,
        issueId,
        JSON.stringify({ status, field: updated.field_name, severity: updated.severity }),
        req.headers.get('x-forwarded-for') || '127.0.0.1',
        'SUCCESS',
      ]
    );

    return NextResponse.json({ success: true, updatedIssue: updated });
  } catch (err: any) {
    console.error('Update data quality issue error:', err);
    return NextResponse.json({ error: 'Failed to update quality issue' }, { status: 500 });
  }
}
