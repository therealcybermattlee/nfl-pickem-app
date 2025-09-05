// Simple test to add a few games manually
export default {
  async fetch(request, env) {
    try {
      if (!env.DB) {
        return new Response('No DB available', { status: 500 });
      }

      // Get team IDs for a simple test game
      const chiefs = await env.DB.prepare('SELECT id FROM teams WHERE abbreviation = ?').bind('KC').first();
      const bills = await env.DB.prepare('SELECT id FROM teams WHERE abbreviation = ?').bind('BUF').first();
      
      if (!chiefs || !bills) {
        return new Response('Teams not found', { status: 500 });
      }

      // Add a test game
      await env.DB.prepare(`
        INSERT OR REPLACE INTO games (
          id, homeTeamId, awayTeamId, gameTime, week, season, 
          gameType, status, spread, overUnder, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        'test-game-1',
        chiefs.id,
        bills.id,
        new Date().toISOString(),
        1,
        2025,
        'regular',
        'scheduled',
        -3.5,
        47.5
      ).run();

      return new Response('Test game added', { status: 200 });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
}