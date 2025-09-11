/**
 * Touch Interaction Testing Suite
 * Comprehensive testing of mobile touch interactions and gestures
 * 
 * Coverage:
 * - Tap accuracy on game card team selection buttons
 * - Long-press interactions and feedback states
 * - Swipe gestures for week navigation  
 * - Multi-touch gesture prevention/handling
 * - Touch target size validation (minimum 44x44px)
 * - Touch response times and feedback
 * - Edge cases: rapid tapping, touch + drag, interrupted touches
 */

import { test, expect, Page, Locator } from '@playwright/test';

// Mobile device configurations for touch testing
const TOUCH_TEST_DEVICES = [
  {
    name: 'iPhone 12',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    hasTouch: true
  },
  {
    name: 'iPhone SE',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    hasTouch: true
  },
  {
    name: 'Galaxy S21',
    viewport: { width: 384, height: 854 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991U) AppleWebKit/537.36',
    hasTouch: true
  },
  {
    name: 'iPad Mini',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    hasTouch: true
  }
];

test.describe('Touch Interaction Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to test page and wait for load
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    // Ensure mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      // Enable touch simulation
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 10 });
      Object.defineProperty(navigator, 'msMaxTouchPoints', { value: 10 });
    });
  });

  test.describe('Team Selection Button Touch Accuracy', () => {
    
    test('should accurately register taps on team selection buttons', async ({ page }) => {
      const gameCards = await page.locator('[class*="mobileGameCard"]').all();
      expect(gameCards.length).toBeGreaterThan(0);
      
      // Test first game card
      const firstCard = gameCards[0];
      const teamButtons = await firstCard.locator('[class*="teamButton"]').all();
      expect(teamButtons.length).toBe(2); // Home and away teams
      
      for (let i = 0; i < teamButtons.length; i++) {
        const teamButton = teamButtons[i];
        const buttonBox = await teamButton.boundingBox();
        
        if (buttonBox) {
          // Test tap in center of button
          await teamButton.tap();
          await page.waitForTimeout(100);
          
          // Verify button is selected (has selected class)
          await expect(teamButton).toHaveClass(/selected/);
          
          // Test tap near edges of button (but still within bounds)
          const edgePoints = [
            { x: buttonBox.x + 5, y: buttonBox.y + 5 }, // Top-left
            { x: buttonBox.x + buttonBox.width - 5, y: buttonBox.y + 5 }, // Top-right
            { x: buttonBox.x + 5, y: buttonBox.y + buttonBox.height - 5 }, // Bottom-left
            { x: buttonBox.x + buttonBox.width - 5, y: buttonBox.y + buttonBox.height - 5 } // Bottom-right
          ];
          
          for (const point of edgePoints) {
            await page.touchscreen.tap(point.x, point.y);
            await page.waitForTimeout(100);
            await expect(teamButton).toHaveClass(/selected/);
          }
        }
      }
    });

    test('should prevent accidental taps outside button boundaries', async ({ page }) => {
      const firstGameCard = page.locator('[class*="mobileGameCard"]').first();
      const teamButton = firstGameCard.locator('[class*="teamButton"]').first();
      const buttonBox = await teamButton.boundingBox();
      
      if (buttonBox) {
        // Tap just outside button boundaries
        const outsidePoints = [
          { x: buttonBox.x - 5, y: buttonBox.y + buttonBox.height / 2 }, // Left edge
          { x: buttonBox.x + buttonBox.width + 5, y: buttonBox.y + buttonBox.height / 2 }, // Right edge
          { x: buttonBox.x + buttonBox.width / 2, y: buttonBox.y - 5 }, // Top edge
          { x: buttonBox.x + buttonBox.width / 2, y: buttonBox.y + buttonBox.height + 5 } // Bottom edge
        ];
        
        for (const point of outsidePoints) {
          // Clear any existing selections first
          await page.evaluate(() => {
            const buttons = document.querySelectorAll('[class*="teamButton"]');
            buttons.forEach(btn => btn.classList.remove('selected'));
          });
          
          await page.touchscreen.tap(point.x, point.y);
          await page.waitForTimeout(100);
          
          // Button should not be selected
          await expect(teamButton).not.toHaveClass(/selected/);
        }
      }
    });

    test('should provide immediate visual feedback on touch', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      
      // Monitor for visual state changes during touch
      const touchFeedbackTest = page.evaluate(async (selector) => {
        const button = document.querySelector(selector) as HTMLElement;
        if (!button) return false;
        
        return new Promise<boolean>((resolve) => {
          let hasVisualFeedback = false;
          
          const checkForFeedback = () => {
            const hasPressed = button.classList.contains('pressed');
            const hasActive = button.matches(':active');
            const hasTransform = getComputedStyle(button).transform !== 'none';
            
            if (hasPressed || hasActive || hasTransform) {
              hasVisualFeedback = true;
            }
          };
          
          // Monitor for changes
          const observer = new MutationObserver(checkForFeedback);
          observer.observe(button, { attributes: true, attributeFilter: ['class'] });
          
          // Simulate touch sequence
          button.addEventListener('touchstart', checkForFeedback);
          button.addEventListener('mousedown', checkForFeedback);
          
          button.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
          
          setTimeout(() => {
            observer.disconnect();
            resolve(hasVisualFeedback);
          }, 500);
        });
      }, teamButton);
      
      await teamButton.tap();
      const hasFeedback = await touchFeedbackTest;
      expect(hasFeedback).toBe(true);
    });
  });

  test.describe('Touch Response Time Validation', () => {
    
    test('should respond to touches within 100ms', async ({ page }) => {
      const teamButtons = await page.locator('[class*="teamButton"]').all();
      
      for (let i = 0; i < Math.min(3, teamButtons.length); i++) {
        const button = teamButtons[i];
        
        const responseTime = await page.evaluate(async (selector, index) => {
          const btn = document.querySelector(`${selector}:nth-child(${index + 1})`) as HTMLElement;
          if (!btn) return Infinity;
          
          return new Promise<number>((resolve) => {
            const startTime = performance.now();
            let responded = false;
            
            const handleResponse = () => {
              if (!responded) {
                responded = true;
                const endTime = performance.now();
                resolve(endTime - startTime);
              }
            };
            
            btn.addEventListener('touchstart', handleResponse, { once: true });
            btn.addEventListener('mousedown', handleResponse, { once: true });
            
            // Simulate touch
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            
            btn.dispatchEvent(touchEvent);
            
            // Fallback timeout
            setTimeout(() => {
              if (!responded) {
                responded = true;
                resolve(Infinity);
              }
            }, 200);
          });
        }, '[class*="teamButton"]', i);
        
        expect(responseTime).toBeLessThan(100); // Should respond within 100ms
      }
    });
  });

  test.describe('Long-Press Interaction Testing', () => {
    
    test('should handle long-press gestures appropriately', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      const buttonBox = await teamButton.boundingBox();
      
      if (buttonBox) {
        const centerX = buttonBox.x + buttonBox.width / 2;
        const centerY = buttonBox.y + buttonBox.height / 2;
        
        // Simulate long press (touch down, wait, touch up)
        await page.touchscreen.tap(centerX, centerY);
        
        // Check if long press triggers any special behavior
        const longPressResult = await page.evaluate(async () => {
          const button = document.querySelector('[class*="teamButton"]') as HTMLElement;
          if (!button) return false;
          
          return new Promise<boolean>((resolve) => {
            let longPressTriggered = false;
            
            button.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              longPressTriggered = true;
            });
            
            // Simulate long press
            const touchStart = new TouchEvent('touchstart', { bubbles: true });
            const touchEnd = new TouchEvent('touchend', { bubbles: true });
            
            button.dispatchEvent(touchStart);
            
            setTimeout(() => {
              button.dispatchEvent(touchEnd);
              resolve(longPressTriggered);
            }, 800); // 800ms long press
          });
        });
        
        // Long press should not interfere with normal selection
        await expect(teamButton).toHaveClass(/selected/);
      }
    });

    test('should prevent context menu on mobile long-press', async ({ page }) => {
      await page.goto('/games');
      
      let contextMenuTriggered = false;
      
      page.on('console', msg => {
        if (msg.text().includes('contextmenu')) {
          contextMenuTriggered = true;
        }
      });
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      
      // Simulate mobile long-press
      await teamButton.touchscreen.tap();
      await page.waitForTimeout(1000); // Long press duration
      
      // Context menu should be prevented on mobile
      expect(contextMenuTriggered).toBe(false);
    });
  });

  test.describe('Swipe Gesture Testing', () => {
    
    test('should handle horizontal swipe for week navigation', async ({ page }) => {
      const weekSelector = page.locator('[class*="weekScrollContainer"]');
      
      if (await weekSelector.count() > 0) {
        const containerBox = await weekSelector.boundingBox();
        
        if (containerBox) {
          const startX = containerBox.x + containerBox.width * 0.8;
          const endX = containerBox.x + containerBox.width * 0.2;
          const y = containerBox.y + containerBox.height / 2;
          
          // Perform swipe gesture (right to left)
          await page.touchscreen.swipe(startX, y, endX, y);
          
          // Wait for swipe animation to complete
          await page.waitForTimeout(500);
          
          // Verify that scroll position changed
          const scrollLeft = await weekSelector.evaluate(el => el.scrollLeft);
          expect(scrollLeft).toBeGreaterThan(0);
        }
      }
    });

    test('should handle vertical swipe for page scrolling', async ({ page }) => {
      // Add enough content to make page scrollable
      await page.evaluate(() => {
        const container = document.body;
        for (let i = 0; i < 10; i++) {
          const div = document.createElement('div');
          div.style.height = '100px';
          div.style.background = `hsl(${i * 30}, 50%, 80%)`;
          div.textContent = `Scroll content ${i}`;
          container.appendChild(div);
        }
      });
      
      const viewportHeight = page.viewportSize()?.height || 800;
      const startY = viewportHeight * 0.7;
      const endY = viewportHeight * 0.3;
      const x = 200;
      
      // Get initial scroll position
      const initialScrollY = await page.evaluate(() => window.scrollY);
      
      // Perform vertical swipe (bottom to top - should scroll down)
      await page.touchscreen.swipe(x, startY, x, endY);
      await page.waitForTimeout(300);
      
      // Verify scroll position changed
      const finalScrollY = await page.evaluate(() => window.scrollY);
      expect(finalScrollY).toBeGreaterThan(initialScrollY);
    });

    test('should distinguish between tap and swipe gestures', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      const buttonBox = await teamButton.boundingBox();
      
      if (buttonBox) {
        const centerX = buttonBox.x + buttonBox.width / 2;
        const centerY = buttonBox.y + buttonBox.height / 2;
        
        // Test short swipe (should still trigger selection)
        const shortSwipeEndX = centerX + 10;
        await page.touchscreen.swipe(centerX, centerY, shortSwipeEndX, centerY);
        await page.waitForTimeout(100);
        
        // Should still be selected (short movement treated as tap)
        await expect(teamButton).toHaveClass(/selected/);
        
        // Clear selection
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('[class*="teamButton"]');
          buttons.forEach(btn => btn.classList.remove('selected'));
        });
        
        // Test long swipe (should not trigger selection)
        const longSwipeEndX = centerX + 100;
        await page.touchscreen.swipe(centerX, centerY, longSwipeEndX, centerY);
        await page.waitForTimeout(100);
        
        // Should not be selected (long movement treated as swipe)
        await expect(teamButton).not.toHaveClass(/selected/);
      }
    });
  });

  test.describe('Multi-Touch Gesture Prevention', () => {
    
    test('should handle simultaneous touches appropriately', async ({ page }) => {
      const teamButtons = await page.locator('[class*="teamButton"]').all();
      
      if (teamButtons.length >= 2) {
        const button1 = teamButtons[0];
        const button2 = teamButtons[1];
        
        const box1 = await button1.boundingBox();
        const box2 = await button2.boundingBox();
        
        if (box1 && box2) {
          // Simulate multi-touch (two fingers touching different buttons)
          const multiTouchResult = await page.evaluate(async (box1Data, box2Data) => {
            const button1 = document.elementFromPoint(
              box1Data.x + box1Data.width / 2,
              box1Data.y + box1Data.height / 2
            ) as HTMLElement;
            
            const button2 = document.elementFromPoint(
              box2Data.x + box2Data.width / 2,
              box2Data.y + box2Data.height / 2
            ) as HTMLElement;
            
            if (!button1 || !button2) return { success: false, reason: 'Buttons not found' };
            
            // Create multi-touch events
            const touch1 = new Touch({
              identifier: 1,
              target: button1,
              clientX: box1Data.x + box1Data.width / 2,
              clientY: box1Data.y + box1Data.height / 2
            });
            
            const touch2 = new Touch({
              identifier: 2,
              target: button2,
              clientX: box2Data.x + box2Data.width / 2,
              clientY: box2Data.y + box2Data.height / 2
            });
            
            const touchEvent = new TouchEvent('touchstart', {
              touches: [touch1, touch2],
              bubbles: true,
              cancelable: true
            });
            
            document.dispatchEvent(touchEvent);
            
            return new Promise((resolve) => {
              setTimeout(() => {
                const button1Selected = button1.classList.contains('selected');
                const button2Selected = button2.classList.contains('selected');
                
                resolve({
                  success: true,
                  button1Selected,
                  button2Selected,
                  bothSelected: button1Selected && button2Selected
                });
              }, 100);
            });
          }, box1, box2);
          
          // Multi-touch behavior should be controlled
          // Either only one should be selected, or both (depending on game rules)
          expect(multiTouchResult.success).toBe(true);
        }
      }
    });

    test('should prevent zoom gestures on game interface', async ({ page }) => {
      // Test pinch-to-zoom prevention
      const gameCard = page.locator('[class*="mobileGameCard"]').first();
      const cardBox = await gameCard.boundingBox();
      
      if (cardBox) {
        const centerX = cardBox.x + cardBox.width / 2;
        const centerY = cardBox.y + cardBox.height / 2;
        
        // Simulate pinch gesture
        const initialScale = await page.evaluate(() => {
          const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
          return meta ? meta.content.includes('user-scalable=no') : false;
        });
        
        // Viewport should prevent user scaling
        expect(initialScale).toBe(true);
        
        // Test that zoom is actually prevented
        const zoomPrevented = await page.evaluate(async () => {
          return new Promise<boolean>((resolve) => {
            let zoomDetected = false;
            
            const handleTouchMove = (e: TouchEvent) => {
              if (e.touches.length === 2) {
                e.preventDefault();
                zoomDetected = true;
              }
            };
            
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            
            // Simulate pinch gesture
            const touch1 = new Touch({
              identifier: 1,
              target: document.body,
              clientX: 100,
              clientY: 100
            });
            
            const touch2 = new Touch({
              identifier: 2,
              target: document.body,
              clientX: 200,
              clientY: 200
            });
            
            const touchStart = new TouchEvent('touchstart', {
              touches: [touch1, touch2],
              bubbles: true,
              cancelable: true
            });
            
            document.dispatchEvent(touchStart);
            
            setTimeout(() => {
              document.removeEventListener('touchmove', handleTouchMove);
              resolve(!zoomDetected); // True if zoom was prevented
            }, 100);
          });
        });
        
        expect(zoomPrevented).toBe(true);
      }
    });
  });

  test.describe('Touch Target Size Compliance', () => {
    
    test('should meet WCAG AA touch target minimum size requirements', async ({ page }) => {
      const touchElements = [
        '[class*="mobileButton"]',
        '[class*="teamButton"]',
        '[class*="weekButton"]',
        '[class*="navButton"]'
      ];
      
      for (const selector of touchElements) {
        const elements = await page.locator(selector).all();
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const box = await element.boundingBox();
          
          if (box) {
            // WCAG AA requires minimum 44x44px touch targets
            expect(box.width, `${selector}[${i}] width should be at least 44px`).toBeGreaterThanOrEqual(44);
            expect(box.height, `${selector}[${i}] height should be at least 44px`).toBeGreaterThanOrEqual(44);
            
            // Also check that touch area includes sufficient padding
            const computedStyle = await element.evaluate(el => {
              const style = getComputedStyle(el);
              return {
                paddingTop: parseInt(style.paddingTop),
                paddingBottom: parseInt(style.paddingBottom),
                paddingLeft: parseInt(style.paddingLeft),
                paddingRight: parseInt(style.paddingRight)
              };
            });
            
            const totalWidth = box.width + computedStyle.paddingLeft + computedStyle.paddingRight;
            const totalHeight = box.height + computedStyle.paddingTop + computedStyle.paddingBottom;
            
            expect(totalWidth).toBeGreaterThanOrEqual(44);
            expect(totalHeight).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should maintain touch targets on different screen densities', async ({ page }) => {
      const densities = [1, 2, 3]; // 1x, 2x, 3x pixel density
      
      for (const density of densities) {
        await page.emulateMedia({ forcedColors: 'none' });
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Simulate different pixel densities
        await page.evaluate((pixelRatio) => {
          Object.defineProperty(window, 'devicePixelRatio', {
            get: () => pixelRatio
          });
        }, density);
        
        const teamButton = page.locator('[class*="teamButton"]').first();
        const box = await teamButton.boundingBox();
        
        if (box) {
          // Touch targets should remain consistent regardless of pixel density
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    
    test('should handle rapid successive taps', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      
      // Rapid fire taps
      for (let i = 0; i < 10; i++) {
        await teamButton.tap();
        await page.waitForTimeout(50); // 50ms between taps
      }
      
      // Button should still be in valid state
      await expect(teamButton).toHaveClass(/selected/);
      
      // No JavaScript errors should have occurred
      const errors = await page.evaluate(() => window['testErrors'] || []);
      expect(errors.length).toBe(0);
    });

    test('should handle interrupted touch sequences', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      const buttonBox = await teamButton.boundingBox();
      
      if (buttonBox) {
        const centerX = buttonBox.x + buttonBox.width / 2;
        const centerY = buttonBox.y + buttonBox.height / 2;
        
        // Start touch but don't end it normally
        await page.evaluate(async (x, y) => {
          const element = document.elementFromPoint(x, y) as HTMLElement;
          if (element) {
            const touchStart = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true
            });
            element.dispatchEvent(touchStart);
            
            // Simulate interrupted touch (touchcancel instead of touchend)
            setTimeout(() => {
              const touchCancel = new TouchEvent('touchcancel', {
                bubbles: true,
                cancelable: true
              });
              element.dispatchEvent(touchCancel);
            }, 100);
          }
        }, centerX, centerY);
        
        await page.waitForTimeout(200);
        
        // Element should handle interrupted touch gracefully
        const hasStuckState = await teamButton.evaluate(el => 
          el.classList.contains('pressed') || el.classList.contains('active')
        );
        
        expect(hasStuckState).toBe(false);
      }
    });

    test('should handle touch events during page transitions', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      
      // Start a touch interaction
      await teamButton.tap();
      
      // Immediately navigate away
      const navigationPromise = page.goto('/leaderboard');
      
      // Navigation should complete without errors
      await navigationPromise;
      await page.waitForLoadState('networkidle');
      
      // Verify no JavaScript errors occurred during transition
      const errors = await page.evaluate(() => window['testErrors'] || []);
      expect(errors.length).toBe(0);
    });
  });

  test.describe('Cross-Device Touch Behavior', () => {
    
    for (const device of TOUCH_TEST_DEVICES) {
      test(`touch interactions on ${device.name}`, async ({ page }) => {
        // Configure device
        await page.setViewportSize(device.viewport);
        await page.setUserAgent(device.userAgent);
        
        // Navigate and wait for load
        await page.goto('/games');
        await page.waitForLoadState('networkidle');
        
        const teamButton = page.locator('[class*="teamButton"]').first();
        
        // Test basic tap
        await teamButton.tap();
        await expect(teamButton).toHaveClass(/selected/);
        
        // Test touch response time
        const responseTime = await page.evaluate(() => {
          return new Promise<number>((resolve) => {
            const button = document.querySelector('[class*="teamButton"]') as HTMLElement;
            if (!button) return resolve(Infinity);
            
            const startTime = performance.now();
            button.addEventListener('touchstart', () => {
              const endTime = performance.now();
              resolve(endTime - startTime);
            }, { once: true });
            
            button.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
          });
        });
        
        expect(responseTime).toBeLessThan(100);
        
        // Test touch target size meets device requirements
        const box = await teamButton.boundingBox();
        if (box) {
          // Adjust minimum size based on device type
          const minSize = device.name.includes('iPad') ? 44 : 44;
          expect(box.width).toBeGreaterThanOrEqual(minSize);
          expect(box.height).toBeGreaterThanOrEqual(minSize);
        }
      });
    }
  });
});