# API Load Tester

A terminal-based HTTP load testing tool built with Node.js and TypeScript. Subscribes fake users at a controlled rate, then fires sustained parallel load while displaying a live dashboard with real-time metrics.

## Features

- **Token bucket rate limiter** — precise control over subscribe and request rates
- **Parallel user simulation** — each user runs an independent request loop
- **Live terminal dashboard** — refreshes every 10 seconds with RPS, latency percentiles, and error breakdown
- **Connection pooling** — uses `undici` Pool for efficient HTTP/1.1 reuse
- **Zero crashes** — all errors are caught and routed to the stats collector

## Stack

- [undici](https://github.com/nodejs/undici) — high-performance HTTP client
- [@faker-js/faker](https://fakerjs.dev/) — realistic fake user generation
- TypeScript 5 + Node.js 20

## Installation

```bash
npm install
```

## Configuration

Edit [`src/config.ts`](src/config.ts):

```ts
export const config = {
  subscribeRate: 10,             // users subscribed per second
  requestRate: 5,                // requests per second per user
  totalUsers: 100,               // total users to create
  targetUrl: 'http://localhost:3000',
  subscribePath: '/subscribe',   // POST endpoint for subscribe phase
  endpoints: [
    { method: 'GET',  path: '/users' },
    { method: 'POST', path: '/data'  },
  ],
  dashboardInterval: 10000,      // dashboard refresh in ms
  timeout: 5000,                 // request timeout in ms
};
```

## Usage

### 1. Start a test server

A minimal echo server is included for local testing:

```bash
node server.js
```

### 2. Run the load tester

```bash
# Build and run
npm run build
npm start

# Or run directly with ts-node
npm run dev
```

Press `Ctrl+C` to stop gracefully.

## Dashboard

```
=== API Load Tester — 00:01:30 elapsed ===

Users         100 / 100 active
RPS           487 req/s
Latency       p50: 42ms   p95: 118ms   p99: 340ms
Success       48,231 (98.2%)
Errors        876 total
  └ timeout   412
  └ 5xx       310
  └ 4xx       154
```

## Phase Flow

1. **Subscribe phase** — creates all users via faker.js, subscribes them to the target API at `subscribeRate` users/second. Logs inline progress. Blocks until all users are subscribed.
2. **Load phase** — each user fires requests in parallel at `requestRate` req/s, picking a random endpoint on each iteration. Runs until stopped.

## Project Structure

```
src/
├── config.ts          # Runtime configuration
├── userFactory.ts     # Fake user generation (faker.js)
├── rateLimiter.ts     # Token bucket algorithm
├── stats.ts           # Metrics: RPS, latency percentiles, error counts
├── reporter.ts        # Live ANSI terminal dashboard
├── index.ts           # Entry point — orchestrates phases
└── phases/
    ├── subscribe.ts   # Subscribe phase logic
    └── load.ts        # Load phase logic
```
