import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentNFLWeek, getCurrentNFLSeason } from '@/lib/nfl-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const season = searchParams.get('season')
    
    const targetWeek = week ? parseInt(week) : getCurrentNFLWeek()
    const targetSeason = season ? parseInt(season) : getCurrentNFLSeason()
    
    const games = await prisma.game.findMany({
      where: {
        week: targetWeek,
        season: targetSeason
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        picks: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            },
            team: true
          }
        }
      },
      orderBy: {
        gameDate: 'asc'
      }
    })
    
    return NextResponse.json({
      success: true,
      games,
      week: targetWeek,
      season: targetSeason,
      count: games.length
    })
    
  } catch (error) {
    console.error('Games API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch games',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { week, season, homeTeamId, awayTeamId, gameDate } = body
    
    if (!week || !season || !homeTeamId || !awayTeamId || !gameDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: week, season, homeTeamId, awayTeamId, gameDate'
      }, { status: 400 })
    }
    
    // Check if teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } })
    ])
    
    if (!homeTeam || !awayTeam) {
      return NextResponse.json({
        success: false,
        error: 'One or both teams not found'
      }, { status: 400 })
    }
    
    const game = await prisma.game.create({
      data: {
        week: parseInt(week),
        season: parseInt(season),
        homeTeamId,
        awayTeamId,
        gameDate: new Date(gameDate),
        isCompleted: false
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })
    
    return NextResponse.json({
      success: true,
      game,
      message: 'Game created successfully'
    })
    
  } catch (error) {
    console.error('Games POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create game',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}