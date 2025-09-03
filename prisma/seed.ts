import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NFL_TEAMS = [
  { name: 'Arizona Cardinals', displayName: 'Cardinals', abbreviation: 'ARI' },
  { name: 'Atlanta Falcons', displayName: 'Falcons', abbreviation: 'ATL' },
  { name: 'Baltimore Ravens', displayName: 'Ravens', abbreviation: 'BAL' },
  { name: 'Buffalo Bills', displayName: 'Bills', abbreviation: 'BUF' },
  { name: 'Carolina Panthers', displayName: 'Panthers', abbreviation: 'CAR' },
  { name: 'Chicago Bears', displayName: 'Bears', abbreviation: 'CHI' },
  { name: 'Cincinnati Bengals', displayName: 'Bengals', abbreviation: 'CIN' },
  { name: 'Cleveland Browns', displayName: 'Browns', abbreviation: 'CLE' },
  { name: 'Dallas Cowboys', displayName: 'Cowboys', abbreviation: 'DAL' },
  { name: 'Denver Broncos', displayName: 'Broncos', abbreviation: 'DEN' },
  { name: 'Detroit Lions', displayName: 'Lions', abbreviation: 'DET' },
  { name: 'Green Bay Packers', displayName: 'Packers', abbreviation: 'GB' },
  { name: 'Houston Texans', displayName: 'Texans', abbreviation: 'HOU' },
  { name: 'Indianapolis Colts', displayName: 'Colts', abbreviation: 'IND' },
  { name: 'Jacksonville Jaguars', displayName: 'Jaguars', abbreviation: 'JAX' },
  { name: 'Kansas City Chiefs', displayName: 'Chiefs', abbreviation: 'KC' },
  { name: 'Las Vegas Raiders', displayName: 'Raiders', abbreviation: 'LV' },
  { name: 'Los Angeles Chargers', displayName: 'Chargers', abbreviation: 'LAC' },
  { name: 'Los Angeles Rams', displayName: 'Rams', abbreviation: 'LAR' },
  { name: 'Miami Dolphins', displayName: 'Dolphins', abbreviation: 'MIA' },
  { name: 'Minnesota Vikings', displayName: 'Vikings', abbreviation: 'MIN' },
  { name: 'New England Patriots', displayName: 'Patriots', abbreviation: 'NE' },
  { name: 'New Orleans Saints', displayName: 'Saints', abbreviation: 'NO' },
  { name: 'New York Giants', displayName: 'Giants', abbreviation: 'NYG' },
  { name: 'New York Jets', displayName: 'Jets', abbreviation: 'NYJ' },
  { name: 'Philadelphia Eagles', displayName: 'Eagles', abbreviation: 'PHI' },
  { name: 'Pittsburgh Steelers', displayName: 'Steelers', abbreviation: 'PIT' },
  { name: 'San Francisco 49ers', displayName: '49ers', abbreviation: 'SF' },
  { name: 'Seattle Seahawks', displayName: 'Seahawks', abbreviation: 'SEA' },
  { name: 'Tampa Bay Buccaneers', displayName: 'Buccaneers', abbreviation: 'TB' },
  { name: 'Tennessee Titans', displayName: 'Titans', abbreviation: 'TEN' },
  { name: 'Washington Commanders', displayName: 'Commanders', abbreviation: 'WAS' }
]

async function main() {
  console.log('Start seeding...')

  // Seed NFL teams
  for (const team of NFL_TEAMS) {
    const result = await prisma.team.upsert({
      where: { abbreviation: team.abbreviation },
      update: {},
      create: {
        name: team.name,
        displayName: team.displayName,
        abbreviation: team.abbreviation
      }
    })
    console.log(`Created/Updated team: ${result.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })