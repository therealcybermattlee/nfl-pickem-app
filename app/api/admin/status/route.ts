import { NextResponse } from 'next/server'
import { getCurrentNFLWeek, getCurrentNFLSeason } from '@/lib/nfl-api'
import { getNextWeekPreview } from '@/lib/week-scheduler'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const currentWeek = getCurrentNFLWeek()
    const currentSeason = getCurrentNFLSeason()
    const nextWeek = await getNextWeekPreview()
    
    // Get current week games count
    const currentWeekGames = await prisma.game.count({
      where: { week: currentWeek, season: currentSeason }
    })
    
    // Get games with odds data
    const gamesWithOdds = await prisma.game.count({
      where: {
        week: currentWeek,
        season: currentSeason,
        homeSpread: { not: null }
      }
    })
    
    // Get total picks for current week
    const totalPicks = await prisma.pick.count({
      where: {
        game: {
          week: currentWeek,
          season: currentSeason
        }
      }
    })
    
    // Get unique users making picks
    const uniquePickers = await prisma.pick.groupBy({
      by: ['userId'],
      where: {
        game: {
          week: currentWeek,
          season: currentSeason
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        season: {
          current: { week: currentWeek, season: currentSeason },
          next: nextWeek,
          envWeek: parseInt(process.env.CURRENT_NFL_WEEK || '1', 10),
          envSeason: parseInt(process.env.CURRENT_NFL_SEASON || '2025', 10)
        },
        games: {
          currentWeek: currentWeekGames,
          withOdds: gamesWithOdds,
          oddsPercentage: currentWeekGames > 0 ? Math.round((gamesWithOdds / currentWeekGames) * 100) : 0
        },
        picks: {
          total: totalPicks,
          uniqueUsers: uniquePickers.length,
          averagePerUser: uniquePickers.length > 0 ? Math.round(totalPicks / uniquePickers.length) : 0
        },
        odds: {
          configured: !!process.env.THE_ODDS_API_KEY,
          provider: process.env.THE_ODDS_API_KEY ? 'The Odds API' : null,
          setupInstructions: !process.env.THE_ODDS_API_KEY ? {
            step1: 'Go to https://the-odds-api.com/',
            step2: 'Sign up for free account (500 requests/month)',
            step3: 'Get your API key from the dashboard',
            step4: 'Add THE_ODDS_API_KEY to your .env file',
            step5: 'Restart the server to activate odds integration'
          } : null
        },
        apis: {
          weekAdvancement: '/api/week/advance',
          oddsSync: '/api/odds/sync',
          gameSync: '/api/sync/games'
        }
      }
    })
  } catch (error) {
    console.error('Admin status API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}