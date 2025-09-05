// Cloudflare Worker script for handling NextAuth compatibility
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle NextAuth API routes specially
    if (url.pathname.startsWith('/api/auth/')) {
      // For now, pass through to the Next.js handler
      // This is a placeholder for potential NextAuth edge compatibility
      return fetch(request);
    }
    
    // Handle all other routes normally
    return fetch(request);
  },
};