import { config } from './config.js';
import type { getSnapshot } from './stats.js';

type Stats = {
  getSnapshot: typeof getSnapshot;
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildDashboard(stats: Stats): string {
  const snap = stats.getSnapshot();
  const elapsed = formatElapsed(snap.elapsedMs);

  const lines: string[] = [
    `=== API Load Tester — ${elapsed} elapsed ===`,
    '',
    `${'Users'.padEnd(14)}${snap.activeUsers} / ${config.totalUsers} active`,
    `${'RPS'.padEnd(14)}${Math.round(snap.rps)} req/s`,
    `${'Latency'.padEnd(14)}p50: ${snap.p50}ms   p95: ${snap.p95}ms   p99: ${snap.p99}ms`,
    `${'Success'.padEnd(14)}${snap.successCount.toLocaleString()} (${snap.successRate.toFixed(1)}%)`,
    `${'Errors'.padEnd(14)}${snap.totalErrors.toLocaleString()} total`,
    `  \u2514 timeout   ${snap.errorCounts.timeout.toLocaleString()}`,
    `  \u2514 5xx       ${snap.errorCounts['5xx'].toLocaleString()}`,
    `  \u2514 4xx       ${snap.errorCounts['4xx'].toLocaleString()}`,
  ];

  return lines.join('\n') + '\n';
}

export function startReporter(stats: Stats): () => void {
  let lastLineCount = 0;

  function render(): void {
    const dashboard = buildDashboard(stats);
    const lineCount = dashboard.split('\n').length - 1;

    if (lastLineCount > 0) {
      // Move cursor up and clear to end of screen
      process.stdout.write(`\x1B[${lastLineCount}A\x1B[0J`);
    }

    process.stdout.write(dashboard);
    lastLineCount = lineCount;
  }

  // Render immediately, then on each interval
  render();
  const interval = setInterval(render, config.dashboardInterval);

  return () => clearInterval(interval);
}
