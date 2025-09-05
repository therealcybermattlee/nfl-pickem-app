// Picks API endpoint for Cloudflare Pages
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

    // For now, return empty array since we don't have user authentication in this request
    // In a real implementation, we'd get the user ID from session/auth
    return new Response(JSON.stringify([]), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Picks API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch picks',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    console.log('Pick submission:', body);
    
    // For now, return success
    // In real implementation, would save pick to database
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Pick saved (placeholder)'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Pick submission error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save pick',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}