const { execSync } = require('child_process')

console.log('🏈 NFL Data Sync Script')
console.log('=====================')

try {
  console.log('📡 Syncing NFL teams and games from ESPN API...')
  
  const result = execSync('curl -X POST http://localhost:3000/api/sync/games', { 
    encoding: 'utf8',
    timeout: 30000
  })
  
  const response = JSON.parse(result)
  
  if (response.success) {
    console.log('✅ Sync successful!')
    console.log(`   Week: ${response.week}`)
    console.log(`   Season: ${response.season}`)
    console.log(`   Message: ${response.message}`)
  } else {
    console.log('❌ Sync failed!')
    console.log(`   Error: ${response.error}`)
    if (response.details) {
      console.log(`   Details: ${response.details}`)
    }
  }
} catch (error) {
  console.log('❌ Script failed!')
  console.log('   Make sure your development server is running on port 3000')
  console.log(`   Error: ${error.message}`)
}

console.log('\\n📊 To view synced data:')
console.log('   - Visit http://localhost:3000/games')
console.log('   - Or check your database with: npm run db:studio')