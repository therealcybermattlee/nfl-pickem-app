#!/bin/bash

# Check Current Database State
# This script helps verify the current state before applying migration

set -e

echo "📊 Current Database State Check"
echo "==============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}Production Database:${NC}"
echo "-------------------"

# Check production database
if wrangler d1 execute nfl-pickem-db --command="SELECT COUNT(*) as games FROM games;" 2>/dev/null; then
    echo "✓ Production database accessible"
    
    # Get counts
    games=$(wrangler d1 execute nfl-pickem-db --command="SELECT COUNT(*) FROM games;" 2>/dev/null || echo "0")
    picks=$(wrangler d1 execute nfl-pickem-db --command="SELECT COUNT(*) FROM picks;" 2>/dev/null || echo "0")
    users=$(wrangler d1 execute nfl-pickem-db --command="SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    
    echo "  Games: $games"
    echo "  Picks: $picks"  
    echo "  Users: $users"
    
    # Check if migration already applied
    lock_check=$(wrangler d1 execute nfl-pickem-db --command="SELECT COUNT(name) FROM sqlite_master WHERE type='table' AND name='game_locks';" 2>/dev/null || echo "0")
    if [[ "$lock_check" == "0" ]]; then
        echo -e "${GREEN}  ✓ Migration not yet applied${NC}"
    else
        echo -e "${YELLOW}  ⚠ Migration appears to already be applied${NC}"
    fi
    
    # Check current schema
    echo "  Current games table columns:"
    wrangler d1 execute nfl-pickem-db --command="PRAGMA table_info(games);" 2>/dev/null | awk -F'|' '{print "    " $2}' || echo "    Error reading schema"
    
else
    echo "✗ Production database not accessible"
fi

echo -e "\n${YELLOW}Local Database:${NC}"
echo "--------------"

# Check local database  
if wrangler d1 execute nfl-pickem-db --local --command="SELECT COUNT(*) as games FROM games;" 2>/dev/null; then
    echo "✓ Local database accessible"
    
    # Get counts
    games_local=$(wrangler d1 execute nfl-pickem-db --local --command="SELECT COUNT(*) FROM games;" 2>/dev/null || echo "0")
    picks_local=$(wrangler d1 execute nfl-pickem-db --local --command="SELECT COUNT(*) FROM picks;" 2>/dev/null || echo "0")
    users_local=$(wrangler d1 execute nfl-pickem-db --local --command="SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    
    echo "  Games: $games_local"
    echo "  Picks: $picks_local"
    echo "  Users: $users_local"
    
    # Check if migration already applied locally
    lock_check_local=$(wrangler d1 execute nfl-pickem-db --local --command="SELECT COUNT(name) FROM sqlite_master WHERE type='table' AND name='game_locks';" 2>/dev/null || echo "0")
    if [[ "$lock_check_local" == "0" ]]; then
        echo -e "${GREEN}  ✓ Migration not yet applied locally${NC}"
    else
        echo -e "${YELLOW}  ⚠ Migration appears to already be applied locally${NC}"
    fi
    
else
    echo "✗ Local database not accessible (may need setup)"
fi

echo -e "\n${YELLOW}Migration Files:${NC}"
echo "---------------"

if [[ -f "migrations/001_add_time_lock_fields.sql" ]]; then
    echo -e "${GREEN}✓ Migration file exists${NC}"
else
    echo "✗ Migration file missing"
fi

if [[ -f "migrations/001_rollback_time_lock_fields.sql" ]]; then
    echo -e "${GREEN}✓ Rollback file exists${NC}"
else
    echo "✗ Rollback file missing"
fi

if [[ -x "migrations/test_migration.sh" ]]; then
    echo -e "${GREEN}✓ Test script exists and is executable${NC}"
else
    echo "✗ Test script missing or not executable"
fi

echo -e "\n${YELLOW}Ready to Proceed:${NC}"
echo "-----------------"
echo "To apply migration to local database:"
echo "  wrangler d1 execute nfl-pickem-db --local --file=migrations/001_add_time_lock_fields.sql"
echo ""
echo "To apply migration to production:"
echo "  wrangler d1 execute nfl-pickem-db --file=migrations/001_add_time_lock_fields.sql"
echo ""
echo "To run full test suite:"
echo "  ./migrations/test_migration.sh"