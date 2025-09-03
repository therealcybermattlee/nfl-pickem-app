import { OddsProvider } from './OddsProvider.interface';
import { 
  GameOdds, 
  OddsFetchOptions, 
  OddsUpdateResult, 
  OddsApiResponse, 
  OddsProviderConfig,
  TEAM_NAME_MAPPINGS 
} from './types';

export class TheOddsApiProvider implements OddsProvider {
  private config: OddsProviderConfig;
  private requestCount: number = 0;

  constructor(config: OddsProviderConfig) {
    this.config = {
      baseUrl: 'https://api.the-odds-api.com/v4',
      defaultBookmaker: 'draftkings',
      requestsPerMonth: 500, // Free tier default
      ...config
    };
  }

  async fetchOdds(options: OddsFetchOptions = {}): Promise<GameOdds[]> {
    try {
      const url = this.buildUrl('/sports/americanfootball_nfl/odds/', {
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        bookmakers: this.config.defaultBookmaker
      });

      const response = await this.makeRequest(url);
      return this.parseOddsResponse(response);
    } catch (error) {
      console.error('Failed to fetch odds:', error);
      throw new Error(`The Odds API fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchGameOdds(homeTeam: string, awayTeam: string, gameDate: Date): Promise<GameOdds | null> {
    const allOdds = await this.fetchOdds();
    
    return allOdds.find(odds => 
      this.matchTeamName(odds.homeTeamName, homeTeam) &&
      this.matchTeamName(odds.awayTeamName, awayTeam) &&
      this.isSameDay(new Date(odds.gameDate), gameDate)
    ) || null;
  }

  async batchFetchOdds(gameIds: string[]): Promise<OddsUpdateResult> {
    const result: OddsUpdateResult = {
      gamesUpdated: 0,
      errors: [],
      timestamp: new Date()
    };

    try {
      // For The Odds API, we fetch all games at once (more efficient)
      const odds = await this.fetchOdds();
      result.gamesUpdated = odds.length;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  async getRemainingRequests(): Promise<number | null> {
    // The Odds API doesn't provide a direct way to check remaining requests
    // We'll track this manually or return estimated remaining based on usage
    return Math.max(0, (this.config.requestsPerMonth || 500) - this.requestCount);
  }

  getProviderName(): string {
    return 'The Odds API';
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 0;
  }

  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(this.config.baseUrl + endpoint);
    
    // Add API key
    url.searchParams.append('apiKey', this.config.apiKey);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  private async makeRequest(url: string): Promise<OddsApiResponse[]> {
    this.requestCount++;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check rate limit headers if available
    const remainingHeader = response.headers.get('X-Requests-Remaining');
    if (remainingHeader) {
      this.requestCount = (this.config.requestsPerMonth || 500) - parseInt(remainingHeader, 10);
    }

    return response.json();
  }

  private parseOddsResponse(apiResponse: OddsApiResponse[]): GameOdds[] {
    return apiResponse.map(game => this.parseGameOdds(game)).filter(Boolean) as GameOdds[];
  }

  private parseGameOdds(game: OddsApiResponse): GameOdds | null {
    try {
      // Find the preferred bookmaker or use the first one
      const bookmaker = game.bookmakers.find(b => 
        b.key === this.config.defaultBookmaker
      ) || game.bookmakers[0];

      if (!bookmaker) {
        return null;
      }

      // Extract odds from different markets
      const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
      const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');

      // Parse spreads
      const homeSpreadOutcome = spreadsMarket?.outcomes.find(o => o.name === game.home_team);
      const awaySpreadOutcome = spreadsMarket?.outcomes.find(o => o.name === game.away_team);

      // Parse totals (over/under)
      const totalOutcome = totalsMarket?.outcomes.find(o => o.name === 'Over');

      // Parse moneylines
      const homeMoneylineOutcome = h2hMarket?.outcomes.find(o => o.name === game.home_team);
      const awayMoneylineOutcome = h2hMarket?.outcomes.find(o => o.name === game.away_team);

      return {
        gameId: game.id,
        homeTeamName: game.home_team,
        awayTeamName: game.away_team,
        gameDate: new Date(game.commence_time),
        homeSpread: homeSpreadOutcome?.point || null,
        awaySpread: awaySpreadOutcome?.point || null,
        homeMoneyline: homeMoneylineOutcome?.price || null,
        awayMoneyline: awayMoneylineOutcome?.price || null,
        overUnder: totalOutcome?.point || null,
        provider: this.getProviderName(),
        lastUpdate: new Date(bookmaker.last_update)
      };
    } catch (error) {
      console.error('Error parsing game odds:', error);
      return null;
    }
  }

  private matchTeamName(apiTeamName: string, dbTeamName: string): boolean {
    // Direct match
    if (apiTeamName === dbTeamName) return true;

    // Check mappings
    const mappings = TEAM_NAME_MAPPINGS[dbTeamName] || [];
    return mappings.some(mapping => 
      mapping.toLowerCase() === apiTeamName.toLowerCase()
    );
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}