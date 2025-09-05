import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  // Handle NextAuth routes specifically
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    // Ensure proper content type for NextAuth
    response.headers.set('Content-Type', 'application/json')
  }
  
  return response
}

export const config = {
  matcher: ['/api/:path*']
}