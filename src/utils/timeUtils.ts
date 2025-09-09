// Time calculation utilities for NFL Pick'em time-lock system

export const calcRemainingTime = (target: Date | string): number => {
  const targetTime = typeof target === 'string' ? new Date(target) : target;
  return Math.max(0, Math.floor((targetTime.getTime() - Date.now()) / 1000));
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return [h, m, s]
      .map(unit => (unit < 10 ? `0${unit}` : unit))
      .join(':');
  }
  
  return [m, s]
    .map(unit => (unit < 10 ? `0${unit}` : unit))
    .join(':');
};

export const formatCompactDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  
  return `${m}m`;
};

export const isGameLocked = (gameTime: Date | string, lockOffsetMinutes: number = 0): boolean => {
  const gameDate = typeof gameTime === 'string' ? new Date(gameTime) : gameTime;
  const lockTime = new Date(gameDate.getTime() - (lockOffsetMinutes * 60 * 1000));
  return Date.now() >= lockTime.getTime();
};

export const getGameLockTime = (gameTime: Date | string, lockOffsetMinutes: number = 0): Date => {
  const gameDate = typeof gameTime === 'string' ? new Date(gameTime) : gameTime;
  return new Date(gameDate.getTime() - (lockOffsetMinutes * 60 * 1000));
};

export const getGameStatus = (
  gameTime: Date | string, 
  isCompleted: boolean,
  lockOffsetMinutes: number = 0
): 'upcoming' | 'locked' | 'inProgress' | 'final' => {
  if (isCompleted) return 'final';
  
  const gameDate = typeof gameTime === 'string' ? new Date(gameTime) : gameDate;
  const now = Date.now();
  const gameStartTime = gameDate.getTime();
  const lockTime = gameStartTime - (lockOffsetMinutes * 60 * 1000);
  
  if (now >= gameStartTime) return 'inProgress';
  if (now >= lockTime) return 'locked';
  return 'upcoming';
};

export const formatGameTime = (gameTime: Date | string): string => {
  const date = typeof gameTime === 'string' ? new Date(gameTime) : gameTime;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

export const formatGameDate = (gameTime: Date | string, includeTime: boolean = false): string => {
  const date = typeof gameTime === 'string' ? new Date(gameTime) : gameTime;
  
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  if (includeTime) {
    const timeStr = formatGameTime(date);
    return `${dateStr} at ${timeStr}`;
  }
  
  return dateStr;
};

export const getTimeUntilGame = (gameTime: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const targetTime = typeof gameTime === 'string' ? new Date(gameTime) : gameTime;
  const totalSeconds = calcRemainingTime(targetTime);
  
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { days, hours, minutes, seconds };
};

// Validation helpers
export const canSubmitPick = (gameTime: Date | string, lockOffsetMinutes: number = 0): boolean => {
  return !isGameLocked(gameTime, lockOffsetMinutes);
};

export const getPickSubmissionError = (
  gameTime: Date | string, 
  lockOffsetMinutes: number = 0
): string | null => {
  if (isGameLocked(gameTime, lockOffsetMinutes)) {
    return 'This game is locked for picks. Submission deadline has passed.';
  }
  return null;
};