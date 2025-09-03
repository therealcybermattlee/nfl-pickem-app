export interface ApiUsageStats {
  requestsUsed: number
  requestsRemaining: number
  dailyUsed: number
  monthlyUsed: number
  resetDate: Date
  lastRequestTime: Date | null
  throttleActive: boolean
}

export interface ThrottleConfig {
  monthlyLimit: number      // Total monthly requests (500 for free tier)
  dailyLimit: number        // Daily limit to spread usage (16-17 per day)
  safetyThreshold: number   // Safety threshold as percentage (0.85 = 85%)
  burstLimit: number        // Max requests in burst window
  burstWindow: number       // Burst window in milliseconds (60000 = 1 minute)
}

interface RequestRecord {
  timestamp: Date
  requestsUsed: number
}

export class ApiThrottler {
  private static instance: ApiThrottler
  private config: ThrottleConfig
  private requestHistory: RequestRecord[] = []
  private currentMonthUsage: number = 0
  private currentDayUsage: number = 0
  private currentMonth: number = new Date().getMonth()
  private currentDay: number = new Date().getDate()
  private lastResetCheck: Date = new Date()

  private constructor() {
    this.config = {
      monthlyLimit: 500,           // Free tier limit
      dailyLimit: 16,              // 500/31 ≈ 16 per day
      safetyThreshold: 0.85,       // Use only 85% of limits
      burstLimit: 5,               // Max 5 requests per minute
      burstWindow: 60 * 1000       // 1 minute window
    }
    
    this.loadUsageFromStorage()
  }

  public static getInstance(): ApiThrottler {
    if (!ApiThrottler.instance) {
      ApiThrottler.instance = new ApiThrottler()
    }
    return ApiThrottler.instance
  }

  public async canMakeRequest(requestsNeeded: number = 1): Promise<boolean> {
    this.checkAndResetCounters()
    
    const stats = this.getStats()
    const effectiveMonthlyLimit = Math.floor(this.config.monthlyLimit * this.config.safetyThreshold)
    const effectiveDailyLimit = Math.floor(this.config.dailyLimit * this.config.safetyThreshold)
    
    // Check monthly limit
    if (stats.monthlyUsed + requestsNeeded > effectiveMonthlyLimit) {
      console.warn(`[ApiThrottler] Monthly limit would be exceeded: ${stats.monthlyUsed + requestsNeeded}/${effectiveMonthlyLimit}`)
      return false
    }
    
    // Check daily limit
    if (stats.dailyUsed + requestsNeeded > effectiveDailyLimit) {
      console.warn(`[ApiThrottler] Daily limit would be exceeded: ${stats.dailyUsed + requestsNeeded}/${effectiveDailyLimit}`)
      return false
    }
    
    // Check burst limit
    const recentRequests = this.getRecentRequests()
    const recentUsage = recentRequests.reduce((sum, record) => sum + record.requestsUsed, 0)
    
    if (recentUsage + requestsNeeded > this.config.burstLimit) {
      console.warn(`[ApiThrottler] Burst limit would be exceeded: ${recentUsage + requestsNeeded}/${this.config.burstLimit}`)
      return false
    }
    
    return true
  }

  public async recordRequest(requestsUsed: number = 1): Promise<void> {
    this.checkAndResetCounters()
    
    const now = new Date()
    this.requestHistory.push({
      timestamp: now,
      requestsUsed
    })
    
    this.currentMonthUsage += requestsUsed
    this.currentDayUsage += requestsUsed
    
    // Clean old history (keep only last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    this.requestHistory = this.requestHistory.filter(record => record.timestamp >= oneDayAgo)
    
    this.saveUsageToStorage()
    
    console.log(`[ApiThrottler] Recorded ${requestsUsed} API request(s). Monthly: ${this.currentMonthUsage}/${this.config.monthlyLimit}, Daily: ${this.currentDayUsage}/${this.config.dailyLimit}`)
  }

  public getStats(): ApiUsageStats {
    this.checkAndResetCounters()
    
    const monthlyRemaining = Math.max(0, this.config.monthlyLimit - this.currentMonthUsage)
    const lastRequest = this.requestHistory.length > 0 ? 
      this.requestHistory[this.requestHistory.length - 1].timestamp : null
    
    const effectiveMonthlyLimit = Math.floor(this.config.monthlyLimit * this.config.safetyThreshold)
    const effectiveDailyLimit = Math.floor(this.config.dailyLimit * this.config.safetyThreshold)
    
    const throttleActive = 
      this.currentMonthUsage >= effectiveMonthlyLimit ||
      this.currentDayUsage >= effectiveDailyLimit ||
      this.getRecentRequests().reduce((sum, r) => sum + r.requestsUsed, 0) >= this.config.burstLimit

    return {
      requestsUsed: this.currentMonthUsage,
      requestsRemaining: monthlyRemaining,
      dailyUsed: this.currentDayUsage,
      monthlyUsed: this.currentMonthUsage,
      resetDate: this.getNextMonthStart(),
      lastRequestTime: lastRequest,
      throttleActive
    }
  }

  public async waitIfThrottled(): Promise<void> {
    const recentRequests = this.getRecentRequests()
    
    if (recentRequests.length >= this.config.burstLimit) {
      const oldestRecentRequest = recentRequests[0]
      const waitTime = this.config.burstWindow - (Date.now() - oldestRecentRequest.timestamp.getTime())
      
      if (waitTime > 0) {
        console.log(`[ApiThrottler] Throttling: waiting ${waitTime}ms for burst window reset`)
        await this.sleep(waitTime)
      }
    }
  }

  private checkAndResetCounters(): void {
    const now = new Date()
    
    // Check if month changed
    if (now.getMonth() !== this.currentMonth) {
      console.log(`[ApiThrottler] Month changed, resetting monthly counter. Previous usage: ${this.currentMonthUsage}`)
      this.currentMonthUsage = 0
      this.currentMonth = now.getMonth()
    }
    
    // Check if day changed  
    if (now.getDate() !== this.currentDay) {
      console.log(`[ApiThrottler] Day changed, resetting daily counter. Previous usage: ${this.currentDayUsage}`)
      this.currentDayUsage = 0
      this.currentDay = now.getDate()
    }
    
    this.lastResetCheck = now
  }

  private getRecentRequests(): RequestRecord[] {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.burstWindow)
    
    return this.requestHistory.filter(record => record.timestamp >= windowStart)
  }

  private getNextMonthStart(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private saveUsageToStorage(): void {
    // In a real application, this would save to persistent storage
    // For now, we'll use in-memory storage which resets on restart
    try {
      const data = {
        currentMonthUsage: this.currentMonthUsage,
        currentDayUsage: this.currentDayUsage,
        currentMonth: this.currentMonth,
        currentDay: this.currentDay,
        requestHistory: this.requestHistory.slice(-100) // Keep last 100 requests
      }
      
      // This could be saved to Redis, database, or file system
      console.log('[ApiThrottler] Usage data would be saved to persistent storage')
    } catch (error) {
      console.error('[ApiThrottler] Error saving usage data:', error)
    }
  }

  private loadUsageFromStorage(): void {
    // In a real application, this would load from persistent storage
    try {
      // This would load from Redis, database, or file system
      console.log('[ApiThrottler] Usage data would be loaded from persistent storage')
    } catch (error) {
      console.error('[ApiThrottler] Error loading usage data:', error)
    }
  }

  public updateConfig(newConfig: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[ApiThrottler] Configuration updated:', newConfig)
  }

  public getConfig(): ThrottleConfig {
    return { ...this.config }
  }

  public reset(): void {
    this.currentMonthUsage = 0
    this.currentDayUsage = 0
    this.requestHistory = []
    console.log('[ApiThrottler] Usage counters reset')
  }

  public getProjectedUsage(): { daily: number; monthly: number; daysRemaining: number } {
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const daysRemaining = daysInMonth - dayOfMonth
    
    const dailyAverage = this.currentMonthUsage / dayOfMonth
    const projectedMonthly = dailyAverage * daysInMonth
    
    return {
      daily: Math.round(dailyAverage * 100) / 100,
      monthly: Math.round(projectedMonthly),
      daysRemaining
    }
  }
}