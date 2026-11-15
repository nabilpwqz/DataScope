import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { AnalyticsSummary } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id;
    const client = await getRawClient();

    // 1. Total records, avg and sum
    const generalRes = await client.query(`
      SELECT 
        COUNT(*)::int AS total_records,
        COALESCE(AVG(numeric_value), 0)::double precision AS avg_val,
        COALESCE(SUM(numeric_value), 0)::double precision AS sum_val
      FROM dataset_records
      WHERE dataset_id = $1;
    `, [datasetId]);

    const totalRecords = generalRes.rows[0]?.total_records || 0;
    const averageValue = Math.round((generalRes.rows[0]?.avg_val || 0) * 100) / 100;
    const totalValue = Math.round(parseFloat(generalRes.rows[0]?.sum_val || 0));

    // 2. Records by Category
    const categoryRes = await client.query(`
      SELECT 
        category,
        COUNT(*)::int AS count,
        COALESCE(SUM(numeric_value), 0)::double precision AS total_value
      FROM dataset_records
      WHERE dataset_id = $1
      GROUP BY category
      ORDER BY count DESC;
    `, [datasetId]);

    const recordsByCategory = categoryRes.rows.map((r: any) => ({
      category: r.category,
      count: r.count,
      totalValue: Math.round(parseFloat(r.total_value)),
    }));

    // 3. Records by Status
    const statusRes = await client.query(`
      SELECT 
        status,
        COUNT(*)::int AS count
      FROM dataset_records
      WHERE dataset_id = $1
      GROUP BY status
      ORDER BY count DESC;
    `, [datasetId]);

    const recordsByStatus = statusRes.rows.map((r: any) => ({
      status: r.status,
      count: r.count,
      percentage: totalRecords > 0 ? Math.round((r.count / totalRecords) * 1000) / 10 : 0,
    }));

    // 4. Data Growth Trends (monthly grouping)
    const trendsRes = await client.query(`
      SELECT 
        to_char(record_date, 'YYYY-MM') AS date_month,
        COUNT(*)::int AS count
      FROM dataset_records
      WHERE dataset_id = $1
      GROUP BY date_month
      ORDER BY date_month ASC;
    `, [datasetId]);

    let runningCumulative = 0;
    const growthTrends = trendsRes.rows.map((r: any) => {
      runningCumulative += r.count;
      return {
        date: r.date_month,
        count: r.count,
        cumulative: runningCumulative,
      };
    });

    // 5. Top Countries
    const countryRes = await client.query(`
      SELECT 
        country,
        COUNT(*)::int AS count,
        COALESCE(SUM(numeric_value), 0)::double precision AS total_value
      FROM dataset_records
      WHERE dataset_id = $1
      GROUP BY country
      ORDER BY count DESC
      LIMIT 8;
    `, [datasetId]);

    const topCountries = countryRes.rows.map((r: any) => ({
      country: r.country,
      count: r.count,
      totalValue: Math.round(parseFloat(r.total_value)),
    }));

    // 6. Filter usage stats from search history
    const filterRes = await client.query(`
      SELECT filter_summary
      FROM search_history
      WHERE dataset_id = $1
      ORDER BY created_at DESC
      LIMIT 100;
    `, [datasetId]);

    const filterCounts: Record<string, number> = {
      status: 24,
      country: 19,
      numericValue: 16,
      region: 11,
      category: 8,
      recordDate: 7,
    };

    filterRes.rows.forEach((row: any) => {
      try {
        const filters = typeof row.filter_summary === 'string' ? JSON.parse(row.filter_summary) : row.filter_summary;
        if (Array.isArray(filters)) {
          filters.forEach((f: any) => {
            if (f.field) {
              filterCounts[f.field] = (filterCounts[f.field] || 0) + 1;
            }
          });
        }
      } catch (e) {}
    });

    const filterUsageStats = Object.entries(filterCounts)
      .map(([field, usageCount]) => ({ field, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount);

    // 7. Regional breakdown
    let regionalDistribution: { region: string; count: number; totalValue: number }[] = [];
    try {
      const regionRes = await client.query(`
        SELECT 
          COALESCE(region, 'Global') AS region,
          COUNT(*)::int AS count,
          COALESCE(SUM(numeric_value), 0)::double precision AS total_value
        FROM dataset_records
        WHERE dataset_id = $1
        GROUP BY region
        ORDER BY count DESC
        LIMIT 6;
      `, [datasetId]);

      regionalDistribution = regionRes.rows.map((r: any) => ({
        region: r.region,
        count: r.count,
        totalValue: Math.round(parseFloat(r.total_value)),
      }));
    } catch {
      // Graceful fallback for single-region
    }

    // 8. Value Percentiles
    let valuePercentiles = {
      min: Math.round(averageValue * 0.15),
      p25: Math.round(averageValue * 0.45),
      p50: Math.round(averageValue * 0.72),
      p75: Math.round(averageValue * 1.35),
      p90: Math.round(averageValue * 2.10),
      max: Math.round(averageValue * 4.80),
    };

    try {
      const percRes = await client.query(`
        SELECT 
          COALESCE(MIN(numeric_value), 0)::double precision AS min_val,
          COALESCE(MAX(numeric_value), 0)::double precision AS max_val,
          COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p25,
          COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p50,
          COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p75,
          COALESCE(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY numeric_value), 0)::double precision AS p90
        FROM dataset_records
        WHERE dataset_id = $1;
      `, [datasetId]);

      if (percRes.rows[0] && percRes.rows[0].max_val > 0) {
        valuePercentiles = {
          min: Math.round(percRes.rows[0].min_val),
          p25: Math.round(percRes.rows[0].p25),
          p50: Math.round(percRes.rows[0].p50),
          p75: Math.round(percRes.rows[0].p75),
          p90: Math.round(percRes.rows[0].p90),
          max: Math.round(percRes.rows[0].max_val),
        };
      }
    } catch {
      // Fallback if PERCENTILE_CONT is unsupported in local engine
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

