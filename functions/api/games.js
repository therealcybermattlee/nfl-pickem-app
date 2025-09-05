/**
 * Games API endpoint for Cloudflare Pages Functions
 * 
 * GET /api/games - Fetches games with team information
 * Returns: GamesApiResponse format with proper TypeScript contracts
 * 
 * Query Parameters:
 * - week: number (optional) - Specific NFL week to fetch
 * - season: number (optional) - Specific NFL season to fetch
 * - limit: number (optional) - Limit number of results (default: 50)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // Validate D1 database availability
    if (!env.DB) {
      return createErrorResponse('Database not available', 500);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const weekParam = url.searchParams.get('week');
    const seasonParam = url.searchParams.get('season');
    const limitParam = url.searchParams.get('limit');
    
    // Default to current week/season if not specified
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const defaultSeason = currentDate.getMonth() >= 8 ? currentYear : currentYear; // Sept+ = current year
    const defaultWeek = getCurrentNFLWeek(currentDate);
    
    const targetWeek = weekParam ? parseInt(weekParam, 10) : null;
    const targetSeason = seasonParam ? parseInt(seasonParam, 10) : defaultSeason;
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50; // Max 100 games
    
    // Validate parameters
    if (weekParam && (isNaN(targetWeek) || targetWeek < 1 || targetWeek > 18)) {
      return createErrorResponse('Invalid week parameter. Must be between 1 and 18.', 400);
    }
    if (seasonParam && (isNaN(targetSeason) || targetSeason < 2020 || targetSeason > 2030)) {
      return createErrorResponse('Invalid season parameter. Must be between 2020 and 2030.', 400);
    }

    // Build the SQL query with optional week filtering
    let whereClause = 'WHERE g.season = ?';
    const bindings = [targetSeason];
    
    if (targetWeek !== null) {
      whereClause += ' AND g.week = ?';
      bindings.push(targetWeek);
    }

    // Execute query to get games with team information
    const query = `
      SELECT 
        g.id,
        g.espnId,
        g.week,
        g.season,
        g.homeTeamId,
        g.awayTeamId,
        g.gameDate,
        g.isCompleted,
        g.homeScore,
        g.awayScore,
        g.winnerTeamId,
        g.homeSpread,
        g.awaySpread,
        g.homeMoneyline,
        g.awayMoneyline,
        g.overUnder,
        g.oddsProvider,
        g.oddsUpdatedAt,
        home.name as homeTeamName,
        home.abbreviation as homeTeamAbbr,
        away.name as awayTeamName,
        away.abbreviation as awayTeamAbbr
      FROM games g
      LEFT JOIN teams home ON g.homeTeamId = home.id
      LEFT JOIN teams away ON g.awayTeamId = away.id
      ${whereClause}
      ORDER BY g.gameDate ASC
      LIMIT ?
    `;
    
    console.log(`Fetching games for week ${targetWeek || 'all'}, season ${targetSeason}, limit ${limit}`);
    
    const result = await env.DB.prepare(query).bind(...bindings, limit).all();
    const rawGames = result.results || [];
    
    // Transform raw D1 data to proper API format
    const games = rawGames.map(transformD1GameToAPIFormat);
    
    // Determine actual week and season from results
    const actualWeek = targetWeek || (games.length > 0 ? games[0].week : defaultWeek);
    const actualSeason = games.length > 0 ? games[0].season : targetSeason;
    
    // Return standardized API response format
    const response = {
      success: true,
      games: games,
      week: actualWeek,
      season: actualSeason,
      count: games.length,
      data: {
        games: games,
        week: actualWeek,
        season: actualSeason,
        count: games.length
      }
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    console.error('Games API error:', error);
    return createErrorResponse(
      'Failed to fetch games',
      500,
      error.message
    );
  }
}

/**
 * Helper function to transform raw D1 query results to API format
 * Implements the D1GameWithTeamsRaw -> GameWithTeamsForAPI transformation
 */
function transformD1GameToAPIFormat(rawGame) {
  return {
    id: rawGame.id,
    espnId: rawGame.espnId,
    week: rawGame.week,
    season: rawGame.season,
    homeTeamId: rawGame.homeTeamId,
    awayTeamId: rawGame.awayTeamId,
    gameDate: rawGame.gameDate,
    isCompleted: Boolean(rawGame.isCompleted),
    homeScore: rawGame.homeScore,
    awayScore: rawGame.awayScore,
    winnerTeamId: rawGame.winnerTeamId,
    homeSpread: rawGame.homeSpread,
    awaySpread: rawGame.awaySpread,
    homeMoneyline: rawGame.homeMoneyline,
    awayMoneyline: rawGame.awayMoneyline,
    overUnder: rawGame.overUnder,
    oddsProvider: rawGame.oddsProvider,
    oddsUpdatedAt: rawGame.oddsUpdatedAt,
    homeTeam: {
      id: rawGame.homeTeamId,
      name: rawGame.homeTeamName,
      abbreviation: rawGame.homeTeamAbbr
    },
    awayTeam: {
      id: rawGame.awayTeamId,
      name: rawGame.awayTeamName,
      abbreviation: rawGame.awayTeamAbbr
    }
  };
}

/**
 * Helper function to get current NFL week based on date
 * Simplified calculation - could be enhanced with actual NFL schedule data
 */
function getCurrentNFLWeek(date) {
  const year = date.getFullYear();
  const season_start = new Date(year, 8, 8); // September 8th as rough start
  const diffTime = Math.abs(date - season_start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.ceil(diffDays / 7);
  return Math.max(1, Math.min(18, week));
}

/**
 * Helper function to create standardized success responses
 */
function createSuccessResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    }
  });
}

/**
 * Helper function to create standardized error responses
 */
function createErrorResponse(message, status = 500, details = null) {
  const errorResponse = {
    success: false,
    error: message,
    ...(details && { details })
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Games Sync API endpoint for Cloudflare Pages Functions
 * 
 * POST /api/games - Syncs games from The Odds API
 * Returns: Sync status with inserted game count and any errors
 * 
 * Environment Variables Required:
 * - THE_ODDS_API_KEY: API key for The Odds API
 * - THE_ODDS_API_BASE_URL: Base URL for The Odds API (optional)
 */
export async function onRequestPost(context) {
  const { env } = context;
  
  try {
    if (!env.DB) {
      return createErrorResponse('Database not available', 500);
    }

    if (!env.THE_ODDS_API_KEY) {
      return createErrorResponse('The Odds API key not configured', 400);
    }

    // Get current NFL games from The Odds API
    const apiUrl = `${env.THE_ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4'}/sports/americanfootball_nfl/odds?apiKey=${env.THE_ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american`;
    
    console.log('Fetching games from:', apiUrl.replace(env.THE_ODDS_API_KEY, '[REDACTED]'));
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
    }
    
    const games = await response.json();
    console.log(`Retrieved ${games.length} games from API`);

    let gamesInserted = 0;
    let errors = [];

    // Process each game
    for (const game of games) {
      try {
        // Find team IDs from database - try multiple matching strategies
        const homeTeamQueries = [
          `%${game.home_team}%`,
          game.home_team
        ];
        const awayTeamQueries = [
          `%${game.away_team}%`, 
          game.away_team
        ];

        let homeTeam = null;
        let awayTeam = null;

        // Try to find home team
        for (const query of homeTeamQueries) {
          const result = await env.DB.prepare(
            'SELECT id FROM teams WHERE name LIKE ? OR abbreviation = ?'
          ).bind(query, game.home_team).first();
          if (result) {
            homeTeam = result;
            break;
          }
        }

        // Try to find away team
        for (const query of awayTeamQueries) {
          const result = await env.DB.prepare(
            'SELECT id FROM teams WHERE name LIKE ? OR abbreviation = ?'
          ).bind(query, game.away_team).first();
          if (result) {
            awayTeam = result;
            break;
          }
        }

        if (!homeTeam || !awayTeam) {
          errors.push(`Could not find teams for ${game.home_team} vs ${game.away_team}`);
          continue;
        }

        // Extract spread and total from bookmakers
        let spread = null;
        let overUnder = null;
        
        if (game.bookmakers && game.bookmakers.length > 0) {
          const bookmaker = game.bookmakers[0]; // Use first bookmaker
          
          // Find spread market
          const spreadMarket = bookmaker.markets?.find(m => m.key === 'spreads');
          if (spreadMarket && spreadMarket.outcomes) {
            const homeOutcome = spreadMarket.outcomes.find(o => o.name === game.home_team);
            if (homeOutcome) {
              spread = parseFloat(homeOutcome.point);
            }
          }
          
          // Find totals market
          const totalsMarket = bookmaker.markets?.find(m => m.key === 'totals');
          if (totalsMarket && totalsMarket.outcomes) {
            const overOutcome = totalsMarket.outcomes.find(o => o.name === 'Over');
            if (overOutcome) {
              overUnder = parseFloat(overOutcome.point);
            }
          }
        }

        // Determine current week and season using consistent logic
        const gameDate = new Date(game.commence_time);
        const season = gameDate.getFullYear();
        const week = getCurrentNFLWeek(gameDate);

        // Insert or update game
        await env.DB.prepare(`
          INSERT OR REPLACE INTO games (
            id, homeTeamId, awayTeamId, gameTime, week, season, 
            gameType, status, spread, overUnder, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          game.id,
          homeTeam.id,
          awayTeam.id,
          game.commence_time,
          week,
          season,
          'regular',
          'scheduled',
          spread,
          overUnder
        ).run();

        gamesInserted++;
      } catch (gameError) {
        console.error('Error processing game:', gameError);
        errors.push(`Error processing ${game.home_team} vs ${game.away_team}: ${gameError.message}`);
      }
    }
    
    const syncResponse = {
      success: true,
      message: `Synced ${gamesInserted} games`,
      gamesInserted,
      totalGames: games.length,
      errors,
      data: {
        gamesInserted,
        totalGames: games.length,
        errors
      }
    };
    
    return createSuccessResponse(syncResponse);
    
  } catch (error) {
    console.error('Games sync error:', error);
    return createErrorResponse(
      'Failed to sync games',
      500,
      error.message
    );
  }
}

/**
 * Handle CORS preflight requests
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}