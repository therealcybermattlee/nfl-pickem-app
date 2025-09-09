import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting NFL Pick\'em E2E Test Teardown...')
  
  try {
    // Clean up temporary storage states if needed
    const storageStatesDir = path.join(__dirname, 'storage-states')
    
    // Optional: Clean up storage states (comment out if you want to inspect them)
    // if (fs.existsSync(storageStatesDir)) {
    //   fs.rmSync(storageStatesDir, { recursive: true, force: true })
    //   console.log('✅ Storage states cleaned up')
    // }
    
    // Log test completion metrics
    const resultsDir = path.join(__dirname, 'results')
    if (fs.existsSync(resultsDir)) {
      const files = fs.readdirSync(resultsDir)
      console.log(`📊 Test artifacts created: ${files.length} files`)
      
      // Log any screenshots (failures)
      const screenshots = files.filter(f => f.includes('screenshot'))
      if (screenshots.length > 0) {
        console.log(`📸 Screenshots captured: ${screenshots.length}`)
        screenshots.forEach(file => console.log(`   - ${file}`))
      }
      
      // Log any videos (failures)
      const videos = files.filter(f => f.includes('video'))
      if (videos.length > 0) {
        console.log(`🎥 Videos recorded: ${videos.length}`)
        videos.forEach(file => console.log(`   - ${file}`))
      }
    }
    
    console.log('✅ NFL Pick\'em E2E Test Teardown Complete!')
    
  } catch (error) {
    console.error('❌ Teardown error:', error)
    // Don't throw - teardown errors shouldn't fail the test run
  }
}

export default globalTeardown