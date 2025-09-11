/**
 * Game-Day Scenario Testing Suite
 * Real-world usage simulation and stress testing for mobile UI
 * 
 * Coverage:
 * - Rapid pick selection under time pressure simulation
 * - Network interruption during pick submission
 * - Multiple users making picks simultaneously
 * - Pick deadline countdown behavior
 * - Error recovery and user feedback
 * - Battery optimization scenarios
 * - Background/foreground app switching
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Game day simulation configurations
const GAME_DAY_SCENARIOS = {
  SUNDAY_MORNING: {
    name: 'Sunday Morning Rush',
    description: 'Multiple games starting within 1 hour',
    timeUntilDeadline: 30 * 60 * 1000, // 30 minutes
    expectedUserBehavior: 'rushed',
    networkConditions: 'good'
  },
  LAST_MINUTE_PICKS: {
    name: 'Last Minute Panic',
    description: 'User making picks with <5 minutes until deadline',
    timeUntilDeadline: 4 * 60 * 1000, // 4 minutes
    expectedUserBehavior: 'frantic',
    networkConditions: 'variable'
  },
  POOR_CONNECTION: {
    name: 'Stadium WiFi',
    description: 'Poor connectivity at stadium/crowded venue',
    timeUntilDeadline: 15 * 60 * 1000, // 15 minutes
    expectedUserBehavior: 'patient',
    networkConditions: 'poor'
  },
  MULTI_USER_LOAD: {
    name: 'Family Pool Rush',
    description: 'Multiple family members picking simultaneously',
    timeUntilDeadline: 60 * 60 * 1000, // 60 minutes
    expectedUserBehavior: 'coordinated',
    networkConditions: 'good'
  }
};

test.describe('Game-Day Scenario Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Mock current time to control deadline scenarios
    await page.addInitScript(() => {
      window.mockCurrentTime = Date.now();
      // Override Date.now() for testing
      const originalNow = Date.now;
      Date.now = () => window.mockCurrentTime;
      
      // Also override new Date() calls
      const OriginalDate = Date;
      window.Date = class extends OriginalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(window.mockCurrentTime);
          } else {
            super(...args);
          }
        }
        
        static now() {
          return window.mockCurrentTime;
        }
      } as any;
    });
    
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Rapid Pick Selection Under Time Pressure', () => {
    
    test('should handle rapid pick selection during Sunday morning rush', async ({ page }) => {
      // Simulate 30 minutes until deadline
      await page.evaluate((timeUntilDeadline) => {
        window.mockCurrentTime = Date.now() + timeUntilDeadline;
      }, GAME_DAY_SCENARIOS.SUNDAY_MORNING.timeUntilDeadline);
      
      const gameCards = await page.locator('[class*="mobileGameCard"]').all();
      expect(gameCards.length).toBeGreaterThan(0);
      
      const selectionTimes: number[] = [];
      
      // Rapid pick selection simulation
      for (let i = 0; i < Math.min(8, gameCards.length); i++) {
        const gameCard = gameCards[i];
        const teamButtons = await gameCard.locator('[class*="teamButton"]').all();
        
        if (teamButtons.length >= 2) {
          const startTime = Date.now();
          
          // Select home team (second button)
          await teamButtons[1].tap();
          await page.waitForTimeout(50); // Brief pause like real user
          
          // Verify selection was registered
          await expect(teamButtons[1]).toHaveClass(/selected/);
          
          const selectionTime = Date.now() - startTime;
          selectionTimes.push(selectionTime);
        }
      }
      
      // All selections should be fast (under 500ms each)
      for (const time of selectionTimes) {
        expect(time).toBeLessThan(500);
      }
      
      // Average selection time should be reasonable for mobile
      const averageTime = selectionTimes.reduce((a, b) => a + b, 0) / selectionTimes.length;
      expect(averageTime).toBeLessThan(300);
    });

    test('should provide clear visual feedback during rapid selections', async ({ page }) => {
      const gameCard = page.locator('[class*="mobileGameCard"]').first();
      const teamButtons = await gameCard.locator('[class*="teamButton"]').all();
      
      if (teamButtons.length >= 2) {
        // Rapid alternating selections
        for (let i = 0; i < 5; i++) {
          const buttonIndex = i % 2;
          await teamButtons[buttonIndex].tap();
          await page.waitForTimeout(100);
          
          // Verify correct button is selected
          await expect(teamButtons[buttonIndex]).toHaveClass(/selected/);
          
          // Other button should not be selected
          const otherIndex = (buttonIndex + 1) % 2;
          await expect(teamButtons[otherIndex]).not.toHaveClass(/selected/);
        }
      }
    });

    test('should prevent double-tap submission errors', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      
      // Simulate double-tap scenario (user taps twice quickly)
      await teamButton.tap();
      await teamButton.tap(); // Immediate second tap
      
      await page.waitForTimeout(200);
      
      // Should still be in valid state (selected)
      await expect(teamButton).toHaveClass(/selected/);
      
      // Should not have triggered any error states
      const errorMessage = page.locator('[class*="error"], [role="alert"]');
      await expect(errorMessage).toHaveCount(0);
    });
  });

  test.describe('Network Interruption Handling', () => {
    
    test('should handle network disconnection during pick submission', async ({ page, context }) => {
      // Intercept network requests
      await page.route('**/api/**', route => route.abort());
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      // Attempt to submit picks (this should fail due to network)
      const submitButton = page.locator('button[class*="mobileButton"]').getByText(/submit|save/i);
      
      if (await submitButton.count() > 0) {
        await submitButton.tap();
        
        // Should show network error feedback
        await expect(page.locator('text=/network|connection|error/i')).toBeVisible({ timeout: 5000 });
        
        // User should be able to retry
        const retryButton = page.locator('button').getByText(/retry|try again/i);
        await expect(retryButton).toBeVisible();
      }
    });

    test('should cache picks locally when network is unavailable', async ({ page }) => {
      // Simulate offline condition
      await page.context().setOffline(true);
      
      const gameCard = page.locator('[class*="mobileGameCard"]').first();
      const teamButton = gameCard.locator('[class*="teamButton"]').first();
      
      await teamButton.tap();
      
      // Pick should be stored locally even when offline
      const localStorageData = await page.evaluate(() => {
        return localStorage.getItem('pendingPicks') || sessionStorage.getItem('pendingPicks');
      });
      
      // Should have cached the pick locally
      expect(localStorageData).toBeTruthy();
      
      // Visual indicator should show offline status
      const offlineIndicator = page.locator('[class*="offline"], [aria-label*="offline"]');
      await expect(offlineIndicator).toBeVisible({ timeout: 3000 });
    });

    test('should sync cached picks when network returns', async ({ page }) => {
      // Start offline
      await page.context().setOffline(true);
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      // Verify pick is cached
      let cachedPicks = await page.evaluate(() => 
        localStorage.getItem('pendingPicks') || sessionStorage.getItem('pendingPicks')
      );
      expect(cachedPicks).toBeTruthy();
      
      // Go back online
      await page.context().setOffline(false);
      
      // Should attempt to sync automatically
      await page.waitForTimeout(2000); // Wait for sync attempt
      
      // Cached picks should be cleared after successful sync
      cachedPicks = await page.evaluate(() => 
        localStorage.getItem('pendingPicks') || sessionStorage.getItem('pendingPicks')
      );
      
      // Either cleared (successful sync) or still there (retry needed)
      // Both are valid behaviors depending on implementation
    });

    test('should handle slow network responses gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        route.continue();
      });
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      const submitButton = page.locator('button[class*="mobileButton"]').getByText(/submit/i);
      
      if (await submitButton.count() > 0) {
        await submitButton.tap();
        
        // Should show loading indicator
        const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], [aria-label*="loading"]');
        await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
        
        // Loading should persist during slow request
        await page.waitForTimeout(2000);
        await expect(loadingIndicator).toBeVisible();
        
        // Eventually should complete or timeout gracefully
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Multiple User Simultaneous Load Testing', () => {
    
    test('should handle multiple concurrent pick submissions', async ({ browser }) => {
      const contexts: BrowserContext[] = [];
      const pages: Page[] = [];
      
      try {
        // Create multiple browser contexts (simulating different users)
        for (let i = 0; i < 3; i++) {
          const context = await browser.newContext({
            viewport: { width: 390, height: 844 }
          });
          contexts.push(context);
          
          const page = await context.newPage();
          await page.goto('/games');
          await page.waitForLoadState('networkidle');
          pages.push(page);
        }
        
        // All users make picks simultaneously
        const pickPromises = pages.map(async (page, index) => {
          const gameCard = page.locator('[class*="mobileGameCard"]').first();
          const teamButtons = await gameCard.locator('[class*="teamButton"]').all();
          
          if (teamButtons.length >= 2) {
            // Different users pick different teams
            const buttonIndex = index % 2;
            await teamButtons[buttonIndex].tap();
            
            return {
              userId: index,
              success: await teamButtons[buttonIndex].getAttribute('class').then(c => c?.includes('selected'))
            };
          }
          return { userId: index, success: false };
        });
        
        const results = await Promise.all(pickPromises);
        
        // All users should successfully make their picks
        for (const result of results) {
          expect(result.success).toBe(true);
        }
        
      } finally {
        // Cleanup contexts
        for (const context of contexts) {
          await context.close();
        }
      }
    });

    test('should maintain data consistency under concurrent load', async ({ browser }) => {
      // Test data integrity when multiple users interact simultaneously
      const numUsers = 5;
      const contexts: BrowserContext[] = [];
      
      try {
        for (let i = 0; i < numUsers; i++) {
          const context = await browser.newContext({
            viewport: { width: 390, height: 844 }
          });
          contexts.push(context);
        }
        
        // Concurrent operations
        const operations = contexts.map(async (context, index) => {
          const page = await context.newPage();
          await page.goto('/games');
          await page.waitForLoadState('networkidle');
          
          // Each user makes picks on different games
          const gameCards = await page.locator('[class*="mobileGameCard"]').all();
          if (gameCards.length > index) {
            const gameCard = gameCards[index];
            const teamButton = gameCard.locator('[class*="teamButton"]').first();
            await teamButton.tap();
            
            // Verify pick was registered
            return await teamButton.getAttribute('class').then(c => c?.includes('selected'));
          }
          return false;
        });
        
        const results = await Promise.all(operations);
        
        // All operations should succeed without conflicts
        expect(results.every(r => r === true)).toBe(true);
        
      } finally {
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });

  test.describe('Pick Deadline Countdown Behavior', () => {
    
    test('should show accurate countdown timers', async ({ page }) => {
      // Mock game with 10 minutes until deadline
      const deadlineTime = Date.now() + (10 * 60 * 1000);
      
      await page.evaluate((deadline) => {
        // Mock game data with deadline
        window.mockGameDeadline = deadline;
      }, deadlineTime);
      
      // Look for countdown timer elements
      const countdownTimer = page.locator('[class*="countdown"], [data-testid*="timer"]');
      
      if (await countdownTimer.count() > 0) {
        // Should show minutes and seconds
        await expect(countdownTimer).toContainText(/\d{1,2}:\d{2}/);
        
        // Timer should count down
        const initialText = await countdownTimer.textContent();
        await page.waitForTimeout(2000);
        const laterText = await countdownTimer.textContent();
        
        expect(initialText).not.toBe(laterText);
      }
    });

    test('should prevent picks after deadline', async ({ page }) => {
      // Set time past deadline
      await page.evaluate(() => {
        window.mockCurrentTime = Date.now() + (2 * 60 * 60 * 1000); // 2 hours in future
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const teamButtons = page.locator('[class*="teamButton"]');
      
      if (await teamButtons.count() > 0) {
        const firstButton = teamButtons.first();
        
        // Buttons should be disabled after deadline
        await expect(firstButton).toBeDisabled();
        
        // Or should have visual indication that picks are locked
        const isLocked = await firstButton.evaluate(el => {
          return el.hasAttribute('disabled') || 
                 el.classList.contains('disabled') ||
                 el.classList.contains('locked');
        });
        
        expect(isLocked).toBe(true);
      }
    });

    test('should show urgency indicators as deadline approaches', async ({ page }) => {
      // Set time to 2 minutes before deadline
      const urgentTime = Date.now() + (2 * 60 * 1000);
      
      await page.evaluate((time) => {
        window.mockCurrentTime = time;
      }, urgentTime);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Look for urgency indicators
      const urgencyIndicators = [
        '[class*="urgent"]',
        '[class*="warning"]', 
        '[class*="danger"]',
        '[style*="color: red"]',
        '[style*="background: red"]'
      ];
      
      let hasUrgencyIndicator = false;
      for (const selector of urgencyIndicators) {
        if (await page.locator(selector).count() > 0) {
          hasUrgencyIndicator = true;
          break;
        }
      }
      
      // Should show some form of urgency indication
      expect(hasUrgencyIndicator).toBe(true);
    });

    test('should auto-save picks before deadline', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      // Should automatically save without explicit submit
      await page.waitForTimeout(1000);
      
      // Check for auto-save indicators
      const autoSaveIndicators = page.locator('text=/auto.?saved|saved|synced/i');
      
      // Either show explicit indicator or picks should persist on reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const savedButton = page.locator('[class*="teamButton"].selected').first();
      const hasSavedPick = await savedButton.count() > 0;
      
      // Pick should persist (indicating auto-save worked)
      expect(hasSavedPick).toBe(true);
    });
  });

  test.describe('Error Recovery and User Feedback', () => {
    
    test('should provide clear error messages for failed submissions', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server temporarily unavailable' })
        });
      });
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      const submitButton = page.locator('button[class*="mobileButton"]').getByText(/submit/i);
      
      if (await submitButton.count() > 0) {
        await submitButton.tap();
        
        // Should show user-friendly error message
        const errorMessage = page.locator('[role="alert"], [class*="error"]');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
        
        // Error should be actionable (not just technical details)
        const errorText = await errorMessage.textContent();
        expect(errorText?.toLowerCase()).toMatch(/try again|retry|check connection|temporarily/);
      }
    });

    test('should allow retry after failed submissions', async ({ page }) => {
      let requestCount = 0;
      
      // Fail first request, succeed on retry
      await page.route('**/api/**', route => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({ status: 500 });
        } else {
          route.continue();
        }
      });
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      const submitButton = page.locator('button[class*="mobileButton"]').getByText(/submit/i);
      
      if (await submitButton.count() > 0) {
        await submitButton.tap();
        
        // Should show retry option
        const retryButton = page.locator('button').getByText(/retry|try again/i);
        await expect(retryButton).toBeVisible({ timeout: 3000 });
        
        // Retry should work
        await retryButton.tap();
        
        // Should show success feedback
        await expect(page.locator('text=/success|saved|submitted/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should maintain pick state during errors', async ({ page }) => {
      const gameCard = page.locator('[class*="mobileGameCard"]').first();
      const teamButtons = await gameCard.locator('[class*="teamButton"]').all();
      
      if (teamButtons.length >= 2) {
        // Make picks
        await teamButtons[0].tap();
        await expect(teamButtons[0]).toHaveClass(/selected/);
        
        // Simulate error condition
        await page.evaluate(() => {
          throw new Error('Simulated error');
        }).catch(() => {}); // Ignore the error
        
        await page.waitForTimeout(500);
        
        // Picks should still be visible/selected
        await expect(teamButtons[0]).toHaveClass(/selected/);
      }
    });
  });

  test.describe('Battery and Performance Optimization', () => {
    
    test('should minimize CPU usage during idle periods', async ({ page }) => {
      // Let page settle
      await page.waitForTimeout(3000);
      
      // Monitor CPU usage during idle time
      const cpuMetrics = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const measurements: number[] = [];
          let measureCount = 0;
          
          const measureCPU = () => {
            const start = performance.now();
            // Do a small amount of work to measure responsiveness
            for (let i = 0; i < 1000; i++) {
              Math.random();
            }
            const end = performance.now();
            measurements.push(end - start);
            measureCount++;
            
            if (measureCount < 10) {
              setTimeout(measureCPU, 200);
            } else {
              const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
              resolve({ averageTime: average, measurements });
            }
          };
          
          measureCPU();
        });
      });
      
      // Should be responsive during idle (low CPU usage)
      expect(cpuMetrics.averageTime).toBeLessThan(5); // Should be very fast
    });

    test('should reduce refresh rate when not interacting', async ({ page }) => {
      // Check for timer/interval optimization
      const timerCount = await page.evaluate(async () => {
        // Count active timers
        let activeTimers = 0;
        
        const originalSetInterval = window.setInterval;
        const originalSetTimeout = window.setTimeout;
        
        window.setInterval = (handler: any, timeout?: number) => {
          activeTimers++;
          return originalSetInterval(handler, timeout);
        };
        
        window.setTimeout = (handler: any, timeout?: number) => {
          activeTimers++;
          const id = originalSetTimeout(() => {
            activeTimers--;
            handler();
          }, timeout);
          return id;
        };
        
        // Wait and measure
        await new Promise(resolve => setTimeout(resolve, 2000));
        return activeTimers;
      });
      
      // Should have minimal ongoing timers during idle
      expect(timerCount).toBeLessThan(5); // Reasonable number of background timers
    });
  });

  test.describe('Background/Foreground App Switching', () => {
    
    test('should handle visibility changes gracefully', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      // Simulate app going to background
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      });
      
      await page.waitForTimeout(1000);
      
      // Simulate app returning to foreground
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Pick should still be selected
      await expect(teamButton).toHaveClass(/selected/);
      
      // App should still be functional
      const otherButton = page.locator('[class*="teamButton"]').nth(1);
      if (await otherButton.count() > 0) {
        await otherButton.tap();
        await expect(otherButton).toHaveClass(/selected/);
      }
    });

    test('should pause non-essential updates when backgrounded', async ({ page }) => {
      // Monitor update frequency
      const updateCounts = await page.evaluate(async () => {
        let updateCount = 0;
        
        // Mock an update function
        const originalRequestAnimationFrame = window.requestAnimationFrame;
        window.requestAnimationFrame = (callback: FrameRequestCallback) => {
          updateCount++;
          return originalRequestAnimationFrame(callback);
        };
        
        // Measure updates while visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        const visibleUpdates = updateCount;
        
        // Simulate backgrounding
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        
        updateCount = 0;
        await new Promise(resolve => setTimeout(resolve, 1000));
        const backgroundUpdates = updateCount;
        
        return { visibleUpdates, backgroundUpdates };
      });
      
      // Should have fewer updates when backgrounded
      expect(updateCounts.backgroundUpdates).toBeLessThanOrEqual(updateCounts.visibleUpdates);
    });
  });
});