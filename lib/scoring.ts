import { prisma } from './prisma'

export interface WeeklyUserStats {
  userId: string
  username: string | null
  name: string | null
  totalPicks: number
  correctPicks: number
  incorrectPicks: number
  pendingPicks: number
  accuracy: number
  points: number
}

export interface SeasonUserStats extends WeeklyUserStats {
  weeklyBreakdown: Array<{
    week: number
    totalPicks: number
    correctPicks: number
    accuracy: number
    points: number
  }>
}

export async function calculateWeeklyScores(week: number, season: number): Promise<WeeklyUserStats[]> {
  try {
    // Get all users with picks for the specified week
    const users = await prisma.user.findMany({
      where: {
        picks: {
          some: {
            game: {
              week: week,
              season: season
            }
          }
        }
      },
      include: {
        picks: {
          where: {
            game: {
              week: week,
              season: season
            }
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
        }
      }
    })

    const userStats: WeeklyUserStats[] = users.map(user => {
      const picks = user.picks
      const totalPicks = picks.length
      
      const correctPicks = picks.filter(pick => 
        pick.game.isCompleted && pick.game.winnerTeamId === pick.teamId
      ).length
      
      const incorrectPicks = picks.filter(pick => 
        pick.game.isCompleted && pick.game.winnerTeamId && pick.game.winnerTeamId !== pick.teamId
      ).length
      
      const pendingPicks = picks.filter(pick => !pick.game.isCompleted).length
      const completedPicks = correctPicks + incorrectPicks
      const accuracy = completedPicks > 0 ? (correctPicks / completedPicks) * 100 : 0
      
      // Simple scoring: 1 point per correct pick
      const points = correctPicks

      return {
        userId: user.id,
        username: user.username,
        name: user.name,
        totalPicks,
        correctPicks,
        incorrectPicks,
        pendingPicks,
        accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimals
        points
      }
    })

    // Sort by accuracy, then by correct picks
    return userStats.sort((a, b) => {
      if (a.accuracy !== b.accuracy) {
        return b.accuracy - a.accuracy
      }
      return b.correctPicks - a.correctPicks
    })

  } catch (error) {
    console.error('Error calculating weekly scores:', error)
    throw error
  }
}

export async function calculateSeasonScores(season: number): Promise<SeasonUserStats[]> {
  try {
    // Get all users with picks for the season
    const users = await prisma.user.findMany({
      where: {
        picks: {
          some: {
            game: {
              season: season
            }
          }
        }
      },
      include: {
        picks: {
          where: {
            game: {
              season: season
            }
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
        }
      }
    })

    const userSeasonStats: SeasonUserStats[] = []

    for (const user of users) {
      const allPicks = user.picks
      const totalPicks = allPicks.length
      
      const correctPicks = allPicks.filter(pick => 
        pick.game.isCompleted && pick.game.winnerTeamId === pick.teamId
      ).length
      
      const incorrectPicks = allPicks.filter(pick => 
        pick.game.isCompleted && pick.game.winnerTeamId && pick.game.winnerTeamId !== pick.teamId
      ).length
      
      const pendingPicks = allPicks.filter(pick => !pick.game.isCompleted).length
      const completedPicks = correctPicks + incorrectPicks
      const accuracy = completedPicks > 0 ? (correctPicks / completedPicks) * 100 : 0
      const points = correctPicks

      // Calculate weekly breakdown
      const weeklyBreakdown: Array<{
        week: number
        totalPicks: number
        correctPicks: number
        accuracy: number
        points: number
      }> = []

      // Group picks by week
      const picksByWeek = new Map<number, typeof allPicks>()
      allPicks.forEach(pick => {
        const week = pick.game.week
        if (!picksByWeek.has(week)) {
          picksByWeek.set(week, [])
        }
        picksByWeek.get(week)!.push(pick)
      })

      // Calculate stats for each week
      for (const [week, weekPicks] of picksByWeek.entries()) {
        const weekTotal = weekPicks.length
        const weekCorrect = weekPicks.filter(pick => 
          pick.game.isCompleted && pick.game.winnerTeamId === pick.teamId
        ).length
        const weekIncorrect = weekPicks.filter(pick => 
          pick.game.isCompleted && pick.game.winnerTeamId && pick.game.winnerTeamId !== pick.teamId
        ).length
        const weekCompleted = weekCorrect + weekIncorrect
        const weekAccuracy = weekCompleted > 0 ? (weekCorrect / weekCompleted) * 100 : 0

        weeklyBreakdown.push({
          week,
          totalPicks: weekTotal,
          correctPicks: weekCorrect,
          accuracy: Math.round(weekAccuracy * 100) / 100,
          points: weekCorrect
        })
      }

      // Sort weekly breakdown by week
      weeklyBreakdown.sort((a, b) => a.week - b.week)

      userSeasonStats.push({
        userId: user.id,
        username: user.username,
        name: user.name,
        totalPicks,
        correctPicks,
        incorrectPicks,
        pendingPicks,
        accuracy: Math.round(accuracy * 100) / 100,
        points,
        weeklyBreakdown
      })
    }

    // Sort by points, then by accuracy
    return userSeasonStats.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points
      }
      return b.accuracy - a.accuracy
    })

  } catch (error) {
    console.error('Error calculating season scores:', error)
    throw error
  }
}

export async function updatePickResults(gameId: string): Promise<void> {
  try {
    // Get the completed game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        picks: true
      }
    })

    if (!game || !game.isCompleted || !game.winnerTeamId) {
      return // Game not completed or no winner
    }

    // Update all picks for this game
    const updatePromises = game.picks.map(pick => {
      const isCorrect = pick.teamId === game.winnerTeamId
      const points = isCorrect ? 1 : 0

      return prisma.pick.update({
        where: { id: pick.id },
        data: {
          isCorrect,
          points
        }
      })
    })

    await Promise.all(updatePromises)
    console.log(`Updated ${game.picks.length} picks for completed game ${gameId}`)

  } catch (error) {
    console.error('Error updating pick results:', error)
    throw error
  }
}

export async function recalculateAllScores(season: number): Promise<void> {
  try {
    console.log(`Recalculating all scores for ${season} season...`)
    
    // Get all completed games for the season
    const completedGames = await prisma.game.findMany({
      where: {
        season: season,
        isCompleted: true,
        winnerTeamId: { not: null }
      },
      include: {
        picks: true
      }
    })

    // Update pick results for each completed game
    for (const game of completedGames) {
      await updatePickResults(game.id)
    }

    console.log(`Recalculation complete for ${completedGames.length} games`)

  } catch (error) {
    console.error('Error recalculating scores:', error)
    throw error
  }
}