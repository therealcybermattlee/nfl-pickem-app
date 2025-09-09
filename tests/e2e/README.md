# NFL Pick'em App - E2E Testing Framework

## Overview

This comprehensive Playwright testing framework validates all features of the NFL Pick'em app through end-to-end browser automation testing. Following the CLAUDE.md permanent rule: **No feature is considered "operational" without validation through end-user testing**.

## Test Suites

### 1. Authentication and Navigation (`auth-navigation.spec.ts`)
- **Purpose**: Validates basic app navigation, routing, and accessibility
- **Coverage**:
  - Page navigation between Home, Teams, Games, Leaderboard
  - Active navigation states and visual feedback
  - Mobile navigation responsiveness
  - Keyboard accessibility and skip navigation
  - Browser back/forward button handling
  - Deep linking to specific routes
  - Page load performance benchmarks

### 2. Game Data Loading (`game-data-loading.spec.ts`)
- **Purpose**: Tests API integration, error handling, and data consistency
- **Coverage**:
  - Successful game data loading from ESPN API
  - API error handling with user-friendly fallbacks
  - Network timeout and connection failure scenarios
  - Empty data state handling
  - Partial/malformed data resilience
  - Leaderboard data loading and week/season selection
  - Cross-page data consistency validation

### 3. Pick Submission (`pick-submission.spec.ts`)
- **Purpose**: Validates core pick submission functionality and validation
- **Coverage**:
  - Complete pick submission workflow
  - User selection requirement validation
  - API error handling during submission
  - Pick update/change functionality
  - Multiple user pick tracking and display
  - Completed game pick prevention
  - Mobile touch interactions for picks
  - Request payload validation
  - Concurrent submission handling

### 4. Time-Lock System (`timelock-workflow.spec.ts`)
- **Purpose**: Tests the critical time-lock pick system (existing comprehensive test)
- **Coverage**:
  - Pick submission before lock time
  - Pick blocking after lock time
  - Real-time countdown timers and updates
  - Auto-pick generation for missed deadlines
  - Urgent state visual indicators
  - Game state transition handling
  - Network failure recovery
  - Security validation (client-side time manipulation protection)
  - Performance under load simulation
  - Game completion and scoring workflow

### 5. Mobile Responsiveness (`mobile-responsiveness.spec.ts`)
- **Purpose**: Ensures optimal mobile experience across devices
- **Coverage**:
  - Mobile navigation and layout adaptation
  - Touch-friendly game cards and pick interface
  - Responsive leaderboard (cards vs table)
  - Portrait vs landscape orientation handling
  - Multiple device sizes (iPhone SE to iPad Mini)
  - Touch gesture support (tap, double-tap)
  - Mobile form interactions and keyboards
  - Touch target size validation (44px minimum)
  - Mobile performance benchmarks
  - Offline/slow connection handling

## Test Configuration

### Browsers and Devices
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Custom Devices**: iPhone SE, iPhone 12 Pro Max, Samsung Galaxy S21, iPad Mini

### Test Data Management
- **Mock API Responses**: Comprehensive mocking for consistent testing
- **Test Users**: Predefined user accounts (Dad, Mom, TwoBow, RockyDaRock)
- **Time Mocking**: Fixed test time (2025-09-07T12:00:00.000Z) for consistency
- **Storage State**: Persistent authentication across tests

### Environment Configuration
- **Local Development**: `http://localhost:5173` (frontend), `http://localhost:8787` (API)
- **Production Testing**: `https://pickem.leefamilysso.com`
- **Parallel Execution**: Supports running multiple browsers simultaneously
- **Retries**: 2 retries on CI, 0 retries locally

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install
```

### Local Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npx playwright test tests/e2e/auth-navigation.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui

# Run specific browser project
npx playwright test --project="Mobile Chrome"

# Run against production
PLAYWRIGHT_BASE_URL=https://pickem.leefamilysso.com npx playwright test
```

### Debug Mode
```bash
# Run tests in headed mode with slow motion
npx playwright test --headed --slowMo=1000

# Run with debugger
npx playwright test --debug

# Generate test code (record interactions)
npx playwright codegen localhost:5173
```

## CI/CD Integration

### GitHub Actions Workflow
The E2E tests run automatically on:
- **Push to main/develop**: Full test suite across all browsers
- **Pull Requests**: Complete validation before merge
- **Daily Schedule**: 2 AM UTC for production monitoring
- **Production Deployments**: Smoke tests on live environment

### Test Artifacts
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests in CI
- **HTML Reports**: Interactive test results with timeline
- **JSON Results**: Machine-readable test data
- **JUnit XML**: For integration with other tools

### Failure Handling
- **Auto-Issue Creation**: Creates GitHub issues for main branch failures
- **Auto-Resolution**: Closes issues when tests pass again
- **Notification Strategy**: Immediate alerts for production issues
- **Artifact Retention**: 7 days for regular runs, 30 days for production

## Test Patterns and Best Practices

### Mocking Strategy
```typescript
// Mock API responses for consistent testing
await page.route('**/api/games*', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockGameData)
  })
})
```

### Time Control
```typescript
// Set consistent test time
await page.addInitScript(() => {
  const mockDate = new Date('2025-09-07T12:00:00.000Z')
  Date.now = () => mockDate.getTime()
})
```

### Mobile Testing
```typescript
// Mobile-specific test patterns
test('Mobile feature', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-specific test')
  
  // Use tap instead of click
  await page.tap('button')
  
  // Verify touch target sizes
  const box = await button.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(44)
})
```

### Error Handling
```typescript
// Test both success and failure scenarios
test('API error handling', async ({ page }) => {
  await page.route('**/api/endpoint', route => {
    route.fulfill({ status: 500 })
  })
  
  await expect(page.locator('error-message')).toBeVisible()
})
```

## Performance Benchmarks

### Load Time Targets
- **Initial Page Load**: < 3 seconds
- **Navigation**: < 2 seconds
- **Mobile Load**: < 5 seconds
- **API Response**: < 1 second

### Monitoring
- Real-time performance tracking in CI
- Regression detection for performance degradation
- Mobile-specific performance validation
- Network condition simulation

## Accessibility Testing

### Coverage
- **Keyboard Navigation**: Tab order and focus management
- **Screen Reader Support**: ARIA labels and roles
- **Color Contrast**: High contrast mode compatibility
- **Touch Targets**: Minimum 44px size validation
- **Skip Navigation**: Content accessibility shortcuts

### WCAG Compliance
- Level AA compliance validation
- Focus indicator visibility
- Alternative text for images
- Semantic HTML structure

## Test Data and Fixtures

### Mock Data Structure
```typescript
interface MockGame {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: { id: string; abbreviation: string; name: string }
  awayTeam: { id: string; abbreviation: string; name: string }
  gameDate: string
  week: number
  season: number
  isCompleted: boolean
  homeSpread?: number
  overUnder?: number
}
```

### Test User Accounts
- **Dad**: Primary test user with picks
- **Mom**: Secondary user for multi-user scenarios
- **TwoBow**: Third user for leaderboard testing
- **RockyDaRock**: Fourth user for complete scenarios

## Troubleshooting

### Common Issues

1. **Browser Installation Issues**
   ```bash
   npx playwright install --force
   ```

2. **Test Timeouts**
   - Check if local servers are running
   - Verify API endpoints are accessible
   - Increase timeout in playwright.config.ts

3. **Flaky Tests**
   - Add proper wait conditions
   - Use `waitForLoadState('networkidle')`
   - Mock external dependencies

4. **Mobile Test Failures**
   - Verify device emulation settings
   - Check touch target sizes
   - Validate responsive breakpoints

### Debug Information
```bash
# View browser console logs
npx playwright test --headed --slowMo=1000

# Generate trace files for failed tests
npx playwright show-trace trace.zip

# Run specific test with verbose output
npx playwright test test-file.spec.ts --headed --debug
```

## Metrics and Reporting

### Test Coverage Metrics
- **Feature Coverage**: 100% of user-facing features
- **Browser Coverage**: Chrome, Firefox, Safari, Mobile
- **Device Coverage**: Phone, tablet, desktop breakpoints
- **Error Scenario Coverage**: API failures, network issues, edge cases

### Success Criteria
✅ **Authentication & Navigation**: All pages accessible, proper routing  
✅ **Data Loading**: Graceful error handling, fallback states  
✅ **Pick Submission**: Validation, success/error feedback  
✅ **Time-Lock System**: Countdown timers, lock enforcement  
✅ **Mobile Experience**: Touch-friendly, responsive design  
✅ **Performance**: Sub-3s loads, responsive interactions  
✅ **Accessibility**: Keyboard navigation, screen reader support  

## Future Enhancements

### Planned Additions
- **Visual Regression Testing**: Screenshot comparison for UI changes
- **A11y Testing**: Automated accessibility audits with axe-core
- **Performance Testing**: Core Web Vitals monitoring
- **API Contract Testing**: Schema validation for API responses
- **User Journey Testing**: Complex multi-step workflows
- **Cross-Browser Visual Testing**: Pixel-perfect consistency validation

### Integration Opportunities
- **Monitoring Integration**: Connect with application monitoring
- **Analytics Validation**: Verify tracking pixel implementation
- **Security Testing**: Authentication and authorization flows
- **Load Testing**: High-concurrency pick submission scenarios

## Conclusion

This comprehensive testing framework ensures the NFL Pick'em app meets production-ready standards through systematic validation of all user-facing functionality. The tests serve as both quality gates and living documentation of expected behavior, supporting confident deployments and rapid iteration.

**Remember**: Following CLAUDE.md guidelines, no feature can be declared "operational" without passing these end-to-end validations. The tests are the final authority on production readiness.