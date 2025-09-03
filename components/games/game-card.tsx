import { GameWithTeams } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface GameCardProps {
  game: GameWithTeams
  showPicks?: boolean
}

export function GameCard({ game, showPicks = false }: GameCardProps) {
  const gameTime = new Date(game.gameDate)
  const isGameStarted = gameTime <= new Date()
  const isCompleted = game.isCompleted

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

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Away Team */}
          <div className="flex items-center space-x-3 flex-1">
            {game.awayTeam.logo && (
              <img 
                src={game.awayTeam.logo} 
                alt={`${game.awayTeam.displayName} logo`}
                className="w-8 h-8 object-contain"
              />
            )}
            <div>
              <div className="font-medium text-sm">{game.awayTeam.displayName}</div>
              <div className="text-xs text-muted-foreground">{game.awayTeam.abbreviation}</div>
            </div>
            {isCompleted && (
              <div className="text-lg font-bold">
                {game.awayScore}
              </div>
            )}
          </div>

          {/* VS / Status */}
          <div className="text-center px-4">
            <div className="text-xs text-muted-foreground mb-1">
              {isCompleted ? '' : '@'}
            </div>
            <Badge variant={status.variant} className="text-xs">
              {status.text}
            </Badge>
          </div>

          {/* Home Team */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            {isCompleted && (
              <div className="text-lg font-bold">
                {game.homeScore}
              </div>
            )}
            <div className="text-right">
              <div className="font-medium text-sm">{game.homeTeam.displayName}</div>
              <div className="text-xs text-muted-foreground">{game.homeTeam.abbreviation}</div>
            </div>
            {game.homeTeam.logo && (
              <img 
                src={game.homeTeam.logo} 
                alt={`${game.homeTeam.displayName} logo`}
                className="w-8 h-8 object-contain"
              />
            )}
          </div>
        </div>

        {/* Winner Indicator */}
        {isCompleted && game.winnerTeamId && (
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="text-xs">
              Winner: {game.winnerTeamId === game.homeTeamId ? game.homeTeam.displayName : game.awayTeam.displayName}
            </Badge>
          </div>
        )}

        {/* Pick Information */}
        {showPicks && game.picks && game.picks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-1">Recent Picks:</div>
            <div className="flex flex-wrap gap-1">
              {game.picks.slice(0, 3).map((pick) => (
                <Badge key={pick.id} variant="outline" className="text-xs">
                  {pick.user.username || pick.user.name}: {pick.team.abbreviation}
                </Badge>
              ))}
              {game.picks.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{game.picks.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}