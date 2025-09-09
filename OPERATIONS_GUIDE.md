# NFL Pick'em App - Production Operations Guide

**Production Environment Management and Monitoring**

This guide covers operational procedures for maintaining the NFL Pick'em app in production.

## 🔧 Production Environment

### Infrastructure Overview:
- **Frontend**: Cloudflare Pages (https://pickem.leefamilysso.com)
- **API**: Cloudflare Workers (https://nfl-pickem-app-production.cybermattlee-llc.workers.dev)
- **Database**: Cloudflare D1 (nfl-pickem-db)
- **CDN**: Global Cloudflare edge network
- **Monitoring**: Built-in Cloudflare analytics and logging

## 📊 Monitoring and Health Checks

### Health Check Endpoints:

#### Frontend Health:
```bash
curl https://pickem.leefamilysso.com/health
# Expected: 200 OK with app status
```

#### API Health:
```bash
curl https://nfl-pickem-app-production.cybermattlee-llc.workers.dev/api/health
# Expected: {"status": "ok", "timestamp": "...", "database": "connected"}
```

### Key Metrics to Monitor:

#### Performance Metrics:
- **Page Load Time**: Should be < 2 seconds
- **API Response Time**: Should be < 500ms average
- **Database Query Time**: Should be < 100ms for standard operations
- **Error Rate**: Should be < 1% of total requests

#### Usage Metrics:
- **Active Users**: Track family member engagement
- **Pick Submission Rate**: Monitor weekly participation
- **Game Data Freshness**: Ensure NFL data is current
- **Cron Job Execution**: Verify 15-minute automation is running

### Cloudflare Dashboard Monitoring:

#### Workers Analytics:
1. **Navigate to**: Cloudflare Dashboard → Workers & Pages → nfl-pickem-app-production
2. **Check**:
   - Request volume and success rate
   - CPU usage and memory consumption
   - Error logs and stack traces
   - Performance metrics and response times

#### D1 Database Monitoring:
1. **Navigate to**: Cloudflare Dashboard → D1 → nfl-pickem-db
2. **Monitor**:
   - Query volume and performance
   - Storage usage and growth
   - Connection health and errors
   - Backup status and recovery points

## 🔄 NFL Data Management

### Weekly Data Synchronization:

#### Manual Sync (if needed):
```bash
# Production sync command
curl -X POST https://nfl-pickem-app-production.cybermattlee-llc.workers.dev/api/odds/sync

# Expected response includes:
# - gamesInserted: number of games added
# - weekBreakdown: games per week
# - dataSources: ESPN + The Odds API statistics
```

#### Automated Sync Schedule:
- **Cron Jobs**: Running every 15 minutes
- **Functions**:
  - Game status updates
  - Score synchronization  
  - Pick deadline enforcement
  - Random pick generation

#### Data Verification:

**Check Game Count for Current Week:**
```bash
wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as game_count FROM games WHERE season = 2025 AND week = 1;"
```

**Verify Data Sources:**
```bash
wrangler d1 execute nfl-pickem-db --remote --command="SELECT oddsProvider, COUNT(*) as count FROM games WHERE season = 2025 GROUP BY oddsProvider;"
```

**Check Latest Games:**
```bash
wrangler d1 execute nfl-pickem-db --remote --command="SELECT homeTeamName, awayTeamName, gameTime, status FROM games WHERE season = 2025 AND week = 1 ORDER BY gameTime LIMIT 5;"
```

## 🚨 Emergency Procedures

### Critical Issue Response:

#### Service Outage:
1. **Check Cloudflare Status**: Visit status.cloudflare.com
2. **Verify DNS**: Ensure domain resolves correctly
3. **Check Workers**: Review error logs in Cloudflare dashboard
4. **Database Access**: Test D1 connection and query performance
5. **Rollback Process**: Revert to last known good deployment if needed

#### Data Corruption:
1. **Stop Cron Jobs**: Temporarily disable automation if needed
2. **Backup Current State**: Export current database state
3. **Identify Corruption**: Determine scope and impact
4. **Restore from Backup**: Use Cloudflare D1 backup and recovery
5. **Verify Integrity**: Run data validation checks post-recovery

#### Performance Degradation:
1. **Check Analytics**: Review Cloudflare metrics for bottlenecks
2. **Database Performance**: Monitor D1 query performance
3. **API Rate Limits**: Verify external API usage (ESPN, The Odds API)
4. **Scale Resources**: Consider upgrading Cloudflare plan if needed
5. **Optimize Queries**: Review and optimize database operations

### Incident Response Checklist:

#### Immediate Actions (0-15 minutes):
- [ ] Verify the scope and impact of the issue
- [ ] Check Cloudflare dashboard for error logs and metrics
- [ ] Test critical user paths (login, pick submission, leaderboard)
- [ ] Document initial findings and timeline

#### Short-term Actions (15-60 minutes):
- [ ] Implement temporary fixes if possible
- [ ] Communicate status to family users if widespread issue
- [ ] Coordinate with Cloudflare support if infrastructure issue
- [ ] Begin deeper investigation and root cause analysis

#### Long-term Actions (1+ hours):
- [ ] Implement permanent fix and test thoroughly
- [ ] Update monitoring to prevent future occurrences  
- [ ] Document lessons learned and update procedures
- [ ] Schedule post-incident review and improvements

## 🛠 Maintenance Procedures

### Weekly Maintenance Tasks:

#### Every Monday (Post-Weekend Games):
- [ ] Verify all weekend games scored correctly
- [ ] Check leaderboard calculations for accuracy
- [ ] Review error logs for any weekend issues
- [ ] Confirm user engagement metrics
- [ ] Prepare for upcoming week's game data

#### Every Tuesday (New Week Prep):
- [ ] Sync new week's NFL game data
- [ ] Verify game schedules and betting lines
- [ ] Test time-lock functionality for upcoming games
- [ ] Check automated cron job health
- [ ] Review database performance metrics

### Monthly Maintenance Tasks:

#### Database Optimization:
```bash
# Check database size and growth
wrangler d1 execute nfl-pickem-db --remote --command="SELECT name, sql FROM sqlite_master WHERE type='table';"

# Analyze table sizes
wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as picks_count FROM picks;"
wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as games_count FROM games;"
wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as users_count FROM users;"
```

#### Performance Review:
- Review Cloudflare analytics for trends
- Analyze user behavior and engagement patterns
- Identify optimization opportunities
- Update performance benchmarks

#### Security Review:
- Review authentication logs for anomalies
- Check for any security vulnerabilities
- Update dependencies if needed
- Verify SSL certificate status

### Seasonal Maintenance:

#### Pre-Season (August):
- [ ] Sync complete NFL schedule for new season
- [ ] Test all systems with new season data
- [ ] Update team information if changes occurred
- [ ] Verify betting line integrations working
- [ ] Load test for expected usage growth

#### Mid-Season (October-December):
- [ ] Monitor performance during peak usage
- [ ] Optimize database queries as data grows
- [ ] Review and tune cron job frequency if needed
- [ ] Plan for playoff system enhancements

#### Post-Season (January-February):
- [ ] Archive completed season data
- [ ] Generate season summary statistics
- [ ] Plan improvements for next season
- [ ] Review operational lessons learned

## 📈 Performance Optimization

### Database Performance:

#### Query Optimization:
```sql
-- Index recommendations for common queries
CREATE INDEX IF NOT EXISTS idx_games_season_week ON games(season, week);
CREATE INDEX IF NOT EXISTS idx_picks_user_game ON picks(userId, gameId);
CREATE INDEX IF NOT EXISTS idx_games_time ON games(gameTime);
```

#### Monitoring Slow Queries:
- Use Cloudflare D1 analytics to identify slow operations
- Review query patterns and optimize WHERE clauses
- Consider denormalization for read-heavy operations
- Monitor database growth and plan scaling

### API Performance:

#### Caching Strategy:
- Leverage Cloudflare edge caching for static data
- Implement appropriate cache headers for game data
- Use request deduplication for high-traffic endpoints
- Monitor cache hit rates and optimize cache keys

#### Request Optimization:
- Batch database operations where possible
- Minimize external API calls during peak usage
- Implement request queuing for non-critical operations
- Use async patterns for independent operations

### Frontend Performance:

#### Asset Optimization:
- Ensure images are properly compressed and cached
- Use appropriate lazy loading for off-screen content
- Minimize JavaScript bundle size with code splitting
- Leverage Cloudflare's automatic optimizations

## 📞 Support and Escalation

### Contact Information:

#### Technical Issues:
- **Primary**: Matt (app developer and maintainer)
- **Backup**: Cloudflare support for infrastructure issues
- **Documentation**: This operations guide and production documentation

#### User Issues:
- **First Response**: Check operations dashboard and logs
- **User Communication**: Direct family support via established channels
- **Issue Resolution**: Technical fixes followed by user notification

### Escalation Procedures:

#### Level 1 - Minor Issues:
- Individual user problems
- Minor data inconsistencies  
- Performance slowdowns
- **Response Time**: Within 2 hours during waking hours

#### Level 2 - Major Issues:
- Service unavailability
- Data corruption affecting multiple users
- Security vulnerabilities
- **Response Time**: Within 30 minutes, 24/7

#### Level 3 - Critical Issues:
- Complete service outage
- Data breach or security compromise
- Infrastructure failure
- **Response Time**: Immediate response required

## 📝 Change Management

### Deployment Process:

#### Development to Production:
```bash
# 1. Build and test locally
npm run build
npm run test:e2e

# 2. Deploy Workers API
npm run workers:deploy

# 3. Deploy frontend (automatic via GitHub integration)
git push origin main  # Triggers Cloudflare Pages deployment

# 4. Verify deployment
curl https://pickem.leefamilysso.com/health
curl https://nfl-pickem-app-production.cybermattlee-llc.workers.dev/api/health
```

#### Rollback Process:
```bash
# Workers rollback (if needed)
wrangler rollback --name nfl-pickem-app-production

# Pages rollback via Cloudflare dashboard:
# 1. Navigate to Cloudflare Pages
# 2. Select nfl-pickem-app project  
# 3. Go to Deployments tab
# 4. Find previous successful deployment
# 5. Click "Retry deployment" or "Promote to production"
```

### Change Documentation:
- Document all production changes with timestamps
- Include rollback procedures for each change
- Track performance impact of changes
- Maintain change log for audit purposes

## ✅ Success Metrics

### Operational Excellence KPIs:

#### Availability:
- **Target**: 99.9% uptime
- **Measurement**: Cloudflare analytics and health checks
- **Alert Threshold**: Any downtime > 5 minutes

#### Performance:
- **Target**: < 2 second page loads, < 500ms API responses
- **Measurement**: Real User Monitoring (RUM) data
- **Alert Threshold**: 90th percentile above targets

#### User Experience:
- **Target**: < 1% error rate on critical user actions
- **Measurement**: Application error tracking
- **Alert Threshold**: Error rate > 2% for 10+ minutes

#### Data Quality:
- **Target**: 100% accuracy on game data and scoring
- **Measurement**: Manual verification and automated checks
- **Alert Threshold**: Any scoring discrepancies

### Continuous Improvement:
- Regular review of operational metrics
- User feedback collection and analysis
- Infrastructure optimization opportunities
- Process refinement and documentation updates

---

**This operations guide ensures the NFL Pick'em app maintains high availability, performance, and user satisfaction throughout the NFL season.**