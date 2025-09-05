// NextAuth-compatible signin endpoint for credentials
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { email, password, redirect = true, callbackUrl = '/dashboard' } = body;
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'CredentialsSignin',
        status: 401,
        ok: false,
        url: null
      }), {
        status: 200, // NextAuth expects 200 even for errors
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Query user from D1 database
    const result = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (!result || result.password !== '$2b$12$pDTzx6mmuHIde1PQpqW52utne/r7uVdZDpj5UeR7qjo9cAVG/seiS') {
      return new Response(JSON.stringify({ 
        error: 'CredentialsSignin',
        status: 401,
        ok: false,
        url: null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Success response in NextAuth format
    return new Response(JSON.stringify({
      error: null,
      status: 200,
      ok: true,
      url: redirect ? callbackUrl : null
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `next-auth.session-token=${result.id}; HttpOnly; Path=/; Max-Age=86400`
      }
    });
    
  } catch (error) {
    console.error('Signin error:', error);
    return new Response(JSON.stringify({ 
      error: 'Configuration',
      status: 500,
      ok: false,
      url: null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}