const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable edge runtime for API routes
    runtime: 'experimental-edge',
  },
  // Optimize for Workers
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

// Setup development platform for Workers compatibility
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform()
}

module.exports = nextConfig