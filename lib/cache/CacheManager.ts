import { prisma } from '@/lib/prisma'

export interface CacheEntry<T = any> {
  key: string
  data: T
  expiresAt: Date
  version: number
  tags: string[]
  hitCount: number
  createdAt: Date
  lastAccessedAt: Date
}

export interface CacheStats {
  memoryHits: number
  databaseHits: number
  misses: number
  totalRequests: number
  hitRatio: number
  evictions: number
  memoryUsage: number
}

export interface CacheConfig {
  memoryTtl: number        // Memory cache TTL in milliseconds
  databaseTtl: number      // Database cache TTL in milliseconds
  maxMemoryItems: number   // Max items in memory cache
  maxMemorySize: number    // Max memory usage in bytes
  compressionThreshold: number // Compress items larger than this
  enableCompression: boolean
}

export class CacheManager {
  private static instance: CacheManager
  private memoryCache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig
  private stats: CacheStats = {
    memoryHits: 0,
    databaseHits: 0,
    misses: 0,
    totalRequests: 0,
    hitRatio: 0,
    evictions: 0,
    memoryUsage: 0
  }
  
  private constructor() {
    this.config = {
      memoryTtl: 5 * 60 * 1000,      // 5 minutes in memory
      databaseTtl: 60 * 60 * 1000,   // 1 hour in database
      maxMemoryItems: 1000,          // Max 1000 items in memory
      maxMemorySize: 50 * 1024 * 1024, // 50MB max memory usage
      compressionThreshold: 10 * 1024,  // Compress items > 10KB
      enableCompression: true
    }
    
    // Start cleanup interval
    setInterval(() => this.cleanupMemoryCache(), 60 * 1000) // Every minute
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  public async get<T>(key: string, tags: string[] = []): Promise<T | null> {
    this.stats.totalRequests++
    
    try {
      // Level 1: Memory Cache
      const memoryResult = this.getFromMemory<T>(key)
      if (memoryResult !== null) {
        this.stats.memoryHits++
        this.updateHitRatio()
        return memoryResult
      }

      // Level 2: Database Cache  
      const databaseResult = await this.getFromDatabase<T>(key)
      if (databaseResult !== null) {
        this.stats.databaseHits++
        
        // Promote to memory cache
        await this.setInMemory(key, databaseResult, tags)
        this.updateHitRatio()
        return databaseResult
      }

      // Cache miss
      this.stats.misses++
      this.updateHitRatio()
      return null

    } catch (error) {
      console.error(`[CacheManager] Error getting cache key ${key}:`, error)
      this.stats.misses++
      this.updateHitRatio()
      return null
    }
  }

  public async set<T>(key: string, data: T, tags: string[] = [], ttlOverride?: number): Promise<void> {
    try {
      // Set in both memory and database
      await Promise.all([
        this.setInMemory(key, data, tags, ttlOverride),
        this.setInDatabase(key, data, tags, ttlOverride)
      ])
    } catch (error) {
      console.error(`[CacheManager] Error setting cache key ${key}:`, error)
    }
  }

  public async invalidate(key: string): Promise<void> {
    try {
      // Remove from memory
      this.memoryCache.delete(key)
      
      // Remove from database
      await prisma.cache.deleteMany({
        where: { key }
      })
      
      console.log(`[CacheManager] Invalidated cache key: ${key}`)
    } catch (error) {
      console.error(`[CacheManager] Error invalidating cache key ${key}:`, error)
    }
  }

  public async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // Remove from memory
      for (const [key, entry] of this.memoryCache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.memoryCache.delete(key)
        }
      }

      // Remove from database
      for (const tag of tags) {
        await prisma.cache.deleteMany({
          where: {
            tags: {
              contains: tag
            }
          }
        })
      }

      console.log(`[CacheManager] Invalidated cache entries with tags:`, tags)
    } catch (error) {
      console.error(`[CacheManager] Error invalidating cache by tags:`, error)
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    if (!entry) return null

    // Check expiration
    if (entry.expiresAt <= new Date()) {
      this.memoryCache.delete(key)
      this.stats.evictions++
      return null
    }

    // Update access stats
    entry.lastAccessedAt = new Date()
    entry.hitCount++
    
    return entry.data as T
  }

  private async getFromDatabase<T>(key: string): Promise<T | null> {
    try {
      const entry = await prisma.cache.findUnique({
        where: { key }
      })

      if (!entry) return null

      // Check expiration
      if (entry.expiresAt <= new Date()) {
        await prisma.cache.delete({
          where: { key }
        })
        return null
      }

      // Update access stats
      await prisma.cache.update({
        where: { key },
        data: {
          lastAccessedAt: new Date(),
          hitCount: { increment: 1 }
        }
      })

      return this.deserializeData<T>(entry.data)
    } catch (error) {
      console.error(`[CacheManager] Database cache error for key ${key}:`, error)
      return null
    }
  }

  private async setInMemory<T>(key: string, data: T, tags: string[] = [], ttlOverride?: number): Promise<void> {
    const now = new Date()
    const ttl = ttlOverride || this.config.memoryTtl
    
    const entry: CacheEntry<T> = {
      key,
      data,
      expiresAt: new Date(now.getTime() + ttl),
      version: 1,
      tags,
      hitCount: 0,
      createdAt: now,
      lastAccessedAt: now
    }

    // Check memory limits before adding
    await this.enforceMemoryLimits()
    
    this.memoryCache.set(key, entry)
    this.updateMemoryUsage()
  }

  private async setInDatabase<T>(key: string, data: T, tags: string[] = [], ttlOverride?: number): Promise<void> {
    try {
      const now = new Date()
      const ttl = ttlOverride || this.config.databaseTtl
      const serializedData = this.serializeData(data)

      await prisma.cache.upsert({
        where: { key },
        update: {
          data: serializedData,
          expiresAt: new Date(now.getTime() + ttl),
          tags: tags.join(','),
          lastAccessedAt: now
        },
        create: {
          key,
          data: serializedData,
          expiresAt: new Date(now.getTime() + ttl),
          version: 1,
          tags: tags.join(','),
          hitCount: 0,
          createdAt: now,
          lastAccessedAt: now
        }
      })
    } catch (error) {
      console.error(`[CacheManager] Database cache set error for key ${key}:`, error)
    }
  }

  private serializeData<T>(data: T): string {
    try {
      const jsonString = JSON.stringify(data)
      
      // Compress if enabled and data is large enough
      if (this.config.enableCompression && jsonString.length > this.config.compressionThreshold) {
        // In production, you would use a compression library like zlib
        // For now, just return the JSON string
        return jsonString
      }
      
      return jsonString
    } catch (error) {
      console.error('[CacheManager] Error serializing data:', error)
      return '{}'
    }
  }

  private deserializeData<T>(data: string): T | null {
    try {
      return JSON.parse(data) as T
    } catch (error) {
      console.error('[CacheManager] Error deserializing data:', error)
      return null
    }
  }

  private async enforceMemoryLimits(): Promise<void> {
    // Remove expired items first
    this.cleanupMemoryCache()

    // If still over limits, remove least recently used items
    while (this.memoryCache.size >= this.config.maxMemoryItems || 
           this.getMemoryUsage() > this.config.maxMemorySize) {
      
      const oldestEntry = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime())[0]

      if (oldestEntry) {
        this.memoryCache.delete(oldestEntry[0])
        this.stats.evictions++
      } else {
        break // Safety break
      }
    }

    this.updateMemoryUsage()
  }

  private cleanupMemoryCache(): void {
    const now = new Date()
    let cleaned = 0

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[CacheManager] Cleaned up ${cleaned} expired memory cache entries`)
      this.updateMemoryUsage()
    }
  }

  private getMemoryUsage(): number {
    let totalSize = 0
    for (const entry of this.memoryCache.values()) {
      totalSize += this.estimateEntrySize(entry)
    }
    return totalSize
  }

  private estimateEntrySize(entry: CacheEntry): number {
    // Rough estimation of memory usage
    return JSON.stringify(entry).length * 2 // 2 bytes per character (UTF-16)
  }

  private updateMemoryUsage(): void {
    this.stats.memoryUsage = this.getMemoryUsage()
  }

  private updateHitRatio(): void {
    const totalHits = this.stats.memoryHits + this.stats.databaseHits
    this.stats.hitRatio = this.stats.totalRequests > 0 
      ? Math.round((totalHits / this.stats.totalRequests) * 100) / 100
      : 0
  }

  public getStats(): CacheStats {
    this.updateMemoryUsage()
    return { ...this.stats }
  }

  public async getHealthCheck() {
    const memoryItems = this.memoryCache.size
    const databaseItems = await prisma.cache.count()
    
    return {
      status: 'healthy',
      memoryCache: {
        items: memoryItems,
        maxItems: this.config.maxMemoryItems,
        usage: this.stats.memoryUsage,
        maxUsage: this.config.maxMemorySize
      },
      databaseCache: {
        items: databaseItems
      },
      stats: this.getStats(),
      uptime: process.uptime()
    }
  }

  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[CacheManager] Configuration updated:', newConfig)
  }

  public getConfig(): CacheConfig {
    return { ...this.config }
  }

  public async clearAll(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear()
      
      // Clear database cache
      await prisma.cache.deleteMany({})
      
      // Reset stats
      this.stats = {
        memoryHits: 0,
        databaseHits: 0,
        misses: 0,
        totalRequests: 0,
        hitRatio: 0,
        evictions: 0,
        memoryUsage: 0
      }
      
      console.log('[CacheManager] All cache data cleared')
    } catch (error) {
      console.error('[CacheManager] Error clearing cache:', error)
    }
  }
}