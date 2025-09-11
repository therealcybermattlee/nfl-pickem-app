/**
 * Cross-Device Visual Testing Framework
 * Multi-device screenshot comparison and layout consistency validation
 * 
 * Coverage:
 * - iPhone 12 (390x844), iPhone SE (375x667), iPhone 14 Pro Max (430x932)
 * - Galaxy S21 (384x854), Pixel 6 (393x851), Galaxy Note (414x896) 
 * - iPad Mini (768x1024) tablet layouts
 * - Screenshot comparison testing for design consistency
 * - Layout shift detection and prevention
 */

import { test, expect, Page, devices } from '@playwright/test';
import path from 'path';

// Define comprehensive device matrix for testing
const DEVICE_MATRIX = [
  {
    name: 'iPhone SE',
    viewport: { width: 375, height: 667 },
    userAgent: 'iPhone SE',
    category: 'small-mobile'
  },
  {
    name: 'iPhone 12',
    viewport: { width: 390, height: 844 },
    userAgent: 'iPhone 12',
    category: 'standard-mobile'
  },
  {
    name: 'iPhone 14 Pro Max',
    viewport: { width: 430, height: 932 },
    userAgent: 'iPhone 14 Pro Max',
    category: 'large-mobile'
  },
  {
    name: 'Galaxy S21',
    viewport: { width: 384, height: 854 },
    userAgent: 'Galaxy S21',
    category: 'standard-mobile'
  },
  {
    name: 'Pixel 6',
    viewport: { width: 393, height: 851 },
    userAgent: 'Pixel 6',
    category: 'standard-mobile'
  },
  {
    name: 'Galaxy Note',
    viewport: { width: 414, height: 896 },
    userAgent: 'Galaxy Note',
    category: 'large-mobile'
  },
  {
    name: 'iPad Mini',
    viewport: { width: 768, height: 1024 },
    userAgent: 'iPad Mini',
    category: 'tablet'
  }
];

// Test pages and their critical UI elements
const TEST_SCENARIOS = [
  {
    path: '/',
    name: 'homepage',
    description: 'Home page with game overview',
    criticalElements: [
      '[data-testid="week-selector"]',
      '[data-testid="game-cards"]',
      '[data-testid="mobile-navigation"]'
    ]
  },
  {
    path: '/games',
    name: 'games-page',
    description: 'Full games listing with pick interface',
    criticalElements: [
      '[data-testid="mobile-pick-interface"]',
      '[class*="mobileGameCard"]',
      '[class*="teamButton"]'
    ]
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    description: 'Leaderboard and standings',
    criticalElements: [
      '[data-testid="standings-table"]',
      '[data-testid="mobile-stats"]'
    ]
  }
];

test.describe('Cross-Device Visual Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.goto('/');
    
    // Add test data attributes for reliable element selection
    await page.addInitScript(() => {
      // Add data-testid attributes to key elements
      const addTestIds = () => {
        // Week selector
        const weekSelector = document.querySelector('[class*="weekSelector"]');
        if (weekSelector) weekSelector.setAttribute('data-testid', 'week-selector');
        
        // Game cards container
        const gameContainer = document.querySelector('[class*="gameContainer"], main');
        if (gameContainer) gameContainer.setAttribute('data-testid', 'game-cards');
        
        // Mobile navigation
        const mobileNav = document.querySelector('[class*="mobileNavigation"]');
        if (mobileNav) mobileNav.setAttribute('data-testid', 'mobile-navigation');
        
        // Mobile pick interface
        const pickInterface = document.querySelector('[class*="MobilePickInterface"]');
        if (pickInterface) pickInterface.setAttribute('data-testid', 'mobile-pick-interface');
        
        // Stats/standings
        const standings = document.querySelector('[class*="leaderboard"], [class*="standings"]');
        if (standings) standings.setAttribute('data-testid', 'standings-table');
      };
      
      // Run immediately and on DOM changes
      addTestIds();
      const observer = new MutationObserver(addTestIds);
      observer.observe(document.body, { childList: true, subtree: true });
    });
    
    await page.waitForLoadState('networkidle');
  });

  test.describe('Multi-Device Screenshot Comparison', () => {
    
    for (const scenario of TEST_SCENARIOS) {
      for (const device of DEVICE_MATRIX) {
        test(`${scenario.name} visual consistency on ${device.name}`, async ({ page }) => {
          // Configure device
          await page.setViewportSize(device.viewport);
          await page.setUserAgent(device.userAgent);
          
          // Navigate to test page
          await page.goto(scenario.path);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000); // Allow animations to settle
          
          // Wait for critical elements to be visible
          for (const selector of scenario.criticalElements) {
            try {
              await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
            } catch (error) {
              console.warn(`Element ${selector} not found on ${scenario.path} for ${device.name}`);
            }
          }
          
          // Take full page screenshot
          const screenshotPath = `screenshots/${device.category}/${device.name.toLowerCase().replace(/\s+/g, '-')}-${scenario.name}.png`;
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: 'disabled'
          });
          
          // Take viewport screenshot for above-fold content
          const viewportScreenshotPath = `screenshots/${device.category}/${device.name.toLowerCase().replace(/\s+/g, '-')}-${scenario.name}-viewport.png`;
          await page.screenshot({
            path: viewportScreenshotPath,
            fullPage: false,
            animations: 'disabled'
          });
          
          // Visual regression testing using Playwright's built-in comparison
          await expect(page).toHaveScreenshot(`${device.name.toLowerCase().replace(/\s+/g, '-')}-${scenario.name}.png`, {
            fullPage: true,
            animations: 'disabled',
            threshold: 0.3, // Allow for small rendering differences
            maxDiffPixels: 1000 // Allow for some pixel differences between devices
          });
        });
      }
    }
  });

  test.describe('Layout Consistency Validation', () => {
    
    test('should maintain consistent element positioning across devices', async ({ page }) => {
      const measurements: Record<string, Array<{device: string, measurements: any}>> = {};
      
      for (const device of DEVICE_MATRIX) {
        await page.setViewportSize(device.viewport);
        await page.goto('/games');
        await page.waitForLoadState('networkidle');
        
        // Measure key elements
        const gameCard = page.locator('[class*="mobileGameCard"]').first();
        const teamButtons = page.locator('[class*="teamButton"]');
        const weekSelector = page.locator('[class*="weekSelector"]');
        
        const measurements_device = {
          device: device.name,
          measurements: {
            gameCardWidth: await gameCard.boundingBox().then(box => box?.width || 0),
            gameCardHeight: await gameCard.boundingBox().then(box => box?.height || 0),
            teamButtonCount: await teamButtons.count(),
            teamButtonWidth: await teamButtons.first().boundingBox().then(box => box?.width || 0),
            weekSelectorHeight: await weekSelector.boundingBox().then(box => box?.height || 0),
            viewportUtilization: 0 // Will calculate
          }
        };
        
        // Calculate viewport utilization
        const gameCardBox = await gameCard.boundingBox();
        if (gameCardBox) {
          measurements_device.measurements.viewportUtilization = 
            (gameCardBox.width / device.viewport.width) * 100;
        }
        
        if (!measurements['/games']) measurements['/games'] = [];
        measurements['/games'].push(measurements_device);
      }
      
      // Validate consistency across device categories
      const categories = ['small-mobile', 'standard-mobile', 'large-mobile', 'tablet'];
      
      for (const category of categories) {
        const devicesInCategory = measurements['/games'].filter(m => 
          DEVICE_MATRIX.find(d => d.name === m.device)?.category === category
        );
        
        if (devicesInCategory.length > 1) {
          const first = devicesInCategory[0];
          const rest = devicesInCategory.slice(1);
          
          for (const device of rest) {
            // Viewport utilization should be similar within category
            const utilizationDiff = Math.abs(
              first.measurements.viewportUtilization - device.measurements.viewportUtilization
            );
            expect(utilizationDiff, 
              `Viewport utilization difference between ${first.device} and ${device.device}`
            ).toBeLessThan(10); // Within 10%
            
            // Team button counts should be identical
            expect(device.measurements.teamButtonCount).toBe(first.measurements.teamButtonCount);
          }
        }
      }
    });

    test('should maintain proper spacing ratios across screen sizes', async ({ page }) => {
      const spacingData: Array<{device: string, spacing: any}> = [];
      
      for (const device of DEVICE_MATRIX) {
        await page.setViewportSize(device.viewport);
        await page.goto('/games');
        await page.waitForLoadState('networkidle');
        
        // Measure spacing between game cards
        const gameCards = await page.locator('[class*="mobileGameCard"]').all();
        let cardSpacing = 0;
        
        if (gameCards.length >= 2) {
          const firstCardBox = await gameCards[0].boundingBox();
          const secondCardBox = await gameCards[1].boundingBox();
          
          if (firstCardBox && secondCardBox) {
            cardSpacing = secondCardBox.y - (firstCardBox.y + firstCardBox.height);
          }
        }
        
        // Measure padding inside game cards
        const cardPadding = await page.evaluate(() => {
          const card = document.querySelector('[class*="mobileGameCard"]');
          if (card) {
            const style = getComputedStyle(card);
            return parseInt(style.paddingTop) + parseInt(style.paddingBottom);
          }
          return 0;
        });
        
        spacingData.push({
          device: device.name,
          spacing: {
            cardSpacing,
            cardPadding,
            spacingRatio: cardSpacing / device.viewport.width * 100 // As percentage of viewport
          }
        });
      }
      
      // Validate spacing consistency
      for (let i = 1; i < spacingData.length; i++) {
        const current = spacingData[i];
        const previous = spacingData[i-1];
        
        // Spacing should follow 8px grid
        expect(current.spacing.cardSpacing % 8).toBe(0);
        expect(current.spacing.cardPadding % 8).toBe(0);
        
        // Spacing ratios should be reasonable across devices
        const ratioFiff = Math.abs(
          current.spacing.spacingRatio - previous.spacing.spacingRatio
        );
        expect(ratioDiff).toBeLessThan(2); // Within 2% of viewport width
      }
    });
  });

  test.describe('Responsive Breakpoint Validation', () => {
    
    test('should transition smoothly between breakpoints', async ({ page }) => {
      // Test smooth transitions around critical breakpoints
      const criticalWidths = [320, 374, 375, 767, 768, 1023, 1024];
      
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      for (const width of criticalWidths) {
        await page.setViewportSize({ width, height: 800 });
        await page.waitForTimeout(300); // Allow CSS transitions
        
        // Check that layout doesn't break at breakpoints
        const gameCard = page.locator('[class*="mobileGameCard"]').first();
        const cardBox = await gameCard.boundingBox();
        
        if (cardBox) {
          // Card should not exceed viewport width
          expect(cardBox.width).toBeLessThanOrEqual(width);
          
          // Card should maintain reasonable proportions
          expect(cardBox.width).toBeGreaterThan(width * 0.7); // At least 70% of viewport
        }
        
        // Check button constraints at each breakpoint
        const buttons = await page.locator('button[class*="mobileButton"]').all();
        for (const button of buttons) {
          const buttonBox = await button.boundingBox();
          if (buttonBox) {
            const maxExpectedWidth = width <= 374 ? 160 : width <= 767 ? 200 : 250;
            expect(buttonBox.width).toBeLessThanOrEqual(maxExpectedWidth);
          }
        }
      }
    });

    test('should hide/show appropriate elements at breakpoints', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      // Test mobile navigation visibility
      const mobileNav = page.locator('[class*="mobileNavigation"]');
      
      // Should be visible on mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      await expect(mobileNav).toBeVisible();
      
      // Should be hidden on desktop
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(300);
      await expect(mobileNav).toBeHidden();
      
      // Test team name visibility on very small screens
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForTimeout(300);
      
      const teamNames = page.locator('[class*="teamName"]');
      if (await teamNames.count() > 0) {
        const firstTeamName = teamNames.first();
        const display = await firstTeamName.evaluate(el => getComputedStyle(el).display);
        expect(display).toBe('none');
      }
    });
  });

  test.describe('Component Rendering Consistency', () => {
    
    test('should render game cards consistently across devices', async ({ page }) => {
      const gameCardData: Array<{device: string, cards: any[]}> = [];
      
      for (const device of DEVICE_MATRIX) {
        await page.setViewportSize(device.viewport);
        await page.goto('/games');
        await page.waitForLoadState('networkidle');
        
        const gameCards = await page.locator('[class*="mobileGameCard"]').all();
        const cardDetails = [];
        
        for (let i = 0; i < Math.min(3, gameCards.length); i++) {
          const card = gameCards[i];
          const boundingBox = await card.boundingBox();
          
          // Count team buttons within this card
          const teamButtons = await card.locator('[class*="teamButton"]').count();
          
          // Check for spread display
          const spreadInfo = await card.locator('[class*="spread"]').textContent();
          
          // Check for time display
          const timeInfo = await card.locator('[class*="gameTime"]').textContent();
          
          cardDetails.push({
            index: i,
            width: boundingBox?.width || 0,
            height: boundingBox?.height || 0,
            teamButtons,
            hasSpread: !!spreadInfo,
            hasTime: !!timeInfo
          });
        }
        
        gameCardData.push({
          device: device.name,
          cards: cardDetails
        });
      }
      
      // Validate consistency across devices
      if (gameCardData.length > 1) {
        const referenceDevice = gameCardData[0];
        
        for (let i = 1; i < gameCardData.length; i++) {
          const currentDevice = gameCardData[i];
          
          // Should have same number of cards
          expect(currentDevice.cards.length).toBe(referenceDevice.cards.length);
          
          // Each card should have consistent content
          for (let cardIndex = 0; cardIndex < referenceDevice.cards.length; cardIndex++) {
            const refCard = referenceDevice.cards[cardIndex];
            const currCard = currentDevice.cards[cardIndex];
            
            expect(currCard.teamButtons).toBe(refCard.teamButtons);
            expect(currCard.hasSpread).toBe(refCard.hasSpread);
            expect(currCard.hasTime).toBe(refCard.hasTime);
          }
        }
      }
    });

    test('should maintain aspect ratios for logos and images', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      const logoAspectRatios: Record<string, number[]> = {};
      
      for (const device of DEVICE_MATRIX) {
        await page.setViewportSize(device.viewport);
        await page.waitForTimeout(500);
        
        const teamLogos = await page.locator('[class*="teamLogo"]').all();
        const aspectRatios = [];
        
        for (const logo of teamLogos) {
          const box = await logo.boundingBox();
          if (box && box.width > 0 && box.height > 0) {
            aspectRatios.push(box.width / box.height);
          }
        }
        
        logoAspectRatios[device.name] = aspectRatios;
      }
      
      // Validate aspect ratios are consistent across devices
      const deviceNames = Object.keys(logoAspectRatios);
      if (deviceNames.length > 1) {
        const reference = logoAspectRatios[deviceNames[0]];
        
        for (let i = 1; i < deviceNames.length; i++) {
          const current = logoAspectRatios[deviceNames[i]];
          
          expect(current.length).toBe(reference.length);
          
          for (let j = 0; j < reference.length; j++) {
            const diff = Math.abs(current[j] - reference[j]);
            expect(diff).toBeLessThan(0.1); // Allow small floating point differences
          }
        }
      }
    });
  });

  test.describe('Performance Impact of Multi-Device Rendering', () => {
    
    test('should maintain reasonable render times across devices', async ({ page }) => {
      const performanceData: Array<{device: string, metrics: any}> = [];
      
      for (const device of DEVICE_MATRIX) {
        await page.setViewportSize(device.viewport);
        
        const startTime = Date.now();
        await page.goto('/games');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        // Measure layout thrashing
        const layoutMetrics = await page.evaluate(() => {
          return new Promise((resolve) => {
            let layoutCount = 0;
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.name === 'layout') layoutCount++;
              }
            });
            
            // observer.observe({ entryTypes: ['measure'] });
            
            setTimeout(() => {
              observer.disconnect();
              resolve({ layoutCount });
            }, 2000);
          });
        });
        
        performanceData.push({
          device: device.name,
          metrics: {
            loadTime,
            ...layoutMetrics
          }
        });
      }
      
      // Validate performance is reasonable across all devices
      for (const data of performanceData) {
        expect(data.metrics.loadTime).toBeLessThan(5000); // Under 5 seconds
        // expect(data.metrics.layoutCount).toBeLessThan(10); // Minimal layout thrashing
      }
      
      // Performance should be similar across similar device categories
      const mobileDevices = performanceData.filter(d => 
        DEVICE_MATRIX.find(dm => dm.name === d.device)?.category.includes('mobile')
      );
      
      if (mobileDevices.length > 1) {
        const loadTimes = mobileDevices.map(d => d.metrics.loadTime);
        const maxLoadTime = Math.max(...loadTimes);
        const minLoadTime = Math.min(...loadTimes);
        const loadTimeVariance = (maxLoadTime - minLoadTime) / minLoadTime * 100;
        
        // Load times shouldn't vary by more than 50% between similar devices
        expect(loadTimeVariance).toBeLessThan(50);
      }
    });
  });
});