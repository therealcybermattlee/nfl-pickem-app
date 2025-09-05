// Teams API endpoint for Cloudflare Pages
export async function onRequestGet(context) {
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

    const teams = await env.DB.prepare('SELECT * FROM teams ORDER BY name').all();
    
    return new Response(JSON.stringify(teams.results || []), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Teams API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch teams',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}