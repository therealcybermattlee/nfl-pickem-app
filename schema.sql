-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  username TEXT UNIQUE,
  image TEXT,
  passwordHash TEXT,
  passwordSalt TEXT,
  microsoftId TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL UNIQUE,
  conference TEXT NOT NULL CHECK (conference IN ('AFC', 'NFC')),
  division TEXT NOT NULL,
  primaryColor TEXT,
  secondaryColor TEXT,
  logoUrl TEXT
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
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

-- Create picks table
CREATE TABLE IF NOT EXISTS picks (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_microsoftId ON users(microsoftId);
CREATE INDEX IF NOT EXISTS idx_teams_abbreviation ON teams(abbreviation);
CREATE INDEX IF NOT EXISTS idx_games_week_season ON games(week, season);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(gameDate);
CREATE INDEX IF NOT EXISTS idx_picks_user_game ON picks(userId, gameId);
CREATE INDEX IF NOT EXISTS idx_picks_game ON picks(gameId);

-- Insert test user
INSERT OR REPLACE INTO users (id, email, name, passwordHash, passwordSalt, role, createdAt, updatedAt)
VALUES (
  'test-user-id',
  'test@example.com', 
  'Test User',
  'b03ddf3ca2e714a6548e7495e2a03f5e824eaac9837cd7f159c67b90fb4b7342', -- hash of 'password123' with salt 'testsalt'
  'testsalt',
  'user',
  datetime('now'),
  datetime('now')
);

-- Insert sample NFL teams
INSERT OR REPLACE INTO teams (id, name, abbreviation, conference, division, primaryColor, secondaryColor) VALUES
('team-buf', 'Buffalo Bills', 'BUF', 'AFC', 'East', '#00338D', '#C60C30'),
('team-mia', 'Miami Dolphins', 'MIA', 'AFC', 'East', '#008E97', '#FC4C02'),
('team-ne', 'New England Patriots', 'NE', 'AFC', 'East', '#002244', '#C60C30'),
('team-nyj', 'New York Jets', 'NYJ', 'AFC', 'East', '#125740', '#000000'),
('team-bal', 'Baltimore Ravens', 'BAL', 'AFC', 'North', '#241773', '#000000'),
('team-cin', 'Cincinnati Bengals', 'CIN', 'AFC', 'North', '#FB4F14', '#000000'),
('team-cle', 'Cleveland Browns', 'CLE', 'AFC', 'North', '#311D00', '#FF3C00'),
('team-pit', 'Pittsburgh Steelers', 'PIT', 'AFC', 'North', '#FFB612', '#000000'),
('team-hou', 'Houston Texans', 'HOU', 'AFC', 'South', '#03202F', '#A71930'),
('team-ind', 'Indianapolis Colts', 'IND', 'AFC', 'South', '#002C5F', '#A2AAAD'),
('team-jax', 'Jacksonville Jaguars', 'JAX', 'AFC', 'South', '#101820', '#D7A22A'),
('team-ten', 'Tennessee Titans', 'TEN', 'AFC', 'South', '#0C2340', '#4B92DB'),
('team-den', 'Denver Broncos', 'DEN', 'AFC', 'West', '#FB4F14', '#002244'),
('team-kc', 'Kansas City Chiefs', 'KC', 'AFC', 'West', '#E31837', '#FFB81C'),
('team-lv', 'Las Vegas Raiders', 'LV', 'AFC', 'West', '#000000', '#A5ACAF'),
('team-lac', 'Los Angeles Chargers', 'LAC', 'AFC', 'West', '#0080C6', '#FFC20E'),
('team-dal', 'Dallas Cowboys', 'DAL', 'NFC', 'East', '#003594', '#041E42'),
('team-nyg', 'New York Giants', 'NYG', 'NFC', 'East', '#0B2265', '#A71930'),
('team-phi', 'Philadelphia Eagles', 'PHI', 'NFC', 'East', '#004C54', '#A5ACAF'),
('team-was', 'Washington Commanders', 'WAS', 'NFC', 'East', '#5A1414', '#FFB612'),
('team-chi', 'Chicago Bears', 'CHI', 'NFC', 'North', '#0B162A', '#C83803'),
('team-det', 'Detroit Lions', 'DET', 'NFC', 'North', '#0076B6', '#B0B7BC'),
('team-gb', 'Green Bay Packers', 'GB', 'NFC', 'North', '#203731', '#FFB612'),
('team-min', 'Minnesota Vikings', 'MIN', 'NFC', 'North', '#4F2683', '#FFC62F'),
('team-atl', 'Atlanta Falcons', 'ATL', 'NFC', 'South', '#A71930', '#000000'),
('team-car', 'Carolina Panthers', 'CAR', 'NFC', 'South', '#0085CA', '#101820'),
('team-no', 'New Orleans Saints', 'NO', 'NFC', 'South', '#101820', '#D3BC8D'),
('team-tb', 'Tampa Bay Buccaneers', 'TB', 'NFC', 'South', '#D50A0A', '#FF7900'),
('team-ari', 'Arizona Cardinals', 'ARI', 'NFC', 'West', '#97233F', '#000000'),
('team-la', 'Los Angeles Rams', 'LAR', 'NFC', 'West', '#003594', '#FFA300'),
('team-sf', 'San Francisco 49ers', 'SF', 'NFC', 'West', '#AA0000', '#B3995D'),
('team-sea', 'Seattle Seahawks', 'SEA', 'NFC', 'West', '#002244', '#69BE28');