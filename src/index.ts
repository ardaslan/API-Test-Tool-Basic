import { Pool } from 'undici';
import { config } from './config.js';
import { createUsers } from './userFactory.js';
import { runSubscribePhase } from './phases/subscribe.js';
import { runLoadPhase } from './phases/load.js';
import { startReporter } from './reporter.js';
import * as stats from './stats.js';

async function main(): Promise<void> {
  const pool = new Pool(config.targetUrl, {
    connections: config.totalUsers,
    pipelining: 1,
    bodyTimeout: config.timeout,
    headersTimeout: config.timeout,
  });

  const users = createUsers(config.totalUsers);
  console.log(`Created ${users.length} users. Starting subscribe phase...\n`);

  await runSubscribePhase(users, pool, stats);
  console.log(`\nAll ${users.length} users subscribed. Starting load phase...\n`);

  const stopReporter = startReporter(stats);
  const { stop: stopLoad } = runLoadPhase(users, pool, stats);

  process.on('SIGINT', () => {
    stopLoad();
    stopReporter();
    pool.destroy().then(() => {
      process.stdout.write('\nLoad test stopped.\n');
      process.exit(0);
    }).catch(() => {
      process.exit(1);
    });
  });
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
