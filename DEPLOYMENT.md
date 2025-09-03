# 🚀 NFL Pick'em App - Deployment Guide

## Quick Deploy to Vercel

### 1. Prepare Database
```bash
# Create production PostgreSQL database
# Get connection string format: postgresql://user:pass@host:port/dbname
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel

# Follow prompts:
# - Set up new project
# - Import from GitHub
# - Configure build settings
```

### 3. Environment Variables in Vercel
Add these in Vercel dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
CURRENT_NFL_SEASON=2024
CURRENT_NFL_WEEK=1
```

### 4. Database Setup
```bash
# After deployment, run migrations
npx prisma db push
npx prisma db seed
```

### 5. Initial Data Sync
- Visit your deployed app
- Create admin user
- Set `isAdmin: true` in database
- Run sync from admin panel or API

## Alternative: Railway Deployment

### 1. Database on Railway
- Create new Railway project
- Add PostgreSQL service
- Copy DATABASE_URL

### 2. Deploy App
- Connect GitHub repo
- Set environment variables
- Deploy automatically

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `NEXTAUTH_SECRET` | Session encryption key | Random 32+ chars |
| `NEXTAUTH_URL` | App URL | `https://yourapp.com` |
| `CURRENT_NFL_SEASON` | NFL season year | `2024` |
| `CURRENT_NFL_WEEK` | Current week | `1-18` |

## Post-Deployment Setup

### 1. Create Admin User
```sql
-- In your database
UPDATE users SET "isAdmin" = true WHERE email = 'your@email.com';
```

### 2. Initial Data Sync
- Visit `/admin` with admin user
- Click "Sync Latest Games"
- Or call API: `POST /api/sync/games`

### 3. Test Core Features
- User registration/login
- Game data display
- Pick functionality
- Leaderboard calculation

## Monitoring & Maintenance

### Database Monitoring
- Monitor connection pool usage
- Set up automated backups
- Check query performance

### Application Monitoring
- Set up error tracking (Sentry)
- Monitor API response times
- Track user activity

### Regular Tasks
- Sync game data (can be automated)
- Update scores during game days
- Monitor for API rate limits

## Production Optimizations

### Performance
```javascript
// Consider adding to next.config.js
module.exports = {
  images: {
    domains: ['a.espncdn.com'], // ESPN logos
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}
```

### Caching
- Enable API route caching for static data
- Cache team logos and static assets
- Consider Redis for session storage

### Security
- Enable HTTPS only
- Set proper CORS headers
- Rate limit API endpoints
- Validate all inputs

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Check DATABASE_URL format
- Verify database is accessible
- Check connection pool limits

**NextAuth Issues**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches domain
- Confirm callback URLs

**Game Sync Issues**
- ESPN API may have rate limits
- Check network connectivity
- Verify team data exists

**Build Failures**
- Check TypeScript errors
- Verify all dependencies installed
- Check Prisma schema validity

### Debug Mode
```env
# Add for debugging
DEBUG=1
NODE_ENV=development
```

## Scaling Considerations

### Database
- Connection pooling (PgBouncer)
- Read replicas for heavy queries
- Index optimization for leaderboards

### Application
- API rate limiting
- Background job processing
- CDN for static assets

### Infrastructure
- Load balancing for high traffic
- Monitoring and alerting
- Automated deployments

---

**Ready to deploy?** Follow the quick Vercel guide above! 🚀