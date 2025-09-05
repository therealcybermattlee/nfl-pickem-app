'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GamesList } from '@/components/games/games-list'
import { Badge } from '@/components/ui/badge'
import { Target, Trophy, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

interface UserStats {
  totalPicks: number
  correctPicks: number
  completedGames: number
  winRate: number
  upcomingGames: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({ 
    totalPicks: 0, 
    correctPicks: 0, 
    completedGames: 0, 
    winRate: 0,
    upcomingGames: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/signin')
      return
    }

    fetchUserStats()
  }, [session, status, router])

  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true)
      
      // Fetch user picks and games in parallel
      const [picksResponse, gamesResponse] = await Promise.all([
        fetch('/api/picks'),
        fetch('/api/games')
      ])
      
      const [picksData, gamesData] = await Promise.all([
        picksResponse.json(),
        gamesResponse.json()
      ])
      
      // Handle both array and object response formats
      const picks = Array.isArray(picksData) ? picksData : (picksData.success ? picksData.picks : [])
      const games = Array.isArray(gamesData) ? gamesData : (gamesData.success ? gamesData.games : [])
      
      // Only proceed if we have valid data
      if (picks && games) {
        
        const completedGames = picks.filter((p: any) => 
          games.find((g: any) => g.id === p.gameId)?.isCompleted
        ).length
        
        const correctPicks = picks.filter((p: any) => {
          const game = games.find((g: any) => g.id === p.gameId)
          return game?.isCompleted && game.winnerTeamId === p.teamId
        }).length
        
        const upcomingGames = games.filter((g: any) => 
          !g.isCompleted && new Date(g.gameDate) > new Date()
        ).length
        
        setStats({
          totalPicks: picks.length,
          correctPicks,
          completedGames,
          winRate: completedGames > 0 ? Math.round((correctPicks / completedGames) * 100) : 0,
          upcomingGames
        })
      } else {
        console.error('Invalid data format received from API')
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  if (status === 'loading') {
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {session.user.name || session.user.username}!
            </h1>
            <p className="text-muted-foreground">
              Ready to make your NFL picks for this week?
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? '-' : stats.totalPicks}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Picks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {isLoadingStats ? '-' : stats.correctPicks}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? '-' : stats.winRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {isLoadingStats ? '-' : stats.upcomingGames}
                    </div>
                    <div className="text-sm text-muted-foreground">Games Left</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Make Picks
                </CardTitle>
                <CardDescription>
                  Choose winners for upcoming games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {stats.upcomingGames > 0 ? (
                      `${stats.upcomingGames} games available to pick`
                    ) : (
                      'All picks submitted for this week'
                    )}
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/picks">View Picks</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Games & Scores
                </CardTitle>
                <CardDescription>
                  View live scores and schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Track real-time game results and upcoming matchups
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/games">View Games</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  My Profile
                </CardTitle>
                <CardDescription>
                  View stats and manage account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Check your season performance and settings
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/profile">View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Overview */}
          {!isLoadingStats && stats.totalPicks > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Season Performance</CardTitle>
                <CardDescription>
                  Your pick performance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Accuracy</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stats.winRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{stats.winRate}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{stats.correctPicks}</div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{stats.completedGames - stats.correctPicks}</div>
                      <div className="text-xs text-muted-foreground">Incorrect</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-600">{stats.totalPicks - stats.completedGames}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Games Preview */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">This Week's Games</h2>
              <Button variant="outline" asChild>
                <Link href="/games">View All</Link>
              </Button>
            </div>
            <GamesList />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}