# Cloudflare Workers + Zero Trust Deployment Guide

## Prerequisites
- Cloudflare account with Workers and Zero Trust access
- Domain `leefamilysso.com` managed by Cloudflare
- Wrangler CLI installed and authenticated

## Step 1: Database Migration to Cloudflare D1

### 1.1 Create D1 Database
```bash
# Login to Cloudflare (if not already done)
npx wrangler login

# Create D1 database
yarn run db:d1-create

# Note the database ID and update wrangler.toml
```

### 1.2 Export Current Data
```bash
# Export current SQLite data
yarn run db:export
```

### 1.3 Import to D1
```bash
# Import data to D1 database
yarn run db:d1-migrate
```

## Step 2: Configure Environment Variables

### 2.1 Set Secrets
```bash
# Set sensitive environment variables
npx wrangler secret put THE_ODDS_API_KEY --env production
npx wrangler secret put NEXTAUTH_SECRET --env production
```

### 2.2 Update wrangler.toml
Update the `database_id` in wrangler.toml with the actual D1 database ID from Step 1.1.

## Step 3: Cloudflare Zero Trust Setup

### 3.1 Create Access Application
1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications
2. Add Application:
   - **Application name:** NFL Pick'em
   - **Subdomain:** pickem
   - **Domain:** leefamilysso.com
   - **Path:** /*

### 3.2 Configure Access Policies
Create policies for who can access the application:
- **Policy name:** "Lee Family Members"
- **Action:** Allow
- **Rules:** Add emails or groups who should have access

### 3.3 Identity Provider (Optional)
Configure identity providers if needed:
- Microsoft 365
- Google Workspace
- Generic SAML/OIDC

## Step 4: Domain Configuration

### 4.1 DNS Setup
Ensure `leefamilysso.com` is configured in Cloudflare DNS.

### 4.2 SSL/TLS Settings
1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full" or "Full (strict)"
3. Enable "Always Use HTTPS"

## Step 5: Deploy to Workers

### 5.1 Build for Workers
```bash
# Generate Prisma client with D1 adapter support
yarn run db:generate

# Build Next.js for Workers
yarn run workers:build
```

### 5.2 Deploy
```bash
# Deploy to Cloudflare Workers
yarn run workers:deploy
```

### 5.3 Configure Custom Domain
```bash
# Add custom domain to Worker
npx wrangler subdomain add pickem.cyberlees.dev
```

## Step 6: Verification

### 6.1 Test Access
1. Navigate to https://pickem.cyberlees.dev
2. Verify Cloudflare Access authentication works
3. Test application functionality

### 6.2 Database Operations
- Verify games data displays correctly
- Test picks submission
- Check odds sync functionality

## Step 7: Post-Deployment Configuration

### 7.1 Update OAuth Redirect URIs
If using Microsoft OAuth, update redirect URIs:
- Development: `http://localhost:3000/api/auth/callback/microsoft`
- Production: `https://pickem.cyberlees.dev/api/auth/callback/microsoft`

### 7.2 Configure Monitoring
Set up Cloudflare Analytics and error tracking:
- Workers Analytics
- Real User Monitoring (RUM)
- Error tracking via Sentry (optional)

## Troubleshooting

### Common Issues
1. **D1 Database Connection Errors**
   - Verify database ID in wrangler.toml
   - Check D1 binding configuration

2. **Zero Trust Authentication Loops**
   - Verify Access application configuration
   - Check policy rules and identity providers

3. **NextAuth Session Issues**
   - Ensure NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches production domain

4. **Edge Runtime Compatibility**
   - Check for Node.js-specific code in API routes
   - Verify all dependencies support edge runtime

### Debug Commands
```bash
# Check deployment logs
npx wrangler tail --env production

# Test D1 database connectivity
npx wrangler d1 execute nfl-pickem-db --command="SELECT COUNT(*) FROM games" --env production

# Local development with D1
yarn run workers:dev
```

## Architecture Benefits

✅ **Global Performance:** Edge deployment across 300+ locations  
✅ **Enterprise Security:** Zero Trust access control  
✅ **Cost Efficiency:** Pay-per-request serverless model  
✅ **Auto Scaling:** Handles traffic spikes automatically  
✅ **High Availability:** 99.9%+ uptime SLA  
✅ **DDoS Protection:** Built-in Cloudflare security  

## Support Contacts
- Cloudflare Support: For infrastructure issues
- Developer: For application-specific problems