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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        isAdmin: true,
        picks: {
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
          },
          take: 10 // Recent picks only
        },
        poolMemberships: {
          include: {
            pool: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Profile GET API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, username, image } = body

    // Validate input
    if (!name || name.trim().length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 })
    }

    if (username && username.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Username must be at least 3 characters'
      }, { status: 400 })
    }

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username.trim(),
          NOT: { id: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: 'Username is already taken'
        }, { status: 400 })
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        username: username?.trim() || null,
        image: image || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        isAdmin: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile PATCH API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}