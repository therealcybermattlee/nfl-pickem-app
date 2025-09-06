# NFL Pick'em App - Claude Development Guide

## ⚠️ CRITICAL DEVELOPMENT GUIDELINES - READ FIRST! ⚠️

### 🤖 Primary Assistant Configuration
**ALWAYS USE CLAUDE SONNET 4 as the primary model** - This provides the best balance of capability, speed, and cost for development tasks.

### 🚀 BE PROACTIVE WITH SPECIALIZED AGENTS  
**ALWAYS try to use specialized agents instead of doing work yourself** when applicable:

- **frontend-developer**: Build React components, implement responsive layouts, and handle client-side state management. Optimizes frontend performance and ensures accessibility. Use PROACTIVELY when creating UI components or fixing frontend issues.
- **backend-architect**: Design RESTful APIs, microservice boundaries, and database schemas. Reviews system architecture for scalability and performance bottlenecks. Use PROACTIVELY when creating new backend services or APIs.
- **ui-ux-designer**: Create interface designs, wireframes, and design systems. Masters user research, prototyping, and accessibility standards. Use PROACTIVELY for design systems, user flows, or interface optimization.
- **typescript-pro**: Master TypeScript with advanced types, generics, and strict type safety. Handles complex type systems, decorators, and enterprise-grade patterns. Use PROACTIVELY for TypeScript architecture, type inference optimization, or advanced typing patterns.
- **deployment-engineer**: Configure CI/CD pipelines, Docker containers, and cloud deployments. Handles GitHub Actions, Kubernetes, and infrastructure automation. Use PROACTIVELY when setting up deployments, containers, or CI/CD workflows.
- **code-reviewer**: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
- **architect-review**: Reviews code changes for architectural consistency and patterns. Use PROACTIVELY after any structural changes, new services, or API modifications. Ensures SOLID principles, proper layering, and maintainability.
- **api-documenter**: Create OpenAPI/Swagger specs, generate SDKs, and write developer documentation. Handles versioning, examples, and interactive docs. Use PROACTIVELY for API documentation or client library generation.
- **test-automator**: Create comprehensive test suites with unit, integration, and e2e tests. Sets up CI pipelines, mocking strategies, and test data. Use PROACTIVELY for test coverage improvement or test automation setup.
- **general-purpose**: General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks. When you are searching for a keyword or file and are not confident that you will find the right match in the first few tries use this agent to perform the search for you.

**Why?** Specialized agents have focused expertise and can often solve problems more efficiently than general development approaches.

### 📋 Task Management
- **ALWAYS use TodoWrite** for any multi-step or complex tasks
- Track progress transparently for the user
- Break down large tasks into manageable steps

---

## Project Status: Cloudflare-Native Implementation ✓

**Current State:** Core rewrite complete, D1 binding configuration needed

**Last Updated:** September 2025  
**Development Phase:** Cloudflare Pages deployment with edge runtime

## What We've Built (Core Achievements)

### ✓ Authentication System
- **NextAuth.js** with credentials provider
- **Test User Available:** `test@example.com` / `password123`
- JWT-based sessions for scalability
- Clean login/signup UI with proper error handling

### ✓ Database & Data Layer
- **Prisma ORM** with SQLite (easily upgradeable to PostgreSQL)
- **Complete NFL team data** (all 32 teams with abbreviations)
- **Relational schema** for users, games, picks, pools
- **Working migrations and seed data**

### ✓ Modern UI/UX Foundation
- **Next.js 14** with App Router
- **Tailwind CSS** with shadcn/ui components
- **Responsive design** optimized for mobile game-day usage
- **Fast page loads** and smooth interactions

### ✓ API Infrastructure
- **RESTful endpoints** with proper error handling
- **Type-safe operations** with TypeScript
- **Authentication middleware** integrated
- **Database queries optimized** for performance

## Quick Start Commands

```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run db:seed

# Start development server
npm run dev

# Access application
open http://localhost:3000
```

## Test Credentials
- **Email:** test@example.com
- **Password:** password123

## Architecture Overview

```
Frontend (Next.js 14 + React)
├── Authentication (NextAuth.js)
├── UI Components (shadcn/ui + Tailwind)
└── API Layer (Next.js API Routes)
    └── Database (Prisma + SQLite)
        └── NFL Data (Teams, Games, Picks)
```

## Database Schema (Current)

### Core Models
- **User**: Authentication + profile data
- **Team**: NFL team information (32 teams loaded)
- **Game**: Match data with timing information
- **Pick**: User predictions with tracking
- **Pool**: Group competition management

### Key Relationships
- Users have many Picks
- Games have many Picks
- Teams are referenced by Games and Picks
- Pools contain multiple Users

## Development Standards

### Code Quality
- **TypeScript strict mode** enabled
- **ESLint + Next.js** configuration active
- **Consistent naming** conventions followed
- **Error boundaries** and proper error handling

### Performance Features
- **Optimized database queries** with proper indexing
- **Component-level code splitting** ready
- **Image optimization** configured for team logos
- **Fast refresh** development experience

## Next Major Feature: Time-Lock Pick System

**Planned Implementation:** 6-sprint plan for time-sensitive picks

### Sprint Overview
1. **Database Enhancement** - Add time-based fields and constraints
2. **Pick Management API** - Lock validation and submission endpoints  
3. **Game State Automation** - Background monitoring and auto-picks
4. **Real-Time Integration** - Live status updates and job processing
5. **User Interface** - Time indicators and lock status UI
6. **Production Readiness** - Testing and deployment optimization

**Key Requirements:**
- Users can pick any time before game start
- Picks lock immediately upon submission
- Auto-random selection for missed picks
- Real-time UI updates with countdown timers

## Development Commands Reference

### Database Operations
```bash
npm run db:generate    # Regenerate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Create migration
npm run db:studio      # Open database browser
npm run db:seed        # Load sample data
```

### Development Workflow
```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run start          # Production server
npm run lint           # Code quality check
```

### Data Management
```bash
npm run sync:nfl       # Update NFL data (when implemented)
```

## Current File Structure

```
app/
├── (auth)/           # Authentication pages
├── api/              # API endpoints
│   └── auth/         # NextAuth configuration
├── components/       # Reusable UI components
└── globals.css       # Global styles

lib/
├── auth.ts           # Authentication configuration
├── prisma.ts         # Database client
└── utils.ts          # Utility functions

prisma/
├── schema.prisma     # Database schema
├── seed.ts           # Sample data
└── dev.db           # SQLite database file
```

## Key Technical Decisions

### Database Choice
- **Current:** SQLite for development simplicity
- **Future:** PostgreSQL for production scalability
- **Migration Path:** Prisma makes database switching seamless

### Authentication Strategy
- **JWT sessions** over database sessions for performance
- **Credentials provider** for direct control over user validation
- **Extensible** to OAuth providers when needed

### Styling Approach
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent, accessible components
- **CSS-in-JS free** for better performance

## Performance Benchmarks

### Current Metrics
- **Page load:** Sub-2 second initial loads
- **Authentication:** ~500ms login response
- **Database queries:** <100ms for standard operations
- **Build time:** <30 seconds full build

### Optimization Ready
- Database indexing strategy planned
- Component lazy loading configured
- Image optimization active
- Bundle splitting enabled

## Security Features

### Current Protections
- **Password hashing** with bcrypt (12 rounds)
- **JWT token validation** on protected routes
- **SQL injection prevention** via Prisma
- **Environment variables** for secrets

### Planned Enhancements
- Rate limiting on auth endpoints
- CSRF protection for forms
- Input sanitization middleware
- Audit logging for picks

## Deployment Readiness

### Environment Setup
- **.env.example** template ready
- **Environment validation** configured
- **Database migrations** automated
- **Seed data** production-safe

### Infrastructure Requirements
- Node.js 18+ runtime
- Database (SQLite dev / PostgreSQL prod)
- Environment variables for auth secrets
- Optional: Redis for session storage scaling

## Development Notes

### Known Working Features
- User registration and login
- Database operations (CRUD)
- UI component library
- API endpoint structure
- NFL team data management

### Ready for Extension
- Additional OAuth providers
- Advanced pool configurations
- Real-time features (WebSocket/SSE)
- Mobile app development
- Admin dashboard features

## Troubleshooting Guide

### Common Issues
1. **"autoprefixer missing"** → Already resolved, dependency added
2. **Auth 401 errors** → Verify user exists, check credentials
3. **Database connection** → Ensure .env file exists with DATABASE_URL
4. **Build errors** → Run `npm run db:generate` after schema changes

### Development Tips
- Always run database operations after schema changes
- Use Prisma Studio for data inspection
- Check server logs for authentication debugging
- Test pick submission logic with time validation

## Success Metrics Achieved

- ✓ **Zero-setup authentication** with test user ready
- ✓ **Fast development cycle** with hot reload
- ✓ **Type safety** across full stack
- ✓ **Responsive design** works on all devices
- ✓ **Scalable architecture** ready for production
- ✓ **Clean code structure** maintainable and extensible

## CRITICAL DEVELOPMENT LEARNINGS - READ FIRST! ⚠️

### Essential Development Principles (Based on Real Experience)

**FAVOR DESTRUCTIVE, LONG-TERM FIXES OVER QUICK FIXES**
- Quick fixes and workarounds should be LAST RESORT only
- When facing architectural problems, choose the destructive but proper solution
- Rewrite entire systems if they're fundamentally incompatible
- Remove and replace broken dependencies completely rather than patching
- Example: Replace NextAuth + Prisma entirely for Cloudflare compatibility rather than trying to make them work

**NEVER declare anything "fixed" until the USER can verify it works in the actual UI**
- Testing individual API endpoints ≠ Testing complete user experience
- Always verify the full user journey: login → dashboard → games display → picks functionality
- Use Playwright for end-to-end testing, not curl for API-only testing
- When user reports "it doesn't work" - believe them, don't dismiss their feedback

**Always test the DEPLOYED APPLICATION that users actually access**
- Local development ≠ Production deployment
- Different deployment URLs may serve different versions
- Check what's actually deployed vs what's in source code
- Verify the correct production URL is being updated

**Be brutally honest about uncertainty**
- Say "I'm not sure, let me check" instead of claiming false confidence
- Admit when something failed instead of making excuses
- Don't make promises until you have concrete evidence
- If you can't verify something works, say so explicitly

**Focus on the complete application, not isolated components**
- Ensure all features are present: dashboard, games list, picks, stats, authentication
- Verify the rich UI components are deployed, not just basic pages
- Check that the app matches the described functionality in this document
- Don't deploy stripped/incomplete versions

**Listen to user feedback and act on it immediately**
- If user says "this is wrong" or "this doesn't work" - investigate thoroughly
- Don't continue with other tasks until core issues are resolved
- User experience is the only measure that matters
- Take responsibility for mistakes instead of making excuses

### Deployment-Specific Learnings

**Cloudflare Pages Deployment Issues Encountered:**
- Multiple deployment URLs can exist with different content
- Main production domain: `https://nfl-pickem-app.pages.dev`
- Custom domain: `https://pickem.leefamilysso.com`
- Always verify which URL is the canonical production version
- Use `wrangler pages deploy` for proper deployments
- Check that functions are deployed to correct locations

**Build Process Must Capture Full Application:**
- Ensure Next.js build includes all pages and components
- Verify API routes are properly deployed
- Check that static assets and styling are included
- Don't accept basic/stripped versions as successful deployments

---

**Next Steps:** Ready to implement time-lock pick system using the 6-sprint plan. Foundation is solid and all core systems are operational.

**For New Developers:** This codebase is production-ready for basic pick'em functionality. The time-lock feature represents the next major milestone.

**REMEMBER:** Always follow the critical learnings above. User experience and honesty are more important than appearing competent.

## 🔧 CURRENT TECHNICAL BLOCKERS (September 2025)

### D1 Database Binding Issue - PRIORITY 1

**Problem:** All API endpoints returning 500 errors due to D1 database binding not accessible in Cloudflare Pages edge functions.

**Status:** Architecture complete, configuration issue only

**What Works:**
- ✅ D1 database exists with ID `b85129d8-b27c-4c73-bd34-5314a881394b`
- ✅ Database contains all 32 NFL teams and test users
- ✅ API routes converted to edge runtime
- ✅ D1DatabaseManager with all necessary methods
- ✅ Build and deployment process working
- ✅ Environment variables configured (NEXTAUTH_SECRET)

**What's Broken:**
- ❌ D1 binding access: `(globalThis as any).DB` and `process.env.DB` both undefined
- ❌ All API endpoints return 500: `/api/teams`, `/api/games`, `/api/picks`
- ❌ Frontend stuck in "Loading..." due to failed session API calls

**Technical Root Cause:**
In Cloudflare Pages with Next.js, D1 bindings are accessed differently than in standard Workers. Current implementation tries `request.cf?.env?.DB` and `globalThis.DB`, but neither work in the Pages environment.

**Next Steps for Resolution:**
1. ✅ Implemented `getRequestContext()` from `@cloudflare/next-on-pages` approach
2. ✅ Updated all API routes with proper binding access pattern
3. ❌ Production deployment still failing - `getRequestContext()` not working in Cloudflare Pages environment
4. **Alternative needed:** Switch to direct D1 REST API calls or different deployment approach

**Current Status:** All API endpoints return 500 errors in production, even simple test endpoints. The `getRequestContext()` approach works in documentation but fails in the actual Cloudflare Pages deployment environment.

**Impact:** Core NFL functionality is architecturally complete but completely blocked until D1 access is resolved.

**Deployment URLs:**
- Latest: `https://c16e8872.nfl-pickem-app.pages.dev`
- Custom domain: `https://pickem.leefamilysso.com` (configured in wrangler.toml)

### Authentication System - DEPRIORITIZED

**Status:** Functional but bypassed for testing core NFL features

**Decision:** Simplified to Cloudflare-native authentication only. Removed Microsoft OAuth complexity. Uses JWT + bcrypt for clean credential-based auth focused on core functionality.