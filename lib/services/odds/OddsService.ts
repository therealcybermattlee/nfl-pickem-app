import { OddsProvider } from './OddsProvider.interface';
import { TheOddsApiProvider } from './TheOddsApiProvider';
import { GameOdds, OddsUpdateResult } from './types';
import { prisma } from '@/lib/prisma';

interface CachedOdds extends GameOdds {
  cachedAt: Date;
  ttl: number;
}

export class OddsService {
  private provider: OddsProvider;
  private cache: Map<string, CachedOdds> = new Map();
  private static instance: OddsService;

  private constructor(provider: OddsProvider) {
    this.provider = provider;
  }

  public static getInstance(): OddsService {
    if (!OddsService.instance) {
      // Initialize with The Odds API provider
      const config = {
        apiKey: process.env.ODDS_API_KEY || '',
        baseUrl: 'https://api.the-odds-api.com/v4'
      };
      
      const provider = new TheOddsApiProvider(config);
      OddsService.instance = new OddsService(provider);
    }
    
    return OddsService.instance;
  }

  /**
   * Get odds for a specific game with intelligent caching
   */
  async getGameOdds(gameId: string, forceRefresh: boolean = false): Promise<GameOdds | null> {
    // Check cache first
    const cached = this.cache.get(gameId);
    if (!forceRefresh && cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Get game details from database
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    if (!game) {
      return null;
    }

    try {
      // Fetch from provider
      const odds = await this.provider.fetchGameOdds(
        game.homeTeam.name,
        game.awayTeam.name,
        game.gameDate
      );

      if (odds) {
        // Cache with TTL based on game proximity
        const ttl = this.calculateCacheTTL(game.gameDate);
        const cachedOdds: CachedOdds = {
          ...odds,
          gameId,
          cachedAt: new Date(),
          ttl
        };
        
        this.cache.set(gameId, cachedOdds);

        // Update database
        await this.updateGameOdds(gameId, odds);
      }

      return odds;
    } catch (error) {
      console.error(`Failed to fetch odds for game ${gameId}:`, error);
      
      // Fallback to database
      return this.getOddsFromDatabase(gameId);
    }
  }

  /**
   * Update odds for all games in the current week
   */
  async updateWeeklyOdds(week: number, season: number): Promise<OddsUpdateResult> {
    const result: OddsUpdateResult = {
      gamesUpdated: 0,
      errors: [],
      timestamp: new Date()
    };

    try {
      // Get all games for the week
      const games = await prisma.game.findMany({
        where: {
          week,
          season,
          isCompleted: false
        },
        include: {
          homeTeam: true,
          awayTeam: true
        }
      });

      if (games.length === 0) {
        return result;
      }

      // Fetch all odds at once (more efficient for API limits)
      const allOdds = await this.provider.fetchOdds();

      // Match odds to games and update database
      for (const game of games) {
        try {
          const matchingOdds = allOdds.find(odds =>
            this.matchTeamNames(odds.homeTeamName, game.homeTeam.name) &&
            this.matchTeamNames(odds.awayTeamName, game.awayTeam.name) &&
            this.isSameDay(new Date(odds.gameDate), game.gameDate)
          );

          if (matchingOdds) {
            await this.updateGameOdds(game.id, matchingOdds);
            result.gamesUpdated++;

            // Update cache
            const ttl = this.calculateCacheTTL(game.gameDate);
            const cachedOdds: CachedOdds = {
              ...matchingOdds,
              gameId: game.id,
              cachedAt: new Date(),
              ttl
            };
            this.cache.set(game.id, cachedOdds);
          }
        } catch (error) {
          const errorMessage = `Failed to update game ${game.id}: ${error}`;
          result.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }
    } catch (error) {
      result.errors.push(`Weekly update failed: ${error}`);
      console.error('Weekly odds update failed:', error);
    }

    return result;
  }

  /**
   * Get odds for multiple games (used by UI)
   */
  async getBatchOdds(gameIds: string[]): Promise<Record<string, GameOdds | null>> {
    const odds: Record<string, GameOdds | null> = {};

    for (const gameId of gameIds) {
      odds[gameId] = await this.getGameOdds(gameId);
    }

    return odds;
  }

  /**
   * Get provider usage statistics
   */
  async getUsageStats() {
    const remaining = await this.provider.getRemainingRequests();
    
    return {
      provider: this.provider.getProviderName(),
      remainingRequests: remaining,
      isAvailable: this.provider.isAvailable(),
      cacheSize: this.cache.size,
      cachedGames: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  private async updateGameOdds(gameId: string, odds: GameOdds): Promise<void> {
    const now = new Date();

    // Update game record
    await prisma.game.update({
      where: { id: gameId },
      data: {
        homeSpread: odds.homeSpread,
        awaySpread: odds.awaySpread,
        homeMoneyline: odds.homeMoneyline,
        awayMoneyline: odds.awayMoneyline,
        overUnder: odds.overUnder,
        oddsProvider: odds.provider,
        oddsUpdatedAt: now
      }
    });

    // Create history record
    await prisma.oddsHistory.create({
      data: {
        gameId,
        homeSpread: odds.homeSpread,
        awaySpread: odds.awaySpread,
        homeMoneyline: odds.homeMoneyline,
        awayMoneyline: odds.awayMoneyline,
        overUnder: odds.overUnder,
        provider: odds.provider,
        timestamp: now
      }
    });
  }

  private async getOddsFromDatabase(gameId: string): Promise<GameOdds | null> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    if (!game || !game.oddsUpdatedAt) {
      return null;
    }

    return {
      gameId: game.id,
      homeTeamName: game.homeTeam.name,
      awayTeamName: game.awayTeam.name,
      gameDate: game.gameDate,
      homeSpread: game.homeSpread,
      awaySpread: game.awaySpread,
      homeMoneyline: game.homeMoneyline,
      awayMoneyline: game.awayMoneyline,
      overUnder: game.overUnder,
      provider: game.oddsProvider || 'Unknown',
      lastUpdate: game.oddsUpdatedAt
    };
  }

  private isCacheValid(cached: CachedOdds): boolean {
    const now = Date.now();
    const cacheAge = now - cached.cachedAt.getTime();
    return cacheAge < cached.ttl * 1000; // TTL is in seconds
  }

  private calculateCacheTTL(gameDate: Date): number {
    const hoursUntilGame = (gameDate.getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (hoursUntilGame <= 1) return 5 * 60;        // 5 minutes
    if (hoursUntilGame <= 6) return 15 * 60;       // 15 minutes  
    if (hoursUntilGame <= 24) return 60 * 60;      // 1 hour
    if (hoursUntilGame <= 72) return 6 * 60 * 60;  // 6 hours
    return 24 * 60 * 60;                           // 24 hours
  }

  private matchTeamNames(apiName: string, dbName: string): boolean {
    // Simple matching - could be enhanced with fuzzy matching
    return apiName.toLowerCase().includes(dbName.toLowerCase()) ||
           dbName.toLowerCase().includes(apiName.toLowerCase());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}