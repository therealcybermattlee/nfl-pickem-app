# Tasks: NFL Pick'em Application with Time-Lock System

**Input**: Design documents from `/specs/001-implement-research/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are MANDATORY per Constitution Principle I (Production-First Testing). Each user story MUST have Playwright E2E validation at checkpoint before declaring complete. Test tasks marked in Phase 9 (T134-T137) but testing REQUIRED throughout implementation, not deferred.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with:
- **Frontend**: `src/` (React + Vite)
- **Backend**: `src/worker.ts` (Cloudflare Workers)
- **Shared**: `lib/` (database layer)
- **Database**: `migrations/` (SQL migration files)
- **Tests**: `tests/` (E2E, unit, integration)

## Implementation Guidelines

### Specialized Agent Delegation (Constitution Principle II)

**MANDATORY**: Delegate tasks to specialized agents when the work matches their expertise. Do NOT attempt manual implementation first.

**Agent Usage by Task Type**:

- **Frontend Components** (T037-T047, T055-T062, T067, T072-T074, T079-T081, T089-T090, T097, T104, T108-T110):
  - Use `frontend-developer` agent for React components, responsive layouts, client-side state
  - Example: "Use frontend-developer to create GameCard component with mobile-responsive design"

- **Backend APIs** (T031-T036, T048-T051, T063-T066, T075-T078, T084-T088, T100-T103):
  - Use `backend-architect` agent for API endpoints, data flow, system architecture
  - Example: "Use backend-architect to design and implement GET /api/games endpoint with proper caching"

- **TypeScript Types** (T017-T019):
  - Use `typescript-pro` agent for complex type definitions, generics, advanced patterns
  - Example: "Use typescript-pro to define API response types with proper inference"

- **Deployment & Infrastructure** (T005, T009, T052, T111-T113):
  - Use `deployment-engineer` agent for Cloudflare Workers, cron triggers, PWA configuration
  - Example: "Use deployment-engineer to configure Cloudflare Cron triggers for game locks"

- **Code Review** (After completing any phase):
  - Use `code-reviewer` agent immediately after significant code changes
  - Example: "Use code-reviewer to review Phase 3 implementation before proceeding to Phase 4"

- **Architecture Review** (After T020-T024, after Phase 2, after any structural changes):
  - Use `architect-review` agent for structural changes, new services, API modifications
  - Example: "Use architect-review after completing Foundational phase to ensure SOLID principles"

- **Testing** (T134-T142, all E2E validation):
  - Use `test-automator` agent for comprehensive test suites, E2E scenarios, test coverage
  - Example: "Use test-automator to create Playwright E2E tests for User Story 1 pick submission flow"

- **UI/UX Design** (Before T037, T045-T046, T067, T072-T074):
  - Use `ui-ux-designer` agent for design systems, user flows, accessibility patterns
  - Example: "Use ui-ux-designer to design mobile-optimized pick selection interface"

**When in doubt**: If the task clearly matches an agent's specialty, USE THE AGENT. Manual implementation should only be used for simple, non-specialized tasks.

### Task Transparency (Constitution Principle V)

**MANDATORY**: Use TodoWrite tool for multi-step and complex task tracking throughout implementation.

**TodoWrite Usage Rules**:

1. **When to use**:
   - Beginning of each phase (create todos for all phase tasks)
   - Beginning of each user story (create todos for all story tasks)
   - Any time you're working on 3+ related tasks
   - When user explicitly requests task tracking

2. **Task states**:
   - `pending`: Task not yet started
   - `in_progress`: Currently working (LIMIT: only ONE task at a time)
   - `completed`: Task finished successfully

3. **Updating rules**:
   - Mark task `in_progress` BEFORE starting work
   - Mark task `completed` IMMEDIATELY after finishing (no batching)
   - Only ONE task should be `in_progress` at any time
   - Update in real-time as you work, don't batch at end

4. **Task descriptions**:
   - **content**: Imperative form (e.g., "Create GameCard component")
   - **activeForm**: Present continuous (e.g., "Creating GameCard component")

**Example Usage**:

```javascript
// Starting Phase 3
TodoWrite({
  todos: [
    {content: "Implement GET /api/games endpoint", status: "pending", activeForm: "Implementing games API"},
    {content: "Create GameCard component", status: "pending", activeForm: "Creating GameCard component"},
    {content: "Create CountdownTimer component", status: "pending", activeForm: "Creating countdown timer"}
  ]
});

// Before starting first task
TodoWrite({
  todos: [
    {content: "Implement GET /api/games endpoint", status: "in_progress", activeForm: "Implementing games API"},
    {content: "Create GameCard component", status: "pending", activeForm: "Creating GameCard component"},
    {content: "Create CountdownTimer component", status: "pending", activeForm: "Creating countdown timer"}
  ]
});

// Immediately after completing first task
TodoWrite({
  todos: [
    {content: "Implement GET /api/games endpoint", status: "completed", activeForm: "Implementing games API"},
    {content: "Create GameCard component", status: "in_progress", activeForm: "Creating GameCard component"},
    {content: "Create CountdownTimer component", status: "pending", activeForm: "Creating countdown timer"}
  ]
});
```

**Rationale**: Transparent task management ensures completeness and gives users visibility into progress. Prevents tasks from being forgotten or left incomplete.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize npm project with TypeScript 5.2+ and configure package.json dependencies
- [X] T002 [P] Setup Vite 5.0+ configuration in vite.config.ts with React plugin
- [X] T003 [P] Configure Tailwind CSS 3.3+ in tailwind.config.ts with custom theme
- [X] T004 [P] Setup TypeScript configuration in tsconfig.json with strict mode enabled
- [X] T005 [P] Configure Wrangler CLI in wrangler-workers.toml for Cloudflare Workers deployment
- [X] T006 [P] Create project structure directories: src/components/, src/pages/, src/hooks/, src/types/, src/utils/, lib/, migrations/, tests/
- [X] T007 [P] Setup ESLint and Prettier configuration files for code quality
- [X] T008 Create .env.local.example template with VITE_API_BASE_URL placeholder
- [X] T009 [P] Configure Vite PWA plugin in vite.config.ts for offline support
- [X] T010 [P] Create .gitignore with node_modules/, dist/, .env.local, .dev.vars entries

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [X] T011 Create database schema migration 0001_initial_schema.sql in migrations/ with users, teams, games, picks tables
- [X] T012 Create database schema migration 0002_time_lock_fields.sql in migrations/ with game_locks table and lock-related columns
- [ ] T013 Create database schema migration 0003_system_logs.sql in migrations/ with system_logs and scheduler_logs tables
- [ ] T014 Create teams seed data file seeds/teams.sql with all 32 NFL teams (UUIDs, names, abbreviations, conferences, divisions, colors)
- [ ] T015 Create test user seed data file seeds/test_user.sql with test@example.com account (bcrypt hashed password)
- [X] T016 Implement D1 database manager in lib/db-workers.ts with Zod schema validation for type safety

### TypeScript Types Foundation

- [X] T017 [P] Define core types in src/types/api.ts (Team, Game, Pick, User, Leaderboard interfaces)
- [X] T018 [P] Define event types in src/types/events.ts (RealTimeEvent union types for SSE)
- [ ] T019 [P] Define model types in src/types/models.ts (GameStatus, LeaderboardEntry extended types)

### API Infrastructure Foundation

- [X] T020 Create Cloudflare Workers entry point in src/worker.ts with request router and CORS headers
- [X] T021 Implement JWT authentication helpers in src/worker.ts (createJWT, verifyJWT functions using jose library)
- [X] T022 Implement bcryptjs password hashing helpers in src/worker.ts (hashPassword, verifyPassword functions with 12 rounds)
- [X] T023 Implement authentication middleware in src/worker.ts (requireAuth function for protected routes)
- [X] T024 Setup error handling and response helpers in src/worker.ts (errorResponse, successResponse utility functions)

### Frontend Foundation

- [X] T025 [P] Create React Router setup in src/App.tsx with route configuration for HomePage, GamesPage, LeaderboardPage, SignInPage, SignUpPage
- [X] T026 [P] Create main entry point in src/main.tsx with React 18 createRoot and strict mode
- [X] T027 [P] Setup Tailwind CSS imports in src/index.css with base, components, utilities layers
- [X] T028 [P] Create API client utility in src/utils/apiClient.ts with get/post methods, auth headers, base URL configuration
- [X] T029 [P] Create time utility helpers in src/utils/timeUtils.ts (formatDuration, calculateTimeRemaining, formatGameTime functions)
- [X] T030 [P] Create formatters utility in src/utils/formatters.ts (formatScore, formatSpread, formatPercentage functions)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View and Submit Picks Before Game Starts (Priority: P1) 🎯 MVP

**Goal**: Users can view upcoming NFL games for the current week and submit their picks for who will win. Picks can be changed multiple times until the game starts, then automatically lock.

**Independent Test**: Create test user → display week 1 games → submit pick for unlocked game → verify pick saved → change pick → verify update → attempt to change locked game pick → verify rejection

### Backend - Games API (US1)

- [X] T031 [P] [US1] Implement GET /api/games endpoint in src/worker.ts to fetch games by week and season with team details
- [X] T032 [P] [US1] Implement GET /api/games/status endpoint in src/worker.ts to return game status with isLocked, timeUntilLock calculations
- [X] T033 [P] [US1] Add game data sync helper in src/worker.ts (syncGamesFromESPN function to populate database from ESPN API)

### Backend - Picks API (US1)

- [X] T034 [P] [US1] Implement GET /api/picks endpoint in src/worker.ts to fetch user's picks with authentication
- [X] T035 [US1] Implement POST /api/picks endpoint in src/worker.ts with pick submission, lock time validation, upsert logic (depends on T023 auth middleware)
- [X] T036 [US1] Add pick lock validation helper in src/worker.ts (validatePickBeforeLock function checking game.lockTime vs current time)

### Frontend - Games Display (US1)

- [X] T037 [P] [US1] Create GameCard component in src/components/GameCard.tsx displaying teams, scores, spread, over/under, game time
- [X] T038 [P] [US1] Create CountdownTimer component in src/components/CountdownTimer.tsx with 1-second interval updates, expiration callback
- [X] T039 [P] [US1] Create GameLockStatus component in src/components/GameLockStatus.tsx showing locked/open/locking-soon states with icons
- [X] T040 [US1] Create HomePage in src/pages/HomePage.tsx with week selector, games list, pick submission integration (depends on T037, T038, T039)

### Frontend - Pick Submission (US1)

- [X] T041 [P] [US1] Create PickSelector component in src/components/PickSelector.tsx with team selection buttons, visual feedback, loading states
- [X] T042 [US1] Integrate PickSelector into GameCard in src/components/GameCard.tsx with onPickSubmit callback (depends on T041)
- [X] T043 [US1] Add pick submission logic to HomePage in src/pages/HomePage.tsx calling POST /api/picks via apiClient (depends on T035, T042)
- [X] T044 [US1] Add optimistic UI updates to HomePage in src/pages/HomePage.tsx updating local state immediately, rolling back on error

### Mobile Optimization (US1)

- [X] T045 [P] [US1] Create MobileGameCard component in src/components/mobile/MobileGameCard.tsx with compact layout for 375px+ screens
- [X] T046 [P] [US1] Create MobilePickModal component in src/components/mobile/MobilePickModal.tsx for touch-optimized pick selection
- [X] T047 [US1] Add mobile viewport detection hook in src/hooks/useMobileViewport.ts using matchMedia for responsive rendering (depends on T045, T046)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view games and submit/change picks until lock time

---

## Phase 4: User Story 2 - View Real-Time Game Results and Scoring (Priority: P1)

**Goal**: Users see live scores during/after games, whether their picks were correct, and points earned. System automatically awards 1 point per correct pick.

**Independent Test**: Mark test games as completed with final scores → verify points calculated correctly → display results to user → show correct/incorrect indicators → verify weekly/seasonal point totals

### Backend - Scoring System (US2)

- [X] T048 [P] [US2] Implement score update helper in src/worker.ts (updateGameScores function fetching from ESPN API, updating games table)
- [X] T049 [P] [US2] Implement point calculation helper in src/worker.ts (calculatePickPoints function: isCorrect=true if pick.teamId===game.winnerTeamId, points=1 else 0)
- [X] T050 [US2] Implement POST /api/scores/update endpoint in src/worker.ts triggering score sync and point calculation (depends on T048, T049)
- [X] T051 [US2] Implement GET /api/games/live-scores endpoint in src/worker.ts returning in-progress game scores with quarter, time remaining

### Backend - Automated Scoring (US2)

- [X] T052 [US2] Implement Cloudflare Cron handler in src/worker.ts scheduled() function calling updateGameScores and calculatePickPoints every 15 minutes
- [X] T053 [US2] Add system logging to Cron handler in src/worker.ts writing to system_logs and scheduler_logs tables with execution details
- [X] T054 [US2] Add idempotency checks to scoring logic in src/worker.ts preventing duplicate point awards for same game completion

### Frontend - Score Display (US2)

- [X] T055 [P] [US2] Create GameResult component in src/components/GameResult.tsx showing final score, winner indicator, user's pick correctness
- [X] T056 [US2] Update GameCard component in src/components/GameCard.tsx to display GameResult when game.isCompleted=true (depends on T055)
- [X] T057 [US2] Create GamesPage in src/pages/GamesPage.tsx showing all games with live scores, pick status, points earned

### Frontend - Pick History (US1/US2 extension for FR-009)

- [X] T058 [P] [US1] Implement GET /api/picks/history endpoint in src/worker.ts returning picks with game outcomes, filtering by userId, season, optional week
- [X] T059 [P] [US1] Create PickHistoryPage in src/pages/PickHistoryPage.tsx displaying user's picks grouped by week with game results
- [X] T060 [US1] Add pick history navigation to Header in src/components/Header.tsx with "History" link routing to /history (depends on T058, T059)
- [X] T061 [US1] Add filtering controls to PickHistoryPage for week selection, season selection, correct/incorrect/all toggle
- [X] T062 [US1] Add statistics summary to PickHistoryPage showing total picks, correct count, win percentage, best week

### Frontend - Points Display (US2)

- [X] T063 [US2] Add points display to HomePage in src/pages/HomePage.tsx showing user's weekly/seasonal point totals

### Frontend - Real-Time Updates (US2)

- [X] T064 [P] [US2] Create useRealTimeUpdates hook in src/hooks/useRealTimeUpdates.ts connecting to SSE /api/events/stream endpoint with polling fallback
- [X] T065 [US2] Implement Server-Sent Events endpoint in src/worker.ts GET /api/events/stream using TransformStream for live score/lock updates
- [X] T066 [US2] Implement polling endpoint in src/worker.ts GET /api/events/poll?lastEventId for clients without SSE support
- [X] T067 [US2] Integrate useRealTimeUpdates into GamesPage in src/pages/GamesPage.tsx auto-refreshing scores when ScoreUpdateEvent received (depends on T064)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can make picks AND see real-time results with automatic scoring

---

## Phase 5: User Story 3 - View Family Competition Leaderboard (Priority: P2)

**Goal**: Users view leaderboard showing all family members ranked by points with win percentage. Can filter by week or season-long standings.

**Independent Test**: Multiple users with completed games → display leaderboard sorted by points → show position, win percentage → filter by week → verify only week's points shown → switch to season view → verify all points shown

### Backend - Leaderboard API (US3)

- [X] T068 [P] [US3] Implement GET /api/leaderboard endpoint in src/worker.ts calculating rankings from picks join games join users, filtering by week/season
- [X] T069 [P] [US3] Implement leaderboard calculation helper in src/worker.ts (calculateLeaderboard function: COUNT picks, SUM points, calculate win%, assign positions)
- [X] T070 [US3] Implement GET /api/leaderboard/live endpoint in src/worker.ts for real-time leaderboard updates during game day (depends on T068, T069)
- [X] T071 [US3] Add tie-breaking logic to leaderboard in src/worker.ts (equal points → sort by winPercentage, then alphabetically by name)

### Frontend - Leaderboard Display (US3)

- [X] T072 [P] [US3] Create LeaderboardTable component in src/components/LeaderboardTable.tsx displaying position, name, points, win%, with responsive table/card layouts
- [X] T073 [US3] Create LeaderboardPage in src/pages/LeaderboardPage.tsx with week selector dropdown, leaderboard table, weekly vs seasonal toggle (depends on T072)
- [X] T074 [US3] Add week filtering to LeaderboardPage in src/pages/LeaderboardPage.tsx calling GET /api/leaderboard?week={n} on dropdown change
- [X] T075 [US3] Add season-long view to LeaderboardPage in src/pages/LeaderboardPage.tsx calling GET /api/leaderboard?season={year} without week parameter

### Frontend - Leaderboard Real-Time Updates (US3)

- [X] T076 [US3] Integrate useRealTimeUpdates into LeaderboardPage in src/pages/LeaderboardPage.tsx refreshing on GameCompletedEvent, LeaderboardUpdateEvent (depends on T064)
- [X] T077 [US3] Add position change animations to LeaderboardTable in src/components/LeaderboardTable.tsx highlighting rank increases/decreases

### Mobile - Leaderboard Responsive Design (US3)

- [X] T078 [P] [US3] Create MobileLeaderboardCard component in src/components/mobile/MobileLeaderboardCard.tsx with compact card layout for narrow screens
- [X] T079 [US3] Add responsive breakpoint logic to LeaderboardTable in src/components/LeaderboardTable.tsx switching table→cards at <768px width (depends on T078)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work - users can make picks, see results, AND compare on leaderboard

---

## Phase 6: User Story 4 - Auto-Generate Picks for Missed Deadlines (Priority: P2)

**Goal**: When users don't submit picks before lock time, system automatically generates random picks so they don't miss out on potential points.

**Independent Test**: Create user → don't submit pick → wait for lock time → run auto-generation → verify random pick created with autoGenerated=true flag → verify pick displays with indicator → verify point award works same as manual pick

### Backend - Auto-Pick Generation (US4)

- [X] T080 [P] [US4] Implement auto-pick generation helper in src/worker.ts (autoGeneratePicksForLockedGames function finding users without picks, creating random teamId selection)
- [X] T081 [P] [US4] Implement POST /api/picks/auto-generate endpoint in src/worker.ts (API key protected) triggering auto-generation for all locked games without picks
- [X] T082 [US4] Add auto-generation to Cron handler in src/worker.ts scheduled() calling autoGeneratePicksForLockedGames after updateGameLocks (depends on T080, T052)
- [X] T083 [US4] Add random selection logic in src/worker.ts ensuring 50/50 distribution between home/away teams for fairness

### Frontend - Auto-Pick Indicators (US4)

- [X] T084 [P] [US4] Add auto-generated indicator to GameCard in src/components/GameCard.tsx showing badge/icon when pick.autoGenerated=true
- [X] T085 [P] [US4] Add auto-generated filter to GamesPage in src/pages/GamesPage.tsx allowing users to see which picks were automatic
- [X] T086 [US4] Update PickSelector in src/components/PickSelector.tsx to display "Auto-picked" label with disabled state for locked games (depends on T084)

### System Logging (US4)

- [X] T087 [US4] Add detailed logging to auto-generation in src/worker.ts recording gameId, userId, teamId to system_logs with event_type='pick_generation'
- [ ] T088 [US4] Create admin endpoint GET /api/system/auto-picks-report in src/worker.ts showing auto-generation statistics per week

**Checkpoint**: At this point, User Stories 1-4 work - picks can be made manually OR auto-generated, with full scoring and leaderboard support

---

## Phase 7: User Story 5 - Sign In and Manage Account (Priority: P2)

**Goal**: Family members create accounts with email/password, sign in to access app, sign out when done. Sessions last 24 hours.

**Independent Test**: Visit registration page → create account → verify auto sign-in → sign out → sign in again → verify session persists → wait 24 hours → verify session expires

### Backend - Authentication Endpoints (US5)

- [X] T089 [P] [US5] Implement POST /api/auth/register endpoint in src/worker.ts creating user with bcrypt hash, returning JWT token (depends on T021, T022)
- [X] T090 [P] [US5] Implement POST /api/auth/signin endpoint in src/worker.ts verifying credentials, returning JWT with 24h expiration (depends on T021, T022)
- [X] T091 [P] [US5] Implement GET /api/auth/session endpoint in src/worker.ts validating JWT, returning current user details (depends on T023)
- [ ] T092 [US5] Add email validation to registration in src/worker.ts checking RFC 5322 format, preventing duplicate emails
- [X] T093 [US5] Add password strength validation to registration in src/worker.ts requiring min 8 characters (configurable)

### Frontend - Authentication Pages (US5)

- [X] T094 [P] [US5] Create SignInPage in src/pages/SignInPage.tsx with email/password form, error display, redirect to home on success
- [X] T095 [P] [US5] Create SignUpPage in src/pages/SignUpPage.tsx with email/password/name form, auto sign-in on registration success (depends on T089)
- [X] T096 [US5] Add authentication context in src/contexts/AuthContext.tsx managing user state, token storage in localStorage, session validation
- [X] T097 [US5] Add protected route wrapper in src/App.tsx redirecting unauthenticated users to /signin (depends on T096)

### Frontend - Session Management (US5)

- [X] T098 [US5] Add session persistence to AuthContext in src/contexts/AuthContext.tsx storing token in localStorage, validating on app load
- [X] T099 [US5] Add sign out functionality to AuthContext in src/contexts/AuthContext.tsx clearing localStorage, redirecting to /signin
- [X] T100 [US5] Add session expiration handling to apiClient in src/utils/apiClient.ts catching 401 errors, triggering sign out
- [ ] T101 [US5] Add automatic token refresh to AuthContext in src/contexts/AuthContext.tsx checking expiration, prompting re-authentication at 24h mark

### Frontend - User Interface Updates (US5)

- [X] T102 [P] [US5] Add navigation header component in src/components/Header.tsx showing user name, sign out button when authenticated
- [ ] T103 [US5] Update App.tsx routing to show Header on authenticated pages (depends on T102)
- [ ] T104 [US5] Add loading state to authentication pages during sign-in/registration API calls

**Checkpoint**: At this point, User Stories 1-5 work - full authentication system with all pick'em features available per-user

---

## Phase 8: User Story 6 - Receive Real-Time Notifications (Priority: P3)

**Goal**: Users get real-time notifications when games about to lock (<1 hour) and when scores update for their picks.

**Independent Test**: User viewing app → game approaching lock time → verify warning notification appears → game score updates → verify notification shown → multiple games lock → verify batched notification

### Backend - Notification Events (US6)

- [X] T105 [P] [US6] Implement event creation helper in src/worker.ts (createRealTimeEvent function writing to events table with type, payload, scope, expiration)
- [X] T106 [P] [US6] Implement POST /api/events endpoint in src/worker.ts for manually triggering notifications (testing/admin)
- [ ] T107 [US6] Add GameLockEvent emission to Cron handler in src/worker.ts when lock time <60 minutes (depends on T105, T052)
- [ ] T108 [US6] Add ScoreUpdateEvent emission to score sync in src/worker.ts when homeScore or awayScore changes (depends on T105, T048)

### Frontend - Notification System (US6)

- [X] T109 [P] [US6] Create Notification component in src/components/Notification.tsx displaying toast-style notifications with dismiss action
- [X] T110 [P] [US6] Create NotificationProvider in src/contexts/NotificationContext.tsx managing notification queue, auto-dismiss timers
- [X] T111 [US6] Integrate useRealTimeUpdates event handling in NotificationProvider showing notifications for GameLockEvent, ScoreUpdateEvent (depends on T064, T110)
- [ ] T112 [US6] Add batching logic to NotificationProvider in src/contexts/NotificationContext.tsx combining multiple simultaneous lock events into single notification

### Frontend - Lock Warning Indicators (US6)

- [ ] T113 [P] [US6] Add urgent state to CountdownTimer in src/components/CountdownTimer.tsx changing color/style when <1 hour remaining
- [ ] T114 [US6] Add warning banner to HomePage in src/pages/HomePage.tsx showing count of games locking soon
- [ ] T115 [US6] Add visual pulsing animation to GameLockStatus in src/components/GameLockStatus.tsx when isLockingSoon=true (depends on T039)

### PWA - Push Notifications (US6)

- [X] T116 [P] [US6] Configure service worker in vite.config.ts PWA plugin for push notification support
- [ ] T117 [US6] Add push notification permission request to App.tsx on first load (if PWA installed)
- [ ] T118 [US6] Implement background sync for notifications in service worker caching game lock times, triggering notifications even when app closed

**Checkpoint**: At this point, all User Stories 1-6 complete - full-featured NFL Pick'em app with real-time notifications

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Performance Optimization

- [X] T119 [P] Add lazy loading to React Router routes in src/App.tsx using React.lazy() for code splitting
- [ ] T120 [P] Add memoization to expensive components in src/components/ using React.memo() for GameCard, LeaderboardTable
- [ ] T121 [P] Add database query optimization in src/worker.ts using composite indexes, query result caching
- [ ] T122 [P] Add image optimization to team logos using Vite asset pipeline, lazy loading images below fold

### Error Handling & Resilience

- [X] T123 [P] Add global error boundary in src/App.tsx catching React errors, displaying friendly error page
- [ ] T124 [P] Add retry logic to apiClient in src/utils/apiClient.ts for failed API calls with exponential backoff
- [ ] T125 [P] Add offline detection to App.tsx showing banner when network unavailable, queuing actions for later
- [ ] T126 [P] Add circuit breaker pattern to ESPN API integration in src/worker.ts preventing cascading failures

### Security Hardening

- [ ] T127 [P] Add rate limiting to authentication endpoints in src/worker.ts preventing brute force attacks
- [ ] T128 [P] Add input sanitization to all form inputs in src/pages/ preventing XSS attacks
- [ ] T129 [P] Add CSRF protection to state-changing endpoints in src/worker.ts using token validation
- [X] T130 [P] Add security headers to Worker responses in src/worker.ts (X-Content-Type-Options, X-Frame-Options, CSP)

### Accessibility (WCAG 2.1 AA)

- [X] T131 [P] Add ARIA labels to interactive components in src/components/ for screen reader support
- [ ] T132 [P] Add keyboard navigation support to GameCard in src/components/GameCard.tsx enabling pick selection via keyboard
- [ ] T133 [P] Add focus management to modal components ensuring focus trapped in MobilePickModal
- [ ] T134 [P] Add color contrast validation to Tailwind theme in tailwind.config.ts ensuring 4.5:1 minimum ratio

### Documentation

- [ ] T135 [P] Create API documentation in docs/API.md documenting all endpoints, request/response schemas
- [ ] T136 [P] Update README.md with project overview, quick start, deployment instructions
- [ ] T137 [P] Create deployment guide in docs/DEPLOYMENT.md with Cloudflare Pages + Workers steps
- [ ] T138 [P] Validate quickstart.md by following steps on fresh machine, updating any outdated instructions

### Testing Setup (Optional - for later)

- [X] T139 [P] Setup Playwright configuration in playwright.config.ts for E2E testing
- [X] T140 [P] Setup Vitest configuration in vitest.config.ts for unit testing
- [ ] T141 [P] Create E2E test fixtures in tests/e2e/fixtures.ts for common test data
- [X] T142 [P] Create example E2E test in tests/e2e/picks.spec.ts testing full pick submission flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - User Story 1 (P1) - Can start after Foundational ✅ MVP
  - User Story 2 (P1) - Can start after Foundational ✅ MVP
  - User Story 3 (P2) - Can start after Foundational (independent)
  - User Story 4 (P2) - Depends on US2 (needs scoring system)
  - User Story 5 (P2) - Can start after Foundational (independent)
  - User Story 6 (P3) - Depends on US2 (needs real-time updates hook)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - pure game viewing and picking
- **User Story 2 (P1)**: No dependencies on other stories - scoring independent of leaderboard
- **User Story 3 (P2)**: Independent - can work without other stories (uses existing pick data)
- **User Story 4 (P2)**: Soft dependency on US2 (uses Cron infrastructure), but can be implemented independently
- **User Story 5 (P2)**: Independent - authentication layer doesn't depend on game features
- **User Story 6 (P3)**: Depends on US2 (reuses useRealTimeUpdates hook and SSE infrastructure)

### Within Each User Story

- Backend API endpoints before frontend pages that consume them
- Utility components (CountdownTimer, GameCard) before pages (HomePage, GamesPage)
- Hooks (useRealTimeUpdates, useMobileViewport) before components that use them
- Types definitions (src/types/) loaded in Foundational phase, available to all stories

### Parallel Opportunities

**Setup Phase (Phase 1)**: All 10 tasks marked [P] can run in parallel

**Foundational Phase (Phase 2)**: Groups can run in parallel:
- Database tasks (T011-T016) sequentially (migration order matters)
- Type tasks (T017-T019) in parallel
- API infrastructure (T020-T024) in parallel
- Frontend foundation (T025-T030) in parallel

**User Story Phases**:
- Once Foundational complete, US1 and US2 can start in parallel (no dependencies)
- US3 and US5 can start in parallel after Foundational
- US4 starts after US2 has Cron infrastructure
- US6 starts after US2 has real-time hook

**Within User Stories**:
- All [P] marked tasks can run in parallel within their story
- Example US1: T031, T032, T033 (Games API) can run parallel with T037, T038, T039 (Frontend components)

---

## Parallel Example: User Story 1

```bash
# Backend APIs can run in parallel:
Task T031: Implement GET /api/games endpoint in src/worker.ts
Task T032: Implement GET /api/games/status endpoint in src/worker.ts
Task T033: Add game data sync helper in src/worker.ts

# Frontend components can run in parallel:
Task T037: Create GameCard component in src/components/GameCard.tsx
Task T038: Create CountdownTimer component in src/components/CountdownTimer.tsx
Task T039: Create GameLockStatus component in src/components/GameLockStatus.tsx

# Mobile components can run in parallel:
Task T045: Create MobileGameCard component in src/components/mobile/MobileGameCard.tsx
Task T046: Create MobilePickModal component in src/components/mobile/MobilePickModal.tsx

# Backend and Frontend work can happen simultaneously on different files
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

Minimum Viable Product for family NFL pick'em:

1. ✅ Complete Phase 1: Setup (~10 tasks, 2-3 hours)
2. ✅ Complete Phase 2: Foundational (~20 tasks, 1-2 days)
3. ✅ Complete Phase 3: User Story 1 - Pick Submission (~22 tasks, 3-4 days - includes pick history)
4. ✅ Complete Phase 4: User Story 2 - Scoring & Results (~15 tasks, 2-3 days)
5. **STOP and VALIDATE**: Test independently, deploy demo
6. **MVP DELIVERED**: Users can make picks, view history, see scores, earn points

**MVP Scope**: Phases 1-4 = 67 tasks total (updated from 62 - added FR-009 pick history coverage)

### Incremental Delivery (Adding Each Story)

1. **Foundation + MVP** (Phases 1-4) → 67 tasks → **Deploy** ✅ (includes pick history feature)
2. **Add Leaderboard** (Phase 5) → +12 tasks → **Deploy** showing family rankings
3. **Add Auto-Picks** (Phase 6) → +9 tasks → **Deploy** preventing missed games
4. **Add Authentication** (Phase 7) → +16 tasks → **Deploy** multi-user support
5. **Add Notifications** (Phase 8) → +14 tasks → **Deploy** real-time alerts
6. **Polish & Launch** (Phase 9) → +24 tasks → **Production Launch**

**Full Feature Set**: 142 tasks total (updated from 137)

### Parallel Team Strategy

With multiple developers (if applicable):

1. **Week 1**: Team completes Setup + Foundational together (Phases 1-2)
2. **Week 2-3**: Once Foundational done, split work:
   - Developer A: User Story 1 (Pick submission)
   - Developer B: User Story 2 (Scoring)
   - Both stories integrate at week end
3. **Week 4**: Merge MVP, test together, deploy
4. **Week 5+**: Continue with US3, US4, US5, US6 in parallel or sequentially

---

## Task Statistics

**Total Tasks**: 142 (increased from 137 - added 5 tasks for FR-009 pick history coverage)

**By Phase**:
- Phase 1 (Setup): 10 tasks
- Phase 2 (Foundational): 20 tasks
- Phase 3 (US1 - Picks): 22 tasks (was 17 - added 5 for pick history feature)
- Phase 4 (US2 - Scoring): 15 tasks
- Phase 5 (US3 - Leaderboard): 12 tasks
- Phase 6 (US4 - Auto-Picks): 9 tasks
- Phase 7 (US5 - Auth): 16 tasks
- Phase 8 (US6 - Notifications): 14 tasks
- Phase 9 (Polish): 24 tasks

**Parallel Tasks**: 80 tasks marked [P] (56% can run in parallel within their phase - includes 2 new parallel tasks T058, T059)

**MVP Tasks**: 67 tasks (Phases 1-4 only - increased from 62 due to pick history addition)

**Critical Path**: Setup → Foundational → US1 → US2 → Deploy MVP (estimated 7-10 days for single developer)

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- **Each user story** should be independently completable and testable
- **Commit** after each task or logical group
- **Stop at checkpoints** to validate stories work independently
- **No tests included** by default - add testing phase later if desired (tasks T134-T137 provide starting point)
- **File paths** are exact - use these paths when implementing tasks
- **Dependencies** clearly marked - respect them to avoid rework
- **MVP scope** clearly defined - deploy early, iterate based on feedback

---

## Success Criteria

**MVP (User Stories 1-2)** achieves:
- ✅ Users can view games and submit picks
- ✅ Picks lock automatically at game time
- ✅ Scores update every 15 minutes via cron
- ✅ Points awarded automatically
- ✅ Mobile responsive (375px+ width)

**Full Feature Set (All User Stories)** adds:
- ✅ Family leaderboard with rankings
- ✅ Auto-generated picks for missed deadlines
- ✅ Multi-user authentication
- ✅ Real-time notifications

**Polish Phase** ensures:
- ✅ Production-ready error handling
- ✅ Security hardening complete
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Performance optimized
- ✅ Documentation complete
