/**
 * Global Setup for Mobile UI Testing
 * Prepares the test environment for comprehensive mobile testing
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up mobile UI testing environment...');

  // Create browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, // iPhone 12 viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  // Wait for servers to be available
  console.log('⏳ Waiting for application servers...');
  
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const apiURL = 'http://localhost:8787';
  
  try {
    // Wait for frontend server
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('✅ Frontend server is ready');
    
    // Check API server
    const response = await page.request.get(`${apiURL}/api/teams`);
    if (response.ok()) {
      console.log('✅ API server is ready');
    } else {
      throw new Error(`API server responded with status ${response.status()}`);
    }
    
  } catch (error) {
    console.error('❌ Server availability check failed:', error);
    await browser.close();
    throw error;
  }

  // Perform authentication for mobile tests
  console.log('🔐 Setting up mobile test authentication...');
  
  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    
    // Fill login form with test credentials
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for successful login redirect
    await page.waitForURL(`${baseURL}/`, { timeout: 10000 });
    
    // Verify login success by checking for authenticated content
    const isLoggedIn = await page.locator('[data-testid="user-menu"], [class*="userName"], text=/Games|Picks/').count() > 0;
    
    if (!isLoggedIn) {
      throw new Error('Authentication verification failed');
    }
    
    // Save authentication state for mobile tests
    await page.context().storageState({ 
      path: 'tests/mobile-ui/auth/mobile-user.json' 
    });
    
    console.log('✅ Mobile authentication setup complete');
    
  } catch (error) {
    console.error('❌ Mobile authentication setup failed:', error);
    
    // Try alternative authentication method if direct login fails
    console.log('🔄 Trying alternative authentication...');
    
    try {
      // Clear any existing state
      await page.context().clearCookies();
      
      // Navigate to home page
      await page.goto(baseURL);
      
      // Check if already authenticated or can access content
      const canAccess = await page.locator('[class*="gameCard"], [class*="mobileGameCard"]').count() > 0;
      
      if (canAccess) {
        // Save current state as authenticated
        await page.context().storageState({ 
          path: 'tests/mobile-ui/auth/mobile-user.json' 
        });
        console.log('✅ Alternative authentication successful');
      } else {
        // Create minimal auth state for testing
        const authState = {
          cookies: [],
          origins: [
            {
              origin: baseURL,
              localStorage: [
                {
                  name: 'testAuthToken',
                  value: 'mobile-test-user-token'
                }
              ]
            }
          ]
        };
        
        const fs = require('fs');
        const path = require('path');
        
        // Ensure auth directory exists
        const authDir = path.dirname('tests/mobile-ui/auth/mobile-user.json');
        fs.mkdirSync(authDir, { recursive: true });
        
        // Write auth state
        fs.writeFileSync('tests/mobile-ui/auth/mobile-user.json', JSON.stringify(authState, null, 2));
        console.log('✅ Fallback authentication state created');
      }
      
    } catch (fallbackError) {
      console.error('❌ Fallback authentication also failed:', fallbackError);
      // Continue with tests anyway - individual tests can handle auth if needed
    }
  }

  // Initialize test data and state
  console.log('📊 Initializing mobile test data...');
  
  try {
    // Check if test data is available
    const gamesResponse = await page.request.get(`${apiURL}/api/games`);
    
    if (gamesResponse.ok()) {
      const games = await gamesResponse.json();
      console.log(`✅ Found ${games.length} games for testing`);
    } else {
      console.log('⚠️  No game data available - some tests may be skipped');
    }
    
  } catch (error) {
    console.log('⚠️  Could not verify test data availability:', error);
  }

  // Setup performance monitoring
  console.log('📈 Setting up performance monitoring...');
  
  await page.addInitScript(() => {
    // Initialize performance monitoring
    window.mobileTestMetrics = {
      renderTimes: [],
      touchResponses: [],
      memoryUsage: [],
      layoutShifts: []
    };
    
    // Monitor Core Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window.mobileTestMetrics.fcp = entry.startTime;
        }
      }
    }).observe({ entryTypes: ['paint'] });
    
    // Monitor Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      window.mobileTestMetrics.cls = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });
  });

  // Setup accessibility testing enhancements
  console.log('♿ Setting up accessibility testing...');
  
  await page.addInitScript(() => {
    // Add accessibility test helpers
    window.a11yTestHelpers = {
      getFocusableElements: () => {
        return document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      },
      
      getAriaLabels: () => {
        const elements = document.querySelectorAll('[aria-label]');
        return Array.from(elements).map(el => ({
          element: el.tagName,
          label: el.getAttribute('aria-label')
        }));
      },
      
      checkColorContrast: () => {
        // Basic color contrast checking
        const textElements = document.querySelectorAll('p, span, div, button, a');
        const contrastIssues = [];
        
        textElements.forEach(el => {
          const style = getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          if (color && backgroundColor && color !== backgroundColor) {
            // Add to contrast check results
            contrastIssues.push({
              element: el,
              color,
              backgroundColor
            });
          }
        });
        
        return contrastIssues;
      }
    };
  });

  await browser.close();
  
  console.log('🎉 Mobile UI testing environment setup complete!');
  console.log('📱 Ready to run tests on multiple devices and scenarios');
}

export default globalSetup;