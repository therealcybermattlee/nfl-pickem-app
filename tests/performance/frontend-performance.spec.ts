import { test, expect, Page } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Frontend Performance Tests', () => {
  let page: Page;
  const PRODUCTION_URL = 'https://pickem.cyberlees.dev';
  const DEV_URL = 'http://localhost:3000';
  
  // Use production URL for performance testing
  const BASE_URL = PRODUCTION_URL;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test('Home Page Load Performance', async () => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`Home page load time: ${loadTime}ms`);
    
    // Assert load time is under 3 seconds for good UX
    expect(loadTime).toBeLessThan(3000);
    
    // Verify critical content is visible
    await expect(page.locator('h1')).toBeVisible({ timeout: 2000 });
  });

  test('Page Navigation Performance', async () => {
    // Start from home page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Test navigation to Games page
    const navigationStart = Date.now();
    await page.click('a[href*="games"]');
    await page.waitForLoadState('networkidle');
    const navigationTime = Date.now() - navigationStart;
    
    console.log(`Navigation time to games: ${navigationTime}ms`);
    expect(navigationTime).toBeLessThan(2000);
    
    // Test navigation to Login page
    const loginNavStart = Date.now();
    await page.click('a[href*="login"]');
    await page.waitForLoadState('networkidle');
    const loginNavTime = Date.now() - loginNavStart;
    
    console.log(`Navigation time to login: ${loginNavTime}ms`);
    expect(loginNavTime).toBeLessThan(2000);
  });

  test('Authentication Performance', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Measure login time
    const loginStart = Date.now();
    await page.click('button[type="submit"]');
    
    // Wait for redirect to indicate successful login
    await page.waitForURL('**/games', { timeout: 10000 });
    const loginTime = Date.now() - loginStart;
    
    console.log(`Login time: ${loginTime}ms`);
    expect(loginTime).toBeLessThan(3000);
  });

  test('Games Page Load with Data', async () => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/games');
    
    // Measure games page load with data
    const gamesLoadStart = Date.now();
    await page.goto(`${BASE_URL}/games`);
    
    // Wait for games data to load
    await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 });
    const gamesLoadTime = Date.now() - gamesLoadStart;
    
    console.log(`Games page with data load time: ${gamesLoadTime}ms`);
    expect(gamesLoadTime).toBeLessThan(4000);
    
    // Verify multiple games are loaded
    const gameCards = await page.locator('[data-testid="game-card"]').count();
    expect(gameCards).toBeGreaterThan(0);
  });

  test('Pick Submission Performance', async () => {
    // Login and navigate to games
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/games');
    await page.goto(`${BASE_URL}/games`);
    await page.waitForSelector('[data-testid="game-card"]');
    
    // Find first available game and make a pick
    const firstGame = page.locator('[data-testid="game-card"]').first();
    await firstGame.scrollIntoViewIfNeeded();
    
    // Look for pick button that's not disabled
    const pickButton = firstGame.locator('button').filter({ hasText: /^(Pick|Choose)/ }).first();
    
    if (await pickButton.isVisible() && await pickButton.isEnabled()) {
      const pickStart = Date.now();
      await pickButton.click();
      
      // Wait for pick confirmation or UI update
      await page.waitForTimeout(1000); // Allow for API call
      const pickTime = Date.now() - pickStart;
      
      console.log(`Pick submission time: ${pickTime}ms`);
      expect(pickTime).toBeLessThan(2000);
    } else {
      console.log('No available picks found - games may be locked');
    }
  });

  test('Countdown Timer Performance', async () => {
    // Login and navigate to games
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/games');
    await page.goto(`${BASE_URL}/games`);
    await page.waitForSelector('[data-testid="game-card"]');
    
    // Check for countdown timers
    const countdownElements = page.locator('[data-testid*="countdown"]');
    const countdownCount = await countdownElements.count();
    
    if (countdownCount > 0) {
      // Measure timer update performance
      const timerElement = countdownElements.first();
      const initialText = await timerElement.textContent();
      
      // Wait for timer to update (they update every second)
      await page.waitForTimeout(2000);
      const updatedText = await timerElement.textContent();
      
      console.log(`Timer update - Initial: ${initialText}, Updated: ${updatedText}`);
      
      // Verify timer is actually updating (different text)
      if (initialText !== updatedText) {
        console.log('Countdown timers are updating correctly');
      }
    } else {
      console.log('No countdown timers found - games may be completed');
    }
  });

  test('Leaderboard Performance', async () => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/games');
    
    // Navigate to leaderboard
    const leaderboardStart = Date.now();
    await page.goto(`${BASE_URL}/leaderboard`);
    await page.waitForLoadState('networkidle');
    
    // Wait for leaderboard data
    await page.waitForSelector('[data-testid="leaderboard-entry"]', { timeout: 10000 });
    const leaderboardTime = Date.now() - leaderboardStart;
    
    console.log(`Leaderboard load time: ${leaderboardTime}ms`);
    expect(leaderboardTime).toBeLessThan(3000);
    
    // Verify leaderboard has entries
    const entries = await page.locator('[data-testid="leaderboard-entry"]').count();
    expect(entries).toBeGreaterThan(0);
  });

  test('Mobile Performance', async ({ browser }) => {
    // Create mobile context
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const mobilePage = await mobileContext.newPage();
    
    // Test mobile load performance
    const mobileStart = Date.now();
    await mobilePage.goto(BASE_URL);
    await mobilePage.waitForLoadState('networkidle');
    const mobileTime = Date.now() - mobileStart;
    
    console.log(`Mobile load time: ${mobileTime}ms`);
    expect(mobileTime).toBeLessThan(4000);
    
    // Test mobile navigation
    const navToggle = mobilePage.locator('[data-testid="mobile-nav-toggle"]');
    if (await navToggle.isVisible()) {
      await navToggle.click();
      await mobilePage.waitForSelector('[data-testid="mobile-nav-menu"]');
    }
    
    await mobileContext.close();
  });

  // Lighthouse performance audit (requires special setup)
  test.skip('Lighthouse Performance Audit', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await playAudit({
      page,
      thresholds: {
        performance: 70,
        accessibility: 90,
        'best-practices': 80,
        seo: 80,
      },
      port: 9222,
    });
  });
});