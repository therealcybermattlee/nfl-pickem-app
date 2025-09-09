import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting NFL Pick\'em E2E Test Setup...')
  
  // Create storage states directory
  const storageStatesDir = path.join(__dirname, 'storage-states')
  if (!fs.existsSync(storageStatesDir)) {
    fs.mkdirSync(storageStatesDir, { recursive: true })
  }

  // Create results directory
  const resultsDir = path.join(__dirname, 'results')
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Set up authentication state using test credentials
    console.log('🔐 Setting up test user authentication...')
    
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
    
    // Navigate to the app
    await page.goto(baseURL)
    
    // Wait for app to load
    await page.waitForSelector('h1', { timeout: 30000 })
    
    // Since the app doesn't have visible login UI but uses test credentials,
    // we'll set up a mock authentication state
    await page.addInitScript(() => {
      // Mock authentication state
      localStorage.setItem('nfl-pickem-user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        isAuthenticated: true
      }))
      
      // Set consistent test time
      const mockDate = new Date('2025-09-07T12:00:00.000Z')
      Date.now = () => mockDate.getTime()
      Date.prototype.getTime = () => mockDate.getTime()
    })
    
    // Verify basic functionality
    await page.waitForSelector('h1')
    const title = await page.textContent('h1')
    console.log(`✅ App loaded successfully with title: "${title}"`)
    
    // Test API connectivity
    try {
      const response = await page.request.get(`${baseURL.replace('5173', '8787')}/api/teams`)
      if (response.ok()) {
        console.log('✅ API connectivity verified')
      } else {
        console.log('⚠️ API not available, tests will use mocked data')
      }
    } catch (error) {
      console.log('⚠️ API connection test failed, tests will use mocked data')
    }
    
    // Save authenticated state
    await page.context().storageState({ path: path.join(storageStatesDir, 'user.json') })
    console.log('✅ Test user authentication state saved')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('✅ NFL Pick\'em E2E Test Setup Complete!')
}

export default globalSetup