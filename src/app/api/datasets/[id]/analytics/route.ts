import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { AnalyticsSummary } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id;

    // Check authorization and dataset-level permission
    const auth = await authorize(req, { datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: insufficient permissions to view dataset analytics' },
        { status: auth.status || 403 }
      );
    }

    const client = await getRawClient();

    // Execute pure SQL analytic aggregations concurrently
    const [
      generalRes,
      categoryRes,
      statusRes,
      trendsRes,
      countryRes,
      filterRes,
      regionResResult,
      percResResult,
    ] = await Promise.all([
      client.query(`
        SELECT 
          COUNT(*)::int AS total_records,
          COALESCE(AVG(numeric_value), 0)::double precision AS avg_val,
          COALESCE(SUM(numeric_value), 0)::double precision AS sum_val
        FROM dataset_records
        WHERE dataset_id = $1;
      `, [datasetId]),
      client.query(`
        SELECT 
          category,
          COUNT(*)::int AS count,
          COALESCE(SUM(numeric_value), 0)::double precision AS total_value
        FROM dataset_records
        WHERE dataset_id = $1
        GROUP BY category
        ORDER BY count DESC;
      `, [datasetId]),
      client.query(`
        SELECT 
          status,
          COUNT(*)::int AS count
        FROM dataset_records
        WHERE dataset_id = $1
        GROUP BY status
        ORDER BY count DESC;
      `, [datasetId]),
      client.query(`
        SELECT 
          to_char(record_date, 'YYYY-MM') AS date_month,
          COUNT(*)::int AS count
        FROM dataset_records
        WHERE dataset_id = $1
        GROUP BY date_month
        ORDER BY date_month ASC;
      `, [datasetId]),
      client.query(`
        SELECT 
          country,
          COUNT(*)::int AS count,
          COALESCE(SUM(numeric_value), 0)::double precision AS total_value
        FROM dataset_records
        WHERE dataset_id = $1
        GROUP BY country
        ORDER BY count DESC
        LIMIT 8;
      `, [datasetId]),
      client.query(`
        SELECT filter_summary
        FROM search_history
        WHERE dataset_id = $1
        ORDER BY created_at DESC
        LIMIT 100;
      `, [datasetId]),
      client.query(`
        SELECT 
          COALESCE(region, 'Global') AS region,
          COUNT(*)::int AS count,
          COALESCE(SUM(numeric_value), 0)::double precision AS total_value
        FROM dataset_records
        WHERE dataset_id = $1
        GROUP BY region
        ORDER BY count DESC
        LIMIT 6;
      `, [datasetId]).catch(() => ({ rows: [] })),
      client.query(`
        SELECT 
          COALESCE(MIN(numeric_value), 0)::double precision AS min_val,
          COALESCE(MAX(numeric_value), 0)::double precision AS max_val,
          COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p25,
          COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p50,
          COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p75,
          COALESCE(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p90
        FROM dataset_records
        WHERE dataset_id = $1;
      `, [datasetId]).catch(() => ({ rows: [] })),
    ]);

    const totalRecords = generalRes.rows[0]?.total_records || 0;
    const averageValue = Math.round((generalRes.rows[0]?.avg_val || 0) * 100) / 100;
    const totalValue = Math.round(parseFloat(generalRes.rows[0]?.sum_val || 0));

    const recordsByCategory = categoryRes.rows.map((r: any) => ({
      category: r.category,
      count: r.count,
      totalValue: Math.round(parseFloat(r.total_value)),
    }));

    const recordsByStatus = statusRes.rows.map((r: any) => ({
      status: r.status,
      count: r.count,
      percentage: totalRecords > 0 ? Math.round((r.count / totalRecords) * 1000) / 10 : 0,
    }));

    let runningCumulative = 0;
    const growthTrends = trendsRes.rows.map((r: any) => {
      runningCumulative += r.count;
      return {
        date: r.date_month,
        count: r.count,
        cumulative: runningCumulative,
      };
    });

    const topCountries = countryRes.rows.map((r: any) => ({
      country: r.country,
      count: r.count,
      totalValue: Math.round(parseFloat(r.total_value)),
    }));

    const filterCounts: Record<string, number> = {};
    filterRes.rows.forEach((row: any) => {
      try {
        const filters = typeof row.filter_summary === 'string' ? JSON.parse(row.filter_summary) : row.filter_summary;
        if (Array.isArray(filters)) {
          filters.forEach((f: any) => {
            const field = typeof f === 'string' ? f.split(' ')[0] : f.field;
            if (field) {
              filterCounts[field] = (filterCounts[field] || 0) + 1;
            }
          });
        }
      } catch (e) {}
    });

    const filterUsageStats = Object.entries(filterCounts)
      .map(([field, usageCount]) => ({ field, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount);

    const regionalDistribution = regionResResult.rows.map((r: any) => ({
      region: r.region,
      count: r.count,
      totalValue: Math.round(parseFloat(r.total_value)),
    }));

    let valuePercentiles = {
      min: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      max: 0,
    };

    if (percResResult.rows && percResResult.rows[0] && percResResult.rows[0].max_val > 0) {
      valuePercentiles = {
        min: Math.round(percResResult.rows[0].min_val),
        p25: Math.round(percResResult.rows[0].p25),
        p50: Math.round(percResResult.rows[0].p50),
        p75: Math.round(percResResult.rows[0].p75),
        p90: Math.round(percResResult.rows[0].p90),
        max: Math.round(percResResult.rows[0].max_val),
      };
    }

    const summary: AnalyticsSummary = {
      totalRecords,
      totalValue,
      recordsByCategory,
      recordsByStatus,
      growthTrends,
      topCountries,
      averageValue,
      medianValue: valuePercentiles.p50,
      filterUsageStats,
      regionalDistribution,
      valuePercentiles,
    };

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Analytics aggregation query error:', err);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
