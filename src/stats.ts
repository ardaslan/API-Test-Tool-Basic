export type ErrorType = 'timeout' | '4xx' | '5xx' | 'network';

export interface StatsSnapshot {
  totalRequests: number;
  rps: number;
  p50: number;
  p95: number;
  p99: number;
  successCount: number;
  successRate: number;
  errorCounts: Record<ErrorType, number>;
  totalErrors: number;
  activeUsers: number;
  elapsedMs: number;
}

const MAX_LATENCIES = 10_000;
const RPS_WINDOW_MS = 10_000;

let totalRequests = 0;
let successCount = 0;
let activeUsers = 0;
const latencies: number[] = [];
const requestTimestamps: number[] = [];
const startTime = Date.now();
const errorCounts: Record<ErrorType, number> = {
  timeout: 0,
  '4xx': 0,
  '5xx': 0,
  network: 0,
};

function classifyStatus(statusCode: number): 'success' | ErrorType {
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 400 && statusCode < 500) return '4xx';
  if (statusCode >= 500) return '5xx';
  return 'network';
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(p * sorted.length);
  return sorted[idx] ?? 0;
}

export function recordRequest(durationMs: number, statusCode: number, errorType?: ErrorType): void {
  totalRequests++;
  requestTimestamps.push(Date.now());

  if (latencies.length >= MAX_LATENCIES) {
    latencies.shift();
  }
  latencies.push(durationMs);

  if (errorType !== undefined) {
    errorCounts[errorType]++;
  } else {
    const classification = classifyStatus(statusCode);
    if (classification === 'success') {
      successCount++;
    } else {
      errorCounts[classification]++;
    }
  }
}

export function incrementActiveUsers(): void {
  activeUsers++;
}

export function decrementActiveUsers(): void {
  activeUsers = Math.max(0, activeUsers - 1);
}

export function getSnapshot(): StatsSnapshot {
  const now = Date.now();
  const windowStart = now - RPS_WINDOW_MS;

  // Prune timestamps outside the rolling window
  while (requestTimestamps.length > 0 && (requestTimestamps[0] ?? 0) < windowStart) {
    requestTimestamps.shift();
  }

  const rps = requestTimestamps.length / (RPS_WINDOW_MS / 1000);

  const sorted = [...latencies].sort((a, b) => a - b);
  const totalErrors = errorCounts.timeout + errorCounts['4xx'] + errorCounts['5xx'] + errorCounts.network;

  return {
    totalRequests,
    rps,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    successCount,
    successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
    errorCounts: { ...errorCounts },
    totalErrors,
    activeUsers,
    elapsedMs: now - startTime,
  };
}
