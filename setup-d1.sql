-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  city TEXT NOT NULL,
  conference TEXT NOT NULL,
  division TEXT NOT NULL,
  primaryColor TEXT,
  secondaryColor TEXT,
  logoUrl TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  username TEXT,
  image TEXT,
  isAdmin INTEGER DEFAULT 0,
  emailVerified DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create games table  
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  homeTeamId TEXT NOT NULL,
  awayTeamId TEXT NOT NULL,
  gameTime DATETIME NOT NULL,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  gameType TEXT DEFAULT 'regular',
  homeScore INTEGER,
  awayScore INTEGER,
  status TEXT DEFAULT 'scheduled',
  spread REAL,
  overUnder REAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (homeTeamId) REFERENCES teams(id),
  FOREIGN KEY (awayTeamId) REFERENCES teams(id)
);

-- Insert NFL teams
INSERT OR REPLACE INTO teams (id, name, abbreviation, city, conference, division) VALUES
('cmf3dg2b4000tdqxu9w9ccp81', 'Cardinals', 'ARI', 'Arizona', 'NFC', 'NFC West'),
('cmf3dg2b4000udqxu9w9ccp82', 'Falcons', 'ATL', 'Atlanta', 'NFC', 'NFC South'),
('cmf3dg2b4000vdqxu9w9ccp83', 'Ravens', 'BAL', 'Baltimore', 'AFC', 'AFC North'),
('cmf3dg2b4000wdqxu9w9ccp84', 'Bills', 'BUF', 'Buffalo', 'AFC', 'AFC East'),
('cmf3dg2b4000xdqxu9w9ccp85', 'Panthers', 'CAR', 'Carolina', 'NFC', 'NFC South'),
('cmf3dg2b4000ydqxu9w9ccp86', 'Bears', 'CHI', 'Chicago', 'NFC', 'NFC North'),
('cmf3dg2b4000zdqxu9w9ccp87', 'Bengals', 'CIN', 'Cincinnati', 'AFC', 'AFC North'),
('cmf3dg2b40010dqxu9w9ccp88', 'Browns', 'CLE', 'Cleveland', 'AFC', 'AFC North'),
('cmf3dg2b40011dqxu9w9ccp89', 'Cowboys', 'DAL', 'Dallas', 'NFC', 'NFC East'),
('cmf3dg2b40012dqxu9w9ccp90', 'Broncos', 'DEN', 'Denver', 'AFC', 'AFC West'),
('cmf3dg2b40013dqxu9w9ccp91', 'Lions', 'DET', 'Detroit', 'NFC', 'NFC North'),
('cmf3dg2b40014dqxu9w9ccp92', 'Packers', 'GB', 'Green Bay', 'NFC', 'NFC North'),
('cmf3dg2b40015dqxu9w9ccp93', 'Texans', 'HOU', 'Houston', 'AFC', 'AFC South'),
('cmf3dg2b40016dqxu9w9ccp94', 'Colts', 'IND', 'Indianapolis', 'AFC', 'AFC South'),
('cmf3dg2b40017dqxu9w9ccp95', 'Jaguars', 'JAX', 'Jacksonville', 'AFC', 'AFC South'),
('cmf3dg2b40018dqxu9w9ccp96', 'Chiefs', 'KC', 'Kansas City', 'AFC', 'AFC West'),
('cmf3dg2b40019dqxu9w9ccp97', 'Raiders', 'LV', 'Las Vegas', 'AFC', 'AFC West'),
('cmf3dg2b4001adqxu9w9ccp98', 'Chargers', 'LAC', 'Los Angeles', 'AFC', 'AFC West'),
('cmf3dg2b4001bdqxu9w9ccp99', 'Rams', 'LAR', 'Los Angeles', 'NFC', 'NFC West'),
('cmf3dg2b4001cdqxu9w9ccpa0', 'Dolphins', 'MIA', 'Miami', 'AFC', 'AFC East'),
('cmf3dg2b4001ddqxu9w9ccpa1', 'Vikings', 'MIN', 'Minnesota', 'NFC', 'NFC North'),
('cmf3dg2b4001edqxu9w9ccpa2', 'Patriots', 'NE', 'New England', 'AFC', 'AFC East'),
('cmf3dg2b4001fdqxu9w9ccpa3', 'Saints', 'NO', 'New Orleans', 'NFC', 'NFC South'),
('cmf3dg2b4001gdqxu9w9ccpa4', 'Giants', 'NYG', 'New York', 'NFC', 'NFC East'),
('cmf3dg2b4001hdqxu9w9ccpa5', 'Jets', 'NYJ', 'New York', 'AFC', 'AFC East'),
('cmf3dg2b4001idqxu9w9ccpa6', 'Eagles', 'PHI', 'Philadelphia', 'NFC', 'NFC East'),
('cmf3dg2b4001jdqxu9w9ccpa7', 'Steelers', 'PIT', 'Pittsburgh', 'AFC', 'AFC North'),
('cmf3dg2b4001kdqxu9w9ccpa8', '49ers', 'SF', 'San Francisco', 'NFC', 'NFC West'),
('cmf3dg2b4001ldqxu9w9ccpa9', 'Seahawks', 'SEA', 'Seattle', 'NFC', 'NFC West'),
('cmf3dg2b4001mdqxu9w9ccpb0', 'Buccaneers', 'TB', 'Tampa Bay', 'NFC', 'NFC South'),
('cmf3dg2b4001ndqxu9w9ccpb1', 'Titans', 'TEN', 'Tennessee', 'AFC', 'AFC South'),
('cmf3dg2b4001odqxu9w9ccpb2', 'Commanders', 'WAS', 'Washington', 'NFC', 'NFC East');

-- Insert the test user
INSERT OR REPLACE INTO users (id, email, password, name, username, isAdmin) VALUES
('cmf3dg2b4000wdqxu9w9ccp81', 'test@example.com', '$2b$12$pDTzx6mmuHIde1PQpqW52utne/r7uVdZDpj5UeR7qjo9cAVG/seiS', 'Dad', 'dad', 0);