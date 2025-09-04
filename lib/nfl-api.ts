const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl'

export interface ESPNGame {
  id: string
  date: string
  name: string
  shortName: string
  season: {
    year: number
    type: number
  }
  week: {
    number: number
  }
  competitions: Array<{
    id: string
    date: string
    attendance: number
    type: {
      id: string
      abbreviation: string
    }
    timeValid: boolean
    neutralSite: boolean
    conferenceCompetition: boolean
    playByPlayAvailable: boolean
    recent: boolean
    venue: {
      id: string
      fullName: string
      address: {
        city: string
        state: string
      }
    }
    competitors: Array<{
      id: string
      uid: string
      type: string
      order: number
      homeAway: 'home' | 'away'
      team: {
        id: string
        uid: string
        location: string
        name: string
        abbreviation: string
        displayName: string
        shortDisplayName: string
        color: string
        alternateColor: string
        isActive: boolean
        venue: {
          id: string
        }
        links: Array<{
          language: string
          rel: string[]
          href: string
          text: string
          shortText: string
          isExternal: boolean
          isPremium: boolean
        }>
        logo: string
      }
      score: string
      linescores?: Array<{
        value: number
        displayValue: string
      }>
      statistics: Array<any>
      records: Array<{
        name: string
        abbreviation: string
        type: string
        summary: string
      }>
    }>
    notes: Array<any>
    status: {
      clock: number
      displayClock: string
      period: number
      type: {
        id: string
        name: string
        state: string
        completed: boolean
        description: string
        detail: string
        shortDetail: string
      }
    }
    broadcasts: Array<{
      market: string
      names: string[]
    }>
  }>
  links: Array<{
    language: string
    rel: string[]
    href: string
    text: string
    shortText: string
    isExternal: boolean
    isPremium: boolean
  }>
  weather?: {
    displayValue: string
    temperature: number
    highTemperature: number
    conditionId: string
    link: {
      language: string
      rel: string[]
      href: string
      text: string
      shortText: string
      isExternal: boolean
      isPremium: boolean
    }
  }
}

export interface ESPNScoreboard {
  leagues: Array<{
    id: string
    uid: string
    name: string
    abbreviation: string
    slug: string
    season: {
      year: number
      startDate: string
      endDate: string
      displayName: string
      type: {
        id: string
        type: number
        name: string
        abbreviation: string
      }
    }
    logos: Array<{
      href: string
      alt: string
      rel: string[]
      width: number
      height: number
    }>
    calendarType: string
    calendarIsWhitelist: boolean
    calendarStartDate: string
    calendarEndDate: string
    calendar: Array<string>
  }>
  season: {
    type: number
    year: number
  }
  week: {
    number: number
  }
  events: ESPNGame[]
}

export async function getCurrentWeekGames(): Promise<ESPNGame[]> {
  try {
    const response = await fetch(`${ESPN_API_BASE}/scoreboard`, {
      headers: {
        'User-Agent': 'NFL-PickEm-App/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`)
    }
    
    const data: ESPNScoreboard = await response.json()
    return data.events || []
  } catch (error) {
    console.error('Error fetching current week games:', error)
    throw error
  }
}

export async function getWeekGames(week: number, year: number = new Date().getFullYear()): Promise<ESPNGame[]> {
  try {
    const response = await fetch(
      `${ESPN_API_BASE}/scoreboard?dates=${year}&seasontype=2&week=${week}`,
      {
        headers: {
          'User-Agent': 'NFL-PickEm-App/1.0'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`)
    }
    
    const data: ESPNScoreboard = await response.json()
    return data.events || []
  } catch (error) {
    console.error(`Error fetching week ${week} games:`, error)
    throw error
  }
}

export async function getAllTeams() {
  try {
    const response = await fetch(`${ESPN_API_BASE}/teams`, {
      headers: {
        'User-Agent': 'NFL-PickEm-App/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.sports[0].leagues[0].teams || []
  } catch (error) {
    console.error('Error fetching teams:', error)
    throw error
  }
}

export function getCurrentNFLWeek(): number {
  const now = new Date()
  
  // Check environment variable first
  const envWeek = process.env.CURRENT_NFL_WEEK
  const envSeason = process.env.CURRENT_NFL_SEASON
  
  if (envWeek && envSeason) {
    return parseInt(envWeek, 10)
  }
  
  // 2025 NFL Season specific dates
  const nfl2025SeasonStart = new Date('2025-09-04') // Week 1 kickoff
  const nfl2025Week2 = new Date('2025-09-11')
  const nfl2025Week3 = new Date('2025-09-18')
  
  if (now < nfl2025SeasonStart) {
    return 1 // Pre-season or waiting for season start
  }
  
  // Calculate week based on actual NFL calendar
  const daysSinceStart = Math.floor((now.getTime() - nfl2025SeasonStart.getTime()) / (24 * 60 * 60 * 1000))
  const weeksSinceStart = Math.floor(daysSinceStart / 7)
  
  // NFL regular season is 18 weeks, then playoffs
  const calculatedWeek = Math.min(weeksSinceStart + 1, 18)
  
  return Math.max(calculatedWeek, 1)
}

export function getCurrentNFLSeason(): number {
  // Check environment variable first
  const envSeason = process.env.CURRENT_NFL_SEASON
  if (envSeason) {
    return parseInt(envSeason, 10)
  }
  
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // NFL season spans two calendar years, starts in fall
  if (now.getMonth() >= 8) { // September or later
    return currentYear
  } else {
    return currentYear - 1
  }
}