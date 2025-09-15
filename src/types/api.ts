export interface Team {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo?: string;
  logoUrl?: string;
  color?: string;
  primaryColor?: string;
  secondaryColor?: string;
  conference?: string;
  division?: string;
}

export interface Game {
  id: string;
  espnId?: string;
  week: number;
  season: number;
  homeTeamId: string;
  awayTeamId: string;
  gameTime: string;
  gameDate: string;
  gameType?: string;
  status?: string;
  isCompleted: boolean;
  isLocked?: boolean;
  lockTime?: string;
  homeScore?: number;
  awayScore?: number;
  winnerTeamId?: string;
  spread?: number;
  homeSpread?: number;
  awaySpread?: number;
  homeMoneyline?: number;
  awayMoneyline?: number;
  overUnder?: number;
  oddsProvider?: string;
  oddsUpdatedAt?: string;
  homeTeam: Team;
  awayTeam: Team;
}

export interface Pick {
  id: number;
  user_id: number;
  game_id: number;
  team_id: number;
  confidence?: number;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  displayName?: string;
}

export interface LeaderboardEntry {
  user: User;
  position: number;
  points: number; // Primary points display (weekly for week view, season for season view)
  weeklyPoints?: number; // Points earned in the selected week only
  totalSeasonPoints?: number; // Total points accumulated across all weeks
  totalPicks: number; // Total picks made (season)
  weeklyPicks?: number; // Picks made in the selected week
  totalGames: number;
  winPercentage: number; // Primary percentage (weekly for week view, season for season view)
  weeklyPercentage?: number; // Win percentage for the selected week only
  seasonPercentage?: number; // Win percentage for the entire season
  streak?: number;
  lastWeekPoints?: number; // Legacy field - use weeklyPoints instead
}

export interface Leaderboard {
  week: number;
  season: number;
  entries: LeaderboardEntry[];
  totalGames: number;
  completedGames: number;
}

export interface GameStatus extends Game {
  timeToLock?: number; // milliseconds until game locks
  isLockingSoon?: boolean; // true if locks within 1 hour
  lockWarningMessage?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}