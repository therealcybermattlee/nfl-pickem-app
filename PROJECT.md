# NFL Pick'em App - Project Configuration

## Project Overview
A Next.js 15 NFL Pick'em application with NextAuth authentication and Prisma database, deployed on Cloudflare Pages with D1 database backend.

## Core Architecture
- **Frontend**: Next.js 15 with App Router
- **Authentication**: NextAuth.js with Microsoft OAuth + credentials provider
- **Database**: Prisma with D1 (production) / SQLite (development)
- **Hosting**: Cloudflare Pages
- **Styling**: Tailwind CSS + shadcn/ui

## Deployment Configuration

### Cloudflare Pages Build Settings
```
Build command: npm run build
Build output directory: .next/
Root directory: (empty)
Environment variables: See below
```

### Next.js Configuration (next.config.js)
```javascript
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
  // Cloudflare Pages compatibility
  output: 'export',
  trailingSlash: true,
  experimental: {
    runtime: 'experimental-edge',
  },
}
```

### Wrangler Configuration (wrangler.toml)
```toml
name = "nfl-pickem-app"
compatibility_date = "2024-09-04"
compatibility_flags = ["nodejs_compat"]

# Production environment
[env.production.vars]
NODE_ENV = "production"
NEXTAUTH_URL = "https://pickem.leefamilysso.com"
THE_ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4"
CURRENT_NFL_SEASON = "2025"
CURRENT_NFL_WEEK = "1"

# D1 database binding
[[env.production.d1_databases]]
binding = "DB"
database_name = "nfl-pickem-db"
database_id = "b85129d8-b27c-4c73-bd34-5314a881394b"
```

## Environment Variables

### Required Secrets (Set via Cloudflare Dashboard)
```bash
# Authentication
NEXTAUTH_SECRET="32-character-minimum-secret-key"
MICROSOFT_CLIENT_ID="azure-app-client-id"
MICROSOFT_CLIENT_SECRET="azure-app-client-secret"
MICROSOFT_TENANT_ID="azure-tenant-id"

# Database
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=your-key"

# External APIs
THE_ODDS_API_KEY="your-odds-api-key"
```

### Public Variables (Set in wrangler.toml)
```bash
NEXTAUTH_URL="https://pickem.leefamilysso.com"
THE_ODDS_API_BASE_URL="https://api.the-odds-api.com/v4"
CURRENT_NFL_SEASON="2025"
CURRENT_NFL_WEEK="1"
NODE_ENV="production"
```

## Database Configuration

### Prisma Schema Adapter for D1
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

export function createPrismaClientWithD1(d1: D1Database) {
  const adapter = new PrismaD1(d1)
  return new PrismaClient({ adapter })
}

// For development
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
```

### Database Migration Commands
```bash
# Create D1 database
wrangler d1 create nfl-pickem-db

# Export local SQLite to SQL
npm run db:export

# Import to D1
wrangler d1 execute nfl-pickem-db --file=./database-dump.sql --env production

# Generate Prisma client
npm run db:generate
```

## Build Process

### Cloudflare Pages Compatible Build
```bash
# Standard Next.js build
npm run build

# Cloudflare adapter conversion (currently not working with NextAuth)
# npx @cloudflare/next-on-pages

# Manual deployment
wrangler pages deploy .next --project-name=nfl-pickem-app
```

### Build Issues & Solutions

#### Issue: NextAuth Edge Runtime Incompatibility
**Problem**: NextAuth doesn't support Edge Runtime required by Cloudflare Pages
**Status**: Known limitation
**Solutions**:
1. Use alternative auth (Clerk, Auth0, custom D1-based auth)
2. Deploy on Node.js compatible platform (Vercel)
3. Wait for NextAuth v5 with better edge support

#### Issue: Prisma Client Edge Runtime
**Problem**: Standard Prisma client doesn't work in edge runtime
**Solution**: Use Prisma Accelerate or D1 adapter
```bash
# Install D1 adapter
npm install @prisma/adapter-d1
```

## Authentication Configuration

### Microsoft Azure App Registration
```
Redirect URIs:
- https://pickem.leefamilysso.com/api/auth/callback/microsoft
- https://localhost:3000/api/auth/callback/microsoft (dev)

API Permissions:
- Microsoft Graph: User.Read
- OpenID: email, profile, openid
```

### NextAuth Configuration
```javascript
// lib/auth.ts
export const authOptions = {
  providers: [
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID,
    }),
    CredentialsProvider({
      // Test user: test@example.com / password123
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (token?.id) session.user.id = token.id
      return session
    },
  },
}
```

## Deployment Commands

### Development
```bash
npm run dev                # Start dev server
npm run db:studio         # Open database browser
npm run db:seed           # Load sample data
```

### Production Deployment
```bash
# Database setup
npm run db:export
wrangler d1 execute nfl-pickem-db --file=./database-dump.sql --env production

# Build and deploy
npm run build
wrangler pages deploy .next --project-name=nfl-pickem-app

# Or git-based deployment (automatic)
git push origin main
```

## Current Status

### Working Features ✅
- Next.js application builds successfully
- Prisma database schema and migrations
- UI components and styling
- Environment configuration
- Cloudflare Pages project setup
- All secrets configured

### Known Issues ❌
- NextAuth session loading hangs in production
- API routes not properly deployed as Cloudflare functions
- Edge runtime compatibility issues with Prisma/NextAuth
- App shows "Loading..." indefinitely

### Next Steps 🔄
1. **Option A**: Migrate to Cloudflare-native auth solution (Clerk/Auth0)
2. **Option B**: Use Prisma Accelerate for edge compatibility  
3. **Option C**: Deploy on Vercel for NextAuth compatibility
4. **Option D**: Implement custom D1-based authentication

## Resources
- [Cloudflare Pages Framework Guides](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/)
- [NextAuth.js Edge Runtime](https://next-auth.js.org/configuration/nextjs#in-app-router)
- [Prisma D1 Adapter](https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Last Updated**: January 2025  
**NFL Season**: Week 1, 2025  
**Deployment**: Cloudflare Pages (pickem.leefamilysso.com)  
**Status**: Issues with NextAuth/Prisma edge runtime compatibility