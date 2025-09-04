// NextAuth middleware to handle all auth routes
export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Only handle /api/auth/* routes
  if (pathParts[0] !== 'api' || pathParts[1] !== 'auth') {
    return next();
  }
  
  const action = pathParts[2]; // 'signin', 'callback', 'session', etc.
  const provider = pathParts[3]; // 'credentials', 'microsoft', etc.
  const method = request.method;
  
  console.log('NextAuth middleware:', { action, provider, method, path: url.pathname });
  
  // Handle credentials signin - direct call from our custom form
  if (action === 'signin' && provider === 'credentials' && method === 'POST') {
    return await handleCredentialsSignin(context);
  }
  
  // Handle credentials callback (NextAuth calls this after signin)
  if (action === 'callback' && provider === 'credentials' && method === 'POST') {
    return await handleCredentialsSignin(context);
  }
  
  // Handle session requests
  if (action === 'session' && method === 'GET') {
    return await handleSession(context);
  }
  
  // Handle signout
  if (action === 'signout' && method === 'POST') {
    return new Response(JSON.stringify({ url: '/' }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': 'next-auth.session-token=; HttpOnly; Path=/; Max-Age=0'
      }
    });
  }
  
  // Handle error page requests
  if (action === 'error' && method === 'GET') {
    return new Response(JSON.stringify({ 
      error: null,
      message: 'No error'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Handle providers endpoint
  if (action === 'providers' && method === 'GET') {
    return new Response(JSON.stringify({
      credentials: {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials'
      },
      'azure-ad': {
        id: 'azure-ad',
        name: 'Microsoft',
        type: 'oauth'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Handle CSRF token requests
  if (action === 'csrf' && method === 'GET') {
    return new Response(JSON.stringify({
      csrfToken: 'dummy-csrf-token-' + Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Handle internal logging endpoint (just return success)
  if (action === '_log' && method === 'POST') {
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Default response for unhandled routes
  return new Response(JSON.stringify({ 
    error: 'NextAuth endpoint not implemented',
    action,
    provider,
    method,
    path: url.pathname
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleCredentialsSignin(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { email, password, redirect = true, callbackUrl = '/dashboard', json = true } = body;
    
    console.log('Signin attempt:', { email, hasPassword: !!password, redirect, callbackUrl, json });
    
    if (!email || !password) {
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
    
    // Create a JWT-like session token
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
    
    // Success response - NextAuth expects this exact format
    return new Response(JSON.stringify({
      error: null,
      status: 200,
      ok: true,
      url: redirect ? callbackUrl : null
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `next-auth.session-token=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
      }
    });
    
  } catch (error) {
    console.error('Credentials signin error:', error);
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

async function handleSession(context) {
  const { request, env } = context;
  
  // Extract session token from cookie
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
  
  if (!sessionMatch) {
    return new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const sessionToken = decodeURIComponent(sessionMatch[1]);
  
  try {
    // Decode the base64 session data
    const sessionData = JSON.parse(atob(sessionToken));
    
    // Check if session is expired
    const now = new Date();
    const expires = new Date(sessionData.expires);
    
    if (now > expires) {
      return new Response(JSON.stringify(null), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return the stored session data
    return new Response(JSON.stringify(sessionData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Session decode error:', error);
    // Fallback: try to treat token as user ID for backward compatibility
    try {
      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(sessionToken)
        .first();
      
      if (!user) {
        return new Response(JSON.stringify(null), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Return session in NextAuth format
      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          isAdmin: user.isAdmin
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (fallbackError) {
      console.error('Session fallback error:', fallbackError);
      return new Response(JSON.stringify(null), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}