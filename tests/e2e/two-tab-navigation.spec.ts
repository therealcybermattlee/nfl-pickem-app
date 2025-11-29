import { test, expect } from '@playwright/test';

/**
 * Two-Tab Navigation Tests
 * Feature: 002-remove-home-tab
 *
 * Tests for the simplified 2-tab navigation (Games + Leaderboard)
 * after removing the Home tab.
 */

const PRODUCTION_URL = 'https://pickem.cyberlees.dev';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

test.describe('Two-Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${PRODUCTION_URL}/signin`);
    await page.fill('[name="email"]', TEST_EMAIL);
    await page.fill('[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL(`${PRODUCTION_URL}/`);
  });

  test('should show only 2 navigation tabs on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Check desktop navigation
    const desktopNav = page.locator('nav[role="navigation"][aria-label="Main navigation"]').first();
    await expect(desktopNav).toBeVisible();

    // Verify Games tab exists
    await expect(desktopNav.locator('a:has-text("Games")')).toBeVisible();

    // Verify Leaderboard tab exists
    await expect(desktopNav.locator('a:has-text("Leaderboard")')).toBeVisible();

    // Verify Home tab does NOT exist
    await expect(desktopNav.locator('a:has-text("Home")')).not.toBeVisible();
  });

  test('should show only 2 navigation icons on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow time for mobile nav to render

    // Check mobile bottom navigation
    const mobileNav = page.locator('nav[role="navigation"][aria-label="Main navigation"]');

    // Verify Games tab exists
    await expect(page.locator('button[aria-label="Games"]')).toBeVisible();

    // Verify Leaderboard tab exists
    await expect(page.locator('button[aria-label="Leaderboard"]')).toBeVisible();

    // Verify Home tab does NOT exist
    await expect(page.locator('button[aria-label="Home"]')).not.toBeVisible();
  });

  test('should land on Games page after login', async ({ page }) => {
    // Should already be on root URL from beforeEach
    await expect(page).toHaveURL(`${PRODUCTION_URL}/`);

    // Verify Games page content is visible (week selector, games grid)
    await expect(page.locator('text=Week')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect /games to /', async ({ page }) => {
    // Navigate to /games
    await page.goto(`${PRODUCTION_URL}/games`);

    // Should redirect to root
    await expect(page).toHaveURL(`${PRODUCTION_URL}/`);

    // Games page content should still be visible
    await expect(page.locator('text=Week')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Leaderboard and back to Games', async ({ page }) => {
    // Click Leaderboard
    await page.click('a:has-text("Leaderboard"), button[aria-label="Leaderboard"]');
    await page.waitForURL(`${PRODUCTION_URL}/leaderboard`);

    // Verify Leaderboard page
    await expect(page.locator('text=Leaderboard')).toBeVisible();

    // Click Games to go back
    await page.click('a:has-text("Games"), button[aria-label="Games"]');
    await page.waitForURL(`${PRODUCTION_URL}/`);

    // Verify Games page
    await expect(page.locator('text=Week')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Default Landing Page', () => {
  test('should show Games page at root URL', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/signin`);
    await page.fill('[name="email"]', TEST_EMAIL);
    await page.fill('[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(`${PRODUCTION_URL}/`);

    // Verify we're on Games page (has week selector)
    await expect(page.locator('text=Week')).toBeVisible({ timeout: 10000 });

    // Verify URL is root
    expect(page.url()).toBe(`${PRODUCTION_URL}/`);
  });
});
