# Safe Production Deployment Guide

## 🚨 CRITICAL: Data Preservation

This deployment includes **code changes only** - NO database migrations:
- ✅ New authentication UI (SignIn, SignUp pages)
- ✅ New notification system components
- ✅ Real-time notification integration with SSE
- ✅ Formatter utility functions
- ❌ NO database schema changes
- ❌ NO data migrations

**Your existing production data (users, games, picks) will be preserved.**

---

## Prerequisites

1. **Authenticate with Cloudflare:**
   ```bash
   npx wrangler login
   ```
   This will open a browser window for authentication.

2. **Verify you're logged in:**
   ```bash
   npx wrangler whoami
   ```

---

## Step 1: Pre-Deployment Verification

### Check Production Database Status
```bash
# Verify data exists (you should see counts > 0)
npm run prod:db:status
```

Expected output:
```
users   | <number of users>
games   | <number of 2025 games>
picks   | <number of picks>
```

**⚠️ STOP if these counts are 0 or unexpected!**

---

## Step 2: Deploy Backend (Workers API)

### Deploy to Production Environment
```bash
npm run workers:deploy-prod
```

This deploys the Workers API with:
- Updated authentication context integration
- Real-time notification event handling
- New API endpoints (if any)

### Verify Workers Deployment
```bash
curl https://nfl-pickem-app-production.cybermattlee-llc.workers.dev/api/teams | head -20
```

Expected: JSON response with NFL teams data

---

## Step 3: Deploy Frontend

### Option A: Using Wrangler (Recommended)
```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=nfl-pickem-app
```

### Option B: Git-based Deployment (Alternative)
If your Cloudflare Pages is connected to GitHub:
```bash
# Simply push to main branch (we're on feature branch, so merge first)
git checkout main
git merge 001-implement-research
git push origin main
```

Cloudflare Pages will auto-deploy from main branch.

---

## Step 4: Post-Deployment Verification

### 1. Check Production Health
```bash
npm run prod:health
```

Expected output:
```
Frontend Status: 200
API connectivity: OK
```

### 2. Verify Database Integrity (Data Not Lost)
```bash
npm run prod:db:status
```

**⚠️ CRITICAL: Compare these counts with Step 1. They should be THE SAME or HIGHER (if new data added during deployment).**

### 3. Manual Browser Testing

Visit: **https://pickem.cyberlees.dev**

#### Test Checklist:

**Authentication System:**
- [ ] Navigate to /signin - SignIn page loads
- [ ] Try logging in with test@example.com / password123
- [ ] Should redirect to home page after successful login
- [ ] Try navigating to /games while logged out - should redirect to /signin
- [ ] Test logout functionality

**Notification System:**
- [ ] After logging in, check browser console for any errors
- [ ] Submit a pick - should see success notification (green toast)
- [ ] Try submitting invalid pick - should see error notification (red toast)
- [ ] Check if notifications auto-dismiss after 5 seconds
- [ ] Check if dismiss button works (X button)

**Real-Time Events (if SSE is active):**
- [ ] Open browser DevTools > Network tab
- [ ] Look for connection to `/api/events/stream`
- [ ] Verify EventSource connection is established
- [ ] Trigger a pick submission - should see real-time notification

**Existing Functionality:**
- [ ] Home page loads with games
- [ ] Games page shows current week's games
- [ ] Leaderboard displays correctly
- [ ] All existing picks are still visible
- [ ] Game countdown timers work

---

## Step 5: Rollback Plan (If Issues Occur)

### If Frontend Has Issues:
```bash
# Revert to previous deployment on Cloudflare Pages
# Go to Cloudflare Dashboard > Pages > nfl-pickem-app > Deployments
# Click "Rollback to this deployment" on the previous successful build
```

### If Workers API Has Issues:
```bash
# Deploy previous version
git checkout <previous-commit-hash>
npm run workers:deploy-prod
git checkout 001-implement-research
```

### If Data Issues (UNLIKELY - we didn't touch database):
```bash
# Contact Cloudflare support or restore from backup
# Check Cloudflare D1 dashboard for point-in-time restore options
```

---

## Known Deployment Considerations

### 1. CORS Configuration
The Workers API is configured to allow:
- https://pickem.cyberlees.dev (production)
- http://localhost:3000 (dev)

If you see CORS errors, check `src/worker.ts` CORS headers.

### 2. Environment Variables
No new environment variables required for this deployment.

### 3. First-Time User Experience
- Existing users can still log in with their credentials
- New users can now use the SignUp page (wasn't available before)
- All existing picks and data are preserved

### 4. Progressive Enhancement
- Real-time notifications will work if SSE is available
- Falls back to polling if SSE isn't supported
- Everything works without real-time features if needed

---

## Success Criteria

✅ Frontend loads at https://pickem.cyberlees.dev
✅ Authentication works (sign in, sign out, protected routes)
✅ Notifications display for user actions
✅ All existing games, picks, and users are intact
✅ Leaderboard shows correct data
✅ No console errors in browser DevTools
✅ Database counts match pre-deployment counts

---

## Deployment Log Template

Record your deployment for tracking:

```
Date: _______________
Time: _______________
Deployed By: _______________
Branch: 001-implement-research
Commits: c5a124e, 5671010, 0361479, acb4da4, 06fb0ad

Pre-Deployment Counts:
- Users: _______
- Games: _______
- Picks: _______

Post-Deployment Counts:
- Users: _______
- Games: _______
- Picks: _______

Issues Encountered: _______________
Resolution: _______________

Status: ✅ SUCCESS / ❌ ROLLED BACK
```

---

## Need Help?

If you encounter any issues during deployment:

1. **Check Logs:**
   ```bash
   npm run prod:logs
   ```

2. **Check Cloudflare Dashboard:**
   - Workers: https://dash.cloudflare.com > Workers & Pages
   - D1 Database: https://dash.cloudflare.com > D1

3. **Verify Build Artifacts:**
   ```bash
   ls -la dist/
   ```

4. **Test Locally First:**
   ```bash
   npm run dev  # Frontend
   npm run workers:dev  # API
   ```

---

## Post-Deployment Monitoring

Monitor for 24-48 hours after deployment:

1. **Error Rates:** Check Cloudflare Workers analytics for errors
2. **User Activity:** Monitor pick submissions and user logins
3. **Performance:** Check page load times and API response times
4. **Database:** Verify data integrity with periodic spot checks

---

**Remember: This is a code-only deployment. Your data is safe! 🛡️**
