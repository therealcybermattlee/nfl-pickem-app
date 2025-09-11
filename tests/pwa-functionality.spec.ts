/**
 * PWA Functionality Tests
 * Tests PWA installation, offline capability, and service worker functionality
 */

import { test, expect } from '@playwright/test';
import { TEST_MOBILE_VIEWPORT } from './support/test-helpers';

test.describe('PWA Functionality', () => {
  
  test('should have valid PWA manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check that manifest is linked
    const manifestLink = await page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached();
    
    // Fetch and validate manifest
    const manifestResponse = await page.request.get('/manifest.webmanifest');
    expect(manifestResponse.status()).toBe(200);
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('NFL Pick\'em App');
    expect(manifest.short_name).toBe('NFL Pickem');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#1f2937');
    expect(manifest.background_color).toBe('#ffffff');
    
    // Verify icons
    expect(manifest.icons).toHaveLength(3);
    expect(manifest.icons[0].sizes).toBe('192x192');
    expect(manifest.icons[1].sizes).toBe('512x512');
    
    // Verify screenshots
    expect(manifest.screenshots).toHaveLength(2);
    expect(manifest.shortcuts).toHaveLength(2);
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker registration
    await page.waitForFunction(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.ready;
    });
    
    // Check service worker is active
    const serviceWorkerStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.active !== null;
      }
      return false;
    });
    
    expect(serviceWorkerStatus).toBe(true);
  });

  test('should cache resources offline', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait for service worker to be ready
    await page.waitForFunction(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.ready;
    });
    
    // Wait for resources to be cached
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Refresh page - should work offline
    await page.reload();
    
    // Verify page loads
    await expect(page.locator('h1')).toContainText(['NFL Pick\'em', 'Welcome']);
    
    // Go back online
    await context.setOffline(false);
  });

  test('should show PWA install prompt on mobile', async ({ page }) => {
    await page.setViewportSize(TEST_MOBILE_VIEWPORT);
    await page.goto('/');
    
    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });
    
    // Wait for install prompt to appear (after 5 second delay)
    await page.waitForTimeout(6000);
    
    // Check install prompt is visible
    const installPrompt = page.locator('[role="dialog"]');
    await expect(installPrompt).toBeVisible();
    
    // Check install button
    const installButton = page.locator('button:has-text("Install")');
    await expect(installButton).toBeVisible();
  });

  test('should display network status indicators', async ({ page, context }) => {
    await page.goto('/');
    
    // Check online status indicator
    await expect(page.locator('[class*="text-green-500"]')).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Should show offline indicator
    await expect(page.locator('text=Offline')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(1000);
  });

  test('should have proper PWA meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);
    
    // Check theme color
    const themeColorMeta = await page.locator('meta[name="theme-color"]');
    await expect(themeColorMeta).toHaveAttribute('content', '#1f2937');
    
    // Check apple-mobile-web-app-capable
    const appleMeta = await page.locator('meta[name="apple-mobile-web-app-capable"]');
    if (await appleMeta.count() > 0) {
      await expect(appleMeta).toHaveAttribute('content', 'yes');
    }
  });

  test('should handle app shortcuts', async ({ page }) => {
    await page.goto('/');
    
    // Fetch manifest and check shortcuts
    const manifestResponse = await page.request.get('/manifest.webmanifest');
    const manifest = await manifestResponse.json();
    
    expect(manifest.shortcuts).toHaveLength(2);
    
    // Test games shortcut
    const gamesShortcut = manifest.shortcuts[0];
    expect(gamesShortcut.name).toBe('Make Picks');
    expect(gamesShortcut.url).toBe('/games');
    
    // Test leaderboard shortcut
    const leaderboardShortcut = manifest.shortcuts[1];
    expect(leaderboardShortcut.name).toBe('View Leaderboard');
    expect(leaderboardShortcut.url).toBe('/leaderboard');
  });

  test('should support proper caching strategies', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker
    await page.waitForFunction(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.ready;
    });
    
    // Check that caches are created
    const cacheNames = await page.evaluate(async () => {
      if ('caches' in window) {
        return await caches.keys();
      }
      return [];
    });
    
    expect(cacheNames.length).toBeGreaterThan(0);
    
    // Should have specific cache names from our service worker
    const expectedCaches = ['api-cache', 'static-resources', 'images', 'fonts'];
    const hasSomeCaches = expectedCaches.some(cacheName => 
      cacheNames.some((name: string) => name.includes(cacheName))
    );
    expect(hasSomeCaches).toBe(true);
  });

  test.describe('Performance Metrics', () => {
    
    test('should meet PWA performance targets', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load in under 3 seconds (Time to Interactive target)
      expect(loadTime).toBeLessThan(3000);
      
      // Check First Contentful Paint (approximate)
      const performanceEntries = await page.evaluate(() => {
        return JSON.stringify(performance.getEntriesByType('navigation'));
      });
      
      const navEntries = JSON.parse(performanceEntries);
      if (navEntries.length > 0) {
        const entry = navEntries[0];
        // DOM Content Loaded should be under 2 seconds
        expect(entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart).toBeLessThan(2000);
      }
    });

    test('should have efficient resource loading', async ({ page }) => {
      const responses: any[] = [];
      
      page.on('response', response => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          responses.push({
            url: response.url(),
            size: response.headers()['content-length'] || 0,
            fromCache: response.fromServiceWorker()
          });
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that we have reasonable number of requests
      expect(responses.length).toBeLessThan(15); // Avoid too many requests
      
      // Check bundle sizes are reasonable
      const jsResponses = responses.filter(r => r.url.includes('.js'));
      const totalJSSize = jsResponses.reduce((sum, r) => sum + parseInt(r.size || '0'), 0);
      
      // Total JS should be under our 300KB budget (this is uncompressed, so higher than gzipped)
      expect(totalJSSize).toBeLessThan(500000); // 500KB uncompressed
    });
    
  });

  test.describe('Mobile PWA Features', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(TEST_MOBILE_VIEWPORT);
    });

    test('should show mobile-optimized install prompt', async ({ page }) => {
      await page.goto('/');
      
      // Mock install event
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt') as any;
        event.prompt = () => Promise.resolve();
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
      });
      
      await page.waitForTimeout(6000);
      
      const installPrompt = page.locator('[role="dialog"]');
      await expect(installPrompt).toBeVisible();
      
      // Check mobile-specific content
      await expect(installPrompt.locator('text=Perfect for game-day picks')).toBeVisible();
      await expect(installPrompt.locator('text=Works offline after installation')).toBeVisible();
    });

    test('should handle mobile navigation with PWA integration', async ({ page }) => {
      await page.goto('/');
      
      // Check mobile navigation is present
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Test navigation still works with PWA
      await page.click('text=Games');
      await expect(page).toHaveURL('/games');
      
      await page.click('text=Leaderboard');
      await expect(page).toHaveURL('/leaderboard');
    });
    
  });

});