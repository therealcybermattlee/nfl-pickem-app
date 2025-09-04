const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Removed experimental runtime - will be set per API route instead
  // Optimize for Workers - removed 'output: export' to support dynamic API routes
  images: {
    unoptimized: true,
  },
}

// Setup development platform for Workers compatibility
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform()
}

module.exports = nextConfig