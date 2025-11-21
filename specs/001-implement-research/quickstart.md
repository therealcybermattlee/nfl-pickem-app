# Quickstart Guide: NFL Pick'em Application

**Target Audience**: New developers joining the project
**Time to First Run**: ~30 minutes
**Last Updated**: November 20, 2025

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18.x or higher ([download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([download](https://git-scm.com/))
- **Cloudflare Account** (free tier sufficient, [sign up](https://dash.cloudflare.com/sign-up))
- **Wrangler CLI** (installed in step 2)
- **Code Editor** (VS Code recommended)

**Optional but Helpful**:
- The Odds API key (for betting lines, [$0 free tier](https://the-odds-api.com/))
- Playwright browsers (for E2E testing, installed automatically)

---

## Step 1: Clone Repository

```bash
git clone https://github.com/therealcybermattlee/nfl-pickem-app.git
cd nfl-pickem-app
```

---

## Step 2: Install Dependencies

Install all frontend, backend, and development dependencies:

```bash
npm install
```

This installs:
- React, Vite, Tailwind CSS (frontend)
- Cloudflare Workers types, bcryptjs, jose (backend)
- Wrangler CLI (Cloudflare deployment tool)
- Playwright, Vitest (testing tools)

**Verify Installation**:
```bash
npx wrangler --version  # Should show v4.34.0 or higher
node --version          # Should show v18.x or higher
```

---

## Step 3: Configure Environment Variables

### Frontend Environment (.env.local)

Create `.env.local` in the project root:

```bash
VITE_API_BASE_URL=http://localhost:8787
VITE_NODE_ENV=development
```

### Backend Environment (Cloudflare Secrets)

Set JWT secret locally for development:

```bash
echo "dev-secret-change-in-production" > .dev.vars
```

**Note**: Never commit `.dev.vars` to Git (already in `.gitignore`)

For production, use Wrangler secrets:
```bash
npx wrangler secret put JWT_SECRET  # Enter production secret when prompted
npx wrangler secret put THE_ODDS_API_KEY  # Optional, for betting lines
```

---

## Step 4: Initialize Local Database

Create and migrate the local D1 database:

```bash
# Create local database
npx wrangler d1 create nfl-pickem-db --local

# Run migrations
npx wrangler d1 execute nfl-pickem-db --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute nfl-pickem-db --local --file=./migrations/0002_time_lock_fields.sql
npx wrangler d1 execute nfl-pickem-db --local --file=./migrations/0003_system_logs.sql

# Seed teams data (all 32 NFL teams)
npx wrangler d1 execute nfl-pickem-db --local --file=./seeds/teams.sql

# Seed test user (email: test@example.com, password: password123)
npx wrangler d1 execute nfl-pickem-db --local --file=./seeds/test_user.sql
```

**Verify Database**:
```bash
npx wrangler d1 execute nfl-pickem-db --local --command="SELECT COUNT(*) FROM teams;"
# Should show: 32

npx wrangler d1 execute nfl-pickem-db --local --command="SELECT email FROM users;"
# Should show: test@example.com
```

---

## Step 5: Run Development Servers

Open **two terminal windows** (or use tmux/screen):

### Terminal 1: Frontend Dev Server
```bash
npm run dev
```

This starts Vite on `http://localhost:3000` with hot module replacement (HMR).

### Terminal 2: Workers Dev Server
```bash
npm run workers:dev
```

This starts Cloudflare Workers local server on `http://localhost:8787` with API endpoints.

**Verify Both Running**:
- Frontend: Open http://localhost:3000 in browser
- Backend: Visit http://localhost:8787/api/health (should return `{"status":"ok"}`)

---

## Step 6: Sign In with Test Account

1. Navigate to http://localhost:3000
2. Click "Sign In"
3. Enter credentials:
   - **Email**: `test@example.com`
   - **Password**: `password123`
4. You should be redirected to the home page showing NFL games

**Troubleshooting**:
- If authentication fails, verify test user was seeded: `npx wrangler d1 execute nfl-pickem-db --local --command="SELECT * FROM users;"`
- Check Workers dev server logs in Terminal 2 for errors

---

## Step 7: Sync NFL Games Data (Optional)

To populate the database with real NFL games:

```bash
# Sync ESPN API data for 2025 season (requires internet connection)
curl -X POST http://localhost:8787/api/odds/sync \
  -H "X-API-Key: ESPN-SYSTEM-SYNC-2025"
```

This fetches ~199 games for the 2025 season from ESPN API (takes ~48 seconds).

**Verify Games Loaded**:
```bash
npx wrangler d1 execute nfl-pickem-db --local --command="SELECT COUNT(*) FROM games WHERE season = 2025;"
# Should show: 199
```

---

## Step 8: Run Tests

### Unit Tests (Vitest)
```bash
npm run test
```

### End-to-End Tests (Playwright)
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e
```

### Integration Tests
```bash
npm run test:integration
```

**All tests should pass** on a fresh setup. If tests fail, check:
- Database migrations ran successfully
- Development servers are running
- Test user exists in database

---

## Step 9: Make Your First Change

Let's make a simple change to verify your setup works:

1. Open `src/pages/HomePage.tsx`
2. Find the heading: `<h1>NFL Pick'em</h1>`
3. Change it to: `<h1>My NFL Pick'em</h1>`
4. Save the file
5. Browser should auto-reload (Vite HMR) - verify change appears

**Commit Your Change**:
```bash
git checkout -b feature/my-first-change
git add src/pages/HomePage.tsx
git commit -m "Update home page heading"
```

---

## Common Development Tasks

### View Database Contents
```bash
# List all users
npx wrangler d1 execute nfl-pickem-db --local --command="SELECT id, email, name FROM users;"

# List games for week 1
npx wrangler d1 execute nfl-pickem-db --local --command="SELECT id, homeTeamId, awayTeamId, gameDate FROM games WHERE week = 1 LIMIT 5;"

# Check picks for a user
npx wrangler d1 execute nfl-pickem-db --local --command="SELECT * FROM picks WHERE userId = 'user-id';"
```

### Clear Database and Start Fresh
```bash
# Drop all tables
npx wrangler d1 execute nfl-pickem-db --local --command="DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS teams; DROP TABLE IF EXISTS games; DROP TABLE IF EXISTS picks; DROP TABLE IF EXISTS game_locks; DROP TABLE IF EXISTS system_logs; DROP TABLE IF EXISTS scheduler_logs;"

# Re-run migrations
npx wrangler d1 execute nfl-pickem-db --local --file=./migrations/0001_initial_schema.sql
# ... repeat for all migrations and seeds
```

### Debug API Endpoints
```bash
# Test auth endpoint
curl -X POST http://localhost:8787/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test games endpoint
curl http://localhost:8787/api/games?week=1&season=2025

# Test picks endpoint (requires token from signin)
curl http://localhost:8787/api/picks \
  -H "Authorization: Bearer <token>"
```

### Lint and Format Code
```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors (if configured)
npm run format      # Format with Prettier (if configured)
```

---

## Troubleshooting

### Issue: Frontend can't connect to API

**Symptom**: Network errors in browser console, API calls failing

**Solution**:
1. Verify Workers dev server is running on port 8787
2. Check `.env.local` has `VITE_API_BASE_URL=http://localhost:8787`
3. Restart Vite dev server after changing `.env.local`

### Issue: Database migrations fail

**Symptom**: `SQLITE_ERROR: no such table` errors

**Solution**:
1. Verify D1 database created: `npx wrangler d1 list`
2. Re-run all migration files in order (0001, 0002, 0003)
3. Check migration file syntax (valid SQLite SQL)

### Issue: Authentication fails

**Symptom**: 401 Unauthorized errors, "Invalid credentials"

**Solution**:
1. Verify test user exists: `npx wrangler d1 execute nfl-pickem-db --local --command="SELECT * FROM users;"`
2. Check password is correct: `password123` (case-sensitive)
3. Verify JWT_SECRET is set in `.dev.vars`

### Issue: Playwright tests fail

**Symptom**: E2E tests timeout or fail to launch browser

**Solution**:
1. Install Playwright browsers: `npx playwright install`
2. Verify development servers are running
3. Run with debugging: `npx playwright test --debug`

### Issue: npm install fails

**Symptom**: Dependency resolution errors, peer dependency warnings

**Solution**:
1. Delete `node_modules` and `package-lock.json`
2. Update Node.js to v18.x or higher
3. Run `npm install` again
4. If persists, try `npm install --legacy-peer-deps`

---

## Next Steps

Now that your development environment is set up, you can:

1. **Explore the Codebase**:
   - Read `ARCHITECTURE.md` for technical details
   - Review `spec.md` for feature requirements
   - Check `data-model.md` for database schema

2. **Pick a Task**:
   - Look at `tasks.md` for implementation tasks (generated by `/speckit.tasks`)
   - Check GitHub Issues for open bugs or features
   - Read `CLAUDE.md` for development guidelines

3. **Make Changes**:
   - Create a feature branch: `git checkout -b feature/my-feature`
   - Write tests first (TDD approach)
   - Implement feature
   - Run tests: `npm run test && npm run test:e2e`
   - Commit and push

4. **Deploy** (when ready):
   - Build frontend: `npm run build`
   - Deploy Workers: `npm run workers:deploy`
   - Verify production: https://pickem.cyberlees.dev

---

## Useful Resources

- **Project Documentation**: See root-level `.md` files
- **Cloudflare Docs**: https://developers.cloudflare.com/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/
- **Playwright Docs**: https://playwright.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Getting Help

- **Check Existing Docs**: `ARCHITECTURE.md`, `PROJECT.md`, `CLAUDE.md`
- **Review Contracts**: `contracts/` directory for API specifications
- **Ask the Team**: (contact info or Slack channel)
- **File an Issue**: GitHub Issues for bugs or questions

**Welcome to the team! Happy coding! 🏈**
