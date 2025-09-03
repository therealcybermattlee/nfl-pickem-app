'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WeeklyUserStats, SeasonUserStats } from '@/lib/scoring'
import { Trophy, Calendar, RefreshCw, BarChart3 } from 'lucide-react'

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<WeeklyUserStats[] | SeasonUserStats[]>([])
  const [viewType, setViewType] = useState<'week' | 'season'>('week')
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [currentSeason, setSeason] = useState<number>(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/signin')
      return
    }

    fetchLeaderboard()
  }, [session, status, router, viewType])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        type: viewType
      })

      const response = await fetch(`/api/leaderboard?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch leaderboard')
      }

      setLeaderboard(data.leaderboard)
      setCurrentWeek(data.week || 1)
      setSeason(data.season)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecalculateScores = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'recalculate',
          season: currentSeason
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to recalculate scores')
      }

      // Refresh leaderboard after recalculation
      await fetchLeaderboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recalculation failed')
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">Loading leaderboard...</div>
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
              <Button onClick={fetchLeaderboard} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // Find current user's position
  const userPosition = leaderboard.findIndex(user => user.userId === session.user.id) + 1
  const userStats = leaderboard.find(user => user.userId === session.user.id)

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Trophy className="h-8 w-8 mr-2" />
                Leaderboard
              </h1>
              <p className="text-muted-foreground">
                See how you rank against other players
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={fetchLeaderboard}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {session.user.isAdmin && (
                <Button
                  onClick={handleRecalculateScores}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Recalculate
                </Button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewType === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('week')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly
            </Button>
            <Button
              variant={viewType === 'season' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('season')}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Season
            </Button>
          </div>

          {/* User's Position Card */}
          {userStats && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <span className="text-lg font-bold text-blue-600">#{userPosition}</span>
                    </div>
                    <div>
                      <div className="font-medium">Your Position</div>
                      <div className="text-sm text-muted-foreground">
                        {viewType === 'week' ? `Week ${currentWeek}` : `${currentSeason} Season`} standings
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{userStats.points}</div>
                      <div className="text-xs text-muted-foreground">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {userStats.correctPicks}/{userStats.totalPicks}
                      </div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{userStats.accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard Table */}
          <LeaderboardTable
            leaderboard={leaderboard}
            type={viewType}
            week={viewType === 'week' ? currentWeek : undefined}
            season={currentSeason}
          />

          {/* Additional Stats for Season View */}
          {viewType === 'season' && leaderboard.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Season Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {leaderboard.reduce((sum, user) => sum + user.totalPicks, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Picks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {leaderboard.reduce((sum, user) => sum + user.correctPicks, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct Picks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {(leaderboard.reduce((sum, user) => sum + user.accuracy, 0) / leaderboard.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Average Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {leaderboard.reduce((sum, user) => sum + user.points, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}