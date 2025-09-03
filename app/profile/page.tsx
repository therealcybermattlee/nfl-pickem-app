'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, Trophy, Target, Edit3, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface UserProfile {
  id: string
  name: string
  username?: string
  email: string
  image?: string
  createdAt: string
  isAdmin: boolean
  picks: Array<{
    id: string
    game: {
      homeTeam: { displayName: string; abbreviation: string }
      awayTeam: { displayName: string; abbreviation: string }
      gameDate: string
      isCompleted: boolean
      winnerTeamId?: string
    }
    team: { displayName: string; abbreviation: string }
    teamId: string
    isCorrect?: boolean
  }>
  poolMemberships: Array<{
    pool: {
      id: string
      name: string
      description?: string
    }
  }>
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Edit form state
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/signin')
      return
    }

    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch profile')
      }

      setProfile(data.user)
      setEditName(data.user.name || '')
      setEditUsername(data.user.username || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editName.trim(),
          username: editUsername.trim() || null
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfile(prev => prev ? { ...prev, ...data.user } : null)
      setIsEditing(false)
      
      // Update session to reflect changes
      await update({
        name: data.user.name,
        username: data.user.username
      })
      
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(profile?.name || '')
    setEditUsername(profile?.username || '')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

  if (!session || !profile) {
    return null
  }

  const correctPicks = profile.picks.filter(p => 
    p.game.isCompleted && p.game.winnerTeamId === p.teamId
  ).length
  const completedPicks = profile.picks.filter(p => p.game.isCompleted).length
  const winRate = completedPicks > 0 ? Math.round((correctPicks / completedPicks) * 100) : 0

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.image || ''} />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-2xl font-bold bg-background border border-input rounded px-2 py-1"
                          placeholder="Your name"
                        />
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="text-sm bg-background border border-input rounded px-2 py-1"
                          placeholder="Username (optional)"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold">{profile.name}</h1>
                        {profile.username && (
                          <p className="text-muted-foreground">@{profile.username}</p>
                        )}
                      </>
                    )}
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    {profile.isAdmin && (
                      <Badge variant="secondary" className="mt-1">
                        Administrator
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Member since {format(new Date(profile.createdAt), 'MMMM d, yyyy')}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{profile.picks.length}</div>
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
                    <div className="text-2xl font-bold">{correctPicks}</div>
                    <div className="text-sm text-muted-foreground">Correct Picks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div>
                  <div className="text-2xl font-bold">{profile.poolMemberships.length}</div>
                  <div className="text-sm text-muted-foreground">Pools Joined</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Picks */}
          {profile.picks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Picks</CardTitle>
                <CardDescription>
                  Your last {Math.min(profile.picks.length, 10)} picks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.picks.slice(0, 10).map((pick) => {
                    const isCorrect = pick.game.isCompleted && pick.game.winnerTeamId === pick.teamId
                    const isIncorrect = pick.game.isCompleted && pick.game.winnerTeamId !== pick.teamId
                    
                    return (
                      <div key={pick.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm">
                            <div className="font-medium">
                              {pick.game.awayTeam.abbreviation} @ {pick.game.homeTeam.abbreviation}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(pick.game.gameDate), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium">
                            Picked: {pick.team.abbreviation}
                          </div>
                          {pick.game.isCompleted && (
                            <Badge 
                              variant={isCorrect ? "default" : "destructive"}
                              className={isCorrect ? "bg-green-100 text-green-800" : ""}
                            >
                              {isCorrect ? "Correct" : "Incorrect"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pools */}
          {profile.poolMemberships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>My Pools</CardTitle>
                <CardDescription>
                  Competition pools you've joined
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {profile.poolMemberships.map(({ pool }) => (
                    <div key={pool.id} className="p-3 rounded-lg border">
                      <div className="font-medium">{pool.name}</div>
                      {pool.description && (
                        <div className="text-sm text-muted-foreground">
                          {pool.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}