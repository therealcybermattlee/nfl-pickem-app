# Data Model: NFL Pick'em Application

**Feature**: 001-implement-research
**Date**: November 20, 2025
**Database**: Cloudflare D1 (SQLite 3.x compatible)

## Overview

This data model defines the database schema for the NFL Pick'em application, including all entities, relationships, constraints, and indexes. The schema supports the time-lock pick system, automated scoring, and leaderboard functionality.

**Design Principles**:
- Normalized to 3NF (Third Normal Form) to minimize redundancy
- Foreign key constraints enforced for referential integrity
- Unique constraints prevent duplicate picks per user per game
- Indexes optimized for read-heavy workload (games list, leaderboard queries)
- Timestamps in ISO 8601 format (UTC) for consistency

---

## Entity Relationship Diagram

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│  User   │◄───────┤   Pick   ├────────►│   Team   │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │                   │                     │
     │                   ▼                     │
     │              ┌──────────┐               │
     │              │   Game   │◄──────────────┘
     │              └────┬─────┘
     │                   │
     │                   ▼
     │              ┌────────────┐
     └─────────────►│Game Lock   │
                    └────────────┘

     ┌──────────────┐
     │ System Log   │  (audit trail)
     └──────────────┘

     ┌──────────────┐
     │Scheduler Log │  (cron execution tracking)
     └──────────────┘
```

**Relationships**:
- User has many Picks (1:N)
- Game has many Picks (1:N)
- Team referenced by Games (home/away/winner) and Picks (1:N each)
- Game has one Game Lock (1:1) when locked
- System Log and Scheduler Log are independent audit tables

---

## Entity Definitions

### 1. User

Represents a family member participating in the pick'em competition.

**Table Name**: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 identifier |
| email | TEXT | NOT NULL, UNIQUE | User's email address (login username) |
| name | TEXT | NULL | Display name for leaderboard |
| passwordHash | TEXT | NOT NULL | bcryptjs hash (12 rounds) |
| passwordSalt | TEXT | NULL | Deprecated (bcryptjs includes salt in hash) |
| role | TEXT | NOT NULL, DEFAULT 'user' | 'user' or 'admin' |
| createdAt | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updatedAt | TEXT | NOT NULL | ISO 8601 UTC timestamp |

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
```

**Constraints**:
- Email must be valid format (validated in application layer)
- Password must be hashed, never stored in plaintext
- Role limited to 'user' or 'admin' (application enforced)

**Validation Rules**:
- Email: RFC 5322 compliant, max 255 characters
- Name: Max 100 characters, allow Unicode
- PasswordHash: bcryptjs format ($2a$12$... or $2b$12$...)
- Role: Enum ['user', 'admin']

**Example Row**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "name": "Dad",
  "passwordHash": "$2b$12$KIXxJ5hN9x.sO3OqP.VwvOz1kQ7sP7vT3yK3mA8bN5P6tS8kL0qKm",
  "passwordSalt": null,
  "role": "user",
  "createdAt": "2025-09-01T00:00:00Z",
  "updatedAt": "2025-09-01T00:00:00Z"
}
```

---

### 2. Team

Represents one of the 32 NFL teams.

**Table Name**: `teams`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 identifier |
| name | TEXT | NOT NULL | Full team name (e.g., "Kansas City Chiefs") |
| abbreviation | TEXT | NOT NULL, UNIQUE | 2-3 letter code (e.g., "KC", "PHI") |
| conference | TEXT | NULL | 'AFC' or 'NFC' |
| division | TEXT | NULL | 'East', 'West', 'North', 'South' |
| primaryColor | TEXT | NULL | Hex color code (e.g., "#E31837") |
| secondaryColor | TEXT | NULL | Hex color code |
| logoUrl | TEXT | NULL | URL to team logo image |

**Indexes**:
```sql
-- Unique constraint on abbreviation creates implicit index
```

**Constraints**:
- Abbreviation must be uppercase (application enforced)
- Conference limited to 'AFC' or 'NFC' (application enforced)
- Division limited to 'East', 'West', 'North', 'South' (application enforced)

**Validation Rules**:
- Name: Max 100 characters
- Abbreviation: 2-3 uppercase letters, matches official NFL codes
- Conference/Division: Must match NFL structure
- Colors: Valid 6-digit hex codes (#RRGGBB)

**Example Row**:
```json
{
  "id": "cmf3dg24j000fdqxurb8dbij6",
  "name": "Kansas City Chiefs",
  "abbreviation": "KC",
  "conference": "AFC",
  "division": "West",
  "primaryColor": "#E31837",
  "secondaryColor": "#FFB81C",
  "logoUrl": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"
}
```

---

### 3. Game

Represents a single NFL game in the season.

**Table Name**: `games`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 identifier |
| espnId | TEXT | NULL | ESPN API game identifier |
| week | INTEGER | NOT NULL | Week number (1-18) |
| season | INTEGER | NOT NULL | Season year (e.g., 2025) |
| homeTeamId | TEXT | NOT NULL, FK→teams(id) | Home team UUID |
| awayTeamId | TEXT | NOT NULL, FK→teams(id) | Away team UUID |
| gameDate | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| lockTime | TEXT | NOT NULL | ISO 8601 UTC timestamp (when picks close) |
| status | TEXT | NOT NULL, DEFAULT 'upcoming' | 'upcoming', 'locked', 'in_progress', 'final' |
| homeScore | INTEGER | NULL | Final home team score |
| awayScore | INTEGER | NULL | Final away team score |
| spread | REAL | NULL | Betting line (e.g., -3.5 means home favored by 3.5) |
| overUnder | REAL | NULL | Total points line (e.g., 47.5) |
| isCompleted | BOOLEAN | NOT NULL, DEFAULT 0 | True when game finished |
| winnerTeamId | TEXT | NULL, FK→teams(id) | Winning team UUID |
| oddsProvider | TEXT | NULL | 'ESPN', 'The Odds API', 'ESPN + The Odds API' |
| lastSyncedAt | TEXT | NULL | ISO 8601 UTC timestamp of last data sync |

**Indexes**:
```sql
CREATE INDEX idx_games_week_season ON games(week, season);
CREATE INDEX idx_games_lock_time ON games(lockTime);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_completed ON games(isCompleted) WHERE isCompleted = 1;
```

**Foreign Keys**:
```sql
FOREIGN KEY (homeTeamId) REFERENCES teams(id)
FOREIGN KEY (awayTeamId) REFERENCES teams(id)
FOREIGN KEY (winnerTeamId) REFERENCES teams(id)
```

**Constraints**:
- lockTime must equal gameDate (picks lock when game starts)
- winnerTeamId must be homeTeamId or awayTeamId
- isCompleted = true requires homeScore, awayScore, winnerTeamId
- week between 1 and 18 (regular season)

**State Transitions**:
```
upcoming → locked → in_progress → final
```

**Validation Rules**:
- Week: Integer 1-18
- Season: Integer 2000-2099
- GameDate/LockTime: ISO 8601 UTC, future date when created
- Status: Enum ['upcoming', 'locked', 'in_progress', 'final']
- Spread: Decimal, typically between -20.0 and 20.0
- OverUnder: Decimal, typically between 30.0 and 70.0

**Example Row**:
```json
{
  "id": "game-001",
  "espnId": "401547417",
  "week": 1,
  "season": 2025,
  "homeTeamId": "team-phi-uuid",
  "awayTeamId": "team-dal-uuid",
  "gameDate": "2025-09-05T20:00:00Z",
  "lockTime": "2025-09-05T20:00:00Z",
  "status": "final",
  "homeScore": 24,
  "awayScore": 20,
  "spread": -1.5,
  "overUnder": 47.5,
  "isCompleted": true,
  "winnerTeamId": "team-phi-uuid",
  "oddsProvider": "ESPN",
  "lastSyncedAt": "2025-09-05T23:30:00Z"
}
```

---

### 4. Pick

Represents a user's prediction for a game winner.

**Table Name**: `picks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 identifier |
| userId | TEXT | NOT NULL, FK→users(id) | User who made the pick |
| gameId | TEXT | NOT NULL, FK→games(id) | Game being picked |
| teamId | TEXT | NOT NULL, FK→teams(id) | Team predicted to win |
| confidence | INTEGER | NULL | Confidence points (unused, reserved for future) |
| isCorrect | BOOLEAN | NULL | True if pick matches winner (set when game completes) |
| points | INTEGER | NOT NULL, DEFAULT 0 | Points earned (0 or 1) |
| lockedAt | TEXT | NULL | ISO 8601 UTC timestamp when pick locked |
| isLocked | BOOLEAN | NOT NULL, DEFAULT 0 | True when game started (picks frozen) |
| autoGenerated | BOOLEAN | NOT NULL, DEFAULT 0 | True if system generated (user missed deadline) |
| createdAt | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updatedAt | TEXT | NOT NULL | ISO 8601 UTC timestamp |

**Indexes**:
```sql
CREATE INDEX idx_picks_user_game ON picks(userId, gameId);
CREATE INDEX idx_picks_game_id ON picks(gameId);
CREATE INDEX idx_picks_is_locked ON picks(isLocked);
```

**Foreign Keys**:
```sql
FOREIGN KEY (userId) REFERENCES users(id)
FOREIGN KEY (gameId) REFERENCES games(id)
FOREIGN KEY (teamId) REFERENCES teams(id)
```

**Unique Constraint**:
```sql
UNIQUE(userId, gameId)  -- One pick per user per game
```

**Constraints**:
- teamId must be homeTeamId or awayTeamId of associated game
- isLocked = true requires lockedAt timestamp
- isCorrect set only when game.isCompleted = true
- points = 1 if isCorrect = true, otherwise 0

**Scoring Logic**:
```typescript
// When game completes:
if (pick.teamId === game.winnerTeamId) {
  pick.isCorrect = true;
  pick.points = 1;
} else {
  pick.isCorrect = false;
  pick.points = 0;
}
```

**Validation Rules**:
- Confidence: Integer 0-16 (if used, reserved for future confidence pools)
- Points: 0 or 1 only
- isLocked: Cannot update pick if true
- teamId: Must match either home or away team of game

**Example Row**:
```json
{
  "id": "pick-001",
  "userId": "user-dad-uuid",
  "gameId": "game-001",
  "teamId": "team-phi-uuid",
  "confidence": null,
  "isCorrect": true,
  "points": 1,
  "lockedAt": "2025-09-05T20:00:00Z",
  "isLocked": true,
  "autoGenerated": false,
  "createdAt": "2025-09-04T15:30:00Z",
  "updatedAt": "2025-09-05T20:00:00Z"
}
```

---

### 5. Game Lock

Represents the locked status of a game (enforces time-lock system).

**Table Name**: `game_locks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 identifier |
| gameId | TEXT | NOT NULL, UNIQUE, FK→games(id) | Game that is locked |
| lockedAt | TEXT | NOT NULL | ISO 8601 UTC timestamp when lock occurred |
| lockReason | TEXT | NULL | 'scheduled_start' or 'manual_override' |

**Indexes**:
```sql
CREATE INDEX idx_game_locks_locked_at ON game_locks(lockedAt);
-- UNIQUE constraint on gameId creates implicit index
```

**Foreign Keys**:
```sql
FOREIGN KEY (gameId) REFERENCES games(id)
```

**Constraints**:
- One lock per game (UNIQUE gameId)
- lockedAt should match or be slightly after game.lockTime
- Locks are immutable (never deleted, only inserted)

**Validation Rules**:
- LockReason: Enum ['scheduled_start', 'manual_override']
- LockedAt: Must be >= game.lockTime

**Example Row**:
```json
{
  "id": "lock-001",
  "gameId": "game-001",
  "lockedAt": "2025-09-05T20:00:03Z",
  "lockReason": "scheduled_start"
}
```

---

### 6. System Log

Represents automated system events for audit trail and troubleshooting.

**Table Name**: `system_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 identifier |
| eventType | TEXT | NOT NULL | 'score_update', 'lock_trigger', 'pick_generation', 'sync', 'migration' |
| status | TEXT | NOT NULL | 'success', 'failure', 'warning' |
| message | TEXT | NULL | Human-readable summary |
| details | TEXT | NULL | JSON string with event-specific data |
| createdAt | TEXT | NOT NULL | ISO 8601 UTC timestamp |

**Indexes**:
```sql
CREATE INDEX idx_system_logs_created_at ON system_logs(createdAt);
CREATE INDEX idx_system_logs_event_type ON system_logs(eventType);
```

**Constraints**:
- EventType limited to known types (application enforced)
- Status limited to 'success', 'failure', 'warning'
- Details must be valid JSON if present

**Validation Rules**:
- EventType: Enum ['score_update', 'lock_trigger', 'pick_generation', 'sync', 'migration']
- Status: Enum ['success', 'failure', 'warning']
- Message: Max 1000 characters
- Details: Valid JSON, max 10KB

**Example Row**:
```json
{
  "id": "log-001",
  "eventType": "lock_trigger",
  "status": "success",
  "message": "Locked 16 games for week 1",
  "details": "{\"gameIds\":[\"game-001\",\"game-002\"],\"executionId\":\"exec-123\"}",
  "createdAt": "2025-09-05T20:00:05Z"
}
```

---

### 7. Scheduler Log

Represents cron job execution tracking for monitoring automated jobs.

**Table Name**: `scheduler_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 identifier |
| executionId | TEXT | NOT NULL | UUID correlating all operations in single cron run |
| jobType | TEXT | NOT NULL | 'update_locks', 'generate_picks', 'update_scores', 'calculate_points' |
| status | TEXT | NOT NULL | 'started', 'success', 'failure' |
| startedAt | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| completedAt | TEXT | NULL | ISO 8601 UTC timestamp |
| duration | INTEGER | NULL | Execution time in milliseconds |
| recordsProcessed | INTEGER | NULL | Number of records affected |
| errorMessage | TEXT | NULL | Error details if status=failure |

**Indexes**:
```sql
CREATE INDEX idx_scheduler_logs_execution_id ON scheduler_logs(executionId);
CREATE INDEX idx_scheduler_logs_started_at ON scheduler_logs(startedAt);
```

**Constraints**:
- completedAt must be >= startedAt
- duration = completedAt - startedAt (milliseconds)
- status='success' requires completedAt
- status='failure' should have errorMessage

**Validation Rules**:
- JobType: Enum ['update_locks', 'generate_picks', 'update_scores', 'calculate_points']
- Status: Enum ['started', 'success', 'failure']
- Duration: Positive integer, typically <60000ms (1 minute)

**Example Row**:
```json
{
  "id": "sched-001",
  "executionId": "exec-123",
  "jobType": "update_locks",
  "status": "success",
  "startedAt": "2025-09-05T20:00:00Z",
  "completedAt": "2025-09-05T20:00:05Z",
  "duration": 5000,
  "recordsProcessed": 16,
  "errorMessage": null
}
```

---

## Derived Entities (Not Stored)

### Leaderboard Entry

Calculated dynamically from picks and games data, not a physical table.

**Calculation Query**:
```sql
SELECT
  u.id as userId,
  u.name as userName,
  COUNT(p.id) as totalPicks,
  SUM(CASE WHEN p.isCorrect = 1 THEN 1 ELSE 0 END) as correctPicks,
  SUM(p.points) as totalPoints,
  ROUND(
    SUM(CASE WHEN p.isCorrect = 1 THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(p.id),
    2
  ) as winPercentage
FROM users u
LEFT JOIN picks p ON p.userId = u.id
LEFT JOIN games g ON p.gameId = g.id
WHERE g.isCompleted = 1 AND g.week = ? AND g.season = ?
GROUP BY u.id
ORDER BY totalPoints DESC, winPercentage DESC;
```

**Structure**:
```typescript
interface LeaderboardEntry {
  userId: string;
  userName: string;
  position: number; // Calculated rank (1st, 2nd, 3rd...)
  totalPicks: number;
  correctPicks: number;
  totalPoints: number;
  winPercentage: number; // Decimal (e.g., 75.00 = 75%)
}
```

---

## Migration Strategy

**Migration Files**: Stored in `/migrations` directory, named sequentially.

### Migration 0001: Initial Schema
```sql
-- migrations/0001_initial_schema.sql
CREATE TABLE users (...);
CREATE TABLE teams (...);
CREATE TABLE games (...);
CREATE TABLE picks (...);
CREATE INDEX idx_users_email ON users(email);
-- ... all indexes
```

### Migration 0002: Time-Lock Fields
```sql
-- migrations/0002_time_lock_fields.sql
CREATE TABLE game_locks (...);
ALTER TABLE games ADD COLUMN lockTime TEXT;
ALTER TABLE picks ADD COLUMN isLocked BOOLEAN DEFAULT 0;
ALTER TABLE picks ADD COLUMN lockedAt TEXT;
CREATE INDEX idx_game_locks_locked_at ON game_locks(lockedAt);
```

### Migration 0003: System Logs
```sql
-- migrations/0003_system_logs.sql
CREATE TABLE system_logs (...);
CREATE TABLE scheduler_logs (...);
CREATE INDEX idx_system_logs_created_at ON system_logs(createdAt);
CREATE INDEX idx_scheduler_logs_execution_id ON scheduler_logs(executionId);
```

**Running Migrations**:
```bash
# Local development
wrangler d1 execute nfl-pickem-db --local --file=./migrations/0001_initial_schema.sql

# Production
wrangler d1 execute nfl-pickem-db --remote --file=./migrations/0001_initial_schema.sql
```

---

## Data Seeding

### Teams Seed Data

All 32 NFL teams must be seeded before any games can be created.

**Seed File**: `seeds/teams.sql`

```sql
INSERT INTO teams (id, name, abbreviation, conference, division, primaryColor, secondaryColor) VALUES
('cmf3dg24j000fdqxurb8dbij6', 'Kansas City Chiefs', 'KC', 'AFC', 'West', '#E31837', '#FFB81C'),
('cmf3dg24k000gdqxu8k5c3h9z', 'Philadelphia Eagles', 'PHI', 'NFC', 'East', '#004C54', '#A5ACAF'),
-- ... 30 more teams
;
```

### Test User Seed Data

**Seed File**: `seeds/test_user.sql`

```sql
INSERT INTO users (id, email, name, passwordHash, role, createdAt, updatedAt) VALUES
('test-user-001', 'test@example.com', 'Test User', '$2b$12$...', 'user', '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z');
```

---

## Performance Considerations

**Query Optimization**:
- Composite indexes on (week, season) speed up game list queries
- Partial index on isCompleted optimizes leaderboard calculations
- UNIQUE(userId, gameId) prevents duplicate picks and speeds up lookups

**Expected Data Volumes**:
- Users: 4-10 (negligible)
- Teams: 32 (static, preloaded)
- Games: 199 per season (relatively small)
- Picks: ~2000 per season (199 games × 10 users)
- Logs: ~5000 per season (cron runs every 15 min for 17 weeks)

**D1 Limits**:
- Database size: 2 GB max (current usage < 10 MB)
- Rows per table: Unlimited (practical limit ~millions)
- Read/write operations: 50ms p50, 200ms p99 (acceptable for this app)

---

## Data Integrity Rules

1. **Referential Integrity**: All foreign keys enforced, cascading deletes not used (preserve audit trail)
2. **Temporal Consistency**: lockTime = gameDate, lockedAt >= lockTime
3. **Scoring Consistency**: points = 1 if isCorrect, else 0
4. **Pick Uniqueness**: One pick per (userId, gameId) combination
5. **Team Validation**: teamId in picks must match game's homeTeamId or awayTeamId
6. **Status Transitions**: Games only move forward (upcoming → locked → in_progress → final), never backward
7. **Immutable Locks**: game_locks rows never updated or deleted
8. **Audit Completeness**: All automated operations logged to system_logs or scheduler_logs

---

## Next Steps

With data model complete, proceed to:
1. Generate API contracts (`/contracts/` directory)
2. Map contracts to these entities
3. Generate quickstart guide
4. Update agent context with schema details
