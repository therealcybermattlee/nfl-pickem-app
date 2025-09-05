// Sync games from The Odds API for Cloudflare Pages
export async function onRequestPost(context) {
  const { env } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!env.THE_ODDS_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'The Odds API key not configured' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
        // Find team IDs from database
        const homeTeam = await env.DB.prepare(
          'SELECT id FROM teams WHERE name LIKE ? OR abbreviation = ?'
        ).bind(`%${game.home_team}%`, game.home_team).first();
        
        const awayTeam = await env.DB.prepare(
          'SELECT id FROM teams WHERE name LIKE ? OR abbreviation = ?'
        ).bind(`%${game.away_team}%`, game.away_team).first();

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

        // Determine current week and season (simplified logic)
        const gameDate = new Date(game.commence_time);
        const currentYear = new Date().getFullYear();
        const season = gameDate.getFullYear() >= currentYear ? currentYear : currentYear;
        
        // Simple week calculation (Sept = week 1, etc.)
        const weekOfYear = Math.ceil((gameDate - new Date(season, 8, 1)) / (7 * 24 * 60 * 60 * 1000));
        const week = Math.max(1, Math.min(18, weekOfYear));

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
    
    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${gamesInserted} games`,
      gamesInserted,
      totalGames: games.length,
      errors
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Games sync error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to sync games',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}