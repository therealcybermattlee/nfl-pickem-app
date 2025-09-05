'use client'

import { useState, useEffect } from 'react'
import { GameWithTeams } from '@/types'
import { GameCard } from './game-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Calendar } from 'lucide-react'

interface GamesListProps {
  week?: number
  season?: number
  showPicks?: boolean
}

export function GamesList({ week, season, showPicks = false }: GamesListProps) {
  const [games, setGames] = useState<GameWithTeams[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [currentSeason, setCurrentSeason] = useState<number>(new Date().getFullYear())

  const fetchGames = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (week) params.append('week', week.toString())
      if (season) params.append('season', season.toString())
      
      const response = await fetch(`/api/games?${params.toString()}`)
      const data = await response.json()
      
      // Handle both array response and object response formats
      if (Array.isArray(data)) {
        // Direct array response
        setGames(data)
        setCurrentWeek(week || 1)
        setCurrentSeason(season || new Date().getFullYear())
      } else {
        // Object response format
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch games')
        }
        
        setGames(data.games || [])
        setCurrentWeek(data.week || week || 1)
        setCurrentSeason(data.season || season || new Date().getFullYear())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const syncGames = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/sync/games', { method: 'POST' })
      const data = await response.json()
      
      // Handle both array response and object response formats
      if (!Array.isArray(data) && !data.success) {
        throw new Error(data.error || 'Failed to sync games')
      }
      
      // Refresh games after sync
      await fetchGames()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [week, season])

  const completedGames = games.filter(g => g.isCompleted)
  const upcomingGames = games.filter(g => !g.isCompleted)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading games...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive mb-4">{error}</div>
          <Button onClick={fetchGames} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Week {currentWeek}, {currentSeason}
          </CardTitle>
          <CardDescription>
            No games found for this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Games may not be available yet, or you might need to sync the latest data.
            </p>
            <Button onClick={syncGames} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Latest Games
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Week {currentWeek}, {currentSeason}</h2>
          <Badge variant="outline">
            {games.length} game{games.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <Button onClick={syncGames} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Sync Games
        </Button>
      </div>

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            Upcoming Games
            <Badge variant="secondary" className="ml-2">
              {upcomingGames.length}
            </Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                showPicks={showPicks} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            Completed Games
            <Badge variant="secondary" className="ml-2">
              {completedGames.length}
            </Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {completedGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                showPicks={showPicks} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}