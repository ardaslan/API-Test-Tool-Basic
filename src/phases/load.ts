import type { Pool } from 'undici';
import { config } from '../config.js';
import type { User } from '../userFactory.js';
import type { recordRequest } from '../stats.js';
import type { ErrorType } from '../stats.js';

type Stats = {
  recordRequest: typeof recordRequest;
};

function classifyErrorCode(code: unknown): ErrorType {
  if (code === 'UND_ERR_HEADERS_TIMEOUT' || code === 'UND_ERR_BODY_TIMEOUT' || code === 'UND_ERR_CONNECT_TIMEOUT') {
    return 'timeout';
  }
  return 'network';
}

function classifyStatus(statusCode: number): ErrorType | null {
  if (statusCode >= 400 && statusCode < 500) return '4xx';
  if (statusCode >= 500) return '5xx';
  return null;
}

export function runLoadPhase(users: User[], pool: Pool, stats: Stats): { stop: () => void } {
  let running = true;

  for (const user of users) {
    void (async () => {
      while (running) {
        const endpointIndex = Math.floor(Math.random() * config.endpoints.length);
        const endpoint = config.endpoints[endpointIndex];
        if (!endpoint) continue;

        const start = Date.now();
        let durationMs = 0;
        try {
          const { statusCode, body } = await pool.request({
            method: endpoint.method,
            path: endpoint.path,
            bodyTimeout: config.timeout,
            headersTimeout: config.timeout,
          });
          await body.dump();
          durationMs = Date.now() - start;
          const errType = classifyStatus(statusCode);
          stats.recordRequest(durationMs, statusCode, errType ?? undefined);
        } catch (err) {
          durationMs = Date.now() - start;
          const code = (err as { code?: unknown }).code;
          stats.recordRequest(durationMs, 0, classifyErrorCode(code));
        }

        const sleepMs = Math.max(0, 1000 / config.requestRate - durationMs);
        await new Promise<void>((resolve) => setTimeout(resolve, sleepMs));
      }
    })();
  }

  return {
    stop: () => {
      running = false;
    },
  };
}
