// NextAuth credentials callback handler for Cloudflare Pages
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
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
      // Return error in NextAuth format
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/signin?error=CredentialsSignin'
        }
      });
    }
    
    // Success - redirect to callback URL or dashboard
    const callbackUrl = formData.get('callbackUrl') || '/dashboard';
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': callbackUrl,
        'Set-Cookie': `next-auth.session-token=${result.id}; HttpOnly; Path=/; Max-Age=86400`
      }
    });
    
  } catch (error) {
    console.error('Credentials callback error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/signin?error=Configuration'
      }
    });
  }
}