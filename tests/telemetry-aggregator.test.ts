import { describe, it, expect } from 'vitest';
import { calculatePercentile, aggregateTelemetry } from '@/lib/telemetry/aggregator';

describe('Telemetry Metrics Aggregator', () => {
  it('calculates accurate percentiles on sample distributions', () => {
    const latencies = [1.2, 2.5, 3.1, 4.0, 5.5, 10.2, 15.0, 22.1, 45.0, 100.0];
    expect(calculatePercentile(latencies, 50)).toBe(5.5);
    expect(calculatePercentile(latencies, 95)).toBe(100.0);
  });

  it('aggregates cache hit rates and timing metrics', () => {
    const samples = [
      { latencyMs: 2.1, cacheHit: true, timestamp: 1 },
      { latencyMs: 3.5, cacheHit: true, timestamp: 2 },
      { latencyMs: 25.0, cacheHit: false, timestamp: 3 },
      { latencyMs: 30.0, cacheHit: false, timestamp: 4 },
    ];
    const summary = aggregateTelemetry(samples);
    expect(summary.count).toBe(4);
    expect(summary.cacheHitRate).toBe(50);
    expect(summary.avgMs).toBe(15.15);
  });
});
