// Import classes we need for JobSystem
import { JobQueue } from './JobQueue'
import { GameDayScheduler } from './schedulers/GameDayScheduler'
import { ApiThrottler } from './schedulers/ApiThrottler'

// Core job system exports
export { BaseJob, JobStatus, JobPriority } from './jobs/BaseJob'
export type { JobResult, JobMetrics } from './jobs/BaseJob'

export { JobQueue } from './JobQueue'
export type { QueueStats } from './JobQueue'

// Specific job implementations
export { OddsUpdateJob } from './jobs/OddsUpdateJob'
export type { OddsUpdateJobData } from './jobs/OddsUpdateJob'

// Schedulers
export { GameDayScheduler } from './schedulers/GameDayScheduler'
export type { ScheduleConfig, GameSchedule } from './schedulers/GameDayScheduler'

export { ApiThrottler } from './schedulers/ApiThrottler'
export type { ApiUsageStats, ThrottleConfig } from './schedulers/ApiThrottler'

// Job system utilities
export class JobSystem {
  private static initialized = false
  
  public static async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    
    console.log('[JobSystem] Initializing NFL Pick\'em job system...')
    
    try {
      // Start job processing
      const jobQueue = JobQueue.getInstance()
      jobQueue.startProcessing()
      
      // Start intelligent scheduling
      const scheduler = GameDayScheduler.getInstance()
      await scheduler.startScheduling()
      
      this.initialized = true
      console.log('[JobSystem] Job system initialized successfully')
      
    } catch (error) {
      console.error('[JobSystem] Failed to initialize job system:', error)
      throw error
    }
  }
  
  public static stop(): void {
    if (!this.initialized) {
      return
    }
    
    console.log('[JobSystem] Stopping job system...')
    
    try {
      const jobQueue = JobQueue.getInstance()
      jobQueue.stopProcessing()
      
      const scheduler = GameDayScheduler.getInstance()
      scheduler.stopScheduling()
      
      this.initialized = false
      console.log('[JobSystem] Job system stopped')
      
    } catch (error) {
      console.error('[JobSystem] Error stopping job system:', error)
    }
  }
  
  public static isInitialized(): boolean {
    return this.initialized
  }
  
  public static getSystemStatus() {
    const jobQueue = JobQueue.getInstance()
    const scheduler = GameDayScheduler.getInstance()
    const throttler = ApiThrottler.getInstance()
    
    return {
      initialized: this.initialized,
      jobQueue: jobQueue.getHealthCheck(),
      scheduler: scheduler.getScheduleStatus(),
      apiThrottler: throttler.getStats()
    }
  }
}