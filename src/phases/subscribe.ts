import type { Pool } from 'undici';
import { config } from '../config.js';
import { RateLimiter } from '../rateLimiter.js';
import type { User } from '../userFactory.js';
import type { recordRequest, incrementActiveUsers } from '../stats.js';

type Stats = {
  recordRequest: typeof recordRequest;
  incrementActiveUsers: typeof incrementActiveUsers;
};

export async function runSubscribePhase(users: User[], pool: Pool, stats: Stats): Promise<void> {
  const limiter = new RateLimiter({
    tokensPerSecond: config.subscribeRate,
    maxTokens: config.subscribeRate,
  });

  try {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user) continue;

      await limiter.acquire();

      const start = Date.now();
      try {
        const { statusCode, body } = await pool.request({
          method: 'POST',
          path: config.subscribePath,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(user),
          bodyTimeout: config.timeout,
          headersTimeout: config.timeout,
        });
        await body.dump();
        stats.recordRequest(Date.now() - start, statusCode);
        stats.incrementActiveUsers();
      } catch {
        stats.recordRequest(Date.now() - start, 0, 'network');
      }

      process.stdout.write(`\rSubscribing... ${i + 1}/${users.length}`);
    }
  } finally {
    limiter.destroy();
  }

  process.stdout.write('\n');
}
