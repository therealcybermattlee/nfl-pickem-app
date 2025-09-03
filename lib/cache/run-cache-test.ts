#!/usr/bin/env tsx

import { testCachingSystem } from './test-caching-system'

async function main() {
  console.log('🚀 STARTING SPRINT 2 PHASE B VALIDATION')
  console.log('=======================================')
  
  try {
    const result = await testCachingSystem()
    
    if (result.success) {
      console.log('\n🎉 SUCCESS: Multi-tier caching system validation completed!')
      console.log('✅ Cache performance optimized for production workloads')
      console.log('✅ API throttling integration working perfectly')
      console.log('✅ Memory and database cache layers operational')
    } else {
      console.log('\n❌ FAILED: Caching system validation failed')
      console.log('Error:', result.error)
    }
    
    console.log('\n📊 FINAL SYSTEM METRICS')
    console.log('=======================')
    console.log('Cache Performance:')
    console.log(`- Hit Ratio: ${Math.round(result.cacheStats?.hitRatio * 100 || 0)}%`)
    console.log(`- Set Avg Time: ${result.performance?.setAvgTime || 0}ms`)
    console.log(`- Get Avg Time: ${result.performance?.getAvgTime || 0}ms`)
    console.log(`- Memory Usage: ${Math.round((result.cacheStats?.memoryUsage || 0) / 1024)}KB`)
    
    console.log('\nAPI Throttling:')
    const throttlerStats = result.throttlerStats
    console.log(`- Monthly Used: ${throttlerStats?.monthlyUsed || 0}/500`)
    console.log(`- Daily Used: ${throttlerStats?.dailyUsed || 0}/16`)
    console.log(`- Throttle Active: ${throttlerStats?.throttleActive ? 'Yes' : 'No'}`)
    
    console.log('\nSystem Health:')
    console.log(`- Memory Cache Items: ${result.healthCheck?.memoryCache?.items || 0}`)
    console.log(`- Database Cache Items: ${result.healthCheck?.databaseCache?.items || 0}`)
    console.log(`- Status: ${result.healthCheck?.status || 'unknown'}`)
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR during caching system test:', error)
    process.exit(1)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}