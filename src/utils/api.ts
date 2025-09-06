import type { Team, Game, Leaderboard, ApiResponse } from '../types/api';

const API_BASE_URL = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev';

export class ApiClient {
  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getTeams(): Promise<ApiResponse<Team[]>> {
    return this.get<Team[]>('/api/teams');
  }

  static async getGames(week: number = 1, season: number = 2025): Promise<ApiResponse<Game[]>> {
    return this.get<Game[]>(`/api/games?week=${week}&season=${season}`);
  }

  static async getSession(): Promise<ApiResponse<any>> {
    return this.get<any>('/api/auth/session');
  }

  static async getLeaderboard(week: number = 1, season: number = 2025): Promise<ApiResponse<Leaderboard>> {
    return this.get<Leaderboard>(`/api/leaderboard?week=${week}&season=${season}`);
  }
}