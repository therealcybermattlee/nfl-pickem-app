# Technology Research & Decisions: NFL Pick'em Application

**Feature**: 001-implement-research
**Date**: November 20, 2025
**Phase**: Phase 0 - Research & Technology Selection

## Overview

This document captures the technology research and architectural decisions for implementing the NFL Pick'em application with time-lock system. Each decision includes the chosen technology, rationale, alternatives considered, and implementation notes.

---

## 1. Authentication Strategy: Password Hashing

### Decision
**bcryptjs** (v3.0.2+) for password hashing in Cloudflare Workers environment

### Rationale
- **Workers Compatibility**: bcryptjs is pure JavaScript with no native dependencies, making it ideal for V8 isolates (Cloudflare Workers runtime)
- **Security**: Industry-standard algorithm with configurable work factor (12 rounds chosen for balance)
- **Proven Track Record**: Widely used, well-tested, no known vulnerabilities when configured correctly
- **Package Size**: Smaller bundle size (~7KB) compared to alternatives, important for Workers deployment
- **Synchronous Operations**: Works within Workers execution time limits (<50ms for hash verification)

### Alternatives Considered
- **Argon2**: Superior security (OWASP recommendation) but requires native bindings (not compatible with Workers V8 isolates). Would need wasm compilation adding significant complexity.
- **scrypt**: Built-in Node.js support but not available in Workers runtime. Pure JS implementations exist but less mature than bcryptjs.
- **PBKDF2**: Simpler but significantly weaker against GPU attacks. Not recommended for new applications in 2025.

### Implementation Notes
```typescript
import bcrypt from 'bcryptjs';

// Hash password on registration (use 12 rounds)
const salt = await bcrypt.genSalt(12);
const passwordHash = await bcrypt.hash(password, salt);

// Verify password on sign-in
const isValid = await bcrypt.compare(password, storedHash);
```

**Key Gotchas**:
- Use `bcryptjs` not `bcrypt` (native version won't work in Workers)
- 12 rounds balances security vs. execution time (~200-300ms on Workers)
- Store hash+salt together (bcryptjs handles this automatically)
- Never log or expose password hashes

---

## 2. Real-Time Updates: Communication Strategy

### Decision
**Hybrid approach**: Server-Sent Events (SSE) with polling fallback

### Rationale
- **SSE for Modern Browsers**: Native browser support, simpler than WebSockets, works over HTTP/2, automatic reconnection
- **Polling Fallback**: Guarantees compatibility for all browsers and network conditions
- **Workers Support**: SSE works with Cloudflare Workers using TransformStream API (no WebSocket support in Workers)
- **Scalability**: Low overhead for 4-10 concurrent users, SSE connections are lightweight
- **Progressive Enhancement**: Degrade gracefully from SSE → polling without user impact

### Alternatives Considered
- **WebSockets**: Not supported by Cloudflare Workers. Would require separate WebSocket server (Durable Objects), adding architectural complexity.
- **Long Polling Only**: Works but higher latency (5-10 second intervals) and more HTTP overhead. Acceptable as fallback, not ideal as primary.
- **GraphQL Subscriptions**: Overkill for this use case, adds significant complexity for minimal benefit. REST + SSE simpler.

### Implementation Notes
```typescript
// Server (src/worker.ts) - SSE endpoint
const { readable, writable } = new TransformStream();
const writer = writable.getWriter();
const encoder = new TextEncoder();

// Send events
setInterval(async () => {
  const events = await getRecentEvents();
  await writer.write(encoder.encode(`data: ${JSON.stringify(events)}\n\n`));
}, 5000); // 5-second intervals

return new Response(readable, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});

// Client (src/hooks/useRealTimeUpdates.ts) - SSE with polling fallback
const eventSource = new EventSource(`${API_URL}/events/stream`);
eventSource.onerror = () => {
  // Fall back to polling
  setInterval(() => fetch('/events/poll'), 10000);
};
```

**Key Gotchas**:
- SSE requires keep-alive support (Cloudflare Workers supports up to 30 seconds, reconnect required)
- Implement heartbeat messages every 30 seconds to prevent timeout
- Polling endpoint must be stateless (use `lastEventId` query param for cursor)
- Close EventSource on component unmount to prevent memory leaks

---

## 3. Cron Job Reliability: Scheduled Tasks

### Decision
**Cloudflare Cron Triggers** (*/15 * * * *) with idempotency and logging

### Rationale
- **Native Integration**: Built into Cloudflare Workers, no external scheduler needed
- **Reliability**: Cloudflare guarantees cron execution, backed by their global network
- **Time Precision**: 15-minute intervals sufficient for game lock enforcement (games lock within 5 seconds of scheduled time)
- **Automatic Retries**: Failed cron runs are retried automatically by Cloudflare
- **Zero Cost**: Included in Workers plan, no additional charges for cron triggers

### Alternatives Considered
- **External Cron (cron-job.org)**: Additional dependency, external failure point, requires API key management. Less reliable than native.
- **Durable Objects Alarms**: More complex, intended for per-entity alarms. Overkill for global 15-minute jobs.
- **Manual Triggers Only**: Requires human intervention, not acceptable for time-critical operations (game locks).

### Implementation Notes
```toml
# wrangler-workers.toml
[triggers]
crons = ["*/15 * * * *"]  # Every 15 minutes
```

```typescript
// src/worker.ts - Cron handler
export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const executionId = crypto.randomUUID();

    try {
      // 1. Update game locks (games that have passed lock time)
      await updateGameLocks(env.DB, executionId);

      // 2. Auto-generate picks for users who missed deadline
      await autoGeneratePicks(env.DB, executionId);

      // 3. Fetch latest scores from ESPN API
      await updateScores(env.DB, env, executionId);

      // 4. Calculate points for completed games
      await calculatePoints(env.DB, executionId);

      // Log success
      await logCronExecution(env.DB, executionId, 'success');
    } catch (error) {
      await logCronExecution(env.DB, executionId, 'failure', error.message);
      throw error; // Cloudflare will retry
    }
  }
};
```

**Key Gotchas**:
- Cron runs are NOT guaranteed to fire at exact second (can vary ±30 seconds)
- Implement idempotency: check if operation already completed before executing
- Use `executionId` to correlate logs from single cron run
- Keep execution under 30 seconds (Workers CPU time limit for cron)
- Log all cron executions to `system_logs` table for monitoring

---

## 4. Mobile PWA Strategy: Offline Support

### Decision
**Vite PWA Plugin** (v1.0.3+) with Workbox for service worker generation

### Rationale
- **Zero Config**: Vite PWA plugin integrates seamlessly with Vite build process
- **Workbox Integration**: Industry-standard service worker toolkit, handles caching strategies automatically
- **PWA Compliance**: Generates manifest.json, icons, and service worker meeting PWA criteria
- **Install Prompts**: Enables "Add to Home Screen" on mobile for app-like experience
- **Offline Game Viewing**: Cache game data and leaderboard for offline access (via NetworkFirst strategy)

### Alternatives Considered
- **Manual Service Worker**: Full control but significantly more code to maintain. Workbox abstracts caching complexity.
- **Next.js PWA Plugin**: Not applicable (using Vite, not Next.js). Similar approach but tied to Next.js ecosystem.
- **No PWA**: Simpler but loses mobile app-like experience and offline capabilities (important for game-day usage).

### Implementation Notes
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'NFL Pick\'em',
        short_name: 'Pick\'em',
        theme_color: '#1a1a1a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.workers\.dev\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 } // 24 hours
            }
          }
        ]
      }
    })
  ]
});
```

**Key Gotchas**:
- Service workers require HTTPS (works on localhost for dev)
- NetworkFirst strategy: attempts network, falls back to cache (good for game data)
- Cache invalidation: Service worker updates when new deployment detected
- Test on actual mobile devices (iOS Safari, Android Chrome) - simulators insufficient
- Clear cache during development to avoid stale data

---

## 5. State Management: Global Application State

### Decision
**React Context + useReducer** for global state (no external library)

### Rationale
- **Built-in**: No additional dependencies, leverages React's built-in state management
- **Sufficient Scale**: 4-10 users, ~12 components - Context avoids prop drilling without library overhead
- **Type Safety**: Works seamlessly with TypeScript interfaces
- **Performance**: useReducer provides predictable state updates, memo/callback prevent unnecessary re-renders
- **Learning Curve**: Team already knows React hooks, no new paradigm to learn

### Alternatives Considered
- **Zustand**: Excellent library, simpler than Redux, but adds dependency for minimal benefit at this scale. Overkill for <20 components.
- **Redux Toolkit**: Too heavy for this application size. Adds boilerplate (actions, reducers, store) not justified by complexity.
- **Jotai/Recoil**: Atomic state management interesting but experimental. Stick with proven patterns.

### Implementation Notes
```typescript
// src/contexts/AppContext.tsx
interface AppState {
  user: User | null;
  currentWeek: number;
  games: Game[];
  picks: Record<string, Pick>;
}

type AppAction =
  | { type: 'SET_USER'; user: User }
  | { type: 'SET_GAMES'; games: Game[] }
  | { type: 'UPDATE_PICK'; gameId: string; pick: Pick };

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
} | null>(null);

// Usage in components
const { state, dispatch } = useContext(AppContext);
```

**Key Gotchas**:
- Wrap root component in `<AppContext.Provider>`
- Split contexts if performance issues (e.g., separate UserContext, GamesContext)
- Use `useMemo` for derived state to avoid recalculations
- Consider React Query for server state caching (optional enhancement)

---

## 6. Testing Strategy: Time-Based Workflows

### Decision
**Playwright** (v1.40+) for E2E with system clock mocking

### Rationale
- **Clock Mocking**: Playwright supports `page.clock.install()` to freeze/fast-forward time, critical for testing countdown timers and locks
- **Cross-Browser**: Tests in Chromium, Firefox, WebKit - catches browser-specific issues (especially Safari mobile)
- **Visual Regression**: Can capture screenshots of countdown timers at specific time points
- **Mobile Viewport Testing**: Simulates 375px mobile screens to verify responsive design
- **Parallel Execution**: Runs tests concurrently, keeps CI pipeline fast

### Alternatives Considered
- **Cypress**: Popular but weaker time mocking support. `cy.clock()` doesn't work well with React's useState timers.
- **Selenium**: Older, more brittle. Playwright is faster and has better async/await API.
- **Manual Testing**: Not repeatable, doesn't catch regressions. Essential to automate time-critical workflows.

### Implementation Notes
```typescript
// tests/e2e/time-lock.spec.ts
test('picks lock when game starts', async ({ page }) => {
  // Install clock mock
  await page.clock.install({ time: new Date('2025-09-05T19:30:00Z') });

  await page.goto('/games');

  // Game locks at 8:00 PM ET (20:00)
  // Verify countdown shows "30 minutes"
  await expect(page.locator('[data-testid="countdown"]')).toContainText('30m');

  // Fast-forward to lock time
  await page.clock.fastForward('30:00');

  // Verify lock indicator appears
  await expect(page.locator('[data-testid="lock-status"]')).toContainText('Locked');

  // Verify pick button is disabled
  await expect(page.locator('button[data-team="KC"]')).toBeDisabled();
});
```

**Key Gotchas**:
- Clock mocking must happen before page navigation
- Test real-time updates separately (can't mock EventSource with clock)
- Mobile viewport testing: `use({ viewport: { width: 375, height: 667 } })`
- Run E2E tests against local Workers dev server, not production
- Flaky test mitigation: use `waitFor` instead of `setTimeout`, retry failed tests once

---

## 7. Database Indexing: Query Performance

### Decision
**Composite indexes** on (week, season), (userId, gameId), (lockTime), (isCompleted)

### Rationale
- **Query Patterns**: Most queries filter by week+season (games list) or userId+gameId (picks lookup)
- **Lock Time Index**: Cron jobs query games WHERE lockTime <= NOW() - single-column index optimal
- **Leaderboard Queries**: Filter by isCompleted=true then aggregate by userId - index on isCompleted speeds up initial filter
- **Unique Constraints**: (userId, gameId) prevents duplicate picks per user per game
- **D1 Optimization**: SQLite (D1) benefits from covering indexes for small result sets

### Alternatives Considered
- **No Indexes**: Queries slow even with 199 games. Table scans unacceptable for time-critical lock operations.
- **Over-Indexing**: Index every column wastes storage and slows writes. Only index high-cardinality columns used in WHERE clauses.
- **Full-Text Search**: Not needed (no text search requirements). SQLite FTS adds overhead.

### Implementation Notes
```sql
-- games table indexes
CREATE INDEX idx_games_week_season ON games(week, season);
CREATE INDEX idx_games_lock_time ON games(lockTime);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_completed ON games(isCompleted) WHERE isCompleted = 1;

-- picks table indexes
CREATE INDEX idx_picks_user_game ON picks(userId, gameId);
CREATE INDEX idx_picks_game_id ON picks(gameId);
CREATE INDEX idx_picks_is_locked ON picks(isLocked);

-- Unique constraint (also creates index)
UNIQUE(userId, gameId) -- Enforces one pick per user per game

-- game_locks table
CREATE INDEX idx_game_locks_locked_at ON game_locks(lockedAt);

-- system_logs table
CREATE INDEX idx_system_logs_created_at ON system_logs(createdAt);
CREATE INDEX idx_system_logs_event_type ON system_logs(eventType);
```

**Key Gotchas**:
- Partial index on `isCompleted` (only index true values) saves space
- Composite index order matters: (week, season) != (season, week). Put highest-cardinality column first.
- D1 query planner: Use `EXPLAIN QUERY PLAN` to verify index usage
- Indexes slow down writes slightly (acceptable tradeoff for read-heavy workload)

---

## 8. API Integration Patterns: External Data Sources

### Decision
**ESPN API primary, The Odds API supplementary** with retry logic and circuit breaker

### Rationale
- **ESPN as Authority**: Free, official NFL data, comprehensive game info, real-time scores
- **The Odds API Supplement**: Paid API ($0.01/request) only used to fill betting line gaps ESPN doesn't provide
- **Data Prioritization**: Always prefer ESPN data, merge with Odds API only when ESPN missing spreads/over-unders
- **Resilience**: Retry failed requests with exponential backoff, circuit breaker after 3 consecutive failures
- **Rate Limiting**: 100ms delay between ESPN requests (respectful, no official limit), Odds API limited to 500 req/month

### Alternatives Considered
- **The Odds API Only**: Costs $20/month minimum, less comprehensive game data than ESPN. ESPN free and authoritative.
- **SportsData.io**: Expensive ($50+/month), overkill for family app. ESPN + Odds API cheaper.
- **Web Scraping**: Fragile, breaks when site changes, violates ToS. APIs more reliable.

### Implementation Notes
```typescript
// src/worker.ts - API integration with retry
async function fetchESPNGames(week: number, season: number): Promise<any[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;
  const params = `?seasontype=2&week=${week}&dates=${season}`;

  let retries = 0;
  while (retries < 3) {
    try {
      const response = await fetch(url + params);
      if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);

      const data = await response.json();
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit

      return data.events.map(parseESPNEvent);
    } catch (error) {
      retries++;
      if (retries === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
    }
  }
}

// Circuit breaker pattern
let failureCount = 0;
const CIRCUIT_THRESHOLD = 3;

async function fetchWithCircuitBreaker(fetchFn: () => Promise<any>) {
  if (failureCount >= CIRCUIT_THRESHOLD) {
    throw new Error('Circuit breaker open - too many failures');
  }

  try {
    const result = await fetchFn();
    failureCount = 0; // Reset on success
    return result;
  } catch (error) {
    failureCount++;
    throw error;
  }
}
```

**Key Gotchas**:
- ESPN API has no official rate limit but be respectful (100ms delays)
- The Odds API costs increase with volume - monitor usage, set budget alerts
- ESPN data format can change between seasons - validate schemas with Zod
- Store `oddsProvider` field to track data source (ESPN vs. Odds API vs. mixed)
- Handle missing data gracefully (games without spreads still playable)

---

## Summary of Decisions

| Decision Area | Chosen Technology | Key Benefit |
|---------------|------------------|-------------|
| Password Hashing | bcryptjs | Workers compatibility |
| Real-Time Updates | SSE + Polling | Simple, reliable fallback |
| Cron Jobs | Cloudflare Triggers | Native, zero cost |
| PWA Strategy | Vite PWA Plugin | Auto-configured, Workbox |
| State Management | React Context | Built-in, sufficient scale |
| Time-Based Testing | Playwright Clock Mocking | Accurate countdown testing |
| Database Indexes | Composite (week, season) | Query performance |
| API Integration | ESPN + Odds API | Official + supplementary |

All decisions prioritize:
1. **Simplicity**: Avoid over-engineering for 4-10 users
2. **Reliability**: Time-critical operations must be automated and tested
3. **Cost**: Leverage free tiers, minimize paid API usage
4. **Developer Experience**: TypeScript throughout, familiar tools (React, Vite, Playwright)

---

## Next Phase

With all technology decisions resolved, proceed to **Phase 1: Design & Contracts**:
1. Generate data-model.md (database schema)
2. Generate API contracts in /contracts/ (OpenAPI spec)
3. Generate quickstart.md (developer onboarding)
4. Update agent context with these decisions
