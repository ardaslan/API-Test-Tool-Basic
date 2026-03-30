# API Load Tester

## Stack
- Node.js with TypeScript
- undici (HTTP client — use this for performance, not axios)
- faker.js (random user generation)
- No external dashboard libraries — build terminal UI with raw process.stdout

## Architecture

Each file has a single responsibility:

- `src/config.ts` — all runtime parameters, editable without recompile
- `src/userFactory.ts` — generates random users using faker.js
- `src/rateLimiter.ts` — token bucket algorithm for rate control
- `src/phases/subscribe.ts` — subscribe phase logic
- `src/phases/load.ts` — load phase logic
- `src/stats.ts` — metrics collection (latency, RPS, errors)
- `src/reporter.ts` — live terminal dashboard, updates every 10 seconds
- `src/index.ts` — entry point, orchestrates phases

## Config Shape

```typescript
export const config = {
  subscribeRate: 10,        // users subscribed per second
  requestRate: 5,           // requests per second per user (configurable)
  totalUsers: 100,          // total users to create and subscribe
  targetUrl: "https://api.example.com",
  endpoints: [
    { method: "GET", path: "/users" },
    { method: "POST", path: "/data" }
  ],
  dashboardInterval: 10000, // stats refresh interval in ms (10 seconds)
  timeout: 5000             // request timeout in ms
}
```

## Phase Flow

1. **Subscribe Phase**
   - Create all users via userFactory
   - Subscribe them at `subscribeRate` users/second using rateLimiter
   - Wait until ALL users are subscribed before proceeding
   - Log progress inline (not in dashboard)

2. **Load Phase**
   - Each user fires requests at `requestRate` requests/second
   - All users run in parallel
   - Every request result is piped to stats collector

## Stats Collection

Collect and expose the following metrics:

- Total requests sent
- Requests per second (RPS) — rolling 10s window
- Latency percentiles: p50, p95, p99 (in ms)
- Success count and rate (%)
- Error count by type (timeout, 4xx, 5xx, network)
- Active users at any given moment

## Terminal Dashboard

- Refreshes every 10 seconds (controlled by `dashboardInterval` in config)
- Clears and rewrites the terminal block on each refresh
- Format example:

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

## Coding Rules

- Use async/await throughout, no callbacks
- All errors must be caught and routed to stats — never crash the process
- Config values are read at runtime so they can be changed between runs without recompile
- Use `undici` pool for connection reuse across requests
- Keep each module under 150 lines
- Export a clean public API from each module — no direct cross-imports between phases
