'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { PickGameCard } from '@/components/games/pick-game-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameWithTeams, PickWithGame } from '@/types'
import { RefreshCw, Target } from 'lucide-react'
import { toast } from 'sonner'

export default function PicksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [games, setGames] = useState<GameWithTeams[]>([])
  const [picks, setPicks] = useState<PickWithGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/signin')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch games and picks in parallel
      const [gamesResponse, picksResponse] = await Promise.all([
        fetch('/api/games'),
        fetch('/api/picks')
      ])

      const [gamesData, picksData] = await Promise.all([
        gamesResponse.json(),
        picksResponse.json()
      ])

      if (!gamesData.success) {
        throw new Error(gamesData.error || 'Failed to fetch games')
      }

      if (!picksData.success) {
        throw new Error(picksData.error || 'Failed to fetch picks')
      }

      setGames(gamesData.games)
      setPicks(picksData.picks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePickTeam = async (gameId: string, teamId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId, teamId })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save pick')
      }

      // Update local picks state
      setPicks(prev => {
        const existingPickIndex = prev.findIndex(p => p.gameId === gameId)
        const newPick = data.pick

        if (existingPickIndex >= 0) {
          // Update existing pick
          const updated = [...prev]
          updated[existingPickIndex] = newPick
          return updated
        } else {
          // Add new pick
          return [...prev, newPick]
        }
      })

      toast.success('Pick saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save pick')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemovePick = async (gameId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/picks?gameId=${gameId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove pick')
      }

      // Remove pick from local state
      setPicks(prev => prev.filter(p => p.gameId !== gameId))

      toast.success('Pick removed!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove pick')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive mb-4">{error}</div>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const upcomingGames = games.filter(g => !g.isCompleted && new Date(g.gameDate) > new Date())
  const liveGames = games.filter(g => !g.isCompleted && new Date(g.gameDate) <= new Date())
  const completedGames = games.filter(g => g.isCompleted)

  const getPickForGame = (gameId: string) => picks.find(p => p.gameId === gameId)

  const totalPicks = picks.length
  const completedPicks = picks.filter(p => games.find(g => g.id === p.gameId)?.isCompleted).length
  const correctPicks = picks.filter(p => {
    const game = games.find(g => g.id === p.gameId)
    return game?.isCompleted && game.winnerTeamId === p.teamId
  }).length

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Target className="h-8 w-8 mr-2" />
                Make Your Picks
              </h1>
              <p className="text-muted-foreground">
                Choose the winning teams for this week's games
              </p>
            </div>
            
            <Button onClick={fetchData} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{totalPicks}</div>
                <div className="text-sm text-muted-foreground">Total Picks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{upcomingGames.length}</div>
                <div className="text-sm text-muted-foreground">Games Left</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{correctPicks}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {completedPicks > 0 ? Math.round((correctPicks / completedPicks) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Games */}
          {upcomingGames.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                Make Your Picks
                <Badge variant="secondary" className="ml-2">
                  {upcomingGames.length}
                </Badge>
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingGames.map((game) => (
                  <PickGameCard
                    key={game.id}
                    game={game}
                    userPick={getPickForGame(game.id)}
                    onPickTeam={handlePickTeam}
                    onRemovePick={handleRemovePick}
                    isLoading={isSubmitting}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Games */}
          {liveGames.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                Games in Progress
                <Badge variant="secondary" className="ml-2">
                  {liveGames.length}
                </Badge>
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {liveGames.map((game) => (
                  <PickGameCard
                    key={game.id}
                    game={game}
                    userPick={getPickForGame(game.id)}
                    onPickTeam={handlePickTeam}
                    onRemovePick={handleRemovePick}
                    isLoading={isSubmitting}
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
                  <PickGameCard
                    key={game.id}
                    game={game}
                    userPick={getPickForGame(game.id)}
                    onPickTeam={handlePickTeam}
                    onRemovePick={handleRemovePick}
                    isLoading={isSubmitting}
                  />
                ))}
              </div>
            </div>
          )}

          {games.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No Games Available</CardTitle>
                <CardDescription>
                  No games found for this week. Check back later or sync the latest games.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}