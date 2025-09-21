#!/bin/bash

# NFL Pick'em App - E2E Test Runner Script
# Day 5-6: Playwright Testing Framework Setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:5173"
API_URL="http://localhost:8787"
PROD_URL="https://pickem.cyberlees.dev"

echo -e "${BLUE}🏈 NFL Pick'em E2E Test Runner${NC}"
echo -e "${BLUE}=================================${NC}"

# Function to check if a URL is accessible
check_url() {
    local url=$1
    local name=$2
    
    echo -e "${YELLOW}Checking ${name}...${NC}"
    
    if curl -s --head --request GET "$url" | grep "200 OK\|301\|302" > /dev/null; then
        echo -e "${GREEN}✅ ${name} is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ ${name} is not accessible${NC}"
        return 1
    fi
}

# Function to start local servers
start_servers() {
    echo -e "${YELLOW}Starting local development servers...${NC}"
    
    # Check if servers are already running
    if check_url "$FRONTEND_URL" "Frontend" && check_url "$API_URL" "API"; then
        echo -e "${GREEN}✅ Local servers already running${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Starting frontend server...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    
    echo -e "${YELLOW}Starting API server...${NC}"
    npm run workers:dev &
    API_PID=$!
    
    echo -e "${YELLOW}Waiting for servers to be ready...${NC}"
    
    # Wait for servers with timeout
    TIMEOUT=60
    ELAPSED=0
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if check_url "$FRONTEND_URL" "Frontend" >/dev/null 2>&1 && check_url "$API_URL" "API" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ All servers ready!${NC}"
            echo "FRONTEND_PID=$FRONTEND_PID" > .test-pids
            echo "API_PID=$API_PID" >> .test-pids
            return 0
        fi
        
        sleep 2
        ELAPSED=$((ELAPSED + 2))
        echo -e "${YELLOW}... waiting (${ELAPSED}s/${TIMEOUT}s)${NC}"
    done
    
    echo -e "${RED}❌ Servers failed to start within ${TIMEOUT} seconds${NC}"
    cleanup_servers
    exit 1
}

# Function to cleanup servers
cleanup_servers() {
    echo -e "${YELLOW}Cleaning up servers...${NC}"
    
    if [ -f .test-pids ]; then
        source .test-pids
        if [ ! -z "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID 2>/dev/null || true
            echo -e "${GREEN}✅ Frontend server stopped${NC}"
        fi
        if [ ! -z "$API_PID" ]; then
            kill $API_PID 2>/dev/null || true
            echo -e "${GREEN}✅ API server stopped${NC}"
        fi
        rm -f .test-pids
    fi
    
    # Kill any remaining processes on our ports
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    lsof -ti:8787 | xargs kill -9 2>/dev/null || true
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Running npm install...${NC}"
        npm install
    fi
    
    # Check if Playwright browsers are installed
    if ! npx playwright --version >/dev/null 2>&1; then
        echo -e "${YELLOW}Installing Playwright...${NC}"
        npm run playwright:install
    fi
    
    echo -e "${GREEN}✅ Dependencies ready${NC}"
}

# Function to run specific test suite
run_test_suite() {
    local suite=$1
    echo -e "${BLUE}Running test suite: ${suite}${NC}"
    
    case $suite in
        "auth")
            npx playwright test tests/e2e/auth-navigation.spec.ts
            ;;
        "data")
            npx playwright test tests/e2e/game-data-loading.spec.ts
            ;;
        "picks")
            npx playwright test tests/e2e/pick-submission.spec.ts
            ;;
        "timelock")
            npx playwright test tests/e2e/timelock-workflow.spec.ts
            ;;
        "mobile")
            npx playwright test tests/e2e/mobile-responsiveness.spec.ts
            ;;
        "all")
            npx playwright test
            ;;
        *)
            echo -e "${RED}❌ Unknown test suite: $suite${NC}"
            echo "Available suites: auth, data, picks, timelock, mobile, all"
            exit 1
            ;;
    esac
}

# Function to run production smoke tests
run_production_tests() {
    echo -e "${BLUE}Running production smoke tests...${NC}"
    
    if check_url "$PROD_URL" "Production site"; then
        PLAYWRIGHT_BASE_URL=$PROD_URL npx playwright test tests/e2e/auth-navigation.spec.ts --project=chromium
    else
        echo -e "${RED}❌ Production site not accessible${NC}"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 [command] [options]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  install     Install dependencies and Playwright browsers"
    echo "  local       Run tests against local development servers"
    echo "  production  Run smoke tests against production"
    echo "  suite       Run specific test suite (auth|data|picks|timelock|mobile|all)"
    echo "  debug       Run tests in debug mode with UI"
    echo "  report      Open the last test report"
    echo "  clean       Clean up running servers and test artifacts"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 local                    # Run all tests locally"
    echo "  $0 suite auth              # Run authentication tests only"
    echo "  $0 debug                   # Run tests with UI for debugging"
    echo "  $0 production              # Run production smoke tests"
}

# Trap to cleanup on exit
trap cleanup_servers EXIT

# Main command handling
case ${1:-"help"} in
    "install")
        install_deps
        ;;
    
    "local")
        install_deps
        start_servers
        echo -e "${BLUE}Running full E2E test suite against local servers...${NC}"
        npx playwright test
        echo -e "${GREEN}✅ All tests completed!${NC}"
        ;;
    
    "production")
        install_deps
        run_production_tests
        echo -e "${GREEN}✅ Production smoke tests completed!${NC}"
        ;;
    
    "suite")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please specify a test suite${NC}"
            show_usage
            exit 1
        fi
        install_deps
        start_servers
        run_test_suite "$2"
        ;;
    
    "debug")
        install_deps
        start_servers
        echo -e "${BLUE}Running tests in debug mode...${NC}"
        npx playwright test --headed --debug
        ;;
    
    "report")
        if [ -d "playwright-report" ]; then
            echo -e "${BLUE}Opening test report...${NC}"
            npx playwright show-report
        else
            echo -e "${RED}❌ No test report found. Run tests first.${NC}"
        fi
        ;;
    
    "clean")
        echo -e "${YELLOW}Cleaning up...${NC}"
        cleanup_servers
        rm -rf playwright-report test-results tests/e2e/results 2>/dev/null || true
        echo -e "${GREEN}✅ Cleanup completed${NC}"
        ;;
    
    "help"|*)
        show_usage
        ;;
esac