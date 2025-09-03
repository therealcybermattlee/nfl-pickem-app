import { BaseJob, JobStatus, JobPriority } from './jobs/BaseJob'

export interface QueueStats {
  totalJobs: number
  pendingJobs: number
  runningJobs: number
  completedJobs: number
  failedJobs: number
  totalApiCalls: number
  totalCacheHits: number
  averageExecutionTime: number
}

export class JobQueue {
  private static instance: JobQueue
  private jobs: Map<string, BaseJob> = new Map()
  private isProcessing: boolean = false
  private processingInterval: NodeJS.Timeout | null = null
  private readonly maxConcurrentJobs: number
  private readonly maxQueueSize: number

  private constructor(maxConcurrentJobs: number = 5, maxQueueSize: number = 1000) {
    this.maxConcurrentJobs = maxConcurrentJobs
    this.maxQueueSize = maxQueueSize
  }

  public static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue()
    }
    return JobQueue.instance
  }

  public async addJob(job: BaseJob): Promise<boolean> {
    if (this.jobs.size >= this.maxQueueSize) {
      console.log(`[JobQueue] Queue at capacity (${this.maxQueueSize}). Rejecting job ${job.id}`)
      return false
    }

    if (this.jobs.has(job.id)) {
      console.log(`[JobQueue] Job ${job.id} already exists in queue`)
      return false
    }

    this.jobs.set(job.id, job)
    console.log(`[JobQueue] Added job ${job.id} (${job.type}) with priority ${job.priority}`)

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing()
    }

    return true
  }

  public removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (!job) {
      return false
    }

    // Don't remove running jobs
    if (job.status === JobStatus.RUNNING) {
      console.log(`[JobQueue] Cannot remove running job ${jobId}`)
      return false
    }

    this.jobs.delete(jobId)
    console.log(`[JobQueue] Removed job ${jobId}`)
    return true
  }

  public getJob(jobId: string): BaseJob | undefined {
    return this.jobs.get(jobId)
  }

  public getAllJobs(): BaseJob[] {
    return Array.from(this.jobs.values())
  }

  public getJobsByStatus(status: JobStatus): BaseJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status)
  }

  public getJobsByType(type: string): BaseJob[] {
    return Array.from(this.jobs.values()).filter(job => job.type === type)
  }

  private getNextJob(): BaseJob | null {
    const readyJobs = Array.from(this.jobs.values())
      .filter(job => job.isReadyToRun())
      .sort((a, b) => {
        // Sort by priority (highest first), then by scheduled time (earliest first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.scheduledFor.getTime() - b.scheduledFor.getTime()
      })

    return readyJobs[0] || null
  }

  private getRunningJobsCount(): number {
    return Array.from(this.jobs.values()).filter(job => job.status === JobStatus.RUNNING).length
  }

  public startProcessing(): void {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    console.log('[JobQueue] Started processing jobs')

    this.processingInterval = setInterval(async () => {
      await this.processJobs()
    }, 5000) // Check every 5 seconds

    // Process immediately
    this.processJobs()
  }

  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.isProcessing = false
    console.log('[JobQueue] Stopped processing jobs')
  }

  private async processJobs(): Promise<void> {
    try {
      const runningCount = this.getRunningJobsCount()
      
      if (runningCount >= this.maxConcurrentJobs) {
        return // Already at max capacity
      }

      const nextJob = this.getNextJob()
      if (!nextJob) {
        return // No jobs ready to run
      }

      console.log(`[JobQueue] Starting job ${nextJob.id} (${nextJob.type})`)
      
      // Run job in background (don't await)
      this.executeJob(nextJob).catch(error => {
        console.error(`[JobQueue] Unexpected error in job ${nextJob.id}:`, error)
      })
    } catch (error) {
      console.error('[JobQueue] Error in processJobs:', error)
    }
  }

  private async executeJob(job: BaseJob): Promise<void> {
    try {
      await job.run()
      
      // Clean up completed jobs after some time
      setTimeout(() => {
        if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
          this.jobs.delete(job.id)
          console.log(`[JobQueue] Cleaned up completed job ${job.id}`)
        }
      }, 60000) // Clean up after 1 minute
    } catch (error) {
      console.error(`[JobQueue] Error executing job ${job.id}:`, error)
    }
  }

  public getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values())
    const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED)
    
    const totalApiCalls = jobs.reduce((sum, job) => sum + job.metrics.apiCallsUsed, 0)
    const totalCacheHits = jobs.reduce((sum, job) => sum + job.metrics.cacheHits, 0)
    const totalExecutionTime = completedJobs.reduce((sum, job) => sum + job.metrics.executionTime, 0)

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === JobStatus.PENDING).length,
      runningJobs: jobs.filter(j => j.status === JobStatus.RUNNING).length,
      completedJobs: completedJobs.length,
      failedJobs: jobs.filter(j => j.status === JobStatus.FAILED).length,
      totalApiCalls,
      totalCacheHits,
      averageExecutionTime: completedJobs.length > 0 ? totalExecutionTime / completedJobs.length : 0
    }
  }

  public async scheduleRecurringJob(
    jobFactory: () => BaseJob,
    intervalMs: number,
    jobType: string
  ): Promise<void> {
    const scheduleNext = () => {
      const job = jobFactory()
      job.scheduledFor = new Date(Date.now() + intervalMs)
      this.addJob(job)
      
      console.log(`[JobQueue] Scheduled next ${jobType} job for ${job.scheduledFor.toISOString()}`)
    }

    // Schedule initial job
    scheduleNext()

    // Set up recurring schedule
    setInterval(scheduleNext, intervalMs)
  }

  public clearCompleted(): number {
    const completedJobs = Array.from(this.jobs.entries())
      .filter(([_, job]) => job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED)
    
    completedJobs.forEach(([jobId, _]) => {
      this.jobs.delete(jobId)
    })

    console.log(`[JobQueue] Cleared ${completedJobs.length} completed jobs`)
    return completedJobs.length
  }

  public getHealthCheck() {
    const stats = this.getStats()
    const memoryUsage = process.memoryUsage()
    
    return {
      status: this.isProcessing ? 'running' : 'stopped',
      queueSize: stats.totalJobs,
      processing: this.isProcessing,
      stats,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      uptime: process.uptime()
    }
  }
}