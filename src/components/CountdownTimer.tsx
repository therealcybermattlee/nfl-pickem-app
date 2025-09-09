import React, { useState, useEffect, useCallback } from 'react';
import { calcRemainingTime, formatDuration, formatCompactDuration } from '../utils/timeUtils';

interface CountdownTimerProps {
  targetTime: Date | string;
  mode?: 'compact' | 'detailed' | 'minimal';
  onFinish?: () => void;
  className?: string;
  showIcon?: boolean;
  urgentThreshold?: number; // seconds when to show urgent styling
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetTime, 
  mode = 'detailed', 
  onFinish, 
  className = '',
  showIcon = false,
  urgentThreshold = 300 // 5 minutes
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    calcRemainingTime(targetTime)
  );
  const [hasFinished, setHasFinished] = useState(false);

  const updateTimer = useCallback(() => {
    const newRemaining = calcRemainingTime(targetTime);
    setRemainingSeconds(newRemaining);
    
    if (newRemaining <= 0 && !hasFinished) {
      setHasFinished(true);
      onFinish?.();
    }
  }, [targetTime, onFinish, hasFinished]);

  useEffect(() => {
    updateTimer(); // Initial update
    
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [updateTimer]);

  const isUrgent = remainingSeconds > 0 && remainingSeconds <= urgentThreshold;
  const isExpired = remainingSeconds <= 0;

  const getDisplayText = () => {
    if (isExpired) {
      return mode === 'minimal' ? '0:00' : 'Expired';
    }
    
    switch (mode) {
      case 'compact':
        return formatCompactDuration(remainingSeconds);
      case 'minimal':
        return formatDuration(remainingSeconds);
      case 'detailed':
      default:
        return formatDuration(remainingSeconds);
    }
  };

  const getStyleClasses = () => {
    let classes = 'font-mono font-medium transition-colors duration-300';
    
    if (isExpired) {
      classes += ' text-red-600';
    } else if (isUrgent) {
      classes += ' text-orange-600 animate-pulse';
    } else {
      classes += ' text-gray-700';
    }
    
    // Size classes based on mode
    switch (mode) {
      case 'minimal':
        classes += ' text-sm';
        break;
      case 'compact':
        classes += ' text-base';
        break;
      case 'detailed':
      default:
        classes += ' text-lg';
        break;
    }
    
    return classes;
  };

  const ClockIcon = () => (
    <svg 
      className="w-4 h-4 mr-1" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
  );

  const getAriaLabel = () => {
    if (isExpired) {
      return 'Time expired';
    }
    
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    
    let label = '';
    if (hours > 0) label += `${hours} hour${hours !== 1 ? 's' : ''} `;
    if (minutes > 0) label += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
    if (hours === 0) label += `${seconds} second${seconds !== 1 ? 's' : ''} `;
    
    return `${label.trim()} remaining`;
  };

  return (
    <div 
      className={`inline-flex items-center ${className}`}
      role="timer"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={getAriaLabel()}
    >
      {showIcon && <ClockIcon />}
      <span className={getStyleClasses()}>
        {getDisplayText()}
      </span>
      {mode === 'detailed' && !isExpired && (
        <span className="text-xs text-gray-500 ml-1">
          {isUrgent ? 'remaining!' : 'left'}
        </span>
      )}
    </div>
  );
};

// Specialized countdown variants for common use cases

export const GameCountdown: React.FC<{
  gameTime: Date | string;
  onGameStart?: () => void;
  className?: string;
}> = ({ gameTime, onGameStart, className }) => (
  <CountdownTimer 
    targetTime={gameTime}
    mode="detailed"
    onFinish={onGameStart}
    showIcon={true}
    urgentThreshold={1800} // 30 minutes for games
    className={`bg-blue-50 px-3 py-2 rounded-lg border ${className}`}
  />
);

export const PickDeadlineCountdown: React.FC<{
  deadline: Date | string;
  onDeadlineReached?: () => void;
  className?: string;
  compact?: boolean;
}> = ({ deadline, onDeadlineReached, className, compact = false }) => (
  <CountdownTimer 
    targetTime={deadline}
    mode={compact ? 'compact' : 'detailed'}
    onFinish={onDeadlineReached}
    showIcon={!compact}
    urgentThreshold={300} // 5 minutes for pick deadlines
    className={`bg-orange-50 px-2 py-1 rounded ${className}`}
  />
);