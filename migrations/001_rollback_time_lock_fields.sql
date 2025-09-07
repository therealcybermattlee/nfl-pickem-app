-- Rollback Script: Remove Time-Lock Fields (Sprint 1)
-- This script removes time-lock functionality from the database
-- Run with: wrangler d1 execute nfl-pickem-db --file=migrations/001_rollback_time_lock_fields.sql

-- WARNING: This will remove all time-lock data and cannot be undone

-- Step 1: Drop time-lock specific indexes
DROP INDEX IF EXISTS idx_games_lock_time;
DROP INDEX IF EXISTS idx_games_status;
DROP INDEX IF EXISTS idx_games_status_lock_time;
DROP INDEX IF EXISTS idx_picks_locked_at;
DROP INDEX IF EXISTS idx_picks_is_locked;
DROP INDEX IF EXISTS idx_picks_auto_generated;
DROP INDEX IF EXISTS idx_picks_user_locked;
DROP INDEX IF EXISTS idx_game_locks_lock_time;
DROP INDEX IF EXISTS idx_game_locks_is_locked;
DROP INDEX IF EXISTS idx_game_locks_last_checked;
DROP INDEX IF EXISTS idx_game_locks_auto_picks;

-- Step 2: Drop game_locks table
DROP TABLE IF EXISTS game_locks;

-- Step 3: Remove columns from picks table
-- Note: SQLite doesn't support DROP COLUMN, so we need to recreate the table
CREATE TABLE picks_backup AS SELECT 
  id, userId, gameId, teamId, confidence, isCorrect, points, createdAt, updatedAt
FROM picks;

DROP TABLE picks;

CREATE TABLE picks (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  gameId TEXT NOT NULL,
  teamId TEXT NOT NULL,
  confidence INTEGER,
  isCorrect BOOLEAN,
  points INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (gameId) REFERENCES games(id),
  FOREIGN KEY (teamId) REFERENCES teams(id),
  UNIQUE(userId, gameId)
);

INSERT INTO picks SELECT * FROM picks_backup;
DROP TABLE picks_backup;

-- Step 4: Remove columns from games table
-- Note: SQLite doesn't support DROP COLUMN, so we need to recreate the table
CREATE TABLE games_backup AS SELECT 
  id, espnId, week, season, homeTeamId, awayTeamId, gameDate, homeScore, awayScore, 
  spread, overUnder, isCompleted, winnerTeamId, createdAt, updatedAt
FROM games;

DROP TABLE games;

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  espnId TEXT,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  homeTeamId TEXT NOT NULL,
  awayTeamId TEXT NOT NULL,
  gameDate TEXT NOT NULL,
  homeScore INTEGER,
  awayScore INTEGER,
  spread REAL,
  overUnder REAL,
  isCompleted BOOLEAN DEFAULT 0,
  winnerTeamId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (homeTeamId) REFERENCES teams(id),
  FOREIGN KEY (awayTeamId) REFERENCES teams(id),
  FOREIGN KEY (winnerTeamId) REFERENCES teams(id)
);

INSERT INTO games SELECT * FROM games_backup;
DROP TABLE games_backup;

-- Step 5: Recreate original indexes
CREATE INDEX IF NOT EXISTS idx_games_week_season ON games(week, season);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(gameDate);
CREATE INDEX IF NOT EXISTS idx_picks_user_game ON picks(userId, gameId);
CREATE INDEX IF EXISTS idx_picks_game ON picks(gameId);

-- Step 6: Verify rollback results (for manual testing)
-- SELECT COUNT(*) as total_games FROM games;
-- SELECT COUNT(*) as total_picks FROM picks;
-- PRAGMA table_info(games);
-- PRAGMA table_info(picks);