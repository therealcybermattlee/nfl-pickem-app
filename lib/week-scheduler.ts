import { getCurrentNFLWeek, getCurrentNFLSeason } from './nfl-api'
import { syncGamesFromESPN } from './game-sync'

export interface WeekAdvanceResult {
  previousWeek: number
  currentWeek: number
  season: number
  gamesLoaded: number
  success: boolean
  message: string
}

export async function checkAndAdvanceWeek(): Promise<WeekAdvanceResult> {
  const currentWeek = getCurrentNFLWeek()
  const currentSeason = getCurrentNFLSeason()
  
  // Get the week from environment (what we think the current week is)
  const envWeek = parseInt(process.env.CURRENT_NFL_WEEK || '1', 10)
  
  const result: WeekAdvanceResult = {
    previousWeek: envWeek,
    currentWeek: currentWeek,
    season: currentSeason,
    gamesLoaded: 0,
    success: false,
    message: ''
  }
  
  // If calculated week is ahead of environment week, we need to advance
  if (currentWeek > envWeek) {
    try {
      // Sync games for the new week
      await syncGamesFromESPN(currentWeek, currentSeason)
      
      // TODO: Update environment variable (in production this would need different handling)
      result.gamesLoaded = await getGamesCount(currentWeek, currentSeason)
      result.success = true
      result.message = `Advanced from Week ${envWeek} to Week ${currentWeek}. Loaded ${result.gamesLoaded} games.`
      
      console.log(result.message)
    } catch (error) {
      result.success = false
      result.message = `Failed to advance to Week ${currentWeek}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(result.message)
    }
  } else if (currentWeek === envWeek) {
    result.success = true
    result.message = `Already on current Week ${currentWeek}`
  } else {
    result.success = true
    result.message = `Environment ahead: Week ${envWeek}, calculated: Week ${currentWeek}`
  }
  
  return result
}

export async function getGamesCount(week: number, season: number): Promise<number> {
  const { prisma } = await import('./prisma')
  return await prisma.game.count({
    where: {
      week: week,
      season: season
    }
  })
}

export async function getNextWeekPreview(week?: number): Promise<{
  week: number,
  season: number,
  startsAt: Date | null,
  gamesCount: number
}> {
  const nextWeek = (week || getCurrentNFLWeek()) + 1
  const season = getCurrentNFLSeason()
  
  const { prisma } = await import('./prisma')
  const gamesCount = await prisma.game.count({
    where: { week: nextWeek, season }
  })
  
  // Get the earliest game time for the week
  const firstGame = await prisma.game.findFirst({
    where: { week: nextWeek, season },
    orderBy: { gameDate: 'asc' }
  })
  
  return {
    week: nextWeek,
    season,
    startsAt: firstGame?.gameDate || null,
    gamesCount
  }
}

// Schedule automatic week checks (run this periodically)
export function scheduleWeekChecks() {
  // Check every 6 hours for week advancement
  setInterval(async () => {
    try {
      const result = await checkAndAdvanceWeek()
      if (result.success && result.currentWeek > result.previousWeek) {
        console.log('🏈 Week automatically advanced:', result.message)
      }
    } catch (error) {
      console.error('Error in scheduled week check:', error)
    }
  }, 6 * 60 * 60 * 1000) // 6 hours
}