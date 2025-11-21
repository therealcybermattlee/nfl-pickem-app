# Implementation Plan: NFL Pick'em Application with Time-Lock System

**Branch**: `001-implement-research` | **Date**: November 20, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-implement-research/spec.md`

## Summary

Implement a family-oriented NFL Pick'em web application where users submit weekly predictions for NFL game winners, with an automated time-lock system that prevents late submissions and auto-generates random picks for missed deadlines. The system awards 1 point per correct pick, displays real-time scores and rankings, and runs automated background jobs every 15 minutes to update game status and calculate leaderboard positions. Primary users are 4-10 family members accessing via mobile and desktop browsers during NFL game days (Thursday/Sunday/Monday).

**Technical Approach**: Modern serverless architecture using Vite + React frontend hosted on Cloudflare Pages, Cloudflare Workers for API and cron jobs, D1 SQLite database for persistence, ESPN API for official game data, and The Odds API for supplementary betting lines. Time-lock enforcement via scheduled cron triggers with countdown timers in the UI.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.2+ with React 18.2+
- Backend: TypeScript 5.2+ (Cloudflare Workers runtime)
- Database: SQL (SQLite via Cloudflare D1)

**Primary Dependencies**:
- Frontend: Vite 5.0+, React 18.2, React Router 6.20+, Tailwind CSS 3.3+, @heroicons/react, Zod 3.25+
- Backend: bcryptjs 3.0+ (password hashing), jose 6.1+ (JWT), @cloudflare/workers-types 4.x
- Build Tools: Wrangler 4.34+ (Cloudflare CLI), Vite PWA plugin 1.0+, TypeScript 5.2+

**Storage**: Cloudflare D1 (SQLite-compatible) with 7 core tables: users, teams, games, picks, game_locks, system_logs, scheduler_logs. Direct SQL queries via prepared statements (no ORM).

**Testing**:
- E2E: Playwright 1.40+
- Unit: Vitest 1.0+
- Integration: Custom contract tests via Wrangler D1 local mode
- Performance: K6 or Artillery for load testing (20+ concurrent users)

**Target Platform**:
- Frontend: Modern browsers (Chrome/Safari/Firefox), mobile-responsive (375px+ width)
- Backend: Cloudflare Workers edge runtime (V8 isolates)
- Database: Cloudflare D1 globally distributed SQLite

**Project Type**: Web application (separated frontend + backend with API boundary)

**Performance Goals**:
- Page load: <2 seconds for game data display
- API response: <500ms for read operations, <1s for write operations
- Countdown timers: 1-second precision updates
- Auto-lock trigger: Within 5 seconds of scheduled game start time
- Background jobs: Complete within 2 minutes per execution
- Concurrent users: Handle 20+ simultaneous pick submissions

**Constraints**:
- Automated locks must fire within 5 seconds of game start (no manual intervention)
- Mobile UI must work without horizontal scrolling on 375px+ screens
- Session validity: Exactly 24 hours (no early expiration)
- Point awards: Within 20 minutes of game completion
- Data sync accuracy: 95%+ compared to official NFL sources
- Uptime: 99%+ during NFL game days (Thu/Sun/Mon)
- No offline mode beyond PWA service worker caching

**Scale/Scope**:
- Users: 4-10 family members (small, private competition)
- Games: 199 games per season (weeks 1-18, 2025 season)
- Data volume: ~2000 picks per season, minimal storage requirements
- API calls: Bursts during game time (Thu 5-9pm, Sun 10am-11pm, Mon 5-9pm ET)
- Real-time updates: SSE or polling every 5-10 seconds for active users
- Mobile-first: Expect 60%+ traffic from mobile devices

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No project constitution defined - using default best practices

Since `.specify/memory/constitution.md` contains only placeholder template content, no specific constitutional gates apply. The plan will follow industry-standard best practices for:

1. **Testing**: Test coverage for critical paths (authentication, pick submission, scoring)
2. **Security**: Prepared statements for SQL injection prevention, bcrypt password hashing, JWT token validation
3. **Observability**: System logs table for automated event tracking, error boundaries in React
4. **Simplicity**: Direct D1 queries (no ORM overhead), standard REST patterns, minimal abstractions

**Constitutional Compliance**: ✅ PASSED (no violations, no constitution to check against)

## Project Structure

### Documentation (this feature)

```text
specs/001-implement-research/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (already complete)
├── research.md          # Phase 0 output (technology decisions and rationale)
├── data-model.md        # Phase 1 output (database schema and relationships)
├── quickstart.md        # Phase 1 output (developer onboarding guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── openapi.yaml     # OpenAPI 3.0 specification
│   ├── auth.md          # Authentication endpoints
│   ├── games.md         # Games and time-lock endpoints
│   ├── picks.md         # Pick submission endpoints
│   ├── leaderboard.md   # Leaderboard endpoints
│   └── system.md        # System/admin endpoints
├── checklists/          # Quality validation
│   └── requirements.md  # Spec validation checklist (already complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend separation)

# Frontend (Cloudflare Pages deployment)
src/
├── components/          # React UI components
│   ├── GameCard.tsx
│   ├── CountdownTimer.tsx
│   ├── GameLockStatus.tsx
│   ├── LeaderboardTable.tsx
│   ├── PickSelector.tsx
│   └── mobile/          # Mobile-optimized variants
│       ├── MobileGameCard.tsx
│       ├── MobileNavigation.tsx
│       └── MobilePickModal.tsx
├── pages/               # Page-level components
│   ├── HomePage.tsx
│   ├── GamesPage.tsx
│   ├── LeaderboardPage.tsx
│   ├── SignInPage.tsx
│   └── SignUpPage.tsx
├── hooks/               # Custom React hooks
│   ├── useRealTimeUpdates.ts
│   ├── useGameStatus.ts
│   └── useMobileViewport.ts
├── types/               # TypeScript type definitions
│   ├── api.ts
│   ├── events.ts
│   └── models.ts
├── utils/               # Utility functions
│   ├── apiClient.ts
│   ├── timeUtils.ts
│   └── formatters.ts
├── styles/              # Global styles
│   └── globals.css
├── App.tsx              # Main React application with routing
├── main.tsx             # Vite entry point
└── index.css            # Tailwind CSS imports

# Backend (Cloudflare Workers deployment)
src/
└── worker.ts            # Single Worker file with all API endpoints (2765+ lines)

# Shared Database Layer
lib/
└── db-workers.ts        # D1 Database manager with Zod schemas

# Database Migrations
migrations/
├── 0001_initial_schema.sql
├── 0002_time_lock_fields.sql
└── 0003_system_logs.sql

# Testing
tests/
├── e2e/                 # Playwright end-to-end tests
│   ├── auth.spec.ts
│   ├── picks.spec.ts
│   ├── leaderboard.spec.ts
│   └── time-lock.spec.ts
├── unit/                # Vitest unit tests
│   ├── apiClient.test.ts
│   ├── timeUtils.test.ts
│   └── formatters.test.ts
└── integration/         # Contract tests
    ├── auth.integration.test.ts
    ├── picks.integration.test.ts
    └── scoring.integration.test.ts

# Configuration
├── vite.config.ts       # Vite build configuration
├── wrangler-workers.toml # Cloudflare Workers config
├── tailwind.config.ts   # Tailwind CSS theme
├── tsconfig.json        # TypeScript configuration
├── playwright.config.ts # E2E test configuration
└── vitest.config.ts     # Unit test configuration

# Static Assets
public/
├── team-logos/          # NFL team logo images
├── favicon.ico
├── pwa-192x192.png
└── pwa-512x512.png

# Documentation (root level)
├── CLAUDE.md            # Claude development guide (already exists)
├── ARCHITECTURE.md      # Technical architecture (already exists)
├── PROJECT.md           # Project status (already exists)
└── README.md            # User-facing documentation
```

**Structure Decision**: Web application with clear separation between frontend (Vite + React) and backend (Cloudflare Workers). Frontend deployed to Cloudflare Pages, backend deployed as Workers with D1 database binding. The `src/worker.ts` file contains all API endpoints in a monolithic worker (current implementation is 2765 lines), which is acceptable for this small-scale application. Database layer is shared via `lib/db-workers.ts` with Zod schema validation.

This structure matches the existing implementation documented in ARCHITECTURE.md and PROJECT.md, ensuring consistency with the current codebase.

## Complexity Tracking

**Status**: ✅ No complexity violations

No constitutional violations to justify. The architecture follows standard patterns for serverless web applications:

- Single worker file acceptable for 10-20 endpoints in a small family application
- Direct D1 queries without ORM reduces complexity vs. adding Prisma/Drizzle layer
- Monolithic frontend appropriate for 6 page components and ~12 UI components
- PWA service worker adds complexity but required for mobile offline support (justified by mobile-first requirement)

All architectural decisions align with simplicity and pragmatism for the stated scale (4-10 users, 199 games/season).

## Phase 0: Research & Technology Decisions

### Research Tasks

Based on Technical Context unknowns and architectural decisions needed:

1. **Authentication Strategy**: Research bcryptjs vs. Argon2 for password hashing in Workers environment
2. **Real-Time Updates**: Research Server-Sent Events (SSE) vs. WebSockets vs. Polling for Cloudflare Workers
3. **Cron Job Reliability**: Research Cloudflare Cron triggers best practices for time-critical operations
4. **Mobile PWA Strategy**: Research Vite PWA plugin configuration for offline game viewing
5. **State Management**: Research React Context vs. Zustand vs. plain hooks for global state
6. **Testing Strategy**: Research Playwright best practices for testing time-based workflows (countdown timers, locks)
7. **Database Indexing**: Research optimal D1 SQLite indexes for time-series queries (game locks, leaderboard)
8. **API Integration Patterns**: Research ESPN API rate limiting and error handling strategies

### Output Artifact

`research.md` will document:
- **Decision**: Technology choice made
- **Rationale**: Why chosen (performance, compatibility, developer experience)
- **Alternatives Considered**: What else was evaluated and why rejected
- **Implementation Notes**: Key gotchas, configuration requirements, known limitations

## Phase 1: Design & Contracts

### Prerequisites
- `research.md` complete with all 8 technology decisions resolved
- No remaining NEEDS CLARIFICATION in Technical Context

### Data Model Design

**Input**: Key Entities from spec.md (User, Team, Game, Pick, Leaderboard Entry, Game Lock, System Log)

**Output**: `data-model.md` containing:
- Entity definitions with all fields and types
- Relationships (foreign keys, unique constraints)
- Validation rules (e.g., one pick per user per game)
- State transitions (game status: upcoming → locked → in_progress → final)
- Indexes for performance (week + season, lock time, user + game)

### API Contracts Generation

**Input**: Functional Requirements FR-001 through FR-020, User Stories acceptance scenarios

**Output**: `/contracts/` directory with:

1. **openapi.yaml**: Complete OpenAPI 3.0 specification with all endpoints
2. **auth.md**: Authentication endpoints (register, signin, session check)
3. **games.md**: Games endpoints (list games, get game status, update locks, live scores)
4. **picks.md**: Pick endpoints (submit pick, list picks, auto-generate picks, live status)
5. **leaderboard.md**: Leaderboard endpoints (get rankings, live updates)
6. **system.md**: System endpoints (logs, metrics, sync, migration)

Each contract document includes:
- HTTP method and path
- Request parameters (path, query, body)
- Request/response schemas
- Status codes and error responses
- Authentication requirements
- Example requests/responses

### Quickstart Guide

**Output**: `quickstart.md` for new developers containing:
- Prerequisites (Node.js, Wrangler CLI, accounts)
- Installation steps (`npm install`)
- Development setup (env variables, database initialization)
- Running locally (frontend dev server, Workers dev, database migrations)
- Running tests (unit, integration, e2e)
- Making first contribution (create branch, run tests, commit, PR)
- Troubleshooting common issues

### Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude` to add:
- Technology stack from research.md
- API patterns from contracts/
- Database schema from data-model.md
- Preserve existing manual additions between markers

## Phase 2: Task Generation

**NOT INCLUDED IN THIS COMMAND**

Phase 2 is executed separately via `/speckit.tasks` command, which will:
- Break down implementation into dependency-ordered tasks
- Map tasks to data model and API contracts
- Generate testing requirements for each task
- Output to `tasks.md`

## Next Steps After Planning

1. ✅ Review this plan.md for accuracy
2. ✅ Verify research.md addresses all technology unknowns
3. ✅ Validate data-model.md against spec.md entities
4. ✅ Confirm contracts/ match functional requirements
5. → Run `/speckit.tasks` to generate implementation tasks
6. → Run `/speckit.implement` to execute task-by-task implementation

## Validation Checklist

- [ ] All NEEDS CLARIFICATION resolved in Technical Context
- [ ] Constitution Check passed (or violations justified)
- [ ] research.md contains all 8 technology decisions
- [ ] data-model.md covers all 7 entities from spec
- [ ] contracts/ includes all endpoint categories (auth, games, picks, leaderboard, system)
- [ ] quickstart.md enables new developer to run app locally in <30 minutes
- [ ] Agent context updated with current plan details
