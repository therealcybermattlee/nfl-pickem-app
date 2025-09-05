const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages compatibility settings
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Configure for Cloudflare deployment
  env: {
    NEXTAUTH_URL_INTERNAL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
}

// Setup development platform for Workers compatibility
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform()
}

module.exports = nextConfig