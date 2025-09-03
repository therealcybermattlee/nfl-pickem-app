'use client'

import { useState } from 'react'
import { GameWithTeams, PickWithGame } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Check, X } from 'lucide-react'

interface PickGameCardProps {
  game: GameWithTeams
  userPick?: PickWithGame
  onPickTeam: (gameId: string, teamId: string) => Promise<void>
  onRemovePick: (gameId: string) => Promise<void>
  isLoading?: boolean
}

export function PickGameCard({ 
  game, 
  userPick, 
  onPickTeam, 
  onRemovePick, 
  isLoading = false 
}: PickGameCardProps) {
  const [localLoading, setLocalLoading] = useState(false)
  const gameTime = new Date(game.gameDate)
  const isGameStarted = gameTime <= new Date()
  const isCompleted = game.isCompleted
  const canMakePick = !isGameStarted && !isCompleted

  const handlePickTeam = async (teamId: string) => {
    if (!canMakePick || localLoading) return
    
    setLocalLoading(true)
    try {
      await onPickTeam(game.id, teamId)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleRemovePick = async () => {
    if (!canMakePick || localLoading || !userPick) return
    
    setLocalLoading(true)
    try {
      await onRemovePick(game.id)
    } finally {
      setLocalLoading(false)
    }
  }

  const getGameStatus = () => {
    if (isCompleted) {
      return { text: 'Final', variant: 'destructive' as const }
    } else if (isGameStarted) {
      return { text: 'In Progress', variant: 'secondary' as const }
    } else {
      return { text: format(gameTime, 'MMM d, h:mm a'), variant: 'outline' as const }
    }
  }

  const status = getGameStatus()
  const isTeamSelected = (teamId: string) => userPick?.teamId === teamId
  const loading = isLoading || localLoading

  // Determine if pick was correct (only for completed games)
  const getPickResult = () => {
    if (!isCompleted || !userPick || !game.winnerTeamId) return null
    return userPick.teamId === game.winnerTeamId ? 'correct' : 'incorrect'
  }

  const pickResult = getPickResult()

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant={status.variant} className="text-xs">
            {status.text}
          </Badge>
          {userPick && (
            <div className="flex items-center space-x-2">
              {pickResult === 'correct' && (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Correct
                </Badge>
              )}
              {pickResult === 'incorrect' && (
                <Badge variant="destructive" className="text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Incorrect
                </Badge>
              )}
              {canMakePick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePick}
                  disabled={loading}
                  className="text-xs"
                >
                  Clear Pick
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Teams and Pick Options */}
        <div className="space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              {game.awayTeam.logo && (
                <img 
                  src={game.awayTeam.logo} 
                  alt={`${game.awayTeam.displayName} logo`}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <div className="font-medium">{game.awayTeam.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  @ {game.homeTeam.abbreviation}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isCompleted && (
                <div className="text-lg font-bold">
                  {game.awayScore}
                </div>
              )}
              {canMakePick ? (
                <Button
                  variant={isTeamSelected(game.awayTeamId) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePickTeam(game.awayTeamId)}
                  disabled={loading}
                >
                  {isTeamSelected(game.awayTeamId) ? 'Picked' : 'Pick'}
                </Button>
              ) : (
                isTeamSelected(game.awayTeamId) && (
                  <Badge variant="secondary">Your Pick</Badge>
                )
              )}
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              {game.homeTeam.logo && (
                <img 
                  src={game.homeTeam.logo} 
                  alt={`${game.homeTeam.displayName} logo`}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <div className="font-medium">{game.homeTeam.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  vs {game.awayTeam.abbreviation}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isCompleted && (
                <div className="text-lg font-bold">
                  {game.homeScore}
                </div>
              )}
              {canMakePick ? (
                <Button
                  variant={isTeamSelected(game.homeTeamId) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePickTeam(game.homeTeamId)}
                  disabled={loading}
                >
                  {isTeamSelected(game.homeTeamId) ? 'Picked' : 'Pick'}
                </Button>
              ) : (
                isTeamSelected(game.homeTeamId) && (
                  <Badge variant="secondary">Your Pick</Badge>
                )
              )}
            </div>
          </div>
        </div>

        {/* Odds Information */}
        {(game.homeSpread || game.overUnder || game.homeMoneyline || game.awayMoneyline) && (
          <div className="mt-3 pt-3 border-t bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-2 text-center font-medium">Betting Odds</div>
            
            {/* Spread with Team Context */}
            {game.homeSpread && (
              <div className="mb-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">{game.awayTeam.abbreviation}:</span>
                    <span className="font-medium text-blue-600">
                      {game.homeSpread > 0 ? `-${Math.abs(game.homeSpread)}` : `+${Math.abs(game.homeSpread)}`}
                    </span>
                    {game.homeSpread > 0 && <span className="text-[10px] text-red-600">(Favorite)</span>}
                    {game.homeSpread < 0 && <span className="text-[10px] text-green-600">(Underdog)</span>}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">{game.homeTeam.abbreviation}:</span>
                    <span className="font-medium text-blue-600">
                      {game.homeSpread > 0 ? `+${game.homeSpread}` : `-${Math.abs(game.homeSpread)}`}
                    </span>
                    {game.homeSpread > 0 && <span className="text-[10px] text-green-600">(Underdog)</span>}
                    {game.homeSpread < 0 && <span className="text-[10px] text-red-600">(Favorite)</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Over/Under */}
              {game.overUnder && (
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Total Points</div>
                  <div className="font-medium">{game.overUnder}</div>
                </div>
              )}
              
              {/* Favorite Indicator */}
              {game.homeSpread && (
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Spread</div>
                  <div className="font-medium">
                    {Math.abs(game.homeSpread)} points
                  </div>
                </div>
              )}
            </div>

            {/* Moneylines */}
            {(game.homeMoneyline || game.awayMoneyline) && (
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-[10px]">
                  {game.awayMoneyline && (
                    <div>
                      <span className="text-muted-foreground">{game.awayTeam.abbreviation} Win:</span>
                      <span className="ml-1 font-medium">{game.awayMoneyline > 0 ? `+${game.awayMoneyline}` : game.awayMoneyline}</span>
                    </div>
                  )}
                  {game.homeMoneyline && (
                    <div>
                      <span className="text-muted-foreground">{game.homeTeam.abbreviation} Win:</span>
                      <span className="ml-1 font-medium">{game.homeMoneyline > 0 ? `+${game.homeMoneyline}` : game.homeMoneyline}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Odds Update Time */}
            {game.oddsUpdatedAt && (
              <div className="mt-2 text-center">
                <div className="text-[9px] text-muted-foreground">
                  Updated: {format(new Date(game.oddsUpdatedAt), 'MMM d, h:mm a')}
                  {game.oddsProvider && ` • ${game.oddsProvider}`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pick Status */}
        {!canMakePick && !userPick && (
          <div className="mt-3 text-center text-sm text-muted-foreground">
            {isGameStarted ? 'Picking closed' : 'No pick made'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}