export interface JobResult {
  success: boolean
  data?: any
  error?: string
  executionTime: number
  retryCount: number
  apiCallsUsed: number
  cacheHits: number
}

export interface JobMetrics {
  startTime: Date
  endTime?: Date
  executionTime: number
  success: boolean
  retryCount: number
  apiCallsUsed: number
  cacheHits: number
  error?: string
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export enum JobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export abstract class BaseJob {
  public readonly id: string
  public readonly type: string
  public readonly priority: JobPriority
  public readonly maxRetries: number
  public readonly retryDelay: number
  public status: JobStatus
  public retryCount: number
  public createdAt: Date
  public scheduledFor: Date
  public metrics: JobMetrics

  constructor(
    id: string,
    type: string,
    priority: JobPriority = JobPriority.NORMAL,
    maxRetries: number = 3,
    retryDelay: number = 1000,
    scheduledFor?: Date
  ) {
    this.id = id
    this.type = type
    this.priority = priority
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
    this.status = JobStatus.PENDING
    this.retryCount = 0
    this.createdAt = new Date()
    this.scheduledFor = scheduledFor || new Date()
    this.metrics = {
      startTime: new Date(),
      executionTime: 0,
      success: false,
      retryCount: 0,
      apiCallsUsed: 0,
      cacheHits: 0
    }
  }

  abstract execute(): Promise<JobResult>

  async run(): Promise<JobResult> {
    this.status = JobStatus.RUNNING
    this.metrics.startTime = new Date()

    try {
      const result = await this.executeWithRetry()
      this.metrics.endTime = new Date()
      this.metrics.executionTime = this.metrics.endTime.getTime() - this.metrics.startTime.getTime()
      this.metrics.success = result.success
      this.metrics.retryCount = this.retryCount
      this.metrics.apiCallsUsed = result.apiCallsUsed
      this.metrics.cacheHits = result.cacheHits

      if (result.success) {
        this.status = JobStatus.COMPLETED
        this.logSuccess(result)
      } else {
        this.status = JobStatus.FAILED
        this.logFailure(result)
      }

      return result
    } catch (error) {
      this.status = JobStatus.FAILED
      this.metrics.endTime = new Date()
      this.metrics.executionTime = this.metrics.endTime.getTime() - this.metrics.startTime.getTime()
      this.metrics.error = error instanceof Error ? error.message : 'Unknown error'

      const result: JobResult = {
        success: false,
        error: this.metrics.error,
        executionTime: this.metrics.executionTime,
        retryCount: this.retryCount,
        apiCallsUsed: 0,
        cacheHits: 0
      }

      this.logFailure(result)
      return result
    }
  }

  private async executeWithRetry(): Promise<JobResult> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.status = JobStatus.RETRYING
          this.retryCount = attempt
          await this.delay(this.calculateRetryDelay(attempt))
          console.log(`[${this.type}] Retry attempt ${attempt}/${this.maxRetries} for job ${this.id}`)
        }

        const result = await this.execute()
        if (result.success) {
          return result
        } else {
          lastError = new Error(result.error || 'Job execution failed')
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.log(`[${this.type}] Attempt ${attempt + 1} failed for job ${this.id}: ${lastError.message}`)
      }
    }

    throw lastError || new Error('Job failed after all retry attempts')
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return this.retryDelay * Math.pow(2, attempt - 1)
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private logSuccess(result: JobResult): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      jobId: this.id,
      jobType: this.type,
      status: 'completed',
      executionTime: result.executionTime,
      retryCount: result.retryCount,
      apiCallsUsed: result.apiCallsUsed,
      cacheHits: result.cacheHits,
      priority: this.priority
    }))
  }

  private logFailure(result: JobResult): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      jobId: this.id,
      jobType: this.type,
      status: 'failed',
      error: result.error,
      executionTime: result.executionTime,
      retryCount: result.retryCount,
      maxRetries: this.maxRetries,
      priority: this.priority
    }))
  }

  public isReadyToRun(): boolean {
    return this.status === JobStatus.PENDING && this.scheduledFor <= new Date()
  }

  public canRetry(): boolean {
    return this.status === JobStatus.FAILED && this.retryCount < this.maxRetries
  }

  public toJSON() {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      priority: this.priority,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      createdAt: this.createdAt.toISOString(),
      scheduledFor: this.scheduledFor.toISOString(),
      metrics: this.metrics
    }
  }
}