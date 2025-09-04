import { User, Team, Game, Pick, Pool, PoolMember } from '@prisma/client'

export type UserWithPicks = User & {
  picks: Pick[]
}

export type GameWithTeams = Game & {
  homeTeam: Team
  awayTeam: Team
}

export type GameWithTeamsAndPicks = GameWithTeams & {
  picks: (Pick & { user: User; team: Team })[]
}

export type PickWithGame = Pick & {
  game: GameWithTeams
  team: Team
}

export type PoolWithMembers = Pool & {
  members: (PoolMember & { user: User })[]
}

export type WeeklyStanding = {
  userId: string
  username: string
  correctPicks: number
  totalPicks: number
  percentage: number
  points: number
}

export type SeasonStanding = WeeklyStanding & {
  weeklyResults: {
    week: number
    correctPicks: number
    totalPicks: number
    points: number
  }[]
}