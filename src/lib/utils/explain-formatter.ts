/**
 * Parser for PostgreSQL EXPLAIN ANALYZE execution plan output strings.
 */

export interface ParsedPlan {
  scanType: string;
  indexName: string | null;
  executionTimeMs: number;
  planningTimeMs: number;
  buffersHit: number;
}

export function parseExplainPlan(planText: string): ParsedPlan {
  const execMatch = planText.match(/Execution Time:\s*([0-9.]+)\s*ms/i);
  const planMatch = planText.match(/Planning Time:\s*([0-9.]+)\s*ms/i);
  const scanMatch = planText.match(/(Bitmap Index Scan|Index Scan|Seq Scan|Index Only Scan)/i);
  const indexMatch = planText.match(/on (idx_[a-zA-Z0-9_]+)/i);
  const bufferMatch = planText.match(/Buffers:\s*shared hit=([0-9]+)/i);

  return {
    scanType: scanMatch ? scanMatch[1] : 'Bitmap Heap Scan',
    indexName: indexMatch ? indexMatch[1] : null,
    executionTimeMs: execMatch ? parseFloat(execMatch[1]) : 0,
    planningTimeMs: planMatch ? parseFloat(planMatch[1]) : 0,
    buffersHit: bufferMatch ? parseInt(bufferMatch[1], 10) : 0,
  };
}
