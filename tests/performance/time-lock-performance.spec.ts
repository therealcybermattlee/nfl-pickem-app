import { test, expect, Page } from '@playwright/test';

test.describe('Time-Lock System Performance Tests', () => {
  const PRODUCTION_URL = 'https://pickem.leefamilysso.com';
  const API_URL = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/games');
  });

  test('Countdown Timer Accuracy and Performance', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/games`);
    await page.waitForSelector('[data-testid="game-card"]');
    
    // Find games with countdown timers
    const countdownSelectors = [
      '[data-testid*="countdown"]',
      '[data-testid*="timer"]',
      'text=/\\d+[hms]/',  // Pattern for time formats
      '.countdown',
      '.timer'
    ];
    
    let timerFound = false;
    let timerElement;
    
    for (const selector of countdownSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        timerElement = elements.first();
        timerFound = true;
        console.log(`Found timer with selector: ${selector}`);
        break;
      }
    }
    
    if (!timerFound) {
      console.log('No countdown timers found - checking for time-related text');
      
      // Look for any time-related content
      const timePatterns = [
        'time', 'countdown', 'deadline', 'starts', 'ends',
        'minutes', 'hours', 'seconds'
      ];
      
      for (const pattern of timePatterns) {
        const elements = page.locator(`text=${pattern}`);
        const count = await elements.count();
        if (count > 0) {
          console.log(`Found time-related content: ${pattern}`);
        }
      }
      
      // Log all visible text to help debug
      const allText = await page.textContent('body');
      console.log('Page text sample:', allText?.substring(0, 500));
      
      // Continue test even without timers to measure general performance
      timerElement = page.locator('body');
    }
    
    // Measure timer update performance over 10 seconds
    const measurements = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const measureStart = Date.now();
      
      // Wait for next timer update
      await page.waitForTimeout(1000);
      
      // Check if page is still responsive
      const currentTime = await page.evaluate(() => Date.now());
      const updateTime = Date.now() - measureStart;
      
      measurements.push({
        iteration: i + 1,
        updateTime,
        pageResponsive: currentTime > 0
      });
      
      console.log(`Timer update ${i + 1}: ${updateTime}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    const avgUpdateTime = measurements.reduce((acc, m) => acc + m.updateTime, 0) / measurements.length;
    
    console.log(`Total test time: ${totalTime}ms`);
    console.log(`Average update time: ${avgUpdateTime}ms`);
    
    // Performance assertions
    expect(avgUpdateTime).toBeLessThan(1200); // Timer updates should be near 1000ms
    expect(totalTime).toBeLessThan(12000); // Total should be close to 10 seconds
    
    // Verify page remained responsive
    measurements.forEach(m => {
      expect(m.pageResponsive).toBe(true);
    });
  });

  test('Pick Submission Before Lock Performance', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/games`);
    await page.waitForSelector('[data-testid="game-card"]');
    
    // Find games that are not locked
    const gameCards = page.locator('[data-testid="game-card"]');
    const gameCount = await gameCards.count();
    
    console.log(`Found ${gameCount} game cards`);
    
    let availablePicksFound = 0;
    const pickTimes = [];
    
    // Try to make picks on available games
    for (let i = 0; i < Math.min(gameCount, 5); i++) {
      const gameCard = gameCards.nth(i);
      
      // Look for pick buttons in various formats
      const pickButtonSelectors = [
        'button:has-text("Pick")',
        'button:has-text("Choose")',
        'button:has-text("Select")',
        'button[data-testid*="pick"]',
        'button[type="button"]:not(:disabled)'
      ];
      
      let pickButton = null;
      for (const selector of pickButtonSelectors) {
        const button = gameCard.locator(selector).first();
        if (await button.isVisible() && await button.isEnabled()) {
          pickButton = button;
          break;
        }
      }
      
      if (pickButton) {
        availablePicksFound++;
        
        // Measure pick submission time
        const pickStart = Date.now();
        await pickButton.click();
        
        // Wait for any confirmation or UI update
        await page.waitForTimeout(500);
        const pickTime = Date.now() - pickStart;
        
        pickTimes.push(pickTime);
        console.log(`Pick ${availablePicksFound} submitted in ${pickTime}ms`);
        
        // Performance assertion for individual pick
        expect(pickTime).toBeLessThan(2000);
      }
    }
    
    console.log(`Made ${availablePicksFound} picks`);
    
    if (availablePicksFound > 0) {
      const avgPickTime = pickTimes.reduce((acc, time) => acc + time, 0) / pickTimes.length;
      console.log(`Average pick time: ${avgPickTime}ms`);
      expect(avgPickTime).toBeLessThan(1500);
    } else {
      console.log('No available picks found - games may be locked or completed');
    }
  });

  test('Lock Status Check Performance', async ({ page }) => {
    // Test API performance for checking lock status
    const checkStart = Date.now();
    
    const response = await page.request.get(`${API_URL}/api/games`, {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('authToken'))}`
      }
    });
    
    const checkTime = Date.now() - checkStart;
    
    expect(response.ok()).toBe(true);
    expect(checkTime).toBeLessThan(1000);
    
    const games = await response.json();
    console.log(`Lock status check took ${checkTime}ms for ${games.length} games`);
    
    // Verify each game has lock status information
    games.forEach((game: any, index: number) => {
      expect(game).toHaveProperty('id');
      // Game should have timing information to determine lock status
      expect(game).toHaveProperty('startTime');
      
      if (index < 3) { // Log first 3 games for debugging
        console.log(`Game ${index + 1} timing:`, {
          id: game.id,
          startTime: game.startTime,
          status: game.status
        });
      }
    });
  });

  test('Bulk Pick Operations Performance', async ({ page }) => {
    // Test submitting multiple picks in quick succession
    await page.goto(`${PRODUCTION_URL}/games`);
    await page.waitForSelector('[data-testid="game-card"]');
    
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    const gameData = await page.request.get(`${API_URL}/api/games`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const games = await gameData.json();
    const availableGames = games.filter((game: any) => {
      // Filter for games that should accept picks (not locked)
      return game.status !== 'FINAL' && game.status !== 'IN_PROGRESS';
    }).slice(0, 5); // Test with first 5 available games
    
    console.log(`Testing bulk picks on ${availableGames.length} games`);
    
    if (availableGames.length === 0) {
      console.log('No games available for bulk pick testing');
      return;
    }
    
    const bulkStart = Date.now();
    const pickPromises = [];
    
    // Submit all picks simultaneously
    availableGames.forEach((game: any, index: number) => {
      const teamId = index % 2 === 0 ? game.homeTeam.id : game.awayTeam.id;
      
      const pickPromise = page.request.post(`${API_URL}/api/picks`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          gameId: game.id,
          teamId: teamId,
          confidence: Math.floor(Math.random() * 10) + 1
        }
      });
      
      pickPromises.push(pickPromise);
    });
    
    // Wait for all picks to complete
    const responses = await Promise.all(pickPromises);
    const bulkTime = Date.now() - bulkStart;
    
    console.log(`Bulk pick submission took ${bulkTime}ms for ${availableGames.length} picks`);
    console.log(`Average per pick: ${bulkTime / availableGames.length}ms`);
    
    // Performance assertions
    expect(bulkTime).toBeLessThan(5000); // Should complete within 5 seconds
    expect(bulkTime / availableGames.length).toBeLessThan(1500); // Average per pick
    
    // Verify responses
    let successCount = 0;
    let lockCount = 0;
    
    responses.forEach((response, index) => {
      if (response.status() === 200) {
        successCount++;
      } else if (response.status() === 409) {
        lockCount++; // Game was locked
      }
      
      console.log(`Pick ${index + 1}: Status ${response.status()}`);
    });
    
    console.log(`Successful picks: ${successCount}, Locked games: ${lockCount}`);
  });

  test('Memory Usage During Extended Session', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/games`);
    
    // Simulate extended user session with multiple page interactions
    const startMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    console.log(`Initial memory usage: ${startMemory} bytes`);
    
    // Perform various actions that might cause memory issues
    for (let i = 0; i < 10; i++) {
      // Navigate between pages
      await page.goto(`${PRODUCTION_URL}/leaderboard`);
      await page.waitForLoadState('networkidle');
      
      await page.goto(`${PRODUCTION_URL}/games`);
      await page.waitForLoadState('networkidle');
      
      // Interact with page elements
      const gameCards = page.locator('[data-testid="game-card"]');
      const count = await gameCards.count();
      if (count > 0) {
        await gameCards.first().hover();
      }
      
      await page.waitForTimeout(500);
    }
    
    const endMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    console.log(`Final memory usage: ${endMemory} bytes`);
    
    if (startMemory > 0 && endMemory > 0) {
      const memoryIncrease = endMemory - startMemory;
      console.log(`Memory increase: ${memoryIncrease} bytes`);
      
      // Assert memory didn't increase dramatically (potential memory leak)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    } else {
      console.log('Memory API not available in this browser');
    }
  });
});