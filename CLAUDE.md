# NFL Pick'em App - Claude Development Guide

## ⚠️ CRITICAL DEVELOPMENT GUIDELINES - READ FIRST! ⚠️

### 🤖 Primary Assistant Configuration

### 📋 Task Management
- **ALWAYS use TodoWrite** for any multi-step or complex tasks
- Track progress transparently for the user
- Break down large tasks into manageable steps

### ✅ PERMANENT TESTING RULE - MANDATORY
**NEVER call any feature "operational", "working", "deployed", or "ready" without confirming it through end-user testing with Playwright.**
- All features MUST be validated with actual browser automation tests
- Test the complete user journey, not just API endpoints
- Verify both desktop and mobile experiences
- Document test results before declaring success
- This rule applies to ALL deployments and feature releases

---

## Project Status: PRODUCTION LAUNCHED ✓

**Current State:** FULLY OPERATIONAL - Production environment ready for NFL game day


## Quick Start Commands

```bash
# Install dependencies
npm install

# Start frontend development
npm run dev              # Vite dev server at localhost:3000

# Start API development
npm run workers:dev      # Workers dev server

# Deploy to production
npm run build           # Build frontend
npm run workers:deploy  # Deploy API
```

## Test Credentials
- **Email:** test@example.com
- **Password:** password123

## ⚠️ Environment Configuration - CRITICAL REFERENCE

### Production URLs (AUTHORITATIVE)
| Service | URL |
|---------|-----|
| **Frontend** | `https://pickem.cyberlees.dev` |
| **Workers API** | `https://nfl-pickem-app-production.m-de6.workers.dev` |
| **API Sync Endpoint** | `POST /api/odds/sync?api-key=ESPN-SYSTEM-SYNC-2025` |

### Database Configuration
- **Database Name:** `nfl-pickem-db`
- **Database ID:** `b85129d8-b27c-4c73-bd34-5314a881394b'

### Wrangler Configuration Files
| File | Purpose | When to Use |
|------|---------|-------------|
| `wrangler-workers.toml` | **PRIMARY** - Workers API deployment | `npm run workers:dev`, `npm run workers:deploy-prod` |
| `wrangler.toml` | Pages/general config with cron triggers | `wrangler d1 execute` commands |

**IMPORTANT:** Both files MUST have the same database ID. If you see database errors, verify both files match.

### Key Environment Files
- `.env.production` - Contains `VITE_API_BASE_URL` for frontend builds
- `src/utils/api.ts` - Hardcoded API base URL (source of truth for frontend)

### Deployment Commands
```bash
# Deploy Workers API to production
npm run workers:deploy-prod

# Deploy frontend to Cloudflare Pages
npm run build && wrangler pages deploy dist --project-name=nfl-pickem-app

# Sync ESPN data to production
curl -X POST "https://nfl-pickem-app-production.m-de6.workers.dev/api/odds/sync?api-key=ESPN-SYSTEM-SYNC-2025"
```

## Architecture Overview

```
Frontend (Vite + React)
├── React Router for navigation
├── Tailwind CSS for styling
├── TypeScript for type safety
└── API Client (connects to Workers)

Cloudflare Workers API
├── JWT Authentication
├── D1 Database Operations
├── ESPN API Integration
└── NFL Data Management
    └── D1 Database (Teams, Games, Picks, Users)
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

## ✅ Time-Lock Pick System - PRODUCTION COMPLETE

**Status:** FULLY IMPLEMENTED AND DEPLOYED ✅

### Implementation Completed (All 6 Sprints Done):
1. **Database Enhancement** ✅ - Time-based fields and constraints active
2. **Pick Management API** ✅ - Lock validation and submission logic working
3. **Game State Automation** ✅ - Cron jobs running every 15 minutes
4. **Real-Time Integration** ✅ - Live countdown timers operational
5. **User Interface** ✅ - Time indicators and mobile displays complete
6. **Production Readiness** ✅ - Comprehensive testing and error handling deployed

**Production Features Active:**
- ✅ Picks lock automatically at game start time (no late submissions)
- ✅ Auto-random picks generated for users who miss deadlines
- ✅ Real-time countdown timers showing time until lock
- ✅ Cloudflare Cron triggers running automated scoring updates
- ✅ Mobile-responsive time displays for game-day usage
- ✅ Comprehensive error handling and user feedback

## Development Commands Reference

### Database Operations
```bash
# Direct D1 database access
wrangler d1 execute nfl-pickem-db --remote --command="SELECT * FROM games LIMIT 5;"
wrangler d1 execute nfl-pickem-db --remote --command="SELECT * FROM users;"
wrangler d1 execute nfl-pickem-db --remote --command="PRAGMA table_info(games);"
```

### Development Workflow
```bash
npm run dev            # Start Vite dev server
npm run build          # Build frontend
npm run workers:dev    # Start Workers dev server
npm run workers:deploy # Deploy Workers API
npm run lint           # Code quality check
```

### Production Operations
```bash
# Test production environment
npm run test:e2e       # Run Playwright end-to-end tests
npm run test:load      # Run load testing for performance
npm run test:security  # Run security vulnerability testing

# Monitor production
curl https://pickem.cyberlees.dev/health    # Check frontend health
curl https://nfl-pickem-app-production.m-de6.workers.dev/api/health  # Check API health

# Production data sync
curl -X POST https://nfl-pickem-app-production.m-de6.workers.dev/api/odds/sync  # Sync NFL data
```

### Data Management
```bash
npm run odds:sync      # Sync ESPN API data (dev)
curl -X POST https://nfl-pickem-app-production.m-de6.workers.dev/api/odds/sync  # Production sync
```

## Current File Structure

```
src/
├── components/       # React UI components (Navigation, GameCard, etc.)
├── pages/           # Page components (GamesPage, LeaderboardPage, SignInPage, SignUpPage)
├── types/           # TypeScript type definitions (api.ts with FamilyPick, etc.)
├── utils/           # Utility functions and API client
├── worker.ts        # Cloudflare Workers API (all endpoints)
├── App.tsx          # Main React app with routing (/ = GamesPage)
├── main.tsx         # Vite entry point
└── index.css        # Global Tailwind styles

Configuration files:
├── vite.config.ts        # Vite + PWA configuration
├── wrangler-workers.toml # PRIMARY Workers deployment config
├── wrangler.toml         # Pages config with cron triggers
└── package.json          # Dependencies and scripts
```

**Note:** HomePage.tsx was removed in Feature 002 - GamesPage now serves as the landing page at root URL (/).

## Key Technical Decisions

### Database Choice
- **Current:** Cloudflare D1 (SQLite-compatible)
- **Production:** Same D1 database scales automatically
- **Operations:** Direct SQL queries, no ORM overhead

### Authentication Strategy
- **Custom JWT** with bcryptjs password hashing
- **Cloudflare Workers compatible** authentication
- **Simple and effective** for pick'em app needs

### Styling Approach
- **Tailwind CSS** for utility-first styling
- **Responsive design** with mobile-first approach
- **Fast builds** with Vite's CSS processing

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
- **Password hashing** with bcryptjs
- **JWT token validation** on protected routes
- **SQL injection prevention** via prepared statements
- **Environment variables** for secrets in Cloudflare

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
- Cloudflare Workers runtime
- Cloudflare D1 database (included)
- Environment variables for auth secrets
- Cloudflare Pages for frontend hosting

## Development Notes

### Known Working Features
- User registration and login
- ESPN API integration with 199+ games
- Pick submission and tracking
- Leaderboard with real-time scoring
- Responsive mobile design
- Automated game status updates

### Ready for Extension
- Time-lock pick system (planned)
- Advanced pool configurations
- Real-time score updates via cron jobs
- Push notifications
- Advanced stats and analytics

## Troubleshooting Guide

### Common Issues
1. **API 500 errors** → Check D1 database bindings in Workers
2. **Auth 401 errors** → Verify JWT tokens and user credentials
3. **CORS issues** → Ensure Workers API has proper CORS headers
4. **Build errors** → Check TypeScript types and Vite config

### Development Tips
- Use `wrangler d1 execute --remote` to check database state
- Test API endpoints directly during development
- Check browser network tab for API request errors
- Use Workers logs for debugging production issues

## Success Metrics Achieved

### Development Excellence:
- ✓ **Zero-setup authentication** with test user ready
- ✓ **Fast development cycle** with hot reload
- ✓ **Type safety** across full stack
- ✓ **Responsive design** works on all devices
- ✓ **Scalable architecture** ready for production
- ✓ **Clean code structure** maintainable and extensible

### Production Launch Success:
- ✓ **Live Production Environment** at https://pickem.cyberlees.dev
- ✓ **Time-Lock System Operational** with real-time countdown timers
- ✓ **Automated Scoring** with 15-minute cron job updates
- ✓ **Performance Tested** for 100+ concurrent users
- ✓ **Security Hardened** with comprehensive vulnerability fixes
- ✓ **End-to-End Validated** with Playwright automation testing
- ✓ **Mobile Game-Day Ready** with responsive design optimizations

## 🚀 PRODUCTION SYSTEM LIVE ✅

**Status:** FULLY OPERATIONAL - Family NFL Pick'em App serving users in production

**Production Deployment:**
- **Live Site**: https://pickem.cyberlees.dev ✅
- **API**: https://nfl-pickem-app-production.m-de6.workers.dev ✅
- **Database**: Cloudflare D1 with time-lock constraints ✅
- **Automation**: Cron jobs running every 15 minutes ✅

**Production Features Active:**
- ✅ Complete time-lock system with real-time countdown timers
- ✅ Automated game scoring and leaderboard updates
- ✅ ESPN API integration with all 2025 NFL games loaded
- ✅ Mobile-responsive design tested for game-day usage
- ✅ Custom JWT authentication with production security
- ✅ Comprehensive error handling and user feedback
- ✅ Performance tested for concurrent family usage

**Ready for NFL Season:** All core features implemented and validated

## 🎯 ESPN API INTEGRATION SUCCESS (September 2025)

### RESOLVED: D1 Database Access ✅ 

**Problem:** Previously had D1 database binding issues preventing API access
**Solution:** Switched to Cloudflare Workers deployment instead of Pages for API routes
**Result:** Full database access now working with 199 games loaded successfully

### ESPN API Integration - COMPLETE ✅

**Status:** Production-ready NFL data integration working

**What Works:**
- ✅ ESPN API integration with 199 games across 14 weeks
- ✅ Full season 2025 NFL schedule loaded  
- ✅ All 16 Week 1 games properly synced
- ✅ Real betting lines (spreads: -1.5, 5.5; over/unders: 47.5, 48.5)
- ✅ Frontend data consistency fixed (home page = games page)
- ✅ Workers API endpoints returning proper data
- ✅ Sync performance: ~48 seconds for full season

**Production URLs:**
- **Workers API:** `https://nfl-pickem-app-production.m-de6.workers.dev`
- **Custom Domain:** `https://pickem.cyberlees.dev` (configured in wrangler.toml)

### CRITICAL ESPN API LEARNINGS - MUST READ! 

**ALWAYS FAVOR OFFICIAL DATA SOURCES OVER THIRD-PARTY APIs**
- ESPN API is the authoritative source for NFL schedules, scores, team data
- Use The Odds API ONLY to supplement missing ESPN data, never to override it  
- Implementation: Check ESPN first, fill gaps with Odds API if needed
- Result: Most games tagged "ESPN", mixed sources tagged "ESPN + The Odds API"

**ALWAYS CHECK REMOTE DATABASE SCHEMA BEFORE CODING**  
- Local vs Remote D1 databases can have different schemas
- Command: `wrangler d1 execute nfl-pickem-db --remote --command="PRAGMA table_info(games);"`
- Critical Issue: Remote uses UUID foreign keys (`homeTeam.id`), not abbreviations
- Fix: Use `homeTeam.id` and `awayTeam.id` for INSERT operations, not `.abbreviation`

**FULL SEASON SYNC APPROACH IS OPTIMAL**
- Don't limit to single weeks - process entire season at once  
- ESPN API Pattern: Loop through weeks 1-18 with delays between requests
- Performance: ~48 seconds to sync 199 games across 14 weeks
- Success Rate: 73% match rate between ESPN and team database (199/272 games)

**ESPN API TECHNICAL DETAILS**
- Free Public Endpoint: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week={week}&dates={season}`
- Rate Limiting: Add 100ms delays between requests to be respectful
- Data Structure: `event.competitions[0].competitors` contains home/away teams
- Odds Access: `event.competitions[0].odds[0]` has spread and over/under when available

**FRONTEND DATA CONSISTENCY REQUIREMENTS**
- HomePage and Games page must use identical field names
- Critical Fields: `game.homeSpread` (not `game.spread`), `game.overUnder`
- Location: Always check `src/pages/HomePage.tsx` matches field names from API
- Validation: Compare both pages side-by-side in browser to verify consistency

### ESPN API Worker Implementation (`src/worker.ts`)

**Function Architecture:**
1. `fetchESPNGames(season)` - Primary data fetcher (loops through weeks 1-18)
2. `fetchOddsApiGames(env)` - Supplementary betting data
3. `syncOddsApi(db, env)` - Orchestrates ESPN-first merging strategy

**Sync Endpoint:** `POST /api/odds/sync` 
- Clears existing season data completely
- Processes all weeks from ESPN API
- Supplements with Odds API data for missing values
- Returns comprehensive stats: `{gamesInserted, weekBreakdown, dataSources}`

**Database Operations:**
```sql
-- Verify schema before development
wrangler d1 execute nfl-pickem-db --remote --command="PRAGMA table_info(games);"

-- Check sync results
wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) FROM games WHERE season = 2025 AND week = 1;"

-- Verify data sources
wrangler d1 execute nfl-pickem-db --remote --command="SELECT oddsProvider, COUNT(*) FROM games GROUP BY oddsProvider;"
```

### Summary

**Current Status:** Production-ready NFL pick'em app  
**Architecture:** Modern, scalable, and fully Cloudflare-native  
**Next Steps:** Time-lock system implementation to complete core functionality

## Active Technologies
- Cloudflare D1 (SQLite-compatible) with 7 core tables: users, teams, games, picks, game_locks, system_logs, scheduler_logs. Direct SQL queries via prepared statements (no ORM).
- TypeScript 5.x with strict mode + React 18, React Router, Tailwind CSS, Vite
- Cloudflare Workers for API, Cloudflare Pages for frontend hosting
- TypeScript 5.x with strict mode enabled (Vite + React frontend, Cloudflare Workers API) + Cloudflare Workers, D1 Database, bcryptjs for password hashing, JWT for authentication (003-seed-user-data)
- Cloudflare D1 (SQLite-compatible) with existing tables: users, picks, teams, games (003-seed-user-data)

## Recent Changes
- **002-remove-home-tab** (Nov 2025): Simplified navigation from 3 tabs to 2 tabs (Games + Leaderboard). Added family picks display on GameCard. GamesPage now serves as landing page at root URL (/). HomePage.tsx deleted.
- **001-implement-research**: Added Cloudflare D1 (SQLite-compatible) with 7 core tables: users, teams, games, picks, game_locks, system_logs, scheduler_logs. Direct SQL queries via prepared statements (no ORM).

## Feature 002: Remove Home Tab - COMPLETE ✅

**Changes Made:**
- Navigation reduced from 3 tabs to 2 tabs (Games + Leaderboard)
- Family picks display added to GameCard component (colored initials showing who picked which team)
- Root URL (/) now renders GamesPage directly
- /games redirects to / for clean URLs
- HomePage.tsx deleted (no longer needed)

**New Types Added:**
- `FamilyPick` interface in `src/types/api.ts` for family picks display
