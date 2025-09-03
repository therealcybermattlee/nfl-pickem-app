'use client'

import { WeeklyUserStats, SeasonUserStats } from '@/lib/scoring'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, Target } from 'lucide-react'

interface LeaderboardTableProps {
  leaderboard: WeeklyUserStats[] | SeasonUserStats[]
  type: 'week' | 'season'
  week?: number
  season: number
}

export function LeaderboardTable({ leaderboard, type, week, season }: LeaderboardTableProps) {
  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>
    }
  }

  const getRankBadge = (position: number) => {
    switch (position) {
      case 1:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">1st</Badge>
      case 2:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">2nd</Badge>
      case 3:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">3rd</Badge>
      default:
        return <Badge variant="outline">#{position}</Badge>
    }
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No picks found for this {type === 'week' ? 'week' : 'season'}.</p>
            <p className="text-sm mt-1">
              Users will appear here once they start making picks.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2" />
          {type === 'week' ? `Week ${week}` : `${season} Season`} Leaderboard
        </CardTitle>
        <CardDescription>
          {type === 'week' 
            ? `Weekly standings for Week ${week}, ${season}`
            : `Overall season standings for ${season}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((user, index) => {
            const position = index + 1
            const isTopThree = position <= 3

            return (
              <div
                key={user.userId}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isTopThree ? 'bg-gradient-to-r from-muted/50 to-background' : 'bg-background'
                } ${position === 1 ? 'border-yellow-200 shadow-sm' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(position)}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium flex items-center space-x-2">
                      <span>{user.name || user.username || 'Unknown User'}</span>
                      {isTopThree && getRankBadge(position)}
                    </div>
                    {user.username && user.name && (
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <div className="text-sm text-muted-foreground">Points</div>
                    <div className="text-lg font-bold text-blue-600">{user.points}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                    <div className="text-lg font-bold text-green-600">
                      {user.correctPicks}/{user.totalPicks}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                    <div className="text-lg font-bold">
                      {user.accuracy.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Stats Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{leaderboard.length}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.max(...leaderboard.map(u => u.totalPicks))}
              </div>
              <div className="text-sm text-muted-foreground">Most Picks</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.max(...leaderboard.map(u => u.correctPicks))}
              </div>
              <div className="text-sm text-muted-foreground">Most Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.max(...leaderboard.map(u => u.accuracy)).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Best Accuracy</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}