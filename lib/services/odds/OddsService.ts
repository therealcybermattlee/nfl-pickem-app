import { D1Database } from '@cloudflare/workers-types';

interface OddsApiGame {
  id: string;
  sport_key: string;
  sport_title: string;
  time: string; // ISO date string
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

interface Team {
  id: number;
  name: string;
  abbreviation: string;
}

export class OddsService {
  private db: D1Database;
  private apiKey: string;
  private apiBaseUrl: string;

  constructor(db: D1Database, apiKey: string, apiBaseUrl: string) {
    this.db = db;
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl;
  }

  private async findTeamByName(teamName: string): Promise<Team | null> {
    // Normalize team name for matching
    const normalizedName = this.normalizeTeamName(teamName);

    const result = await this.db.prepare(
      `SELECT * FROM Team WHERE 
       LOWER(name) LIKE ? OR 
       LOWER(abbreviation) = ?`
    )
    .bind(`%${normalizedName}%`, normalizedName.toUpperCase())
    .first();

    return result as Team | null;
  }

  private normalizeTeamName(name: string): string {
    // Remove city names and normalize common team names
    const nameMap: { [key: string]: string } = {
      'Philadelphia Eagles': 'Eagles',
      'New England Patriots': 'Patriots',
      // Add more mappings as needed
    };

    return nameMap[name] || name.replace(/^[^A-Za-z]+/, '');
  }

  public async syncWeekGames(season: number, week: number): Promise<void> {
    const apiUrl = `${this.apiBaseUrl}/sports/americanfootball_nfl/odds/?apiKey=${this.apiKey}&regions=us&markets=spreads,totals&oddsFormat=american`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Odds API request failed: ${response.statusText}`);
      }

      const games: OddsApiGame[] = await response.json();

      // Clear existing games for this week first
      await this.db.prepare(
        `DELETE FROM Game WHERE season = ? AND week = ?`
      ).bind(season, week).run();

      // Batch insert games
      for (const game of games) {
        const homeTeam = await this.findTeamByName(game.home_team);
        const awayTeam = await this.findTeamByName(game.away_team);

        if (!homeTeam || !awayTeam) {
          console.warn(`Could not find teams for game: ${game.home_team} vs ${game.away_team}`);
          continue;
        }

        // Extract spread and total from first bookmaker
        const spreadsMarket = game.bookmakers[0]?.markets.find(m => m.key === 'spreads');
        const totalsMarket = game.bookmakers[0]?.markets.find(m => m.key === 'totals');

        const homeSpread = spreadsMarket?.outcomes.find(o => o.name === game.home_team)?.price || 0;
        const totalPoints = totalsMarket?.outcomes[0]?.price || 0;

        await this.db.prepare(`
          INSERT INTO Game (
            homeTeamId, 
            awayTeamId, 
            season, 
            week, 
            gameTime, 
            homeSpread, 
            totalPoints, 
            status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          homeTeam.id, 
          awayTeam.id, 
          season, 
          week, 
          new Date(game.time).toISOString(), 
          homeSpread, 
          totalPoints, 
          'scheduled'
        ).run();
      }

      console.log(`Synced ${games.length} games for season ${season}, week ${week}`);
    } catch (error) {
      console.error('Game sync error:', error);
      throw error;
    }
  }
}