/**
 * Type-safe API client for NFL Pick'em application
 * Provides strongly typed methods to interact with all API endpoints
 */

import { 
  GamesApiResponse, 
  TeamsApiResponse, 
  PicksApiResponse,
  ApiErrorResponse,
  ApiResponse,
  CreateGameRequest,
  CreatePickRequest,
  UpdateGameRequest,
  isApiSuccess,
  isApiError
} from '@/types'

/**
 * Configuration for API client
 */
interface ApiClientConfig {
  /** Base URL for API endpoints */
  baseUrl?: string
  /** Default timeout in milliseconds */
  timeout?: number
  /** Default headers to include with requests */
  defaultHeaders?: Record<string, string>
}

/**
 * Type-safe API client class
 */
export class ApiClient {
  private baseUrl: string
  private timeout: number
  private defaultHeaders: Record<string, string>

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    this.timeout = config.timeout || 10000 // 10 seconds
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders
    }
  }

  /**
   * Make a typed HTTP request
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Set up abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Parse JSON response
      let data: ApiResponse<T>
      
      try {
        data = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, create error response
        return {
          success: false,
          error: 'Failed to parse server response',
          details: response.statusText
        }
      }

      // Handle HTTP errors even if response is parseable
      if (!response.ok && data.success !== false) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: typeof data === 'string' ? data : JSON.stringify(data)
        }
      }

      return data

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          details: `Request took longer than ${this.timeout}ms`
        }
      }

      return {
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ==============================================================================
  // GAMES API METHODS
  // ==============================================================================

  /**
   * Fetch games for a specific week and season
   * 
   * @param week NFL week (1-18, optional)
   * @param season NFL season year (optional)
   * @param limit Maximum number of games to return (optional)
   */
  async getGames(
    week?: number, 
    season?: number, 
    limit?: number
  ): Promise<GamesApiResponse | ApiErrorResponse> {
    const params = new URLSearchParams()
    if (week !== undefined) params.set('week', week.toString())
    if (season !== undefined) params.set('season', season.toString())
    if (limit !== undefined) params.set('limit', limit.toString())
    
    const queryString = params.toString()
    const endpoint = `/api/games${queryString ? `?${queryString}` : ''}`
    
    return this.request<GamesApiResponse['data']>(endpoint, { method: 'GET' })
  }

  /**
   * Create a new game
   */
  async createGame(gameData: CreateGameRequest): Promise<ApiResponse<any>> {
    return this.request('/api/games', {
      method: 'POST',
      body: JSON.stringify(gameData)
    })
  }

  /**
   * Update an existing game
   */
  async updateGame(gameData: UpdateGameRequest): Promise<ApiResponse<any>> {
    return this.request(`/api/games/${gameData.id}`, {
      method: 'PUT',
      body: JSON.stringify(gameData)
    })
  }

  /**
   * Sync games from external API (admin only)
   */
  async syncGames(): Promise<ApiResponse<any>> {
    return this.request('/api/games', { method: 'POST' })
  }

  // ==============================================================================
  // TEAMS API METHODS
  // ==============================================================================

  /**
   * Fetch all NFL teams
   */
  async getTeams(): Promise<TeamsApiResponse | ApiErrorResponse> {
    return this.request<TeamsApiResponse['data']>('/api/teams', { method: 'GET' })
  }

  // ==============================================================================
  // PICKS API METHODS
  // ==============================================================================

  /**
   * Fetch user's picks for a specific week and season
   */
  async getPicks(
    week?: number, 
    season?: number
  ): Promise<PicksApiResponse | ApiErrorResponse> {
    const params = new URLSearchParams()
    if (week !== undefined) params.set('week', week.toString())
    if (season !== undefined) params.set('season', season.toString())
    
    const queryString = params.toString()
    const endpoint = `/api/picks${queryString ? `?${queryString}` : ''}`
    
    return this.request<PicksApiResponse['data']>(endpoint, { method: 'GET' })
  }

  /**
   * Create or update a pick
   */
  async createPick(pickData: CreatePickRequest): Promise<ApiResponse<any>> {
    return this.request('/api/picks', {
      method: 'POST',
      body: JSON.stringify(pickData)
    })
  }

  /**
   * Delete a pick
   */
  async deletePick(pickId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/picks/${pickId}`, { method: 'DELETE' })
  }

  // ==============================================================================
  // UTILITY METHODS
  // ==============================================================================

  /**
   * Check if the API is responding
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request('/api/health', { method: 'GET' })
      return isApiSuccess(response)
    } catch {
      return false
    }
  }

  /**
   * Helper method to handle API responses consistently
   */
  static handleResponse<T>(
    response: ApiResponse<T>,
    onSuccess: (data: T) => void,
    onError?: (error: string, details?: string) => void
  ): void {
    if (isApiSuccess(response)) {
      onSuccess(response.data)
    } else if (isApiError(response)) {
      onError?.(response.error, response.details)
    }
  }
}

/**
 * Default API client instance
 * Use this for most cases unless you need custom configuration
 */
export const apiClient = new ApiClient()

/**
 * React hook for API client (if using React)
 * Provides error handling and loading states
 */
export function useApiClient() {
  return {
    client: apiClient,
    handleResponse: ApiClient.handleResponse
  }
}

/**
 * Legacy function for backward compatibility
 * Fetches games and handles both old and new response formats
 * 
 * @deprecated Use apiClient.getGames() instead
 */
export async function fetchGames(week?: number, season?: number) {
  console.warn('fetchGames is deprecated. Use apiClient.getGames() instead.')
  
  const response = await apiClient.getGames(week, season)
  
  // Handle both legacy and new response formats
  if (isApiSuccess(response)) {
    return {
      success: true,
      games: response.games || response.data?.games || [],
      week: response.week || response.data?.week || week || 1,
      season: response.season || response.data?.season || season || new Date().getFullYear()
    }
  } else {
    return {
      success: false,
      games: [],
      week: week || 1,
      season: season || new Date().getFullYear(),
      error: response.error
    }
  }
}