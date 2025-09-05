
import { NextResponse } from 'next/server'
import { checkAndAdvanceWeek, getNextWeekPreview } from '@/lib/week-scheduler'
import { getCurrentNFLWeek, getCurrentNFLSeason } from '@/lib/nfl-api'

export async function GET() {
  try {
    const result = await checkAndAdvanceWeek()
    const nextWeek = await getNextWeekPreview()
    
    return NextResponse.json({
      success: true,
      data: {
        current: {
          week: getCurrentNFLWeek(),
          season: getCurrentNFLSeason()
        },
        advancement: result,
        nextWeek
      }
    })
  } catch (error) {
    console.error('Week advancement API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Force check and advance if needed
    const result = await checkAndAdvanceWeek()
    
    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.message
    })
  } catch (error) {
    console.error('Force week advancement error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}