
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const season = searchParams.get('season')
    const gameId = searchParams.get('gameId')

    let whereClause: any = { userId: session.user.id }

    if (gameId) {
      whereClause.gameId = gameId
    } else {
      // If no gameId, filter by week/season through the game relation
      whereClause.game = {}
      if (week) whereClause.game.week = parseInt(week)
      if (season) whereClause.game.season = parseInt(season)
    }

    const picks = await prisma.pick.findMany({
      where: whereClause,
      include: {
        game: {
          include: {
            homeTeam: true,
            awayTeam: true
          }
        },
        team: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      picks,
      count: picks.length
    })

  } catch (error) {
    console.error('Picks GET API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch picks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { gameId, teamId } = body

    if (!gameId || !teamId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: gameId, teamId'
      }, { status: 400 })
    }

    // Check if game exists and hasn't started yet
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })

    if (!game) {
      return NextResponse.json({
        success: false,
        error: 'Game not found'
      }, { status: 404 })
    }

    // Check if game has already started
    const now = new Date()
    if (new Date(game.gameDate) <= now) {
      return NextResponse.json({
        success: false,
        error: 'Cannot make picks for games that have already started'
      }, { status: 400 })
    }

    // Verify that the selected team is playing in this game
    if (teamId !== game.homeTeamId && teamId !== game.awayTeamId) {
      return NextResponse.json({
        success: false,
        error: 'Selected team is not playing in this game'
      }, { status: 400 })
    }

    // Create or update the pick
    const pick = await prisma.pick.upsert({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId: gameId
        }
      },
      update: {
        teamId: teamId,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        gameId: gameId,
        teamId: teamId
      },
      include: {
        game: {
          include: {
            homeTeam: true,
            awayTeam: true
          }
        },
        team: true
      }
    })

    return NextResponse.json({
      success: true,
      pick,
      message: 'Pick saved successfully'
    })

  } catch (error) {
    console.error('Picks POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save pick',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json({
        success: false,
        error: 'Missing gameId parameter'
      }, { status: 400 })
    }

    // Check if game exists and hasn't started yet
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return NextResponse.json({
        success: false,
        error: 'Game not found'
      }, { status: 404 })
    }

    // Check if game has already started
    const now = new Date()
    if (new Date(game.gameDate) <= now) {
      return NextResponse.json({
        success: false,
        error: 'Cannot remove picks for games that have already started'
      }, { status: 400 })
    }

    // Delete the pick
    await prisma.pick.delete({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId: gameId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pick removed successfully'
    })

  } catch (error) {
    console.error('Picks DELETE API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to remove pick',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}