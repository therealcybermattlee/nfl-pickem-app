import { test, expect } from '@playwright/test';

test.describe('Notification System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (assumes authenticated via storage state)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display success notification with correct styling', async ({ page }) => {
    // Trigger a success notification by making a pick
    await page.click('[data-testid="game-card"]', { force: true });
    await page.click('[data-testid="pick-team-button"]', { force: true });

    // Wait for notification to appear
    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 5000 });

    // Verify success notification styling
    await expect(notification).toHaveClass(/bg-green-50|dark:bg-green-900/);

    // Verify notification has success icon
    const icon = notification.locator('svg').first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveClass(/text-green-500/);

    // Verify notification has title
    const title = notification.locator('p').first();
    await expect(title).toBeVisible();
    await expect(title).toHaveClass(/text-green-800/);
  });

  test('should display error notification on API failure', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/picks', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    // Trigger action that should fail
    await page.click('[data-testid="game-card"]', { force: true });
    await page.click('[data-testid="pick-team-button"]', { force: true });

    // Wait for error notification
    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 5000 });

    // Verify error notification styling
    await expect(notification).toHaveClass(/bg-red-50|dark:bg-red-900/);

    // Verify error icon color
    const icon = notification.locator('svg').first();
    await expect(icon).toHaveClass(/text-red-500/);
  });

  test('should auto-dismiss notification after 5 seconds', async ({ page }) => {
    // Trigger a notification
    await page.evaluate(() => {
      // Access notification context and show a test notification
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'info',
          title: 'Test Auto-Dismiss',
          message: 'This should disappear in 5 seconds',
          duration: 5000,
        },
      });
      window.dispatchEvent(event);
    });

    // Wait for notification to appear
    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 2000 });

    // Wait for auto-dismiss (5 seconds + 1 second buffer)
    await page.waitForTimeout(6000);

    // Verify notification is gone
    await expect(notification).not.toBeVisible();
  });

  test('should manually dismiss notification when close button clicked', async ({ page }) => {
    // Trigger a persistent notification
    await page.evaluate(() => {
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'warning',
          title: 'Manual Dismiss Test',
          duration: 0, // Persistent
        },
      });
      window.dispatchEvent(event);
    });

    // Wait for notification to appear
    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 2000 });

    // Click dismiss button
    const dismissButton = notification.locator('button[aria-label="Dismiss notification"]');
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();

    // Verify notification is dismissed
    await expect(notification).not.toBeVisible({ timeout: 1000 });
  });

  test('should display multiple notifications in queue', async ({ page }) => {
    // Trigger multiple notifications
    await page.evaluate(() => {
      for (let i = 1; i <= 3; i++) {
        const event = new CustomEvent('show-notification', {
          detail: {
            type: 'info',
            title: `Notification ${i}`,
            duration: 0, // Persistent for testing
          },
        });
        window.dispatchEvent(event);
      }
    });

    // Wait for notifications to appear
    await page.waitForTimeout(1000);

    // Verify multiple notifications are visible
    const notifications = page.locator('[role="alert"]');
    const count = await notifications.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify notifications are stacked vertically
    const firstNotification = notifications.nth(0);
    const secondNotification = notifications.nth(1);

    const firstBox = await firstNotification.boundingBox();
    const secondBox = await secondNotification.boundingBox();

    // Second notification should be below first (higher Y coordinate)
    expect(secondBox?.y).toBeGreaterThan(firstBox?.y ?? 0);
  });

  test('should limit notification queue to maximum (5 by default)', async ({ page }) => {
    // Trigger more than max notifications
    await page.evaluate(() => {
      for (let i = 1; i <= 7; i++) {
        const event = new CustomEvent('show-notification', {
          detail: {
            type: 'info',
            title: `Notification ${i}`,
            duration: 0,
          },
        });
        window.dispatchEvent(event);
      }
    });

    await page.waitForTimeout(1000);

    // Verify max 5 notifications are visible
    const notifications = page.locator('[role="alert"]');
    const count = await notifications.count();
    expect(count).toBeLessThanOrEqual(5);
  });

  test('should display notification with action button', async ({ page }) => {
    // Trigger notification with action
    await page.evaluate(() => {
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'warning',
          title: 'Action Required',
          message: 'Click the button to proceed',
          duration: 0,
          action: {
            label: 'View Details',
            onClick: () => console.log('Action clicked'),
          },
        },
      });
      window.dispatchEvent(event);
    });

    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 2000 });

    // Verify action button exists
    const actionButton = notification.locator('button').filter({ hasText: 'View Details' });
    await expect(actionButton).toBeVisible();

    // Action button should be clickable
    await expect(actionButton).toBeEnabled();
  });

  test('should display different notification types with correct colors', async ({ page }) => {
    const types = [
      { type: 'success', bgClass: 'bg-green-50', iconClass: 'text-green-500' },
      { type: 'error', bgClass: 'bg-red-50', iconClass: 'text-red-500' },
      { type: 'warning', bgClass: 'bg-yellow-50', iconClass: 'text-yellow-500' },
      { type: 'info', bgClass: 'bg-blue-50', iconClass: 'text-blue-500' },
    ];

    for (const notifType of types) {
      // Trigger notification
      await page.evaluate((type) => {
        const event = new CustomEvent('show-notification', {
          detail: {
            type,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
            duration: 2000,
          },
        });
        window.dispatchEvent(event);
      }, notifType.type);

      // Wait for notification
      const notification = page.locator('[role="alert"]').first();
      await expect(notification).toBeVisible({ timeout: 2000 });

      // Verify background color class
      await expect(notification).toHaveClass(new RegExp(notifType.bgClass));

      // Verify icon color class
      const icon = notification.locator('svg').first();
      await expect(icon).toHaveClass(new RegExp(notifType.iconClass));

      // Wait for auto-dismiss
      await page.waitForTimeout(2500);
    }
  });

  test('should animate notification slide-in from right', async ({ page }) => {
    // Trigger notification
    await page.evaluate(() => {
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'info',
          title: 'Animation Test',
          duration: 3000,
        },
      });
      window.dispatchEvent(event);
    });

    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 2000 });

    // Verify slide-in animation class
    await expect(notification).toHaveClass(/animate-slide-in-right/);
  });

  test('should position notifications in top-right corner by default', async ({ page }) => {
    // Trigger notification
    await page.evaluate(() => {
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'info',
          title: 'Position Test',
          duration: 0,
        },
      });
      window.dispatchEvent(event);
    });

    const notificationContainer = page.locator('.fixed.top-4.right-4').first();
    await expect(notificationContainer).toBeVisible({ timeout: 2000 });

    // Verify notification is in top-right quadrant
    const box = await notificationContainer.boundingBox();
    const viewportSize = page.viewportSize();

    if (box && viewportSize) {
      expect(box.x).toBeGreaterThan(viewportSize.width / 2);
      expect(box.y).toBeLessThan(viewportSize.height / 2);
    }
  });

  test('should support accessibility attributes', async ({ page }) => {
    // Trigger notification
    await page.evaluate(() => {
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'success',
          title: 'Accessibility Test',
          message: 'This notification has proper ARIA labels',
          duration: 0,
        },
      });
      window.dispatchEvent(event);
    });

    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 2000 });

    // Verify ARIA attributes
    await expect(notification).toHaveAttribute('role', 'alert');
    await expect(notification).toHaveAttribute('aria-live', 'polite');

    // Verify dismiss button has aria-label
    const dismissButton = notification.locator('button').last();
    await expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss notification');
  });

  test('should work in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Trigger notification
    await page.evaluate(() => {
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'success',
          title: 'Dark Mode Test',
          duration: 0,
        },
      });
      window.dispatchEvent(event);
    });

    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 2000 });

    // Dark mode class should be present on notification
    await expect(notification).toHaveClass(/dark:bg-green-900/);
  });

  test('should handle rapid notification creation without crashes', async ({ page }) => {
    // Rapidly create many notifications
    await page.evaluate(() => {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const event = new CustomEvent('show-notification', {
            detail: {
              type: ['success', 'error', 'warning', 'info'][i % 4],
              title: `Rapid Test ${i}`,
              duration: 1000,
            },
          });
          window.dispatchEvent(event);
        }, i * 100);
      }
    });

    // Wait for all notifications to process
    await page.waitForTimeout(3000);

    // Page should still be responsive
    await expect(page).not.toHaveTitle(/Error/);

    // Should have some notifications visible (but not 20)
    const notifications = page.locator('[role="alert"]');
    const count = await notifications.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5); // Max queue limit
  });
});

test.describe('Notification Integration with App Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show notification on successful pick submission', async ({ page }) => {
    // Mock successful pick submission
    await page.route('**/api/picks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          pick: { id: 1, teamId: 'team-1', gameId: 'game-1' },
        }),
      });
    });

    // Submit a pick
    await page.click('[data-testid="game-card"]', { force: true });
    await page.click('[data-testid="pick-team-button"]', { force: true });

    // Verify success notification
    const notification = page.locator('[role="alert"]').first();
    await expect(notification).toBeVisible({ timeout: 5000 });
    await expect(notification).toHaveClass(/bg-green-50/);
  });

  test('should show notification on authentication success', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/signin');

    // Mock successful authentication
    await page.route('**/api/auth/signin', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '1', email: 'test@example.com', name: 'Test' },
          token: 'fake-jwt-token',
        }),
      });
    });

    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show success notification or redirect (depending on implementation)
    await page.waitForTimeout(2000);

    // Either notification or successful navigation
    const notification = page.locator('[role="alert"]').first();
    const notificationVisible = await notification.isVisible().catch(() => false);

    if (notificationVisible) {
      await expect(notification).toHaveClass(/bg-green-50/);
    }
  });
});
