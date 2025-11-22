import type { Team, Game, GameStatus, Leaderboard, ApiResponse } from '../types/api';

const API_BASE_URL = 'https://nfl-pickem-app-production.m-de6.workers.dev';

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

  static async post<T>(endpoint: string, data?: any, token?: string): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const responseData = await response.json();
      return {
        success: true,
        data: responseData
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

  // Time-lock related endpoints
  static async getGameStatus(week: number = 1, season: number = 2025): Promise<ApiResponse<GameStatus[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/status?week=${week}&season=${season}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      // Handle the API response format: {games: [...], count: X, timestamp: "..."}
      if (data && Array.isArray(data.games)) {
        return {
          success: true,
          data: data.games
        };
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          error: 'Invalid API response format'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async updateGameLocks(): Promise<ApiResponse<{ updated: number }>> {
    return this.get<{ updated: number }>('/api/games/update-locks');
  }

  static async autoGeneratePicks(userId: number): Promise<ApiResponse<{ generated: number }>> {
    return this.get<{ generated: number }>(`/api/picks/auto-generate?userId=${userId}`);
  }

  static async submitPick(pick: { gameId: string; teamId: string; userId: string }, token: string): Promise<ApiResponse<any>> {
    return this.post('/api/picks', pick, token);
  }

  static async getUserPicks(userId: number, week: number, season: number, token: string): Promise<ApiResponse<any[]>> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${API_BASE_URL}/api/picks/live-status?userId=${userId}&week=${week}&season=${season}`, {
        headers
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.picks || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}