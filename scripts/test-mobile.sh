#!/bin/bash

# Mobile UI Testing Script
# Comprehensive mobile testing suite runner with reporting and CI integration

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$PROJECT_ROOT/tests/mobile-ui/results"
REPORT_DIR="$PROJECT_ROOT/playwright-report-mobile"

# Default options
RUN_ALL=true
RUN_DESIGN_SYSTEM=false
RUN_VISUAL=false
RUN_TOUCH=false
RUN_ACCESSIBILITY=false
RUN_PERFORMANCE=false
RUN_GAME_DAY=false
CI_MODE=false
HEADLESS=true
PARALLEL=true
RETRIES=2
TIMEOUT=45000

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo -e "${NC}"
}

# Function to show usage
show_usage() {
    echo "Mobile UI Testing Suite Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all                 Run all mobile test suites (default)"
    echo "  --design-system       Run design system validation tests"
    echo "  --visual              Run visual regression tests"
    echo "  --touch               Run touch interaction tests"
    echo "  --accessibility       Run accessibility tests"
    echo "  --performance         Run performance benchmarks"
    echo "  --game-day            Run game day scenario tests"
    echo "  --ci                  Run in CI mode (reduced parallelism, strict timeouts)"
    echo "  --headed              Run tests in headed mode (default: headless)"
    echo "  --no-parallel         Run tests sequentially"
    echo "  --retries <number>    Number of retries (default: 2)"
    echo "  --timeout <ms>        Test timeout in milliseconds (default: 45000)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 --accessibility    # Run only accessibility tests"
    echo "  $0 --visual --ci      # Run visual tests in CI mode"
    echo "  $0 --performance --headed --timeout 60000"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                RUN_ALL=true
                shift
                ;;
            --design-system)
                RUN_ALL=false
                RUN_DESIGN_SYSTEM=true
                shift
                ;;
            --visual)
                RUN_ALL=false
                RUN_VISUAL=true
                shift
                ;;
            --touch)
                RUN_ALL=false
                RUN_TOUCH=true
                shift
                ;;
            --accessibility)
                RUN_ALL=false
                RUN_ACCESSIBILITY=true
                shift
                ;;
            --performance)
                RUN_ALL=false
                RUN_PERFORMANCE=true
                shift
                ;;
            --game-day)
                RUN_ALL=false
                RUN_GAME_DAY=true
                shift
                ;;
            --ci)
                CI_MODE=true
                HEADLESS=true
                PARALLEL=false
                RETRIES=1
                shift
                ;;
            --headed)
                HEADLESS=false
                shift
                ;;
            --no-parallel)
                PARALLEL=false
                shift
                ;;
            --retries)
                RETRIES="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        print_error "Not in a valid project directory. package.json not found."
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! command -v npx &> /dev/null; then
        print_error "npx not found. Please install Node.js and npm."
        exit 1
    fi
    
    # Check if mobile config exists
    if [[ ! -f "$PROJECT_ROOT/playwright.mobile.config.ts" ]]; then
        print_error "Mobile Playwright configuration not found."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup test environment
setup_environment() {
    print_status "Setting up test environment..."
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$REPORT_DIR"
    
    # Create mobile auth directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/tests/mobile-ui/auth"
    
    # Install dependencies if needed
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        print_status "Installing dependencies..."
        cd "$PROJECT_ROOT" && npm install
    fi
    
    # Install Playwright browsers
    print_status "Ensuring Playwright browsers are installed..."
    cd "$PROJECT_ROOT" && npx playwright install --with-deps chromium webkit
    
    print_success "Test environment setup complete"
}

# Function to start application servers
start_servers() {
    print_status "Starting application servers..."
    
    cd "$PROJECT_ROOT"
    
    # Start frontend server
    npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    
    # Start workers server
    npm run workers:dev > /dev/null 2>&1 &
    WORKERS_PID=$!
    
    # Wait for servers to start
    print_status "Waiting for servers to be ready..."
    npx wait-on http://localhost:3000 --timeout 60000
    npx wait-on http://localhost:8787 --timeout 60000
    
    print_success "Application servers started successfully"
}

# Function to stop application servers
stop_servers() {
    print_status "Stopping application servers..."
    
    if [[ -n "$FRONTEND_PID" ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [[ -n "$WORKERS_PID" ]]; then
        kill $WORKERS_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on the ports
    pkill -f "vite.*3000" 2>/dev/null || true
    pkill -f "wrangler.*8787" 2>/dev/null || true
    
    print_success "Application servers stopped"
}

# Function to build Playwright command
build_playwright_cmd() {
    local test_file="$1"
    local project_filter="$2"
    
    local cmd="npx playwright test --config=playwright.mobile.config.ts"
    
    if [[ -n "$test_file" ]]; then
        cmd="$cmd $test_file"
    fi
    
    if [[ -n "$project_filter" ]]; then
        cmd="$cmd --project=\"$project_filter\""
    fi
    
    if [[ "$HEADLESS" == true ]]; then
        cmd="$cmd --headed=false"
    else
        cmd="$cmd --headed=true"
    fi
    
    if [[ "$PARALLEL" == false ]]; then
        cmd="$cmd --workers=1"
    fi
    
    cmd="$cmd --retries=$RETRIES"
    cmd="$cmd --timeout=$TIMEOUT"
    
    if [[ "$CI_MODE" == true ]]; then
        cmd="$cmd --reporter=line,json"
    fi
    
    echo "$cmd"
}

# Function to run specific test suite
run_test_suite() {
    local suite_name="$1"
    local test_file="$2"
    local project_filter="$3"
    
    print_header "Running $suite_name Tests"
    
    local cmd=$(build_playwright_cmd "$test_file" "$project_filter")
    
    print_status "Command: $cmd"
    
    if eval "$cmd"; then
        print_success "$suite_name tests passed"
        return 0
    else
        print_error "$suite_name tests failed"
        return 1
    fi
}

# Function to run all test suites
run_tests() {
    local failed_suites=()
    local passed_suites=()
    
    cd "$PROJECT_ROOT"
    
    if [[ "$RUN_ALL" == true ]] || [[ "$RUN_DESIGN_SYSTEM" == true ]]; then
        if run_test_suite "Design System" "tests/mobile-ui/design-system-validation.test.ts" ""; then
            passed_suites+=("Design System")
        else
            failed_suites+=("Design System")
        fi
    fi
    
    if [[ "$RUN_ALL" == true ]] || [[ "$RUN_VISUAL" == true ]]; then
        if run_test_suite "Visual Regression" "tests/mobile-ui/cross-device-visual.test.ts" ""; then
            passed_suites+=("Visual Regression")
        else
            failed_suites+=("Visual Regression")
        fi
    fi
    
    if [[ "$RUN_ALL" == true ]] || [[ "$RUN_TOUCH" == true ]]; then
        if run_test_suite "Touch Interactions" "tests/mobile-ui/touch-interactions.test.ts" ""; then
            passed_suites+=("Touch Interactions")
        else
            failed_suites+=("Touch Interactions")
        fi
    fi
    
    if [[ "$RUN_ALL" == true ]] || [[ "$RUN_ACCESSIBILITY" == true ]]; then
        if run_test_suite "Accessibility" "tests/mobile-ui/accessibility-comprehensive.test.ts" "Accessibility Audit"; then
            passed_suites+=("Accessibility")
        else
            failed_suites+=("Accessibility")
        fi
    fi
    
    if [[ "$RUN_ALL" == true ]] || [[ "$RUN_PERFORMANCE" == true ]]; then
        if run_test_suite "Performance" "tests/mobile-ui/performance-benchmarks.test.ts" "Performance Testing"; then
            passed_suites+=("Performance")
        else
            failed_suites+=("Performance")
        fi
    fi
    
    if [[ "$RUN_ALL" == true ]] || [[ "$RUN_GAME_DAY" == true ]]; then
        if run_test_suite "Game Day Scenarios" "tests/mobile-ui/game-day-scenarios.test.ts" "Game Day Scenarios"; then
            passed_suites+=("Game Day Scenarios")
        else
            failed_suites+=("Game Day Scenarios")
        fi
    fi
    
    # Print summary
    print_header "Test Results Summary"
    
    if [[ ${#passed_suites[@]} -gt 0 ]]; then
        print_success "Passed test suites:"
        for suite in "${passed_suites[@]}"; do
            echo -e "  ${GREEN}✅ $suite${NC}"
        done
    fi
    
    if [[ ${#failed_suites[@]} -gt 0 ]]; then
        print_error "Failed test suites:"
        for suite in "${failed_suites[@]}"; do
            echo -e "  ${RED}❌ $suite${NC}"
        done
        return 1
    fi
    
    print_success "All mobile test suites passed!"
    return 0
}

# Function to generate test report
generate_report() {
    print_status "Generating test report..."
    
    local report_file="$RESULTS_DIR/mobile-test-report.html"
    local json_file="$RESULTS_DIR/mobile-test-results.json"
    
    if [[ -f "$json_file" ]]; then
        print_status "Test results JSON found, generating HTML report..."
        
        # Open HTML report if not in CI mode
        if [[ "$CI_MODE" == false ]] && [[ -f "$REPORT_DIR/index.html" ]]; then
            print_status "Opening test report in browser..."
            if command -v open &> /dev/null; then
                open "$REPORT_DIR/index.html"
            elif command -v xdg-open &> /dev/null; then
                xdg-open "$REPORT_DIR/index.html"
            fi
        fi
    fi
    
    print_success "Test report generated"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    stop_servers
    
    # Remove temporary files
    rm -f /tmp/mobile-test-*.tmp 2>/dev/null || true
    
    print_success "Cleanup complete"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_header "Mobile UI Testing Suite"
    
    parse_arguments "$@"
    
    print_status "Configuration:"
    echo "  CI Mode: $CI_MODE"
    echo "  Headless: $HEADLESS"
    echo "  Parallel: $PARALLEL"
    echo "  Retries: $RETRIES"
    echo "  Timeout: ${TIMEOUT}ms"
    echo ""
    
    check_prerequisites
    setup_environment
    start_servers
    
    local test_result=0
    if run_tests; then
        print_success "All mobile tests completed successfully!"
    else
        print_error "Some mobile tests failed!"
        test_result=1
    fi
    
    generate_report
    
    if [[ $test_result -eq 0 ]]; then
        print_success "🎉 Mobile UI is ready for deployment!"
    else
        print_error "⚠️  Mobile UI needs attention before deployment."
    fi
    
    exit $test_result
}

# Run main function with all arguments
main "$@"