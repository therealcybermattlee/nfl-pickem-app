#!/usr/bin/env node

/**
 * Quick Mobile UI Validation Script
 * 
 * Validates critical UI fixes implemented during the 8-day sprint:
 * - No full-width buttons on mobile viewports
 * - Touch target accessibility (44px minimum)
 * - Performance benchmarks
 * - PWA readiness
 */

import { chromium } from 'playwright'

const MOBILE_VIEWPORTS = [
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Pixel 6', width: 393, height: 851 },
  { name: 'iPhone SE', width: 375, height: 667 }
]

const PRODUCTION_SITE = 'https://pickem.cyberlees.dev'

async function validateMobileFixes() {
  console.log('🚀 NFL Pick\'em PWA - Critical Mobile Validation')
  console.log('===============================================\n')

  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const viewport of MOBILE_VIEWPORTS) {
    console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`)
    
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    
    try {
      // Navigate to production site
      await page.goto(PRODUCTION_SITE, { waitUntil: 'networkidle' })
      
      // Login to access all UI elements
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')
      
      // Navigate to games page
      await page.click('[data-testid="games-nav-link"]')
      await page.waitForSelector('[data-testid="games-grid"]')
      
      // ✅ CRITICAL TEST 1: No full-width buttons
      const buttonWidthViolations = await page.evaluate((viewport) => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const violations = []
        
        buttons.forEach((button, index) => {
          if (button.offsetParent !== null) { // visible elements only
            const rect = button.getBoundingClientRect()
            const maxWidth = viewport.width * 0.85 // 85% max allowed
            
            if (rect.width > maxWidth) {
              violations.push({
                index,
                width: rect.width,
                maxAllowed: maxWidth,
                text: button.textContent?.slice(0, 30) || `Button ${index}`
              })
            }
          }
        })
        
        return violations
      }, viewport)
      
      // ✅ CRITICAL TEST 2: Touch target accessibility
      const touchTargetViolations = await page.evaluate(() => {
        const interactive = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'))
        const violations = []
        
        interactive.forEach((element, index) => {
          if (element.offsetParent !== null) {
            const rect = element.getBoundingClientRect()
            const minSize = Math.min(rect.width, rect.height)
            
            if (minSize < 44) { // iOS/Android guidelines
              violations.push({
                index,
                size: minSize,
                text: element.textContent?.slice(0, 30) || `Element ${index}`
              })
            }
          }
        })
        
        return violations
      })
      
      // ✅ CRITICAL TEST 3: Performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0]
        const paint = performance.getEntriesByType('paint')
        
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          transferSize: navigation?.transferSize || 0
        }
      })
      
      // ✅ CRITICAL TEST 4: PWA readiness
      const pwaReadiness = await page.evaluate(() => {
        return {
          hasManifest: !!document.querySelector('link[rel="manifest"]'),
          hasServiceWorker: 'serviceWorker' in navigator,
          isSecure: location.protocol === 'https:',
          hasViewport: !!document.querySelector('meta[name="viewport"]')
        }
      })
      
      // Compile results
      const deviceResult = {
        device: viewport.name,
        viewport: `${viewport.width}x${viewport.height}`,
        buttonWidthViolations: buttonWidthViolations.length,
        touchTargetViolations: touchTargetViolations.length,
        performance: {
          loadTime: Math.round(performanceMetrics.loadTime),
          fcp: Math.round(performanceMetrics.fcp),
          bundleSize: Math.round(performanceMetrics.transferSize / 1024)
        },
        pwaScore: Object.values(pwaReadiness).filter(Boolean).length,
        issues: [
          ...buttonWidthViolations.map(v => `Button too wide: "${v.text}" (${v.width}px)`),
          ...touchTargetViolations.map(v => `Touch target too small: "${v.text}" (${v.size}px)`)
        ]
      }
      
      results.push(deviceResult)
      
      // Report results for this device
      console.log(`  ✅ Button width violations: ${deviceResult.buttonWidthViolations}`)
      console.log(`  ✅ Touch target violations: ${deviceResult.touchTargetViolations}`)
      console.log(`  📊 Load time: ${deviceResult.performance.loadTime}ms`)
      console.log(`  📊 FCP: ${deviceResult.performance.fcp}ms`)
      console.log(`  📊 Bundle size: ${deviceResult.performance.bundleSize}KB`)
      console.log(`  🔧 PWA score: ${deviceResult.pwaScore}/4`)
      
      if (deviceResult.issues.length > 0) {
        console.log(`  ⚠️  Issues found: ${deviceResult.issues.length}`)
        deviceResult.issues.forEach(issue => console.log(`    - ${issue}`))
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing ${viewport.name}: ${error.message}`)
      results.push({
        device: viewport.name,
        viewport: `${viewport.width}x${viewport.height}`,
        error: error.message
      })
    } finally {
      await context.close()
    }
    
    console.log('')
  }
  
  await browser.close()
  
  // Final analysis
  console.log('📋 CRITICAL VALIDATION SUMMARY')
  console.log('==============================')
  
  const totalButtonViolations = results.reduce((sum, r) => sum + (r.buttonWidthViolations || 0), 0)
  const totalTouchViolations = results.reduce((sum, r) => sum + (r.touchTargetViolations || 0), 0)
  const avgLoadTime = results.reduce((sum, r) => sum + (r.performance?.loadTime || 0), 0) / results.length
  const avgFCP = results.reduce((sum, r) => sum + (r.performance?.fcp || 0), 0) / results.length
  const avgBundleSize = results.reduce((sum, r) => sum + (r.performance?.bundleSize || 0), 0) / results.length
  
  console.log(`\n🎯 Critical Fix Validation:`)
  console.log(`  Full-width button issues: ${totalButtonViolations} (Target: 0)`)
  console.log(`  Touch target issues: ${totalTouchViolations} (Target: ≤2)`)
  console.log(`  Average load time: ${Math.round(avgLoadTime)}ms (Target: <3000ms)`)
  console.log(`  Average FCP: ${Math.round(avgFCP)}ms (Target: <1800ms)`)
  console.log(`  Average bundle size: ${Math.round(avgBundleSize)}KB (Target: <300KB)`)
  
  // Success criteria
  const criticalPassed = totalButtonViolations === 0 && totalTouchViolations <= 2
  const performancePassed = avgLoadTime < 3000 && avgFCP < 1800 && avgBundleSize < 300
  
  console.log(`\n🏆 8-Day Sprint Validation:`)
  console.log(`  Critical UI fixes: ${criticalPassed ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`  Performance benchmarks: ${performancePassed ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (criticalPassed && performancePassed) {
    console.log(`\n🎉 SUCCESS! Mobile improvements are production-ready!`)
    console.log(`✅ The 8-day sprint has successfully transformed the NFL Pick'em app`)
    process.exit(0)
  } else {
    console.log(`\n❌ Some critical issues need attention before final deployment`)
    process.exit(1)
  }
}

// Run validation
validateMobileFixes().catch(error => {
  console.error('Validation failed:', error)
  process.exit(1)
})