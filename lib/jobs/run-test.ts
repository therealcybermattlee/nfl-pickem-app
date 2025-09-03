#!/usr/bin/env tsx

import { testJobSystem } from './test-job-system'

async function main() {
  console.log('🚀 STARTING JOB SYSTEM VALIDATION')
  console.log('==================================')
  
  try {
    const result = await testJobSystem()
    
    if (result.success) {
      console.log('\n🎉 SUCCESS: Job system validation completed!')
      console.log('✅ All systems operational and ready for production')
    } else {
      console.log('\n❌ FAILED: Job system validation failed')
      console.log('Error:', result.error)
    }
    
    console.log('\n📊 FINAL SYSTEM STATUS')
    console.log('=====================')
    console.log(JSON.stringify(result.systemStatus, null, 2))
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR during job system test:', error)
    process.exit(1)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}