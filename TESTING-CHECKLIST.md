# 🏈 NFL Pick'em App - Testing Checklist

## Pre-Testing Setup
- [ ] PostgreSQL database running
- [ ] Environment variables configured (.env.local)
- [ ] Dependencies installed (`npm install`)
- [ ] Database schema created (`npm run db:push`)
- [ ] NFL teams seeded (`npm run db:seed`)
- [ ] Development server running (`npm run dev`)

## 🔐 Authentication Testing

### User Registration
- [ ] Navigate to `/signup`
- [ ] Create new account with valid data
- [ ] Verify form validation (missing fields, password mismatch)
- [ ] Confirm successful registration and auto-login
- [ ] Check duplicate email/username prevention

### User Login
- [ ] Navigate to `/signin`
- [ ] Login with correct credentials
- [ ] Test invalid credentials (should show error)
- [ ] Verify redirect to dashboard after login
- [ ] Test logout functionality

## 📊 Dashboard Testing
- [ ] Dashboard loads with user stats
- [ ] Quick stats show correct numbers (picks, win rate, etc.)
- [ ] Navigation cards work (Games, Picks, Profile)
- [ ] Games preview displays (if games synced)
- [ ] Performance overview shows for users with picks

## 🏈 NFL Data Integration

### Game Sync
- [ ] Run sync command: `npm run sync:nfl`
- [ ] Verify teams populated in database (`npm run db:studio`)
- [ ] Check games appear in `/games`
- [ ] Confirm game status updates (upcoming, live, final)
- [ ] Test manual sync via admin panel (if admin user)

### Games Display
- [ ] Navigate to `/games`
- [ ] Games display with team logos and info
- [ ] Game status badges show correctly
- [ ] Refresh button works
- [ ] Mobile responsive design

## 🎯 Picks System Testing

### Making Picks
- [ ] Navigate to `/picks`
- [ ] Upcoming games show pick options
- [ ] Can select teams for upcoming games
- [ ] Pick deadlines enforced (no picks after game start)
- [ ] Toast notifications work for pick save/remove
- [ ] Pick status updates correctly

### Pick Management
- [ ] Clear picks functionality works
- [ ] Pick changes save properly
- [ ] User can see their current picks
- [ ] Stats update after making picks (dashboard)

## 🏆 Leaderboard Testing

### Weekly Leaderboard
- [ ] Navigate to `/leaderboard`
- [ ] Weekly view shows current week standings
- [ ] User position highlighted
- [ ] Correct ranking by points/accuracy
- [ ] Stats display properly

### Season Leaderboard
- [ ] Toggle to season view
- [ ] Season standings calculated correctly
- [ ] Weekly breakdown shows (if applicable)
- [ ] Season statistics accurate

## 👤 Profile Management
- [ ] Navigate to `/profile`
- [ ] User info displays correctly
- [ ] Edit profile functionality works
- [ ] Stats and pick history shown
- [ ] Recent picks display with results

## 🔧 Admin Features (Admin Users Only)
- [ ] Set user as admin in database: `isAdmin: true`
- [ ] Admin panel accessible at `/admin`
- [ ] Admin badge shows in navigation
- [ ] Sync games via admin interface
- [ ] Recalculate scores functionality
- [ ] Admin-only API endpoints work

## 📱 Mobile Testing
- [ ] All pages responsive on mobile
- [ ] Navigation header collapses properly
- [ ] Pick interface usable on mobile
- [ ] Leaderboard table scrollable
- [ ] Touch interactions work

## 🧪 Edge Cases & Error Handling

### Game States
- [ ] Test with games in different states (upcoming, live, completed)
- [ ] Pick deadlines work correctly
- [ ] Score updates reflect in pick results
- [ ] Completed games show correct winners

### Data Scenarios
- [ ] Empty states (no games, no picks, no users)
- [ ] Loading states work properly
- [ ] Error messages display for failed requests
- [ ] Network error handling

### User Scenarios
- [ ] New user with no picks
- [ ] User with completed picks
- [ ] User with pending picks
- [ ] Multiple users in leaderboard

## 🚀 Production Readiness
- [ ] Build succeeds: `npm run build`
- [ ] No console errors or warnings
- [ ] Environment variables secure
- [ ] Database migrations work: `npm run db:migrate`
- [ ] Sync scripts functional in production
- [ ] Error boundaries handle crashes gracefully

## 📋 Test Results

**Date Tested**: ___________  
**Tester**: ___________  
**Environment**: ___________  

### Issues Found:
1. ___________
2. ___________
3. ___________

### Notes:
___________
___________
___________

**Overall Status**: ⭕ Pass / ❌ Fail  
**Ready for Deployment**: ✅ Yes / ❌ No