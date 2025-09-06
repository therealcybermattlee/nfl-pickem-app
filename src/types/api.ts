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

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}