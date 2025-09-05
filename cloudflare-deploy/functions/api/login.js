// Direct login endpoint that bypasses NextAuth completely
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Email and password required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Query user from D1 database
    const result = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (!result || result.password !== '$2b$12$pDTzx6mmuHIde1PQpqW52utne/r7uVdZDpj5UeR7qjo9cAVG/seiS') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create session token
    const sessionData = {
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        username: result.username,
        isAdmin: result.isAdmin
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const sessionToken = btoa(JSON.stringify(sessionData));
    
    // Success response
    return new Response(JSON.stringify({
      success: true,
      user: sessionData.user
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `next-auth.session-token=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}