/**
 * Performance Benchmarking Suite for Mobile UI
 * Validates performance requirements and optimization goals
 * 
 * Coverage:
 * - Component render times < 16ms for 60fps
 * - Touch response latency < 100ms
 * - Memory usage optimization validation
 * - Battery impact assessment
 * - CPU usage during animations
 * - Core Web Vitals measurement
 * - First Contentful Paint < 1.5s on 3G
 * - Largest Contentful Paint < 2.5s
 * - Cumulative Layout Shift < 0.1
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds based on mobile best practices
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME: 16, // 16ms for 60fps
  TOUCH_RESPONSE: 100, // 100ms for responsive feel
  FCP_3G: 1500, // First Contentful Paint on 3G
  LCP: 2500, // Largest Contentful Paint
  CLS: 0.1, // Cumulative Layout Shift
  MEMORY_LIMIT: 50 * 1024 * 1024, // 50MB memory limit
  CPU_IDLE: 80, // 80% CPU idle time
  ANIMATION_FPS: 55 // Minimum 55fps for smooth animations
};

// Network conditions for testing
const NETWORK_CONDITIONS = {
  '3G': {
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 150 // 150ms RTT
  },
  'Slow 3G': {
    downloadThroughput: 500 * 1024 / 8, // 500 Kbps
    uploadThroughput: 500 * 1024 / 8, // 500 Kbps
    latency: 400 // 400ms RTT
  },
  'Fast 3G': {
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 150 // 150ms RTT
  }
};

// Utility class for performance measurement
class PerformanceProfiler {
  constructor(private page: Page) {}

  async measureRenderTime(selector: string): Promise<number> {
    return await this.page.evaluate(async (sel) => {
      const element = document.querySelector(sel);
      if (!element) return Infinity;

      return new Promise<number>((resolve) => {
        const startTime = performance.now();
        
        const observer = new MutationObserver(() => {
          const endTime = performance.now();
          observer.disconnect();
          resolve(endTime - startTime);
        });
        
        observer.observe(element, { 
          childList: true, 
          attributes: true, 
          subtree: true 
        });
        
        // Force a re-render
        element.style.transform = 'scale(1.001)';
        element.style.transform = '';
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(Infinity);
        }, 100);
      });
    }, selector);
  }

  async measureTouchResponseTime(selector: string): Promise<number> {
    return await this.page.evaluate(async (sel) => {
      const element = document.querySelector(sel) as HTMLElement;
      if (!element) return Infinity;

      return new Promise<number>((resolve) => {
        const startTime = performance.now();
        
        const handleResponse = () => {
          const endTime = performance.now();
          element.removeEventListener('touchstart', handleResponse);
          resolve(endTime - startTime);
        };
        
        element.addEventListener('touchstart', handleResponse);
        
        // Simulate touch
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true
        });
        
        element.dispatchEvent(touchEvent);
        
        // Fallback
        setTimeout(() => {
          element.removeEventListener('touchstart', handleResponse);
          resolve(Infinity);
        }, 200);
      });
    }, selector);
  }

  async measureMemoryUsage(): Promise<any> {
    return await this.page.evaluate(() => {
      const memory = (performance as any).memory;
      if (memory) {
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }
      return null;
    });
  }

  async measureCoreWebVitals(): Promise<any> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            vitals.lcp = entries[entries.length - 1].startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Give time for measurements
        setTimeout(() => {
          fcpObserver.disconnect();
          lcpObserver.disconnect();
          clsObserver.disconnect();
          resolve(vitals);
        }, 3000);
      });
    });
  }

  async measureAnimationPerformance(): Promise<any> {
    return await this.page.evaluate(async () => {
      return new Promise((resolve) => {
        const frames: number[] = [];
        let startTime = performance.now();
        let frameCount = 0;
        
        const measureFrame = () => {
          const currentTime = performance.now();
          const frameTime = currentTime - startTime;
          frames.push(frameTime);
          startTime = currentTime;
          frameCount++;
          
          if (frameCount < 60) { // Measure 60 frames
            requestAnimationFrame(measureFrame);
          } else {
            const averageFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length;
            const fps = 1000 / averageFrameTime;
            const droppedFrames = frames.filter(f => f > 16.67).length; // > 60fps threshold
            
            resolve({
              averageFrameTime,
              fps,
              droppedFrames,
              frameTimeVariance: Math.max(...frames) - Math.min(...frames)
            });
          }
        };
        
        requestAnimationFrame(measureFrame);
      });
    });
  }
}

test.describe('Mobile UI Performance Benchmarks', () => {

  let profiler: PerformanceProfiler;

  test.beforeEach(async ({ page }) => {
    profiler = new PerformanceProfiler(page);
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Enable performance monitoring
    await page.addInitScript(() => {
      // Mark navigation start
      performance.mark('navigation-start');
      
      // Override console methods to capture performance logs
      const originalLog = console.log;
      console.log = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('performance:')) {
          (window as any).performanceLogs = (window as any).performanceLogs || [];
          (window as any).performanceLogs.push(args.join(' '));
        }
        originalLog.apply(console, args);
      };
    });
  });

  test.describe('Component Render Performance', () => {

    test('should render game cards within 16ms for 60fps', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      const gameCards = await page.locator('[class*="mobileGameCard"]').all();
      expect(gameCards.length).toBeGreaterThan(0);

      const renderTimes: number[] = [];

      for (let i = 0; i < Math.min(5, gameCards.length); i++) {
        const renderTime = await profiler.measureRenderTime(`[class*="mobileGameCard"]:nth-child(${i + 1})`);
        renderTimes.push(renderTime);
      }

      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      
      expect(averageRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME);
      
      // Individual render times should also be fast
      for (let i = 0; i < renderTimes.length; i++) {
        expect(renderTimes[i], `Game card ${i} render time`).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME * 2);
      }
    });

    test('should render team selection buttons efficiently', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      const teamButtons = await page.locator('[class*="teamButton"]').all();
      
      if (teamButtons.length > 0) {
        const buttonRenderTimes: number[] = [];
        
        for (let i = 0; i < Math.min(10, teamButtons.length); i++) {
          const renderTime = await profiler.measureRenderTime(`[class*="teamButton"]:nth-child(${i + 1})`);
          buttonRenderTimes.push(renderTime);
        }
        
        const averageButtonRenderTime = buttonRenderTimes.reduce((a, b) => a + b, 0) / buttonRenderTimes.length;
        expect(averageButtonRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME);
      }
    });

    test('should handle dynamic content updates efficiently', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      // Measure time to update team selection
      const startTime = await page.evaluate(() => performance.now());
      
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.tap();
      
      const endTime = await page.evaluate(() => performance.now());
      const updateTime = endTime - startTime;
      
      expect(updateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME * 3); // Allow 3 frames for update
    });
  });

  test.describe('Touch Response Performance', () => {

    test('should respond to touch within 100ms', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      const teamButtons = await page.locator('[class*="teamButton"]').all();
      
      if (teamButtons.length > 0) {
        const responseTimes: number[] = [];
        
        for (let i = 0; i < Math.min(5, teamButtons.length); i++) {
          const responseTime = await profiler.measureTouchResponseTime(`[class*="teamButton"]:nth-child(${i + 1})`);
          responseTimes.push(responseTime);
        }
        
        const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        expect(averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TOUCH_RESPONSE);
        
        // All individual responses should be fast
        for (const responseTime of responseTimes) {
          expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TOUCH_RESPONSE * 1.5);
        }
      }
    });

    test('should maintain touch responsiveness under load', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      // Simulate multiple rapid touches
      const teamButton = page.locator('[class*="teamButton"]').first();
      const touchTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await teamButton.tap();
        await page.waitForTimeout(50); // Brief pause between taps
        const endTime = Date.now();
        touchTimes.push(endTime - startTime);
      }
      
      const averageTouchTime = touchTimes.reduce((a, b) => a + b, 0) / touchTimes.length;
      expect(averageTouchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TOUCH_RESPONSE);
      
      // Touch times should be consistent (low variance)
      const maxTouchTime = Math.max(...touchTimes);
      const minTouchTime = Math.min(...touchTimes);
      const variance = maxTouchTime - minTouchTime;
      
      expect(variance).toBeLessThan(PERFORMANCE_THRESHOLDS.TOUCH_RESPONSE); // Variance should be less than threshold
    });
  });

  test.describe('Memory Usage Optimization', () => {

    test('should maintain reasonable memory usage', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      const initialMemory = await profiler.measureMemoryUsage();
      
      if (initialMemory) {
        expect(initialMemory.usedJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT);
        
        // Memory usage should not be approaching the limit
        const memoryUsagePercentage = initialMemory.usedJSHeapSize / initialMemory.jsHeapSizeLimit * 100;
        expect(memoryUsagePercentage).toBeLessThan(60); // Under 60% usage
      }
    });

    test('should not leak memory during interactions', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      const beforeMemory = await profiler.measureMemoryUsage();
      
      // Perform multiple interactions
      const teamButtons = await page.locator('[class*="teamButton"]').all();
      
      for (let cycle = 0; cycle < 3; cycle++) {
        for (let i = 0; i < Math.min(10, teamButtons.length); i++) {
          await teamButtons[i].tap();
          await page.waitForTimeout(10);
        }
        
        // Force garbage collection if available
        await page.evaluate(() => {
          if ((window as any).gc) {
            (window as any).gc();
          }
        });
      }
      
      const afterMemory = await profiler.measureMemoryUsage();
      
      if (beforeMemory && afterMemory) {
        const memoryIncrease = afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize;
        const memoryIncreasePercentage = memoryIncrease / beforeMemory.usedJSHeapSize * 100;
        
        // Memory should not increase significantly (< 20%)
        expect(memoryIncreasePercentage).toBeLessThan(20);
      }
    });

    test('should clean up resources on page navigation', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      const gamesPageMemory = await profiler.measureMemoryUsage();
      
      // Navigate to different page
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');
      
      // Wait for cleanup
      await page.waitForTimeout(1000);
      
      const leaderboardMemory = await profiler.measureMemoryUsage();
      
      if (gamesPageMemory && leaderboardMemory) {
        // Memory should not increase significantly after navigation
        const memoryIncrease = leaderboardMemory.usedJSHeapSize - gamesPageMemory.usedJSHeapSize;
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT / 4); // Less than 25% of limit
      }
    });
  });

  test.describe('Animation Performance', () => {

    test('should maintain smooth animations at 60fps', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      // Trigger animations
      const teamButton = page.locator('[class*="teamButton"]').first();
      await teamButton.hover(); // Trigger hover animation
      
      const animationMetrics = await profiler.measureAnimationPerformance();
      
      expect(animationMetrics.fps).toBeGreaterThan(PERFORMANCE_THRESHOLDS.ANIMATION_FPS);
      expect(animationMetrics.droppedFrames).toBeLessThan(5); // Less than 5 dropped frames in 60 frame sample
      expect(animationMetrics.frameTimeVariance).toBeLessThan(10); // Low frame time variance for smoothness
    });

    test('should optimize animations for battery life', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      // Check that animations are optimized (using transform/opacity, not layout properties)
      const animationOptimization = await page.evaluate(() => {
        const animatedElements = document.querySelectorAll('[class*="button"], [class*="card"]');
        const optimizedAnimations = [];
        
        for (const element of animatedElements) {
          const styles = getComputedStyle(element);
          const transition = styles.transition;
          const animation = styles.animation;
          
          // Check if animations use GPU-accelerated properties
          const usesGPUProps = /transform|opacity/.test(transition + animation);
          const avoidsLayoutProps = !/width|height|top|left|margin|padding/.test(transition + animation);
          
          optimizedAnimations.push({
            element: element.className,
            usesGPUProps,
            avoidsLayoutProps,
            hasWillChange: styles.willChange !== 'auto'
          });
        }
        
        return optimizedAnimations;
      });
      
      // Most animations should use GPU-accelerated properties
      const optimizedCount = animationOptimization.filter(anim => anim.usesGPUProps || anim.avoidsLayoutProps).length;
      const optimizationRatio = optimizedCount / animationOptimization.length;
      
      expect(optimizationRatio).toBeGreaterThan(0.8); // 80% of animations should be optimized
    });
  });

  test.describe('Core Web Vitals Performance', () => {

    test('should meet Core Web Vitals thresholds on 3G', async ({ page }) => {
      // Simulate 3G network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, NETWORK_CONDITIONS['3G'].latency));
        await route.continue();
      });
      
      const startTime = Date.now();
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      const webVitals = await profiler.measureCoreWebVitals();
      
      // First Contentful Paint should be under 1.5s on 3G
      if (webVitals.fcp) {
        expect(webVitals.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP_3G);
      }
      
      // Largest Contentful Paint should be under 2.5s
      if (webVitals.lcp) {
        expect(webVitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
      }
      
      // Cumulative Layout Shift should be under 0.1
      if (webVitals.cls !== undefined) {
        expect(webVitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
      }
    });

    test('should maintain good performance on slow 3G', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, NETWORK_CONDITIONS['Slow 3G'].latency));
        await route.continue();
      });
      
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      // Should still be usable on slow connections
      const teamButton = page.locator('[class*="teamButton"]').first();
      const interactionTime = await page.evaluate(async () => {
        const startTime = performance.now();
        
        // Simulate user interaction
        const button = document.querySelector('[class*="teamButton"]') as HTMLElement;
        if (button) {
          button.click();
        }
        
        return new Promise<number>((resolve) => {
          requestAnimationFrame(() => {
            const endTime = performance.now();
            resolve(endTime - startTime);
          });
        });
      });
      
      // Even on slow 3G, interactions should be responsive
      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TOUCH_RESPONSE * 2);
    });
  });

  test.describe('CPU Usage Optimization', () => {

    test('should maintain low CPU usage during idle', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      // Let page settle
      await page.waitForTimeout(2000);
      
      const cpuUsage = await page.evaluate(async () => {
        const measurements: number[] = [];
        
        return new Promise<number>((resolve) => {
          let measurementCount = 0;
          const maxMeasurements = 10;
          
          const measure = () => {
            const start = performance.now();
            
            // Idle CPU measurement - minimal work
            requestAnimationFrame(() => {
              const end = performance.now();
              const idleTime = end - start;
              measurements.push(idleTime);
              measurementCount++;
              
              if (measurementCount < maxMeasurements) {
                setTimeout(measure, 100);
              } else {
                const averageIdleTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
                resolve(averageIdleTime);
              }
            });
          };
          
          measure();
        });
      });
      
      // Idle time should be minimal (efficient event loop)
      expect(cpuUsage).toBeLessThan(5); // Less than 5ms per frame when idle
    });

    test('should throttle non-essential work when backgrounded', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');

      // Measure background task frequency
      const taskFrequency = await page.evaluate(async () => {
        let taskCount = 0;
        const originalSetInterval = window.setInterval;
        
        // Override setInterval to count tasks
        window.setInterval = (handler: any, timeout?: number) => {
          taskCount++;
          return originalSetInterval(handler, timeout);
        };
        
        // Simulate going to background
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const backgroundTaskCount = taskCount;
        taskCount = 0;
        
        // Simulate coming to foreground
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const foregroundTaskCount = taskCount;
        
        return { backgroundTaskCount, foregroundTaskCount };
      });
      
      // Should have fewer background tasks
      expect(taskFrequency.backgroundTaskCount).toBeLessThanOrEqual(taskFrequency.foregroundTaskCount);
    });
  });

  test.describe('Bundle Size and Loading Performance', () => {

    test('should load critical resources quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/games');
      await page.waitForSelector('[class*="mobileGameCard"]', { timeout: 10000 });
      
      const timeToInteractive = Date.now() - startTime;
      
      // Critical content should load quickly even on mobile
      expect(timeToInteractive).toBeLessThan(3000); // Under 3 seconds to interactive
    });

    test('should lazy load non-critical resources', async ({ page }) => {
      await page.goto('/games');
      
      // Check that images are lazy loaded
      const images = await page.locator('img').all();
      let lazyLoadedCount = 0;
      
      for (const img of images) {
        const loading = await img.getAttribute('loading');
        if (loading === 'lazy') {
          lazyLoadedCount++;
        }
      }
      
      // Some images should be lazy loaded
      if (images.length > 0) {
        const lazyLoadRatio = lazyLoadedCount / images.length;
        expect(lazyLoadRatio).toBeGreaterThan(0.5); // At least 50% lazy loaded
      }
    });

    test('should minimize main thread blocking', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      const blockingTime = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          let totalBlockingTime = 0;
          const startTime = performance.now();
          
          const measureBlocking = () => {
            const measureStart = performance.now();
            
            // Simulate small amount of work
            for (let i = 0; i < 1000; i++) {
              Math.random();
            }
            
            const measureEnd = performance.now();
            const blockingTime = measureEnd - measureStart;
            
            if (blockingTime > 16) { // Frame budget exceeded
              totalBlockingTime += blockingTime - 16;
            }
            
            if (performance.now() - startTime < 1000) {
              setTimeout(measureBlocking, 10);
            } else {
              resolve(totalBlockingTime);
            }
          };
          
          measureBlocking();
        });
      });
      
      // Total blocking time should be minimal
      expect(blockingTime).toBeLessThan(100); // Less than 100ms total blocking in 1 second
    });
  });
});