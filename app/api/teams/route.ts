
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const teams = await prisma.team.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({
      success: true,
      teams,
      count: teams.length
    })
    
  } catch (error) {
    console.error('Teams API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, displayName, abbreviation, logo, color } = body
    
    if (!name || !displayName || !abbreviation) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, displayName, abbreviation'
      }, { status: 400 })
    }
    
    // Check if team with abbreviation already exists
    const existingTeam = await prisma.team.findUnique({
      where: { abbreviation }
    })
    
    if (existingTeam) {
      return NextResponse.json({
        success: false,
        error: 'Team with this abbreviation already exists'
      }, { status: 400 })
    }
    
    const team = await prisma.team.create({
      data: {
        name,
        displayName,
        abbreviation,
        logo: logo || null,
        color: color || null
      }
    })
    
    return NextResponse.json({
      success: true,
      team,
      message: 'Team created successfully'
    })
    
  } catch (error) {
    console.error('Teams POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create team',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}