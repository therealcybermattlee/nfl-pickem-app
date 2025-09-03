import { JobSystem, OddsUpdateJob, JobQueue, GameDayScheduler, ApiThrottler } from './index'

export async function testJobSystem() {
  console.log('🧪 TESTING AUTOMATED JOB SYSTEM')
  console.log('================================')

  try {
    // Test 1: Initialize Job System
    console.log('\n📋 1. INITIALIZING JOB SYSTEM')
    await JobSystem.initialize()
    
    // Test 2: Check System Status
    console.log('\n📊 2. SYSTEM STATUS')
    const status = JobSystem.getSystemStatus()
    console.log(JSON.stringify(status, null, 2))
    
    // Test 3: Test API Throttler
    console.log('\n🚦 3. TESTING API THROTTLER')
    const throttler = ApiThrottler.getInstance()
    
    console.log('Initial throttler stats:', throttler.getStats())
    
    const canMakeRequest = await throttler.canMakeRequest(1)
    console.log('Can make request:', canMakeRequest)
    
    if (canMakeRequest) {
      await throttler.recordRequest(1)
      console.log('Recorded 1 API request')
    }
    
    // Test 4: Create and Schedule Jobs
    console.log('\n⚙️  4. CREATING AND SCHEDULING JOBS')
    const jobQueue = JobQueue.getInstance()
    
    // Create a test odds update job
    const testJob = OddsUpdateJob.createWeeklyUpdateJob(1, 2025)
    console.log('Created test job:', testJob.id)
    
    const jobAdded = await jobQueue.addJob(testJob)
    console.log('Job added to queue:', jobAdded)
    
    // Test 5: Check Job Status
    console.log('\n📈 5. CHECKING JOB QUEUE STATUS')
    const queueStats = jobQueue.getStats()
    console.log('Queue stats:', queueStats)
    
    const allJobs = jobQueue.getAllJobs()
    console.log('Jobs in queue:', allJobs.length)
    
    // Test 6: Test Scheduler Status
    console.log('\n📅 6. CHECKING SCHEDULER STATUS')
    const scheduler = GameDayScheduler.getInstance()
    const scheduleStatus = scheduler.getScheduleStatus()
    console.log('Schedule status:', scheduleStatus)
    
    // Test 7: Wait and Check Job Execution
    console.log('\n⏳ 7. WAITING FOR JOB EXECUTION (30 seconds)')
    await new Promise(resolve => setTimeout(resolve, 30000))
    
    const updatedStats = jobQueue.getStats()
    console.log('Updated queue stats:', updatedStats)
    
    // Test 8: API Usage Projection
    console.log('\n📊 8. API USAGE PROJECTION')
    const projection = throttler.getProjectedUsage()
    console.log('Usage projection:', projection)
    
    console.log('\n✅ JOB SYSTEM TEST COMPLETED')
    console.log('============================')
    
    return {
      success: true,
      systemStatus: JobSystem.getSystemStatus(),
      message: 'Job system test completed successfully'
    }
    
  } catch (error) {
    console.error('❌ JOB SYSTEM TEST FAILED:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Job system test failed'
    }
  }
}

// Quick system health check
export function getSystemHealthCheck() {
  return {
    timestamp: new Date().toISOString(),
    system: JobSystem.getSystemStatus(),
    initialized: JobSystem.isInitialized()
  }
}