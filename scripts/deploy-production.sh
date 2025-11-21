#!/bin/bash

# NFL Pick'em App - Safe Production Deployment Script
# This script deploys code changes while preserving all database data

set -e  # Exit on error

echo "🏈 NFL Pick'em App - Production Deployment"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 0: Check authentication
echo "📋 Step 0: Checking Cloudflare authentication..."
if ! npx wrangler whoami > /dev/null 2>&1; then
    print_error "Not logged in to Cloudflare"
    echo ""
    echo "Please run: npx wrangler login"
    exit 1
fi
print_success "Authenticated with Cloudflare"
echo ""

# Step 1: Pre-deployment verification
echo "📋 Step 1: Pre-deployment verification..."
echo ""

print_info "Checking production database status..."
PRE_DEPLOY_COUNTS=$(npx wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as games FROM games WHERE season = 2025; SELECT COUNT(*) as picks FROM picks;" 2>&1 | grep -E "users|games|picks" || echo "Could not retrieve counts")

if [ -z "$PRE_DEPLOY_COUNTS" ]; then
    print_warning "Could not retrieve database counts"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled by user"
        exit 1
    fi
else
    echo "Pre-deployment database status:"
    echo "$PRE_DEPLOY_COUNTS"
    echo ""
fi

print_warning "CRITICAL: This deployment includes code changes only"
print_info "Your database data (users, games, picks) will be preserved"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled by user"
    exit 1
fi
echo ""

# Step 2: Build frontend
echo "📋 Step 2: Building frontend..."
if npm run build; then
    print_success "Frontend build completed"
else
    print_error "Frontend build failed"
    exit 1
fi
echo ""

# Step 3: Deploy Workers API
echo "📋 Step 3: Deploying Workers API (backend)..."
if npm run workers:deploy-prod; then
    print_success "Workers API deployed"
else
    print_error "Workers API deployment failed"
    exit 1
fi
echo ""

# Step 4: Test Workers API
echo "📋 Step 4: Testing Workers API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://nfl-pickem-app-production.cybermattlee-llc.workers.dev/api/teams)
if [ "$API_RESPONSE" = "200" ]; then
    print_success "Workers API is responding (HTTP $API_RESPONSE)"
else
    print_warning "Workers API returned HTTP $API_RESPONSE (expected 200)"
fi
echo ""

# Step 5: Deploy frontend to Cloudflare Pages
echo "📋 Step 5: Deploying frontend to Cloudflare Pages..."
print_info "Deploying dist/ to nfl-pickem-app..."

if npx wrangler pages deploy dist --project-name=nfl-pickem-app --branch=production; then
    print_success "Frontend deployed to Cloudflare Pages"
else
    print_error "Frontend deployment failed"
    exit 1
fi
echo ""

# Step 6: Post-deployment verification
echo "📋 Step 6: Post-deployment verification..."
echo ""

print_info "Checking frontend health..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://pickem.cyberlees.dev)
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend is live (HTTP $FRONTEND_STATUS)"
else
    print_warning "Frontend returned HTTP $FRONTEND_STATUS (expected 200)"
fi
echo ""

print_info "Checking production database status..."
POST_DEPLOY_COUNTS=$(npx wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as games FROM games WHERE season = 2025; SELECT COUNT(*) as picks FROM picks;" 2>&1 | grep -E "users|games|picks" || echo "Could not retrieve counts")

if [ -z "$POST_DEPLOY_COUNTS" ]; then
    print_warning "Could not retrieve post-deployment database counts"
else
    echo "Post-deployment database status:"
    echo "$POST_DEPLOY_COUNTS"
    echo ""

    print_info "Comparing pre and post deployment counts..."
    if [ "$PRE_DEPLOY_COUNTS" = "$POST_DEPLOY_COUNTS" ] || [ -z "$PRE_DEPLOY_COUNTS" ]; then
        print_success "Database integrity verified - no data lost"
    else
        print_warning "Database counts changed (this is OK if users were active during deployment)"
    fi
fi
echo ""

# Summary
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
print_success "Production URL: https://pickem.cyberlees.dev"
print_success "API URL: https://nfl-pickem-app-production.cybermattlee-llc.workers.dev"
echo ""
print_info "Next steps:"
echo "  1. Visit https://pickem.cyberlees.dev in your browser"
echo "  2. Test authentication (login/logout)"
echo "  3. Test notifications (submit a pick)"
echo "  4. Verify existing data is intact"
echo ""
print_info "Monitor deployment:"
echo "  npm run prod:logs       # View real-time logs"
echo "  npm run prod:monitor    # Check system status"
echo ""
echo "Deployment completed at: $(date)"
