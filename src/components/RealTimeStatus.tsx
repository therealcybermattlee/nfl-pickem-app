import React from 'react'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import { RealTimeEvent } from '../types/events'

interface RealTimeStatusProps {
  userId?: number
  authToken?: string
  showEvents?: boolean
  className?: string
}

const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  userId,
  authToken,
  showEvents = false,
  className = ''
}) => {
  const {
    isConnected,
    isReconnecting,
    connectionError,
    events,
    getEventsByType
  } = useRealTimeUpdates({ userId, authToken })

  // Get connection status indicator
  const getStatusIndicator = () => {
    if (isReconnecting) {
      return (
        <div className="flex items-center space-x-2 text-yellow-600">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Reconnecting...</span>
        </div>
      )
    }

    if (isConnected) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm">Live Updates</span>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-2 text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm">
          {connectionError ? 'Connection Error' : 'Disconnected'}
        </span>
      </div>
    )
  }

  // Format event for display
  const formatEvent = (event: RealTimeEvent) => {
    switch (event.type) {
      case 'GameLockEvent':
        return `🔒 Game locked: ${event.payload.teamsAffected.awayTeam.abbreviation} @ ${event.payload.teamsAffected.homeTeam.abbreviation}`
      
      case 'ScoreUpdateEvent':
        return `⚽ Score update: ${event.payload.awayScore} - ${event.payload.homeScore} (Q${event.payload.quarter})`
      
      case 'PickSubmittedEvent':
        return `✓ Pick submitted by user ${event.payload.userId}: ${event.payload.teamPicked.abbreviation}`
      
      case 'AutoPickGeneratedEvent':
        return `🤖 Auto-pick generated for user ${event.payload.userId}: ${event.payload.teamPicked.abbreviation}`
      
      case 'GameCompletedEvent':
        return `🏁 Game completed: Final score ${event.payload.finalScore.away} - ${event.payload.finalScore.home}`
      
      case 'LeaderboardUpdateEvent':
        return `🏆 Leaderboard updated for Week ${event.payload.week}`
      
      default:
        return `📢 ${event.type}`
    }
  }

  const recentEvents = events.slice(-10).reverse() // Show last 10 events, newest first

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Live Status</h3>
          {getStatusIndicator()}
        </div>
        
        {connectionError && (
          <p className="mt-2 text-xs text-red-600">{connectionError}</p>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          Events received: {events.length}
        </div>
      </div>
      
      {showEvents && recentEvents.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Updates</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentEvents.map((event, index) => (
              <div key={`${event.id}-${index}`} className="flex items-start space-x-2">
                <div className="text-xs text-gray-400 mt-0.5 w-12 flex-shrink-0">
                  {new Date(event.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-xs text-gray-700 flex-1">
                  {formatEvent(event)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Event-specific components
export const GameLockNotification: React.FC<{
  events: RealTimeEvent[]
  onDismiss?: (eventId: number) => void
}> = ({ events, onDismiss }) => {
  const gameLockEvents = events.filter(e => e.type === 'GameLockEvent')
  
  if (gameLockEvents.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {gameLockEvents.slice(-3).map((event) => (
        <div 
          key={event.id}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm animate-slide-in-right"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-600">🔒</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Game Locked
              </p>
              <p className="text-sm text-yellow-700">
                {event.payload.teamsAffected.awayTeam.abbreviation} @ {event.payload.teamsAffected.homeTeam.abbreviation}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(event.id)}
                className="ml-4 text-yellow-400 hover:text-yellow-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export const ScoreUpdateNotification: React.FC<{
  events: RealTimeEvent[]
  onDismiss?: (eventId: number) => void
}> = ({ events, onDismiss }) => {
  const scoreEvents = events.filter(e => e.type === 'ScoreUpdateEvent')
  
  if (scoreEvents.length === 0) return null
  
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {scoreEvents.slice(-2).map((event) => (
        <div 
          key={event.id}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm animate-slide-in-right"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-600">⚽</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-blue-800">
                Score Update
              </p>
              <p className="text-sm text-blue-700">
                {event.payload.awayScore} - {event.payload.homeScore} (Q{event.payload.quarter})
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(event.id)}
                className="ml-4 text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RealTimeStatus