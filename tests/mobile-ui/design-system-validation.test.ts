/**
 * Design System Validation Test Suite
 * Validates the mobile design system constraints and components
 * 
 * Critical Focus Areas:
 * - Button max-width constraints (200px default)
 * - Touch target minimums (44px for accessibility)
 * - Visual hierarchy and spacing system (8px grid)
 * - Color system and dark mode compatibility
 * - Typography hierarchy validation
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Design System Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Button Constraints Validation', () => {
    
    test('should enforce maximum button width constraints on mobile viewports', async ({ page }) => {
      // Test different mobile viewport sizes
      const viewports = [
        { name: 'iPhone SE', width: 375, height: 667, expectedMaxWidth: 200 },
        { name: 'iPhone 12', width: 390, height: 844, expectedMaxWidth: 200 },
        { name: 'iPhone 14 Pro Max', width: 430, height: 932, expectedMaxWidth: 220 },
        { name: 'Galaxy S21', width: 384, height: 854, expectedMaxWidth: 200 },
        { name: 'Small Mobile', width: 360, height: 640, expectedMaxWidth: 160 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Wait for CSS to apply
        await page.waitForTimeout(500);
        
        // Check all buttons in the mobile component library
        const buttons = await page.locator('button[class*="mobileButton"]').all();
        
        for (let i = 0; i < buttons.length; i++) {
          const button = buttons[i];
          const boundingBox = await button.boundingBox();
          
          if (boundingBox) {
            expect(boundingBox.width, 
              `Button ${i} width ${boundingBox.width}px exceeds maximum ${viewport.expectedMaxWidth}px on ${viewport.name}`
            ).toBeLessThanOrEqual(viewport.expectedMaxWidth);
          }
        }
        
        // Specifically test team selection buttons (most critical)
        const teamButtons = await page.locator('button[class*="teamButton"]').all();
        
        for (let i = 0; i < teamButtons.length; i++) {
          const teamButton = teamButtons[i];
          const boundingBox = await teamButton.boundingBox();
          
          if (boundingBox) {
            // Team buttons should be flexible but not exceed viewport constraints
            expect(boundingBox.width, 
              `Team button ${i} width should be reasonable on ${viewport.name}`
            ).toBeLessThanOrEqual(viewport.width * 0.45); // Max 45% of viewport width
          }
        }
      }
    });

    test('should respect fullWidth override when explicitly set', async ({ page }) => {
      // Create a test button with fullWidth class
      await page.evaluate(() => {
        const button = document.createElement('button');
        button.className = 'mobileButton fullWidth';
        button.textContent = 'Full Width Test';
        document.body.appendChild(button);
        button.id = 'full-width-test';
      });

      const fullWidthButton = page.locator('#full-width-test');
      const buttonBox = await fullWidthButton.boundingBox();
      const viewportSize = page.viewportSize();
      
      if (buttonBox && viewportSize) {
        expect(buttonBox.width).toBeGreaterThan(viewportSize.width * 0.9); // Should be close to full width
      }
    });

    test('should validate button size variants', async ({ page }) => {
      // Test small, medium, large button constraints
      const sizeVariants = [
        { class: 'button-sm', expectedMaxWidth: 150, expectedMinHeight: 36 },
        { class: 'button-md', expectedMaxWidth: 200, expectedMinHeight: 44 },
        { class: 'button-lg', expectedMaxWidth: 250, expectedMinHeight: 52 }
      ];

      for (const variant of sizeVariants) {
        await page.evaluate((className) => {
          const button = document.createElement('button');
          button.className = `mobileButton ${className}`;
          button.textContent = `${className} Button`;
          document.body.appendChild(button);
          button.id = `test-${className}`;
        }, variant.class);

        const testButton = page.locator(`#test-${variant.class}`);
        const boundingBox = await testButton.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.width, `${variant.class} width constraint`).toBeLessThanOrEqual(variant.expectedMaxWidth);
          expect(boundingBox.height, `${variant.class} height constraint`).toBeGreaterThanOrEqual(variant.expectedMinHeight);
        }
      }
    });
  });

  test.describe('Touch Target Validation', () => {
    
    test('should enforce minimum 44px touch targets for accessibility', async ({ page }) => {
      // Test all interactive elements for WCAG AA touch target compliance
      const interactiveSelectors = [
        'button[class*="mobileButton"]',
        'button[class*="teamButton"]', 
        'button[class*="weekButton"]',
        'button[class*="navButton"]'
      ];

      for (const selector of interactiveSelectors) {
        const elements = await page.locator(selector).all();
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const boundingBox = await element.boundingBox();
          
          if (boundingBox) {
            expect(boundingBox.width, `${selector}[${i}] width should meet 44px minimum`).toBeGreaterThanOrEqual(44);
            expect(boundingBox.height, `${selector}[${i}] height should meet 44px minimum`).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should maintain touch targets on small screens', async ({ page }) => {
      // Test on very small screens (iPhone SE and below)
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForTimeout(500);
      
      const touchElements = await page.locator('button[class*="mobile"]').all();
      
      for (const element of touchElements) {
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Visual Hierarchy & Spacing Validation', () => {
    
    test('should follow 8px grid spacing system', async ({ page }) => {
      // Check CSS custom properties for spacing consistency
      const spacingValues = await page.evaluate(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
          xs: computedStyle.getPropertyValue('--mobile-spacing-xs'),
          sm: computedStyle.getPropertyValue('--mobile-spacing-sm'), 
          md: computedStyle.getPropertyValue('--mobile-spacing-md'),
          lg: computedStyle.getPropertyValue('--mobile-spacing-lg'),
          xl: computedStyle.getPropertyValue('--mobile-spacing-xl')
        };
      });

      // Validate 8px grid system
      expect(spacingValues.xs.trim()).toBe('4px');   // 0.5 * 8px
      expect(spacingValues.sm.trim()).toBe('8px');   // 1 * 8px  
      expect(spacingValues.md.trim()).toBe('16px');  // 2 * 8px
      expect(spacingValues.lg.trim()).toBe('24px');  // 3 * 8px
      expect(spacingValues.xl.trim()).toBe('32px');  // 4 * 8px
    });

    test('should validate component spacing consistency', async ({ page }) => {
      // Check actual rendered spacing between components
      const gameCards = await page.locator('[class*="mobileGameCard"]').all();
      
      if (gameCards.length >= 2) {
        const firstCard = await gameCards[0].boundingBox();
        const secondCard = await gameCards[1].boundingBox();
        
        if (firstCard && secondCard) {
          const gap = secondCard.y - (firstCard.y + firstCard.height);
          // Should be a multiple of 8px
          expect(gap % 8).toBe(0);
        }
      }
    });
  });

  test.describe('Color System Validation', () => {
    
    test('should validate CSS custom properties for color system', async ({ page }) => {
      const colorProperties = await page.evaluate(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
          primary: computedStyle.getPropertyValue('--mobile-primary'),
          primaryHover: computedStyle.getPropertyValue('--mobile-primary-hover'),
          primaryActive: computedStyle.getPropertyValue('--mobile-primary-active'),
          bgPrimary: computedStyle.getPropertyValue('--mobile-bg-primary'),
          bgSecondary: computedStyle.getPropertyValue('--mobile-bg-secondary'),
          textPrimary: computedStyle.getPropertyValue('--mobile-text-primary'),
          border: computedStyle.getPropertyValue('--mobile-border')
        };
      });

      // Validate color properties are defined
      expect(colorProperties.primary.trim()).toBeTruthy();
      expect(colorProperties.primaryHover.trim()).toBeTruthy();
      expect(colorProperties.bgPrimary.trim()).toBeTruthy();
      expect(colorProperties.textPrimary.trim()).toBeTruthy();
    });

    test('should support dark mode color transitions', async ({ page }) => {
      // Force dark mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(300);
      
      const darkModeColors = await page.evaluate(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
          bgPrimary: computedStyle.getPropertyValue('--mobile-bg-primary'),
          textPrimary: computedStyle.getPropertyValue('--mobile-text-primary')
        };
      });
      
      // Validate dark mode variables are applied
      expect(darkModeColors.bgPrimary.trim()).not.toBe('#ffffff');
      expect(darkModeColors.textPrimary.trim()).not.toBe('#111827');
      
      // Test light mode
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForTimeout(300);
      
      const lightModeColors = await page.evaluate(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
          bgPrimary: computedStyle.getPropertyValue('--mobile-bg-primary'),
          textPrimary: computedStyle.getPropertyValue('--mobile-text-primary')
        };
      });
      
      // Colors should be different between modes
      expect(lightModeColors.bgPrimary).not.toBe(darkModeColors.bgPrimary);
      expect(lightModeColors.textPrimary).not.toBe(darkModeColors.textPrimary);
    });
  });

  test.describe('Typography Hierarchy Validation', () => {
    
    test('should maintain proper font sizes across viewports', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 }, // iPhone SE
        { width: 390, height: 844 }, // iPhone 12
        { width: 430, height: 932 }  // iPhone 14 Pro Max
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);
        
        // Check button font size (should be 16px to prevent iOS zoom)
        const buttonFontSize = await page.evaluate(() => {
          const button = document.querySelector('button[class*="mobileButton"]');
          return button ? getComputedStyle(button).fontSize : null;
        });
        
        expect(buttonFontSize).toBe('16px'); // Critical for iOS
        
        // Check team abbreviation font size
        const teamAbbrFontSize = await page.evaluate(() => {
          const abbr = document.querySelector('[class*="teamAbbr"]');
          return abbr ? getComputedStyle(abbr).fontSize : null;
        });
        
        if (teamAbbrFontSize) {
          expect(parseInt(teamAbbrFontSize)).toBeGreaterThanOrEqual(14);
        }
      }
    });
  });

  test.describe('Component State Validation', () => {
    
    test('should validate disabled state styling', async ({ page }) => {
      // Create disabled test elements
      await page.evaluate(() => {
        const button = document.createElement('button');
        button.className = 'mobileButton disabled';
        button.disabled = true;
        button.textContent = 'Disabled Button';
        document.body.appendChild(button);
        button.id = 'disabled-test';
      });

      const disabledButton = page.locator('#disabled-test');
      
      // Check opacity is reduced
      const opacity = await disabledButton.evaluate(el => getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeLessThan(1);
      
      // Check cursor is not-allowed
      const cursor = await disabledButton.evaluate(el => getComputedStyle(el).cursor);
      expect(cursor).toBe('not-allowed');
    });

    test('should validate loading state behavior', async ({ page }) => {
      // Create loading test element
      await page.evaluate(() => {
        const button = document.createElement('button');
        button.className = 'mobileButton loading';
        button.innerHTML = '<span class="spinner"></span><span class="hiddenText">Loading...</span>';
        document.body.appendChild(button);
        button.id = 'loading-test';
      });

      const loadingButton = page.locator('#loading-test');
      
      // Check spinner is visible
      const spinner = loadingButton.locator('.spinner');
      await expect(spinner).toBeVisible();
      
      // Check text opacity is reduced
      const hiddenText = loadingButton.locator('.hiddenText');
      const opacity = await hiddenText.evaluate(el => getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeLessThan(1);
    });

    test('should validate focus states for accessibility', async ({ page }) => {
      const button = page.locator('button[class*="mobileButton"]').first();
      
      // Focus the button
      await button.focus();
      
      // Check focus-visible outline
      const outlineWidth = await button.evaluate(el => getComputedStyle(el).outlineWidth);
      const outlineColor = await button.evaluate(el => getComputedStyle(el).outlineColor);
      
      // Should have visible focus indicator
      expect(outlineWidth).not.toBe('0px');
      expect(outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    });
  });

  test.describe('Responsive Design Validation', () => {
    
    test('should adapt button constraints across breakpoints', async ({ page }) => {
      const breakpoints = [
        { width: 320, height: 568, name: 'Very Small Mobile', expectedMaxWidth: 160 },
        { width: 375, height: 667, name: 'Small Mobile', expectedMaxWidth: 200 },
        { width: 430, height: 932, name: 'Large Mobile', expectedMaxWidth: 220 },
        { width: 768, height: 1024, name: 'Tablet', expectedMaxWidth: 250 }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.waitForTimeout(500);
        
        const maxWidthValue = await page.evaluate(() => {
          const root = document.documentElement;
          return getComputedStyle(root).getPropertyValue('--mobile-button-max-width');
        });
        
        expect(parseInt(maxWidthValue)).toBe(breakpoint.expectedMaxWidth);
      }
    });

    test('should hide/show elements appropriately on small screens', async ({ page }) => {
      // Test very small screen behavior
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForTimeout(500);
      
      // Team names should be hidden on very small screens
      const teamNames = await page.locator('[class*="teamName"]').all();
      
      for (const teamName of teamNames) {
        const display = await teamName.evaluate(el => getComputedStyle(el).display);
        expect(display).toBe('none');
      }
      
      // Test normal screen - team names should be visible
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const teamNamesNormal = await page.locator('[class*="teamName"]').first();
      if (await teamNamesNormal.count() > 0) {
        const display = await teamNamesNormal.evaluate(el => getComputedStyle(el).display);
        expect(display).not.toBe('none');
      }
    });
  });
});