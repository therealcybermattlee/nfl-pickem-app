import { GameOdds, OddsFetchOptions, OddsUpdateResult } from './types';

/**
 * Interface for odds data providers
 * Allows swapping between different odds APIs (The Odds API, ESPN, etc.)
 */
export interface OddsProvider {
  /**
   * Fetch current odds for NFL games
   * @param options - Options for filtering games
   * @returns Array of game odds
   */
  fetchOdds(options?: OddsFetchOptions): Promise<GameOdds[]>;

  /**
   * Fetch odds for a specific game by teams and date
   * @param homeTeam - Home team name
   * @param awayTeam - Away team name
   * @param gameDate - Game date
   * @returns Game odds or null if not found
   */
  fetchGameOdds(
    homeTeam: string, 
    awayTeam: string, 
    gameDate: Date
  ): Promise<GameOdds | null>;

  /**
   * Batch fetch odds for multiple games
   * @param gameIds - Array of game IDs to fetch
   * @returns Update result with success count and errors
   */
  batchFetchOdds(gameIds: string[]): Promise<OddsUpdateResult>;

  /**
   * Get remaining API requests for current period
   * @returns Number of requests remaining or null if unlimited
   */
  getRemainingRequests(): Promise<number | null>;

  /**
   * Get provider name for tracking
   * @returns Provider name
   */
  getProviderName(): string;

  /**
   * Check if provider is available and configured
   * @returns True if provider is ready to use
   */
  isAvailable(): boolean;
}