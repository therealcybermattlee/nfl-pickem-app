import { JobQueue } from '../JobQueue'
import { OddsUpdateJob } from '../jobs/OddsUpdateJob'
import { JobPriority } from '../jobs/BaseJob'
import { prisma } from '@/lib/prisma'

export interface ScheduleConfig {
  // Frequency in milliseconds
  defaultFrequency: number        // Default update frequency (1 hour)
  gameProximityFrequency: number  // When close to games (15 minutes)  
  liveDayFrequency: number        // On game days (5 minutes)
  liveGameFrequency: number       // During live games (2 minutes)
  
  // Thresholds in milliseconds  
  proximityThreshold: number      // 24 hours before game
  gameDayThreshold: number        // 2 hours before game
  liveThreshold: number           // Game time to 4 hours after
}

export interface GameSchedule {
  gameId: string
  gameDate: Date
  homeTeam: string
  awayTeam: string
  isCompleted: boolean
  week: number
  season: number
}

export class GameDayScheduler {
  private static instance: GameDayScheduler
  private jobQueue: JobQueue
  private config: ScheduleConfig
  private scheduledIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isRunning: boolean = false

  private constructor() {
    this.jobQueue = JobQueue.getInstance()
    this.config = {
      defaultFrequency: 60 * 60 * 1000,      // 1 hour
      gameProximityFrequency: 15 * 60 * 1000, // 15 minutes
      liveDayFrequency: 5 * 60 * 1000,       // 5 minutes  
      liveGameFrequency: 2 * 60 * 1000,      // 2 minutes
      
      proximityThreshold: 24 * 60 * 60 * 1000, // 24 hours
      gameDayThreshold: 2 * 60 * 60 * 1000,    // 2 hours
      liveThreshold: 6 * 60 * 60 * 1000        // 6 hours (game + 4 hours after)
    }
  }

  public static getInstance(): GameDayScheduler {
    if (!GameDayScheduler.instance) {
      GameDayScheduler.instance = new GameDayScheduler()
    }
    return GameDayScheduler.instance
  }

  public async startScheduling(): Promise<void> {
    if (this.isRunning) {
      console.log('[GameDayScheduler] Already running')
      return
    }

    this.isRunning = true
    console.log('[GameDayScheduler] Starting intelligent game day scheduling')
    
    // Start job processing
    this.jobQueue.startProcessing()
    
    // Initial schedule setup
    await this.updateSchedule()
    
    // Set up schedule refresh every 30 minutes
    const scheduleRefreshInterval = setInterval(async () => {
      try {
        await this.updateSchedule()
      } catch (error) {
        console.error('[GameDayScheduler] Error updating schedule:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    this.scheduledIntervals.set('schedule-refresh', scheduleRefreshInterval)
  }

  public stopScheduling(): void {
    if (!this.isRunning) {
      return
    }

    console.log('[GameDayScheduler] Stopping scheduling')
    this.isRunning = false

    // Clear all intervals
    this.scheduledIntervals.forEach((interval, key) => {
      clearInterval(interval)
      console.log(`[GameDayScheduler] Cleared interval: ${key}`)
    })
    this.scheduledIntervals.clear()
  }

  private async updateSchedule(): Promise<void> {
    try {
      console.log('[GameDayScheduler] Updating schedule based on current games')
      
      // Get current games from database
      const games = await this.getCurrentGames()
      const now = new Date()
      
      // Group games by scheduling needs
      const scheduleGroups = {
        live: [] as GameSchedule[],
        gameDay: [] as GameSchedule[],
        proximity: [] as GameSchedule[],
        default: [] as GameSchedule[]
      }

      for (const game of games) {
        const timeToGame = game.gameDate.getTime() - now.getTime()
        const timeFromGameStart = now.getTime() - game.gameDate.getTime()
        
        if (!game.isCompleted && timeFromGameStart >= 0 && timeFromGameStart <= this.config.liveThreshold) {
          // Live or recently completed game
          scheduleGroups.live.push(game)
        } else if (timeToGame <= this.config.gameDayThreshold && timeToGame > 0) {
          // Game day - within 2 hours of start
          scheduleGroups.gameDay.push(game)
        } else if (timeToGame <= this.config.proximityThreshold && timeToGame > 0) {
          // Game proximity - within 24 hours
          scheduleGroups.proximity.push(game)
        } else if (!game.isCompleted && timeToGame > 0) {
          // Default scheduling for future games
          scheduleGroups.default.push(game)
        }
      }

      // Update scheduling for each group
      this.scheduleForGroup('live', scheduleGroups.live, this.config.liveGameFrequency, JobPriority.CRITICAL)
      this.scheduleForGroup('gameDay', scheduleGroups.gameDay, this.config.liveDayFrequency, JobPriority.HIGH)
      this.scheduleForGroup('proximity', scheduleGroups.proximity, this.config.gameProximityFrequency, JobPriority.HIGH)
      this.scheduleForGroup('default', scheduleGroups.default, this.config.defaultFrequency, JobPriority.NORMAL)

      console.log('[GameDayScheduler] Schedule updated', {
        live: scheduleGroups.live.length,
        gameDay: scheduleGroups.gameDay.length,
        proximity: scheduleGroups.proximity.length,
        default: scheduleGroups.default.length
      })

    } catch (error) {
      console.error('[GameDayScheduler] Error updating schedule:', error)
    }
  }

  private scheduleForGroup(
    groupName: string, 
    games: GameSchedule[], 
    frequency: number,
    priority: JobPriority
  ): void {
    const intervalKey = `odds-update-${groupName}`
    
    // Clear existing interval for this group
    if (this.scheduledIntervals.has(intervalKey)) {
      clearInterval(this.scheduledIntervals.get(intervalKey)!)
    }

    if (games.length === 0) {
      return
    }

    console.log(`[GameDayScheduler] Scheduling ${groupName} group: ${games.length} games, every ${frequency/1000}s`)

    // Create recurring job for this group
    const interval = setInterval(async () => {
      try {
        // Get unique weeks/seasons from games
        const weekSeasons = new Map<string, { week: number; season: number }>()
        
        for (const game of games) {
          const key = `${game.week}-${game.season}`
          weekSeasons.set(key, { week: game.week, season: game.season })
        }

        // Create jobs for each week/season combination
        for (const [key, { week, season }] of weekSeasons.entries()) {
          const job = OddsUpdateJob.createWeeklyUpdateJob(week, season, priority)
          await this.jobQueue.addJob(job)
          
          console.log(`[GameDayScheduler] Scheduled ${groupName} odds update job for week ${week}, season ${season}`)
        }
      } catch (error) {
        console.error(`[GameDayScheduler] Error creating ${groupName} jobs:`, error)
      }
    }, frequency)

    this.scheduledIntervals.set(intervalKey, interval)

    // Also schedule immediate job
    setTimeout(async () => {
      const weekSeasons = new Map<string, { week: number; season: number }>()
      for (const game of games) {
        const key = `${game.week}-${game.season}`
        weekSeasons.set(key, { week: game.week, season: game.season })
      }
      
      for (const [key, { week, season }] of weekSeasons.entries()) {
        const job = OddsUpdateJob.createWeeklyUpdateJob(week, season, priority)
        await this.jobQueue.addJob(job)
      }
    }, 5000) // 5 second delay for immediate execution
  }

  private async getCurrentGames(): Promise<GameSchedule[]> {
    try {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const games = await prisma.game.findMany({
        where: {
          gameDate: {
            gte: oneWeekAgo,
            lte: oneWeekFromNow
          }
        },
        include: {
          homeTeam: {
            select: { displayName: true }
          },
          awayTeam: {
            select: { displayName: true }
          }
        },
        orderBy: {
          gameDate: 'asc'
        }
      })

      return games.map(game => ({
        gameId: game.id,
        gameDate: game.gameDate,
        homeTeam: game.homeTeam.displayName,
        awayTeam: game.awayTeam.displayName,
        isCompleted: game.isCompleted,
        week: game.week,
        season: game.season
      }))
    } catch (error) {
      console.error('[GameDayScheduler] Error fetching games:', error)
      return []
    }
  }

  public getScheduleStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: Array.from(this.scheduledIntervals.keys()),
      config: this.config,
      jobQueueStats: this.jobQueue.getStats()
    }
  }

  public updateConfig(newConfig: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[GameDayScheduler] Configuration updated:', newConfig)
    
    // Restart scheduling with new config
    if (this.isRunning) {
      this.stopScheduling()
      setTimeout(() => this.startScheduling(), 1000)
    }
  }
}