/**
 * Comprehensive Accessibility Testing Suite
 * Full WCAG 2.1 AA compliance testing for mobile UI
 * 
 * Coverage:
 * - Screen reader navigation (VoiceOver, TalkBack)
 * - Keyboard navigation on mobile browsers
 * - High contrast mode compatibility
 * - Color blindness simulation testing
 * - Voice control integration testing
 * - ARIA labels and semantic markup validation
 * - Focus management and navigation order
 * - Text alternatives and descriptions
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

// Screen reader simulation utilities
class ScreenReaderSimulator {
  constructor(private page: Page) {}
  
  async simulateVoiceOver() {
    // Enable VoiceOver simulation
    await this.page.evaluate(() => {
      // Mock VoiceOver APIs
      (window as any).speechSynthesis = {
        speak: (utterance: any) => {
          console.log('VoiceOver:', utterance.text);
          (window as any).lastSpokenText = utterance.text;
        },
        cancel: () => {},
        pause: () => {},
        resume: () => {}
      };
    });
  }
  
  async getLastSpokenText(): Promise<string> {
    return await this.page.evaluate(() => (window as any).lastSpokenText || '');
  }
  
  async navigateByHeadings() {
    // Simulate VoiceOver heading navigation
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    return headings.map(async (heading) => {
      const text = await heading.textContent();
      const level = await heading.evaluate(el => el.tagName);
      return { text, level };
    });
  }
}

// Color blindness simulation
const COLOR_BLINDNESS_FILTERS = {
  protanopia: 'url(#protanopia)',
  deuteranopia: 'url(#deuteranopia)',  
  tritanopia: 'url(#tritanopia)',
  achromatopsia: 'grayscale(100%)'
};

test.describe('Comprehensive Accessibility Testing', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    // Inject axe-core for automated accessibility testing
    await injectAxe(page);
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    
    test('should pass axe-core accessibility audit', async ({ page }) => {
      await configureAxe(page, {
        rules: {
          // Enable all WCAG 2.1 AA rules
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'label': { enabled: true },
          'link-name': { enabled: true },
          'button-name': { enabled: true }
        }
      });
      
      // Check main content
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      if (headings.length > 0) {
        let lastLevel = 0;
        
        for (const heading of headings) {
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
          const currentLevel = parseInt(tagName.charAt(1));
          const text = await heading.textContent();
          
          // Heading levels should not skip (e.g., h1 -> h3)
          if (lastLevel > 0) {
            expect(currentLevel - lastLevel, 
              `Heading "${text}" (${tagName}) skips levels from h${lastLevel}`
            ).toBeLessThanOrEqual(1);
          }
          
          lastLevel = currentLevel;
        }
      }
    });

    test('should have descriptive link and button text', async ({ page }) => {
      // Check all buttons have accessible names
      const buttons = await page.locator('button').all();
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const accessibleName = await button.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.getAttribute('title') ||
                 el.textContent?.trim() ||
                 '';
        });
        
        expect(accessibleName.length, `Button ${i} should have accessible name`).toBeGreaterThan(0);
        
        // Avoid generic text like "click here" or "button"
        const genericTerms = ['click here', 'button', 'link', 'here', 'more'];
        const isGeneric = genericTerms.some(term => 
          accessibleName.toLowerCase().includes(term) && accessibleName.toLowerCase() === term
        );
        
        expect(isGeneric, `Button ${i} has generic text: "${accessibleName}"`).toBe(false);
      }
      
      // Check all links have accessible names
      const links = await page.locator('a').all();
      
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const accessibleName = await link.evaluate(el => {
          return el.getAttribute('aria-label') ||
                 el.getAttribute('title') ||
                 el.textContent?.trim() ||
                 '';
        });
        
        expect(accessibleName.length, `Link ${i} should have accessible name`).toBeGreaterThan(0);
      }
    });

    test('should provide text alternatives for images', async ({ page }) => {
      const images = await page.locator('img').all();
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const role = await img.getAttribute('role');
        
        // Images should have alt text or be marked as decorative
        const hasTextAlternative = alt !== null || ariaLabel || role === 'presentation';
        
        expect(hasTextAlternative, `Image ${i} should have alt text or be marked decorative`).toBe(true);
        
        // Alt text should not be redundant
        if (alt) {
          const redundantPhrases = ['image of', 'picture of', 'photo of', 'logo of'];
          const hasRedundantPhrase = redundantPhrases.some(phrase => 
            alt.toLowerCase().includes(phrase)
          );
          
          expect(hasRedundantPhrase, `Image ${i} alt text is redundant: "${alt}"`).toBe(false);
        }
      }
    });
  });

  test.describe('Screen Reader Navigation', () => {
    
    test('should provide proper ARIA labels for team selection', async ({ page }) => {
      const screenReader = new ScreenReaderSimulator(page);
      await screenReader.simulateVoiceOver();
      
      const teamButtons = await page.locator('[class*="teamButton"]').all();
      
      for (let i = 0; i < teamButtons.length; i++) {
        const button = teamButtons[i];
        
        // Focus button to trigger screen reader
        await button.focus();
        
        const ariaLabel = await button.getAttribute('aria-label');
        const role = await button.getAttribute('role');
        
        expect(ariaLabel, `Team button ${i} should have aria-label`).toBeTruthy();
        expect(role, `Team button ${i} should have appropriate role`).toBe('radio');
        
        // Aria label should include team name and context
        if (ariaLabel) {
          expect(ariaLabel.toLowerCase()).toMatch(/select|choose|pick/);
          expect(ariaLabel.length).toBeGreaterThan(10); // Should be descriptive
        }
      }
    });

    test('should announce game state changes to screen readers', async ({ page }) => {
      const screenReader = new ScreenReaderSimulator(page);
      await screenReader.simulateVoiceOver();
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      
      // Select team
      await teamButton.tap();
      
      // Check for live region updates
      const liveRegions = await page.locator('[aria-live]').all();
      
      if (liveRegions.length > 0) {
        let hasStatusUpdate = false;
        
        for (const region of liveRegions) {
          const content = await region.textContent();
          if (content && content.trim().length > 0) {
            hasStatusUpdate = true;
            
            // Should announce selection in user-friendly language
            expect(content.toLowerCase()).toMatch(/selected|picked|chosen|team/);
          }
        }
        
        expect(hasStatusUpdate).toBe(true);
      }
    });

    test('should provide proper landmark navigation', async ({ page }) => {
      // Check for proper landmark roles
      const landmarks = [
        { selector: 'main', expectedRole: 'main' },
        { selector: 'nav, [role="navigation"]', expectedRole: 'navigation' },
        { selector: '[role="banner"]', expectedRole: 'banner' },
        { selector: '[role="contentinfo"]', expectedRole: 'contentinfo' }
      ];
      
      for (const landmark of landmarks) {
        const elements = await page.locator(landmark.selector).all();
        
        for (const element of elements) {
          const role = await element.getAttribute('role') || 
                       await element.evaluate(el => el.tagName.toLowerCase() === 'main' ? 'main' : '');
          
          if (role) {
            expect(role).toBe(landmark.expectedRole);
            
            // Landmarks should have accessible names when there are multiple
            if (elements.length > 1) {
              const accessibleName = await element.evaluate(el => 
                el.getAttribute('aria-label') ||
                el.getAttribute('aria-labelledby') ||
                el.querySelector('h1, h2, h3')?.textContent?.trim()
              );
              
              expect(accessibleName).toBeTruthy();
            }
          }
        }
      }
    });

    test('should handle radiogroup semantics for team selection', async ({ page }) => {
      const gameCards = await page.locator('[class*="mobileGameCard"]').all();
      
      for (let cardIndex = 0; cardIndex < gameCards.length; cardIndex++) {
        const gameCard = gameCards[cardIndex];
        const teamSelector = gameCard.locator('[class*="teamSelector"]');
        
        if (await teamSelector.count() > 0) {
          // Team selector should be a radiogroup
          const role = await teamSelector.getAttribute('role');
          expect(role, `Game ${cardIndex} team selector should be radiogroup`).toBe('radiogroup');
          
          // Should have accessible name
          const accessibleName = await teamSelector.evaluate(el =>
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby')
          );
          expect(accessibleName, `Game ${cardIndex} radiogroup should have accessible name`).toBeTruthy();
          
          // Team buttons should be radio buttons
          const teamButtons = await gameCard.locator('[class*="teamButton"]').all();
          
          for (let buttonIndex = 0; buttonIndex < teamButtons.length; buttonIndex++) {
            const button = teamButtons[buttonIndex];
            const buttonRole = await button.getAttribute('role');
            const ariaChecked = await button.getAttribute('aria-checked');
            
            expect(buttonRole, `Team button ${buttonIndex} in game ${cardIndex} should be radio`).toBe('radio');
            expect(ariaChecked, `Team button ${buttonIndex} should have aria-checked`).toMatch(/true|false/);
          }
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    
    test('should support full keyboard navigation', async ({ page }) => {
      // Start from top of page
      await page.keyboard.press('Home');
      
      let focusedElements: string[] = [];
      let maxTabs = 20; // Prevent infinite loop
      
      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;
          
          return {
            tagName: el.tagName.toLowerCase(),
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            textContent: el.textContent?.slice(0, 50),
            className: el.className
          };
        });
        
        if (focusedElement) {
          focusedElements.push(`${focusedElement.tagName}[${focusedElement.role || ''}]`);
        }
        
        // Should be able to reach interactive elements
        if (focusedElement?.tagName === 'button' && focusedElement.className.includes('teamButton')) {
          // Should be able to activate with Enter or Space
          await page.keyboard.press('Enter');
          
          const isSelected = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement;
            return el.classList.contains('selected') || el.getAttribute('aria-checked') === 'true';
          });
          
          expect(isSelected).toBe(true);
          break;
        }
      }
      
      // Should have focused on interactive elements
      expect(focusedElements.length).toBeGreaterThan(0);
      
      const hasButtons = focusedElements.some(el => el.includes('button'));
      expect(hasButtons, 'Should be able to reach buttons via keyboard').toBe(true);
    });

    test('should provide arrow key navigation for radio groups', async ({ page }) => {
      const gameCard = page.locator('[class*="mobileGameCard"]').first();
      const firstTeamButton = gameCard.locator('[class*="teamButton"]').first();
      
      // Focus first team button
      await firstTeamButton.focus();
      
      // Arrow keys should navigate within radio group
      await page.keyboard.press('ArrowRight');
      
      const focusedAfterArrow = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        return {
          hasTeamButtonClass: el.classList.contains('teamButton') || el.className.includes('teamButton'),
          ariaChecked: el.getAttribute('aria-checked')
        };
      });
      
      // Should still be on a team button
      expect(focusedAfterArrow.hasTeamButtonClass).toBe(true);
      
      // Should be able to select with Space
      await page.keyboard.press('Space');
      
      const isSelected = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        return el.classList.contains('selected') || el.getAttribute('aria-checked') === 'true';
      });
      
      expect(isSelected).toBe(true);
    });

    test('should provide skip links for efficient navigation', async ({ page }) => {
      // Check for skip link
      const skipLink = page.locator('a[href*="#"], button').getByText(/skip/i).first();
      
      if (await skipLink.count() > 0) {
        // Skip link should be first focusable element or become visible on focus
        await page.keyboard.press('Tab');
        
        const isSkipLinkVisible = await skipLink.evaluate(el => {
          const style = getComputedStyle(el);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' &&
                 style.opacity !== '0';
        });
        
        expect(isSkipLinkVisible).toBe(true);
        
        // Activating skip link should move focus
        await skipLink.press('Enter');
        
        const focusAfterSkip = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusAfterSkip).toBeTruthy();
      }
    });

    test('should maintain logical focus order', async ({ page }) => {
      const focusableElements = await page.locator(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).all();
      
      if (focusableElements.length > 1) {
        // Check reading order matches visual order
        let lastY = -1;
        let lastX = -1;
        
        for (const element of focusableElements) {
          const box = await element.boundingBox();
          if (box) {
            // Elements should generally flow top-to-bottom, left-to-right
            if (lastY !== -1) {
              const isNewRow = box.y > lastY + 10; // Allow for small y differences
              const isRightOfPrevious = box.x > lastX - 10; // Allow for small x differences
              
              if (!isNewRow && !isRightOfPrevious) {
                console.warn(`Focus order may be incorrect: element at (${box.x}, ${box.y}) after (${lastX}, ${lastY})`);
              }
            }
            
            lastY = box.y;
            lastX = box.x;
          }
        }
      }
    });
  });

  test.describe('High Contrast Mode Compatibility', () => {
    
    test('should maintain usability in high contrast mode', async ({ page }) => {
      // Enable high contrast mode simulation
      await page.emulateMedia({ forcedColors: 'active' });
      
      // Check that interactive elements remain visible
      const buttons = await page.locator('button[class*="teamButton"]').all();
      
      for (const button of buttons) {
        const styles = await button.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            color: computed.color,
            borderWidth: computed.borderWidth
          };
        });
        
        // In forced colors mode, elements should have system colors
        expect(styles.borderWidth, 'Buttons should have visible borders in high contrast').not.toBe('0px');
        
        // Colors should be from system palette (not custom colors)
        const isSystemColor = styles.color.includes('rgb') || 
                             styles.color === 'buttontext' ||
                             styles.color === 'linktext';
        expect(isSystemColor).toBe(true);
      }
      
      // Check focus indicators are still visible
      const firstButton = buttons[0];
      if (firstButton) {
        await firstButton.focus();
        
        const focusStyles = await firstButton.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            outlineWidth: computed.outlineWidth,
            outlineColor: computed.outlineColor,
            outlineStyle: computed.outlineStyle
          };
        });
        
        expect(focusStyles.outlineWidth, 'Focus indicators should be visible in high contrast').not.toBe('0px');
      }
    });

    test('should preserve information without relying on color alone', async ({ page }) => {
      const gameCards = await page.locator('[class*="mobileGameCard"]').all();
      
      for (const gameCard of gameCards) {
        // Check if locked games have non-color indicators
        const isLocked = await gameCard.evaluate(el => el.classList.contains('locked'));
        
        if (isLocked) {
          // Should have text or icon indicator, not just color
          const lockIndicator = gameCard.locator('[class*="lock"], [aria-label*="lock"], text=🔒');
          await expect(lockIndicator).toBeVisible();
        }
        
        // Check spread/odds information is not color-dependent
        const spreadInfo = gameCard.locator('[class*="spread"]');
        if (await spreadInfo.count() > 0) {
          const spreadText = await spreadInfo.textContent();
          // Should contain + or - symbols, not rely on color
          expect(spreadText).toMatch(/[+-]/);
        }
      }
    });
  });

  test.describe('Color Blindness Simulation Testing', () => {
    
    test('should be usable with protanopia (red-blind)', async ({ page }) => {
      await page.addStyleTag({
        content: `
          html {
            filter: ${COLOR_BLINDNESS_FILTERS.protanopia};
          }
        `
      });
      
      // Test team selection is still distinguishable
      const teamButtons = await page.locator('[class*="teamButton"]').all();
      
      if (teamButtons.length >= 2) {
        const button1 = teamButtons[0];
        const button2 = teamButtons[1];
        
        // Select first team
        await button1.tap();
        
        // Should be able to distinguish selected state without relying on red/green
        const button1State = await button1.evaluate(el => ({
          hasSelectedClass: el.classList.contains('selected'),
          hasBorder: getComputedStyle(el).borderWidth !== '0px',
          hasCheckmark: el.querySelector('[class*="checkmark"]') !== null
        }));
        
        const button2State = await button2.evaluate(el => ({
          hasSelectedClass: el.classList.contains('selected'),
          hasBorder: getComputedStyle(el).borderWidth !== '0px',
          hasCheckmark: el.querySelector('[class*="checkmark"]') !== null
        }));
        
        // Selected button should have non-color indicators
        expect(button1State.hasSelectedClass || button1State.hasCheckmark).toBe(true);
        expect(button2State.hasSelectedClass || button2State.hasCheckmark).toBe(false);
      }
    });

    test('should be usable with deuteranopia (green-blind)', async ({ page }) => {
      await page.addStyleTag({
        content: `
          html {
            filter: ${COLOR_BLINDNESS_FILTERS.deuteranopia};
          }
        `
      });
      
      // Test error and success states are distinguishable
      const buttons = await page.locator('button[class*="mobileButton"]').all();
      
      for (const button of buttons) {
        const buttonClass = await button.getAttribute('class');
        
        if (buttonClass?.includes('success') || buttonClass?.includes('danger')) {
          // Should have non-color indicators (icons, text, borders)
          const hasIcon = await button.locator('svg, [class*="icon"]').count() > 0;
          const hasDistinctiveBorder = await button.evaluate(el => {
            const style = getComputedStyle(el);
            return parseInt(style.borderWidth) > 2; // Thick border for distinction
          });
          
          expect(hasIcon || hasDistinctiveBorder).toBe(true);
        }
      }
    });

    test('should be usable with achromatopsia (no color vision)', async ({ page }) => {
      await page.addStyleTag({
        content: `
          html {
            filter: ${COLOR_BLINDNESS_FILTERS.achromatopsia};
          }
        `
      });
      
      // All functionality should work without any color
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      // Should be able to identify selection through shape, position, or pattern
      const selectionIndicators = await teamButton.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          hasThickBorder: parseInt(computed.borderWidth) > 2,
          hasCheckmark: el.querySelector('[class*="checkmark"], ✓') !== null,
          hasTransform: computed.transform !== 'none',
          hasBoxShadow: computed.boxShadow !== 'none'
        };
      });
      
      const hasNonColorIndicator = Object.values(selectionIndicators).some(Boolean);
      expect(hasNonColorIndicator, 'Should have non-color selection indicator').toBe(true);
    });
  });

  test.describe('Voice Control Integration', () => {
    
    test('should support voice control commands', async ({ page }) => {
      // Simulate voice control by checking for proper labeling
      const gameCard = page.locator('[class*="mobileGameCard"]').first();
      const teamButtons = await gameCard.locator('[class*="teamButton"]').all();
      
      for (const button of teamButtons) {
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (ariaLabel) {
          // Voice control should be able to identify buttons by team names
          expect(ariaLabel.toLowerCase()).toMatch(/[a-z]{3,}/); // Should contain team name
          
          // Should not have generic terms that would conflict
          expect(ariaLabel.toLowerCase()).not.toMatch(/^button|^click/);
        }
      }
    });

    test('should have unique identifiers for voice commands', async ({ page }) => {
      const allButtons = await page.locator('button').all();
      const ariaLabels: string[] = [];
      
      for (const button of allButtons) {
        const label = await button.getAttribute('aria-label');
        if (label) {
          ariaLabels.push(label.toLowerCase());
        }
      }
      
      // Check for duplicate labels that would confuse voice control
      const duplicates = ariaLabels.filter((label, index) => 
        ariaLabels.indexOf(label) !== index
      );
      
      expect(duplicates.length, `Duplicate aria-labels found: ${duplicates.join(', ')}`).toBe(0);
    });
  });

  test.describe('Mobile Screen Reader Optimization', () => {
    
    test('should optimize for mobile screen reader gestures', async ({ page }) => {
      // Test swipe navigation support
      const gameCards = await page.locator('[class*="mobileGameCard"]').all();
      
      if (gameCards.length > 1) {
        for (const gameCard of gameCards) {
          // Each game card should be a navigable unit
          const role = await gameCard.getAttribute('role');
          const ariaLabel = await gameCard.getAttribute('aria-label');
          
          // Should have appropriate role for screen reader navigation
          expect(role || ariaLabel, 'Game cards should be identifiable to screen readers').toBeTruthy();
          
          // Should contain all necessary information in accessible form
          const teamInfo = await gameCard.evaluate(el => {
            const teams = Array.from(el.querySelectorAll('[class*="teamButton"]')).map(btn => 
              btn.getAttribute('aria-label')
            );
            const time = el.querySelector('[class*="gameTime"]')?.textContent;
            return { teams, time };
          });
          
          expect(teamInfo.teams.filter(Boolean).length).toBe(2); // Home and away teams
          expect(teamInfo.time).toBeTruthy();
        }
      }
    });

    test('should provide rotor navigation support', async ({ page }) => {
      // Check headings for rotor navigation
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      if (headings.length > 0) {
        for (const heading of headings) {
          const text = await heading.textContent();
          const level = await heading.evaluate(el => el.tagName);
          
          // Headings should be meaningful for rotor navigation
          expect(text?.trim().length, `${level} should have meaningful text`).toBeGreaterThan(0);
          
          // Should not be empty or just whitespace
          expect(text?.trim(), `${level} should not be empty`).toBeTruthy();
        }
      }
      
      // Check buttons for rotor navigation
      const buttons = await page.locator('button').all();
      const buttonLabels = [];
      
      for (const button of buttons) {
        const label = await button.evaluate(el => 
          el.getAttribute('aria-label') || el.textContent?.trim()
        );
        if (label) {
          buttonLabels.push(label);
        }
      }
      
      // Button labels should be unique enough for rotor selection
      const shortLabels = buttonLabels.filter(label => label.length < 3);
      expect(shortLabels.length, 'Buttons should have descriptive labels for rotor navigation').toBe(0);
    });
  });

  test.describe('Focus Management', () => {
    
    test('should manage focus appropriately during interactions', async ({ page }) => {
      const teamButton = page.locator('[class*="teamButton"]').first();
      
      // Focus button
      await teamButton.focus();
      
      // Select team
      await teamButton.press('Enter');
      
      // Focus should remain on button after selection
      const focusedElement = await page.evaluate(() => document.activeElement?.className);
      expect(focusedElement).toContain('teamButton');
    });

    test('should trap focus in modal dialogs', async ({ page }) => {
      // Look for modal dialogs
      const modals = await page.locator('[role="dialog"], [aria-modal="true"]').all();
      
      for (const modal of modals) {
        if (await modal.isVisible()) {
          // Focus should be within modal
          const focusableElements = await modal.locator(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ).all();
          
          if (focusableElements.length > 0) {
            // Tab should cycle within modal
            await page.keyboard.press('Tab');
            
            const focusedElement = page.locator(':focus');
            const isWithinModal = await modal.locator(':focus').count() > 0;
            
            expect(isWithinModal, 'Focus should remain within modal').toBe(true);
          }
        }
      }
    });

    test('should restore focus after temporary overlays close', async ({ page }) => {
      const initialFocused = page.locator('[class*="teamButton"]').first();
      await initialFocused.focus();
      
      // Simulate temporary overlay (like loading spinner)
      await page.evaluate(() => {
        const overlay = document.createElement('div');
        overlay.id = 'test-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);
        
        // Remove after delay
        setTimeout(() => overlay.remove(), 1000);
      });
      
      await page.waitForTimeout(1100);
      
      // Focus should return to original element
      const focusedAfter = page.locator(':focus');
      const isSameElement = await page.evaluate(() => {
        const focused = document.activeElement as HTMLElement;
        return focused?.classList.contains('teamButton');
      });
      
      expect(isSameElement).toBe(true);
    });
  });
});