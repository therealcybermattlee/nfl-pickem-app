#!/bin/bash

# Complete End-to-End Testing Suite Runner
# 
# This script orchestrates the complete mobile E2E validation suite
# for the NFL Pick'em PWA, covering all critical testing scenarios
# developed during the 8-day mobile improvement sprint.

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV=${1:-"production"}  # production, staging, or local
DEVICE_TYPE=${2:-"all"}      # mobile, desktop, or all
PARALLEL=${3:-"true"}        # true or false
BROWSER=${4:-"all"}          # chromium, webkit, firefox, or all

# Test suite configuration
PRODUCTION_SITE="https://pickem.cyberlees.dev"
LOCAL_SITE="http://localhost:3000"
RESULTS_DIR="./test-results/$(date +%Y%m%d_%H%M%S)"
REPORT_DIR="./playwright-report"

echo -e "${BLUE}🚀 NFL Pick'em PWA - Complete E2E Test Suite${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "${YELLOW}Test Configuration:${NC}"
echo -e "  Environment: ${TEST_ENV}"
echo -e "  Device Type: ${DEVICE_TYPE}"
echo -e "  Parallel Execution: ${PARALLEL}"
echo -e "  Browser: ${BROWSER}"
echo -e "  Results Directory: ${RESULTS_DIR}"
echo ""

# Create results directory
mkdir -p "${RESULTS_DIR}"
mkdir -p "${RESULTS_DIR}/screenshots"
mkdir -p "${RESULTS_DIR}/videos"
mkdir -p "${RESULTS_DIR}/traces"

# Set base URL based on environment
if [ "$TEST_ENV" = "production" ]; then
    export PLAYWRIGHT_BASE_URL="$PRODUCTION_SITE"
    echo -e "${GREEN}✅ Testing against PRODUCTION environment${NC}"
elif [ "$TEST_ENV" = "local" ]; then
    export PLAYWRIGHT_BASE_URL="$LOCAL_SITE"
    echo -e "${YELLOW}⚠️  Testing against LOCAL environment${NC}"
else
    echo -e "${RED}❌ Invalid environment: $TEST_ENV${NC}"
    exit 1
fi

# Function to run test suite with error handling
run_test_suite() {
    local test_name=$1
    local test_file=$2
    local additional_args=$3
    
    echo -e "\n${BLUE}📋 Running: ${test_name}${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
    
    local start_time=$(date +%s)
    
    if npx playwright test "$test_file" \
        --output-dir="${RESULTS_DIR}" \
        --reporter=html,json,junit \
        $additional_args; then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}✅ ${test_name} - PASSED (${duration}s)${NC}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}❌ ${test_name} - FAILED (${duration}s)${NC}"
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if Playwright is installed
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx is not installed${NC}"
        exit 1
    fi
    
    # Check if test environment is accessible
    if [ "$TEST_ENV" = "production" ]; then
        if ! curl -s "$PRODUCTION_SITE" > /dev/null; then
            echo -e "${RED}❌ Production site is not accessible${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Production site is accessible${NC}"
    elif [ "$TEST_ENV" = "local" ]; then
        if ! curl -s "$LOCAL_SITE" > /dev/null; then
            echo -e "${RED}❌ Local development server is not running${NC}"
            echo -e "${YELLOW}💡 Start the development server with: npm run dev${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Local development server is accessible${NC}"
    fi
    
    # Install Playwright browsers if needed
    echo -e "${BLUE}🔧 Ensuring Playwright browsers are installed...${NC}"
    npx playwright install --with-deps
    
    echo -e "${GREEN}✅ Prerequisites check completed${NC}"
}

# Function to set parallel execution
set_parallel_config() {
    if [ "$PARALLEL" = "false" ]; then
        PARALLEL_ARGS="--workers=1"
        echo -e "${YELLOW}⚠️  Running tests sequentially${NC}"
    else
        PARALLEL_ARGS="--workers=4"
        echo -e "${GREEN}✅ Running tests in parallel (4 workers)${NC}"
    fi
}

# Function to set browser configuration
set_browser_config() {
    case $BROWSER in
        "chromium")
            BROWSER_ARGS="--project=chromium"
            ;;
        "webkit")
            BROWSER_ARGS="--project=webkit"
            ;;
        "firefox")
            BROWSER_ARGS="--project=firefox"
            ;;
        "mobile")
            BROWSER_ARGS="--project='Mobile Chrome' --project='Mobile Safari'"
            ;;
        "all")
            BROWSER_ARGS=""
            ;;
        *)
            echo -e "${RED}❌ Invalid browser: $BROWSER${NC}"
            exit 1
            ;;
    esac
}

# Function to set device type configuration
set_device_config() {
    case $DEVICE_TYPE in
        "mobile")
            DEVICE_ARGS="--project='Mobile Chrome' --project='Mobile Safari'"
            ;;
        "desktop")
            DEVICE_ARGS="--project=chromium --project=webkit --project=firefox"
            ;;
        "all")
            DEVICE_ARGS=""
            ;;
        *)
            echo -e "${RED}❌ Invalid device type: $DEVICE_TYPE${NC}"
            exit 1
            ;;
    esac
}

# Function to generate summary report
generate_summary_report() {
    echo -e "\n${BLUE}📊 Generating test summary report...${NC}"
    
    local summary_file="${RESULTS_DIR}/test-summary.md"
    
    cat > "$summary_file" << EOF
# NFL Pick'em PWA - E2E Test Results Summary

**Test Run:** $(date)
**Environment:** $TEST_ENV
**Base URL:** $PLAYWRIGHT_BASE_URL
**Device Type:** $DEVICE_TYPE
**Browser:** $BROWSER
**Parallel Execution:** $PARALLEL

## Test Suite Results

EOF

    # Count results from each test file
    for test_result in "${test_results[@]}"; do
        echo "- $test_result" >> "$summary_file"
    done
    
    cat >> "$summary_file" << EOF

## Critical Validation Checklist

- [ ] No full-width buttons across all mobile viewports
- [ ] Touch targets ≥ 44px for accessibility
- [ ] PWA functionality working (offline, installation)
- [ ] Cross-device consistency maintained
- [ ] Performance benchmarks met (FCP < 1.8s, Bundle < 300KB)
- [ ] Game-day stress scenarios handled gracefully
- [ ] Production environment fully validated

## Performance Metrics

- **Bundle Size:** < 300KB target
- **First Contentful Paint:** < 1.8s target
- **API Response Time:** < 500ms target
- **Memory Usage:** < 50MB growth target

## Files Generated

- Test screenshots: \`${RESULTS_DIR}/screenshots/\`
- Test videos: \`${RESULTS_DIR}/videos/\`
- Playwright traces: \`${RESULTS_DIR}/traces/\`
- HTML Report: \`${REPORT_DIR}/index.html\`

EOF

    echo -e "${GREEN}✅ Summary report generated: $summary_file${NC}"
}

# Main test execution function
run_complete_e2e_suite() {
    local failed_tests=0
    local total_tests=0
    declare -a test_results=()
    
    echo -e "\n${BLUE}🎯 Starting Complete E2E Test Suite Execution${NC}"
    echo -e "${BLUE}==============================================${NC}"
    
    # Test Suite 1: Complete Mobile Flow (Critical Priority)
    total_tests=$((total_tests + 1))
    if run_test_suite \
        "Complete Mobile User Journey" \
        "tests/e2e/complete-mobile-flow.spec.ts" \
        "$PARALLEL_ARGS $DEVICE_ARGS $BROWSER_ARGS"; then
        test_results+=("✅ Complete Mobile Flow - PASSED")
    else
        test_results+=("❌ Complete Mobile Flow - FAILED")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test Suite 2: Production Environment Validation
    total_tests=$((total_tests + 1))
    if [ "$TEST_ENV" = "production" ]; then
        if run_test_suite \
            "Production Environment Validation" \
            "tests/e2e/production-validation.spec.ts" \
            "$PARALLEL_ARGS $DEVICE_ARGS $BROWSER_ARGS"; then
            test_results+=("✅ Production Validation - PASSED")
        else
            test_results+=("❌ Production Validation - FAILED")
            failed_tests=$((failed_tests + 1))
        fi
    else
        test_results+=("⏭️  Production Validation - SKIPPED (not production env)")
    fi
    
    # Test Suite 3: Game Day Stress Testing
    total_tests=$((total_tests + 1))
    if run_test_suite \
        "Game Day Stress Testing" \
        "tests/e2e/game-day-stress.spec.ts" \
        "$PARALLEL_ARGS --workers=2"; then  # Reduce workers for stress tests
        test_results+=("✅ Game Day Stress - PASSED")
    else
        test_results+=("❌ Game Day Stress - FAILED")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test Suite 4: PWA Functionality
    total_tests=$((total_tests + 1))
    if run_test_suite \
        "PWA Functionality Validation" \
        "tests/e2e/pwa-functionality.spec.ts" \
        "$PARALLEL_ARGS $DEVICE_ARGS $BROWSER_ARGS"; then
        test_results+=("✅ PWA Functionality - PASSED")
    else
        test_results+=("❌ PWA Functionality - FAILED")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test Suite 5: Cross-Device Consistency
    total_tests=$((total_tests + 1))
    if run_test_suite \
        "Cross-Device Consistency" \
        "tests/e2e/cross-device-consistency.spec.ts" \
        "$PARALLEL_ARGS"; then
        test_results+=("✅ Cross-Device Consistency - PASSED")
    else
        test_results+=("❌ Cross-Device Consistency - FAILED")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test Suite 6: Production Performance Benchmarks
    total_tests=$((total_tests + 1))
    if run_test_suite \
        "Production Performance Benchmarks" \
        "tests/e2e/performance-production.spec.ts" \
        "$PARALLEL_ARGS $DEVICE_ARGS"; then
        test_results+=("✅ Performance Benchmarks - PASSED")
    else
        test_results+=("❌ Performance Benchmarks - FAILED")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Generate final report
    generate_summary_report
    
    # Final results summary
    echo -e "\n${BLUE}📋 FINAL TEST RESULTS SUMMARY${NC}"
    echo -e "${BLUE}=============================${NC}"
    
    for result in "${test_results[@]}"; do
        echo -e "  $result"
    done
    
    local passed_tests=$((total_tests - failed_tests))
    local success_rate=$(( (passed_tests * 100) / total_tests ))
    
    echo -e "\n${BLUE}📊 Test Statistics:${NC}"
    echo -e "  Total Test Suites: $total_tests"
    echo -e "  Passed: ${GREEN}$passed_tests${NC}"
    echo -e "  Failed: ${RED}$failed_tests${NC}"
    echo -e "  Success Rate: ${success_rate}%"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL TESTS PASSED! The 8-day mobile improvement sprint is COMPLETE!${NC}"
        echo -e "${GREEN}✅ NFL Pick'em PWA is ready for game day with full mobile optimization${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ ${failed_tests} test suite(s) failed. Review the results and fix issues.${NC}"
        echo -e "${YELLOW}📁 Check detailed results in: ${RESULTS_DIR}${NC}"
        echo -e "${YELLOW}🌐 Open HTML report: ${REPORT_DIR}/index.html${NC}"
        exit 1
    fi
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [ENVIRONMENT] [DEVICE_TYPE] [PARALLEL] [BROWSER]

Arguments:
  ENVIRONMENT   Target environment (production|local) [default: production]
  DEVICE_TYPE   Device types to test (mobile|desktop|all) [default: all]  
  PARALLEL      Run tests in parallel (true|false) [default: true]
  BROWSER       Browser to test (chromium|webkit|firefox|mobile|all) [default: all]

Examples:
  $0                                    # Full test suite on production
  $0 local mobile true chromium         # Mobile tests on local dev server
  $0 production desktop false webkit    # Desktop tests sequentially on production

Test Suites Included:
  ✅ Complete Mobile User Journey       - Full pick selection workflow
  ✅ Production Environment Validation  - Live API and data consistency  
  ✅ Game Day Stress Testing           - High-pressure scenarios
  ✅ PWA Functionality                 - Offline, installation, sync
  ✅ Cross-Device Consistency          - Multi-device family usage
  ✅ Performance Benchmarks            - Core Web Vitals, bundle size

Critical Validations:
  ✅ No full-width button issues
  ✅ Touch target accessibility (44px+)
  ✅ PWA installation and offline work
  ✅ Performance benchmarks met
  ✅ Cross-device consistency maintained

EOF
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_usage
    exit 0
fi

# Main execution flow
echo -e "${GREEN}Starting NFL Pick'em PWA Complete E2E Test Suite...${NC}"

# Run all checks and configurations
check_prerequisites
set_parallel_config  
set_browser_config
set_device_config

# Execute the complete test suite
run_complete_e2e_suite

echo -e "${GREEN}Complete E2E Test Suite execution finished.${NC}"