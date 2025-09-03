// Types for odds data and API responses

export interface GameOdds {
  gameId: string;
  homeTeamName: string;
  awayTeamName: string;
  gameDate: Date;
  homeSpread: number | null;
  awaySpread: number | null;
  homeMoneyline: number | null;
  awayMoneyline: number | null;
  overUnder: number | null;
  provider: string;
  lastUpdate: Date;
}

export interface OddsApiResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: 'spreads' | 'totals' | 'h2h';
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultBookmaker?: string;
  requestsPerMonth?: number;
}

export interface OddsFetchOptions {
  gameWeek?: number;
  teamNames?: string[];
  forceRefresh?: boolean;
}

export interface OddsUpdateResult {
  gamesUpdated: number;
  errors: string[];
  timestamp: Date;
}

// Team name mapping for API compatibility
export const TEAM_NAME_MAPPINGS: Record<string, string[]> = {
  'Arizona Cardinals': ['Arizona Cardinals', 'Cardinals'],
  'Atlanta Falcons': ['Atlanta Falcons', 'Falcons'],
  'Baltimore Ravens': ['Baltimore Ravens', 'Ravens'],
  'Buffalo Bills': ['Buffalo Bills', 'Bills'],
  'Carolina Panthers': ['Carolina Panthers', 'Panthers'],
  'Chicago Bears': ['Chicago Bears', 'Bears'],
  'Cincinnati Bengals': ['Cincinnati Bengals', 'Bengals'],
  'Cleveland Browns': ['Cleveland Browns', 'Browns'],
  'Dallas Cowboys': ['Dallas Cowboys', 'Cowboys'],
  'Denver Broncos': ['Denver Broncos', 'Broncos'],
  'Detroit Lions': ['Detroit Lions', 'Lions'],
  'Green Bay Packers': ['Green Bay Packers', 'Packers'],
  'Houston Texans': ['Houston Texans', 'Texans'],
  'Indianapolis Colts': ['Indianapolis Colts', 'Colts'],
  'Jacksonville Jaguars': ['Jacksonville Jaguars', 'Jaguars'],
  'Kansas City Chiefs': ['Kansas City Chiefs', 'Chiefs'],
  'Las Vegas Raiders': ['Las Vegas Raiders', 'Raiders'],
  'Los Angeles Chargers': ['Los Angeles Chargers', 'Chargers'],
  'Los Angeles Rams': ['Los Angeles Rams', 'Rams'],
  'Miami Dolphins': ['Miami Dolphins', 'Dolphins'],
  'Minnesota Vikings': ['Minnesota Vikings', 'Vikings'],
  'New England Patriots': ['New England Patriots', 'Patriots'],
  'New Orleans Saints': ['New Orleans Saints', 'Saints'],
  'New York Giants': ['New York Giants', 'Giants'],
  'New York Jets': ['New York Jets', 'Jets'],
  'Philadelphia Eagles': ['Philadelphia Eagles', 'Eagles'],
  'Pittsburgh Steelers': ['Pittsburgh Steelers', 'Steelers'],
  'San Francisco 49ers': ['San Francisco 49ers', '49ers'],
  'Seattle Seahawks': ['Seattle Seahawks', 'Seahawks'],
  'Tampa Bay Buccaneers': ['Tampa Bay Buccaneers', 'Buccaneers'],
  'Tennessee Titans': ['Tennessee Titans', 'Titans'],
  'Washington Commanders': ['Washington Commanders', 'Commanders', 'Washington']
};