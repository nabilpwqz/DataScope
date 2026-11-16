import { describe, it, expect } from 'vitest';
import { parseExplainPlan } from '@/lib/utils/explain-formatter';

describe('EXPLAIN Plan Parser', () => {
  it('extracts execution timing, index names, and scan types', () => {
    const plan = `
Bitmap Heap Scan on dataset_records (cost=4.82..142.18 rows=25 width=340) (actual time=0.812..3.42 rows=25 loops=1)
  Recheck Cond: (dataset_id = 'ds-sales-01')
  Buffers: shared hit=48
  -> Bitmap Index Scan on idx_records_composite (cost=0.00..4.81 rows=25 width=0)
Planning Time: 0.162 ms
Execution Time: 3.420 ms
`;
    const parsed = parseExplainPlan(plan);
    expect(parsed.executionTimeMs).toBe(3.42);
    expect(parsed.planningTimeMs).toBe(0.162);
    expect(parsed.buffersHit).toBe(48);
    expect(parsed.indexName).toBe('idx_records_composite');
  });
});
