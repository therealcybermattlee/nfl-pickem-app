import { prisma } from './prisma'
import { getCurrentWeekGames, getWeekGames, ESPNGame, getCurrentNFLWeek, getCurrentNFLSeason } from './nfl-api'
import { updatePickResults } from './scoring'

export async function syncTeamsFromESPN() {
  try {
    console.log('Starting team sync from ESPN...')
    
    // Get current games to extract team data
    const games = await getCurrentWeekGames()
    
    for (const game of games) {
      for (const competition of game.competitions) {
        for (const competitor of competition.competitors) {
          const team = competitor.team
          
          await prisma.team.upsert({
            where: { abbreviation: team.abbreviation },
            update: {
              name: team.location + ' ' + team.name,
              displayName: team.displayName,
              logo: team.logo,
              color: '#' + team.color
            },
            create: {
              name: team.location + ' ' + team.name,
              displayName: team.displayName,
              abbreviation: team.abbreviation,
              logo: team.logo,
              color: '#' + team.color
            }
          })
          
          console.log(`Synced team: ${team.displayName}`)
        }
      }
    }
    
    console.log('Team sync completed!')
  } catch (error) {
    console.error('Error syncing teams:', error)
    throw error
  }
}

export async function syncGamesFromESPN(week?: number, season?: number) {
  try {
    const currentWeek = week || getCurrentNFLWeek()
    const currentSeason = season || getCurrentNFLSeason()
    
    console.log(`Syncing games for Week ${currentWeek}, ${currentSeason} season...`)
    
    const espnGames = week 
      ? await getWeekGames(week, season)
      : await getCurrentWeekGames()
    
    for (const espnGame of espnGames) {
      const competition = espnGame.competitions[0]
      if (!competition) continue
      
      const homeTeam = competition.competitors.find(c => c.homeAway === 'home')
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away')
      
      if (!homeTeam || !awayTeam) continue
      
      // Find teams in our database
      const homeTeamRecord = await prisma.team.findUnique({
        where: { abbreviation: homeTeam.team.abbreviation }
      })
      
      const awayTeamRecord = await prisma.team.findUnique({
        where: { abbreviation: awayTeam.team.abbreviation }
      })
      
      if (!homeTeamRecord || !awayTeamRecord) {
        console.log(`Skipping game: Missing team data for ${homeTeam.team.abbreviation} vs ${awayTeam.team.abbreviation}`)
        continue
      }
      
      const gameDate = new Date(competition.date)
      const isCompleted = competition.status.type.completed
      const homeScore = isCompleted ? parseInt(homeTeam.score) : null
      const awayScore = isCompleted ? parseInt(awayTeam.score) : null
      
      let winnerTeamId = null
      if (isCompleted && homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) {
          winnerTeamId = homeTeamRecord.id
        } else if (awayScore > homeScore) {
          winnerTeamId = awayTeamRecord.id
        }
        // null for ties
      }
      
      await prisma.game.upsert({
        where: { espnId: espnGame.id },
        update: {
          gameDate,
          isCompleted,
          homeScore,
          awayScore,
          winnerTeamId
        },
        create: {
          espnId: espnGame.id,
          week: currentWeek,
          season: currentSeason,
          homeTeamId: homeTeamRecord.id,
          awayTeamId: awayTeamRecord.id,
          gameDate,
          isCompleted,
          homeScore,
          awayScore,
          winnerTeamId
        }
      })
      
      console.log(`Synced game: ${awayTeam.team.abbreviation} @ ${homeTeam.team.abbreviation}`)
    }
    
    console.log(`Game sync completed for Week ${currentWeek}!`)
  } catch (error) {
    console.error('Error syncing games:', error)
    throw error
  }
}

export async function updateGameScores() {
  try {
    console.log('Updating game scores...')
    
    // Get current incomplete games
    const incompleteGames = await prisma.game.findMany({
      where: {
        isCompleted: false,
        week: getCurrentNFLWeek(),
        season: getCurrentNFLSeason()
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })
    
    if (incompleteGames.length === 0) {
      console.log('No incomplete games to update')
      return
    }
    
    // Get current ESPN data
    const espnGames = await getCurrentWeekGames()
    
    for (const game of incompleteGames) {
      const espnGame = espnGames.find(eg => eg.id === game.espnId)
      if (!espnGame) continue
      
      const competition = espnGame.competitions[0]
      if (!competition) continue
      
      const homeTeam = competition.competitors.find(c => c.homeAway === 'home')
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away')
      
      if (!homeTeam || !awayTeam) continue
      
      const isCompleted = competition.status.type.completed
      const homeScore = isCompleted ? parseInt(homeTeam.score) : null
      const awayScore = isCompleted ? parseInt(awayTeam.score) : null
      
      let winnerTeamId = null
      if (isCompleted && homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) {
          winnerTeamId = game.homeTeamId
        } else if (awayScore > homeScore) {
          winnerTeamId = game.awayTeamId
        }
      }
      
      await prisma.game.update({
        where: { id: game.id },
        data: {
          isCompleted,
          homeScore,
          awayScore,
          winnerTeamId
        }
      })
      
      console.log(`Updated scores: ${game.awayTeam.abbreviation} ${awayScore || 0} - ${game.homeTeam.abbreviation} ${homeScore || 0}`)
      
      // If game is newly completed, update pick results
      if (isCompleted && winnerTeamId) {
        await updatePickResults(game.id)
      }
    }
    
    console.log('Game score update completed!')
  } catch (error) {
    console.error('Error updating game scores:', error)
    throw error
  }
}

export async function syncCurrentWeek() {
  console.log('Starting full sync for current week...')
  
  try {
    // First sync teams to make sure we have all team data
    await syncTeamsFromESPN()
    
    // Then sync games for current week
    await syncGamesFromESPN()
    
    // Update any incomplete game scores
    await updateGameScores()
    
    console.log('Full sync completed successfully!')
  } catch (error) {
    console.error('Error during full sync:', error)
    throw error
  }
}