/**
 * Telemetry and latency percentiles aggregator for query execution metrics.
 */

export interface LatencySample {
  latencyMs: number;
  cacheHit: boolean;
  timestamp: number;
}

export function calculatePercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function aggregateTelemetry(samples: LatencySample[]) {
  if (samples.length === 0) {
    return { count: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, cacheHitRate: 0 };
  }
  const latencies = samples.map((s) => s.latencyMs);
  const totalLatency = latencies.reduce((acc, v) => acc + v, 0);
  const hits = samples.filter((s) => s.cacheHit).length;

  return {
    count: samples.length,
    avgMs: Math.round((totalLatency / samples.length) * 100) / 100,
    p50Ms: calculatePercentile(latencies, 50),
    p95Ms: calculatePercentile(latencies, 95),
    p99Ms: calculatePercentile(latencies, 99),
    cacheHitRate: Math.round((hits / samples.length) * 1000) / 10,
  };
}
