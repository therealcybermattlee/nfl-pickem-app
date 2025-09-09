import React from 'react';

type GameStatus = 'upcoming' | 'locked' | 'inProgress' | 'final';

interface GameLockStatusProps {
  status: GameStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

// Status configuration with colors, labels, and icons
const statusConfig = {
  upcoming: {
    label: 'OPEN',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    description: 'Picks are still open'
  },
  locked: {
    label: 'LOCKED',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    description: 'No more picks allowed'
  },
  inProgress: {
    label: 'LIVE',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12l-1 1H7l-1-1z" />
      </svg>
    ),
    description: 'Game in progress'
  },
  final: {
    label: 'FINAL',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Game completed'
  }
} as const;

// Size configurations
const sizeConfig = {
  small: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3'
  },
  medium: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4'
  },
  large: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5'
  }
} as const;

export const GameLockStatus: React.FC<GameLockStatusProps> = ({ 
  status, 
  size = 'medium',
  showIcon = false,
  className = ''
}) => {
  const config = statusConfig[status];
  const sizeClasses = sizeConfig[size];

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border transition-all duration-200
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses.container}
        ${className}
      `}
      role="status"
      aria-label={config.description}
      title={config.description}
    >
      {showIcon && (
        <span className={sizeClasses.icon} aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

// Specialized variants for different contexts

export const MobileGameStatus: React.FC<{
  status: GameStatus;
  className?: string;
}> = ({ status, className }) => (
  <GameLockStatus 
    status={status}
    size="small"
    showIcon={true}
    className={`shadow-sm hover:shadow-md transition-shadow ${className}`}
  />
);

export const DetailedGameStatus: React.FC<{
  status: GameStatus;
  gameTime?: Date | string;
  className?: string;
}> = ({ status, gameTime, className }) => {
  const config = statusConfig[status];
  
  return (
    <div className={`flex flex-col items-center space-y-1 ${className}`}>
      <GameLockStatus status={status} size="large" showIcon={true} />
      {gameTime && status === 'upcoming' && (
        <span className="text-xs text-gray-500">
          {new Date(gameTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })}
        </span>
      )}
    </div>
  );
};

// Hook for determining game status
export const useGameStatus = (
  gameTime: Date | string,
  isCompleted: boolean,
  lockOffsetMinutes: number = 0
): GameStatus => {
  const gameDate = typeof gameTime === 'string' ? new Date(gameTime) : gameTime;
  const now = Date.now();
  const gameStartTime = gameDate.getTime();
  const lockTime = gameStartTime - (lockOffsetMinutes * 60 * 1000);
  
  if (isCompleted) return 'final';
  if (now >= gameStartTime) return 'inProgress';
  if (now >= lockTime) return 'locked';
  return 'upcoming';
};