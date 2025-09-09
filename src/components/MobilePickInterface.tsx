import React, { useState, useCallback, useEffect } from 'react';
import { Game } from '../types/api';
import { GameLockStatus, useGameStatus } from './GameLockStatus';
import { PickDeadlineIndicator } from './PickDeadlineIndicator';
import { canSubmitPick } from '../utils/timeUtils';

interface MobilePickInterfaceProps {
  games: Game[];
  userPicks: Map<string, string>;
  onPickSubmit: (gameId: string, teamId: string) => Promise<void>;
  lockOffsetMinutes?: number;
  className?: string;
}

interface PickSubmissionState {
  submitting: string | null; // gameId being submitted
  error: string | null;
  success: string | null; // gameId successfully submitted
}

export const MobilePickInterface: React.FC<MobilePickInterfaceProps> = ({
  games,
  userPicks,
  onPickSubmit,
  lockOffsetMinutes = 0,
  className = ''
}) => {
  const [submissionState, setSubmissionState] = useState<PickSubmissionState>({
    submitting: null,
    error: null,
    success: null
  });

  // Filter games that can still accept picks
  const availableGames = games.filter(game => 
    canSubmitPick(game.gameDate, lockOffsetMinutes) && !game.isCompleted
  );

  // Clear success/error messages after a delay
  useEffect(() => {
    if (submissionState.success || submissionState.error) {
      const timer = setTimeout(() => {
        setSubmissionState(prev => ({
          ...prev,
          success: null,
          error: null
        }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submissionState.success, submissionState.error]);

  const handlePickSubmit = useCallback(async (gameId: string, teamId: string) => {
    setSubmissionState({
      submitting: gameId,
      error: null,
      success: null
    });

    try {
      await onPickSubmit(gameId, teamId);
      setSubmissionState({
        submitting: null,
        error: null,
        success: gameId
      });
      
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      setSubmissionState({
        submitting: null,
        error: error instanceof Error ? error.message : 'Failed to submit pick',
        success: null
      });
      
      // Error vibration pattern
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [onPickSubmit]);

  const QuickPickCard: React.FC<{ game: Game }> = ({ game }) => {
    const gameStatus = useGameStatus(game.gameDate, game.isCompleted, lockOffsetMinutes);
    const userPickTeamId = userPicks.get(game.id);
    const isSubmitting = submissionState.submitting === game.id;
    const hasSuccess = submissionState.success === game.id;

    return (
      <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
        {/* Game header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-500">Week {game.week}</div>
            <div className="font-medium text-gray-900">
              {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
            </div>
          </div>
          <GameLockStatus status={gameStatus} size="small" showIcon />
        </div>

        {/* Pick deadline */}
        <PickDeadlineIndicator
          deadline={new Date(new Date(game.gameDate).getTime() - lockOffsetMinutes * 60 * 1000)}
          gameId={game.id}
          userHasPick={!!userPickTeamId}
          compact
        />

        {/* Team selection buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePickSubmit(game.id, game.awayTeam.id)}
            disabled={isSubmitting || gameStatus !== 'upcoming'}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation
              ${userPickTeamId === game.awayTeam.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              active:scale-95
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              {game.awayTeam.logo ? (
                <img 
                  src={game.awayTeam.logo} 
                  alt={`${game.awayTeam.name} logo`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{game.awayTeam.abbreviation}</span>
                </div>
              )}
              <div className="text-sm font-medium">{game.awayTeam.abbreviation}</div>
              
              {userPickTeamId === game.awayTeam.id && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => handlePickSubmit(game.id, game.homeTeam.id)}
            disabled={isSubmitting || gameStatus !== 'upcoming'}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation
              ${userPickTeamId === game.homeTeam.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              active:scale-95
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              {game.homeTeam.logo ? (
                <img 
                  src={game.homeTeam.logo} 
                  alt={`${game.homeTeam.name} logo`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{game.homeTeam.abbreviation}</span>
                </div>
              )}
              <div className="text-sm font-medium">{game.homeTeam.abbreviation}</div>
              
              {userPickTeamId === game.homeTeam.id && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Loading indicator */}
        {isSubmitting && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Submitting pick...</span>
            </div>
          </div>
        )}

        {/* Success indicator */}
        {hasSuccess && (
          <div className="flex items-center justify-center py-2 text-green-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Pick submitted!</span>
          </div>
        )}
      </div>
    );
  };

  if (availableGames.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No picks available</h3>
        <p className="text-gray-500 text-sm">All games are locked or completed</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Quick Picks</h2>
        <div className="text-sm text-gray-500">
          {availableGames.length} game{availableGames.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Error message */}
      {submissionState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium text-red-800">{submissionState.error}</span>
          </div>
        </div>
      )}

      {/* Games grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {availableGames.map(game => (
          <QuickPickCard key={game.id} game={game} />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-gray-900">
              {userPicks.size}
            </div>
            <div className="text-gray-500">Submitted</div>
          </div>
          <div>
            <div className="font-semibold text-orange-600">
              {availableGames.length - Array.from(userPicks.keys()).filter(gameId => 
                availableGames.some(g => g.id === gameId)
              ).length}
            </div>
            <div className="text-gray-500">Remaining</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">
              {availableGames.length > 0 
                ? Math.round((Array.from(userPicks.keys()).filter(gameId => 
                    availableGames.some(g => g.id === gameId)
                  ).length / availableGames.length) * 100)
                : 0}%
            </div>
            <div className="text-gray-500">Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Swipeable pick component for advanced mobile interactions
export const SwipePickCard: React.FC<{
  game: Game;
  userPickTeamId?: string;
  onPickSubmit: (gameId: string, teamId: string) => void;
  lockOffsetMinutes?: number;
}> = ({ game, userPickTeamId, onPickSubmit, lockOffsetMinutes = 0 }) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [startX, setStartX] = useState<number | null>(null);
  
  const gameStatus = useGameStatus(game.gameDate, game.isCompleted, lockOffsetMinutes);
  const canPick = gameStatus === 'upcoming';

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canPick) return;
    setStartX(e.touches[0].clientX);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canPick || startX === null) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    
    if (Math.abs(diffX) > 50) {
      setSwipeDirection(diffX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (!canPick || !swipeDirection) {
      setSwipeDirection(null);
      setStartX(null);
      return;
    }

    const teamId = swipeDirection === 'left' ? game.awayTeam.id : game.homeTeam.id;
    onPickSubmit(game.id, teamId);
    
    setSwipeDirection(null);
    setStartX(null);
  };

  return (
    <div 
      className={`
        relative bg-white rounded-lg border p-4 transition-all duration-200 touch-manipulation
        ${swipeDirection === 'left' ? 'bg-blue-50 border-blue-300' : ''}
        ${swipeDirection === 'right' ? 'bg-green-50 border-green-300' : ''}
        ${!canPick ? 'opacity-60' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicators */}
      {canPick && (
        <>
          <div className={`
            absolute left-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200
            ${swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'}
          `}>
            <div className="bg-blue-500 text-white rounded-full p-2">
              <span className="text-sm font-bold">{game.awayTeam.abbreviation}</span>
            </div>
          </div>
          
          <div className={`
            absolute right-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200
            ${swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'}
          `}>
            <div className="bg-green-500 text-white rounded-full p-2">
              <span className="text-sm font-bold">{game.homeTeam.abbreviation}</span>
            </div>
          </div>
        </>
      )}

      {/* Game content */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-sm font-medium">{game.awayTeam.abbreviation}</div>
            <div className="text-xs text-gray-500">Away</div>
          </div>
          <span className="text-gray-400">@</span>
          <div className="text-center">
            <div className="text-sm font-medium">{game.homeTeam.abbreviation}</div>
            <div className="text-xs text-gray-500">Home</div>
          </div>
        </div>
        
        <div className="text-right">
          <GameLockStatus status={gameStatus} size="small" />
          {userPickTeamId && (
            <div className="text-xs text-green-600 mt-1">
              ✓ {userPickTeamId === game.homeTeam.id ? game.homeTeam.abbreviation : game.awayTeam.abbreviation}
            </div>
          )}
        </div>
      </div>

      {canPick && !userPickTeamId && (
        <div className="mt-2 text-center text-xs text-gray-500">
          Swipe left for {game.awayTeam.abbreviation}, right for {game.homeTeam.abbreviation}
        </div>
      )}
    </div>
  );
};