import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { DataLineageGraph } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const client = await getRawClient();

    // Fetch dynamic dataset record counts from db to reflect live database state
    const dsCounts = await client.query(`
      SELECT d.id, d.name, d.category, COUNT(r.id)::int as count
      FROM datasets d
      LEFT JOIN dataset_records r ON d.id = r.dataset_id
      GROUP BY d.id
      ORDER BY d.created_at ASC;
    `);

    const datasetsMap: Record<string, { name: string; count: number; category: string }> = {};
    for (const row of dsCounts.rows) {
      datasetsMap[row.id] = {
        name: row.name,
        count: row.count,
        category: row.category,
      };
    }

    const graph: DataLineageGraph = {
      nodes: [
        // Upstream Data Sources
        {
          id: 'src-crm',
          name: 'Salesforce Enterprise CRM',
          type: 'source',
          status: 'active',
          description: 'Primary customer relationship records, deal stages, and account hierarchies.',
          metadata: {
            owner: 'RevOps Team',
            destination: 'Kafka Pipeline: crm-inbound',
            lastSync: '4 minutes ago',
          },
        },
        {
          id: 'src-kafka',
          name: 'Apache Kafka Event Mesh',
          type: 'source',
          status: 'active',
          description: 'Distributed pub/sub event stream ingesting edge telemetry and telemetry telemetry packets.',
          metadata: {
            owner: 'Infrastructure Engineering',
            destination: 'Spark Streaming Consumer',
            lastSync: 'Realtime (sub-second)',
          },
        },
        {
          id: 'src-stripe',
          name: 'Stripe Billing & Ledger',
          type: 'source',
          status: 'active',
          description: 'Invoicing, recurring subscriptions, and merchant settlement transaction webhooks.',
          metadata: {
            owner: 'Finance Systems',
            destination: 'Webhook Receiver',
            lastSync: '12 minutes ago',
          },
        },

        // Ingestion & Processing Pipelines
        {
          id: 'pipe-cdc',
          name: 'Debezium CDC Ingestion Worker',
          type: 'pipeline',
          status: 'active',
          description: 'Change data capture worker synchronizing database state with high fidelity.',
          metadata: {
            owner: 'Data Engineering',
            records: 48200,
            lastSync: '1 minute ago',
          },
        },
        {
          id: 'pipe-validator',
          name: 'Schema Validator & Trigram Indexer',
          type: 'pipeline',
          status: 'active',
          description: 'Validates type constraints, deduplicates keys, and maintains inverted search indices.',
          metadata: {
            owner: 'Search Architecture',
            records: 110000,
            lastSync: 'Continuous',
          },
        },

        // Platform Datasets
        {
          id: 'ds-sales-01',
          name: datasetsMap['ds-sales-01']?.name || 'Global Enterprise Sales 2024',
          type: 'dataset',
          status: 'active',
          description: 'Core B2B revenue and sales opportunity ledger containing accounts and contract ARR.',
          metadata: {
            owner: 'Revenue Analytics',
            records: datasetsMap['ds-sales-01']?.count || 100000,
            lastSync: 'Live',
          },
        },
        {
          id: 'ds-telemetry-02',
          name: datasetsMap['ds-telemetry-02']?.name || 'Distributed Edge Telemetry',
          type: 'dataset',
          status: 'active',
          description: 'Sensor metrics, edge node heartbeats, and cluster latency performance monitoring.',
          metadata: {
            owner: 'Site Reliability Engineering',
            records: datasetsMap['ds-telemetry-02']?.count || 10000,
            lastSync: 'Live',
          },
        },
        {
          id: 'ds-finance-03',
          name: datasetsMap['ds-finance-03']?.name || 'Treasury & Transactions Registry',
          type: 'dataset',
          status: 'idle',
          description: 'Audit compliant treasury transaction records, currency conversions, and reserves.',
          metadata: {
            owner: 'Treasury & Compliance',
            records: datasetsMap['ds-finance-03']?.count || 0,
            lastSync: 'Scheduled Daily',
          },
        },

        // Downstream Consumers
        {
          id: 'cons-bi',
          name: 'Executive BI & Analytics Dashboards',
          type: 'consumer',
          status: 'active',
          description: 'Realtime business intelligence queries and cohort segmentation analysis.',
          metadata: {
            owner: 'Business Intelligence Group',
            lastSync: 'Query on-demand',
          },
        },
        {
          id: 'cons-ai',
          name: 'DataScope AI Query Assistant',
          type: 'consumer',
          status: 'active',
          description: 'Natural language semantic parsing and automated SQL filter generation.',
          metadata: {
            owner: 'AI Labs',
            lastSync: 'Active Session',
          },
        },
        {
          id: 'cons-audit',
          name: 'Compliance Audit & Export Service',
          type: 'consumer',
          status: 'active',
          description: 'Automated CSV/Parquet data room exports and immutable compliance log verification.',
          metadata: {
            owner: 'Governance & Security',
            lastSync: 'Event Triggered',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'src-crm', target: 'pipe-cdc', label: 'CDC TLS 1.3', protocol: 'HTTPS Webhook' },
        { id: 'e2', source: 'src-kafka', target: 'pipe-cdc', label: 'Kafka Protocol', protocol: 'mTLS' },
        { id: 'e3', source: 'src-stripe', target: 'pipe-cdc', label: 'REST v2 API', protocol: 'HTTPS JSON' },
        { id: 'e4', source: 'pipe-cdc', target: 'pipe-validator', label: 'Streaming Batch', protocol: 'Internal IPC' },
        { id: 'e5', source: 'pipe-validator', target: 'ds-sales-01', label: 'Indexed Upsert', protocol: 'PostgreSQL Pool' },
        { id: 'e6', source: 'pipe-validator', target: 'ds-telemetry-02', label: 'Partitioned Write', protocol: 'PostgreSQL Pool' },
        { id: 'e7', source: 'pipe-validator', target: 'ds-finance-03', label: 'Ledger Audit Append', protocol: 'PostgreSQL Pool' },
        { id: 'e8', source: 'ds-sales-01', target: 'cons-bi', label: 'Aggregated Views', protocol: 'RTK Query REST' },
        { id: 'e9', source: 'ds-sales-01', target: 'cons-ai', label: 'Semantic Schema', protocol: 'Internal Service' },
        { id: 'e10', source: 'ds-sales-01', target: 'cons-audit', label: 'Export Stream', protocol: 'Worker Queue' },
        { id: 'e11', source: 'ds-telemetry-02', target: 'cons-bi', label: 'Time-Series Feed', protocol: 'RTK Query REST' },
        { id: 'e12', source: 'ds-finance-03', target: 'cons-audit', label: 'SOX Audit Logs', protocol: 'Signed Hash' },
      ],
    };

    return NextResponse.json(graph);
  } catch (err: any) {
    console.error('Fetch data lineage error:', err);
    return NextResponse.json({ error: 'Failed to retrieve data lineage graph' }, { status: 500 });
  }
}
