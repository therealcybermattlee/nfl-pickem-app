import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { calcRemainingTime, getPickSubmissionError } from '../utils/timeUtils';

interface PickDeadlineIndicatorProps {
  deadline: Date | string;
  gameId: string;
  userHasPick?: boolean;
  isAutoPickEnabled?: boolean;
  onDeadlineReached?: (gameId: string) => void;
  className?: string;
  compact?: boolean;
}

export const PickDeadlineIndicator: React.FC<PickDeadlineIndicatorProps> = ({
  deadline,
  gameId,
  userHasPick = false,
  isAutoPickEnabled = false,
  onDeadlineReached,
  className = '',
  compact = false
}) => {
  const [isExpired, setIsExpired] = useState(calcRemainingTime(deadline) <= 0);
  
  useEffect(() => {
    const checkExpiration = () => {
      const expired = calcRemainingTime(deadline) <= 0;
      if (expired && !isExpired) {
        setIsExpired(true);
        onDeadlineReached?.(gameId);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [deadline, gameId, isExpired, onDeadlineReached]);

  const error = getPickSubmissionError(deadline);
  
  // Different states based on pick status and deadline
  if (isExpired) {
    if (userHasPick) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="flex items-center text-green-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Pick submitted</span>
          </div>
        </div>
      );
    }

    if (isAutoPickEnabled) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="flex items-center text-orange-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Auto-pick will be assigned</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center text-red-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium">Deadline passed</span>
        </div>
      </div>
    );
  }

  if (userHasPick) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center text-green-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Pick submitted</span>
        </div>
        {!compact && (
          <div className="text-xs text-gray-500">
            Can change until deadline
          </div>
        )}
      </div>
    );
  }

  // Active countdown state
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className={`font-medium ${compact ? 'text-sm' : 'text-base'} text-gray-700`}>
          Pick deadline
        </span>
        <CountdownTimer 
          targetTime={deadline}
          mode={compact ? 'compact' : 'detailed'}
          urgentThreshold={300} // 5 minutes
          className="bg-orange-50 px-2 py-1 rounded"
        />
      </div>
      
      {!compact && (
        <div className="text-xs text-gray-500">
          {isAutoPickEnabled 
            ? 'Submit your pick or one will be assigned automatically'
            : 'Submit your pick before time expires'
          }
        </div>
      )}
    </div>
  );
};

// Specialized mobile-first variant
export const MobilePickDeadline: React.FC<{
  deadline: Date | string;
  gameId: string;
  userHasPick?: boolean;
  onDeadlineReached?: (gameId: string) => void;
  className?: string;
}> = ({ deadline, gameId, userHasPick, onDeadlineReached, className }) => {
  const remainingTime = calcRemainingTime(deadline);
  const isUrgent = remainingTime > 0 && remainingTime <= 300; // 5 minutes
  const isExpired = remainingTime <= 0;

  return (
    <div className={`
      p-3 rounded-lg border-l-4 transition-all duration-300 ${
        isExpired 
          ? 'bg-red-50 border-l-red-400' 
          : isUrgent 
            ? 'bg-orange-50 border-l-orange-400 animate-pulse'
            : 'bg-blue-50 border-l-blue-400'
      } ${className}
    `}>
      <PickDeadlineIndicator 
        deadline={deadline}
        gameId={gameId}
        userHasPick={userHasPick}
        onDeadlineReached={onDeadlineReached}
        compact={true}
      />
    </div>
  );
};

// Batch indicator for multiple games
export const BatchPickDeadlines: React.FC<{
  games: Array<{
    id: string;
    deadline: Date | string;
    userHasPick?: boolean;
  }>;
  onDeadlineReached?: (gameId: string) => void;
  className?: string;
}> = ({ games, onDeadlineReached, className }) => {
  const upcomingGames = games.filter(game => calcRemainingTime(game.deadline) > 0);
  const nextDeadline = upcomingGames.reduce((earliest, game) => {
    const gameTime = new Date(game.deadline).getTime();
    return gameTime < earliest.getTime() ? new Date(game.deadline) : earliest;
  }, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to week from now

  if (upcomingGames.length === 0) {
    return (
      <div className={`text-center p-4 text-gray-500 ${className}`}>
        All pick deadlines have passed
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-orange-50 p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Next deadline in:
        </span>
        <CountdownTimer 
          targetTime={nextDeadline}
          mode="compact"
          urgentThreshold={900} // 15 minutes for batch view
        />
      </div>
      <div className="text-xs text-gray-600">
        {upcomingGames.length} game{upcomingGames.length !== 1 ? 's' : ''} with pending picks
      </div>
    </div>
  );
};