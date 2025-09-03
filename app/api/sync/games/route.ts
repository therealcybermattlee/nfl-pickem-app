import { NextRequest, NextResponse } from 'next/server'
import { syncCurrentWeek, syncGamesFromESPN, updateGameScores } from '@/lib/game-sync'
import { getCurrentNFLWeek, getCurrentNFLSeason } from '@/lib/nfl-api'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'full'
    const week = searchParams.get('week')
    const season = searchParams.get('season')
    
    console.log(`Sync request: action=${action}, week=${week}, season=${season}`)
    
    switch (action) {
      case 'full':
        await syncCurrentWeek()
        return NextResponse.json({ 
          success: true, 
          message: 'Full sync completed successfully',
          week: getCurrentNFLWeek(),
          season: getCurrentNFLSeason()
        })
        
      case 'games':
        if (week && season) {
          await syncGamesFromESPN(parseInt(week), parseInt(season))
          return NextResponse.json({ 
            success: true, 
            message: `Games synced for Week ${week}, ${season} season`
          })
        } else {
          await syncGamesFromESPN()
          return NextResponse.json({ 
            success: true, 
            message: `Games synced for current week`
          })
        }
        
      case 'scores':
        await updateGameScores()
        return NextResponse.json({ 
          success: true, 
          message: 'Game scores updated successfully' 
        })
        
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use: full, games, or scores' 
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'status') {
      const currentWeek = getCurrentNFLWeek()
      const currentSeason = getCurrentNFLSeason()
      
      return NextResponse.json({
        success: true,
        currentWeek,
        currentSeason,
        message: `Current NFL week: ${currentWeek}, Season: ${currentSeason}`
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'NFL Data Sync API',
      availableActions: {
        POST: {
          'full': 'Complete sync (teams + games + scores)',
          'games': 'Sync games only (optionally specify ?week=X&season=Y)',
          'scores': 'Update scores for incomplete games'
        },
        GET: {
          'status': 'Get current NFL week/season info (?action=status)'
        }
      }
    })
  } catch (error) {
    console.error('Sync API GET error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get sync status'
    }, { status: 500 })
  }
}