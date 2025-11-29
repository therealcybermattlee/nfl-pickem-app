import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types/api';

/**
 * LeaderboardTable Component
 *
 * Displays leaderboard rankings in a responsive layout:
 * - Desktop (≥768px): Clean table layout
 * - Mobile (<768px): Card-based layout with touch-friendly spacing
 *
 * Features:
 * - Trophy/medal icons for top 3 positions
 * - Current user highlighting
 * - Win percentage and pick statistics
 * - Streak indicators (fire/ice emojis)
 * - Position change animations (up/down arrows)
 * - Loading and empty states
 * - Full WCAG AA accessibility compliance
 */

interface LeaderboardTableProps {
  /** Array of leaderboard entries sorted by position */
  entries: LeaderboardEntry[];

  /** Current logged-in user's ID for highlighting */
  currentUserId?: string;

  /** Loading state - shows skeleton loaders */
  isLoading?: boolean;

  /** Message to display when entries array is empty */
  emptyMessage?: string;

  /** View mode: week or season */
  viewMode?: 'week' | 'season';

  /** Current week number for display context */
  week?: number;
}

/**
 * Get position icon/emoji for rankings
 */
const getPositionIcon = (position: number): string => {
  switch (position) {
    case 1:
      return '🏆';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return position.toString();
  }
};

/**
 * Get position-specific text color
 */
const getPositionColor = (position: number): string => {
  switch (position) {
    case 1:
      return 'text-amber-600 dark:text-amber-400';
    case 2:
      return 'text-slate-600 dark:text-slate-400';
    case 3:
      return 'text-orange-600 dark:text-orange-400';
    default:
      return 'text-slate-700 dark:text-slate-300';
  }
};

/**
 * Get position-specific background styling
 */
const getPositionBg = (position: number): string => {
  switch (position) {
    case 1:
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    case 2:
      return 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
    case 3:
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    default:
      return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  }
};

/**
 * Get streak indicator with emoji and styling
 */
const getStreakIndicator = (streak?: number): React.ReactNode => {
  if (!streak || streak === 0) return null;

  const isWinning = streak > 0;
  const streakValue = Math.abs(streak);

  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
        isWinning
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      }`}
      role="status"
      aria-label={`${isWinning ? 'Win' : 'Loss'} streak of ${streakValue}`}
    >
      {isWinning ? '🔥' : '❄️'} {streakValue}
    </span>
  );
};

/**
 * Get position change indicator (up/down arrows)
 */
const getPositionChangeIndicator = (
  currentPosition: number,
  previousPosition?: number
): React.ReactNode => {
  if (!previousPosition || previousPosition === currentPosition) return null;

  const movedUp = currentPosition < previousPosition;
  const positionChange = Math.abs(previousPosition - currentPosition);

  return (
    <span
      className={`inline-flex items-center ml-2 text-xs font-semibold transition-all duration-300 ${
        movedUp
          ? 'text-green-600 dark:text-green-400 animate-bounce'
          : 'text-red-600 dark:text-red-400'
      }`}
      role="status"
      aria-label={`${movedUp ? 'Up' : 'Down'} ${positionChange} ${positionChange === 1 ? 'place' : 'places'}`}
      title={`${movedUp ? 'Up' : 'Down'} ${positionChange} from position ${previousPosition}`}
    >
      {movedUp ? '↑' : '↓'}{positionChange}
    </span>
  );
};

/**
 * Skeleton loader for loading state
 */
const SkeletonRow: React.FC = () => (
  <div className="p-4 rounded-xl border-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
      <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
  </div>
);

/**
 * Main LeaderboardTable component
 */
export const LeaderboardTable = React.memo<LeaderboardTableProps>(({
  entries,
  currentUserId,
  isLoading = false,
  emptyMessage = 'No leaderboard data available',
  viewMode = 'week',
  week = 1
}) => {
  // Track previous positions for change indicators
  const [previousPositions, setPreviousPositions] = useState<Map<string, number>>(new Map());

  // Update previous positions when entries change
  useEffect(() => {
    if (entries && entries.length > 0) {
      const newPositions = new Map<string, number>();
      entries.forEach(entry => {
        newPositions.set(entry.user.id.toString(), entry.position);
      });

      // Only update if we have previous data to compare
      if (previousPositions.size > 0) {
        // Keep old positions for comparison, update after a delay to show animations
        setTimeout(() => {
          setPreviousPositions(newPositions);
        }, 2000); // Show change indicators for 2 seconds
      } else {
        // First load, just set current positions
        setPreviousPositions(newPositions);
      }
    }
  }, [entries]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading leaderboard">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonRow key={index} />
        ))}
        <span className="sr-only">Loading leaderboard data...</span>
      </div>
    );
  }

  // Empty state
  if (!entries || entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-64 text-slate-600 dark:text-slate-400"
        role="status"
        aria-label="Empty leaderboard"
      >
        <div className="text-center space-y-2">
          <svg
            className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View (≥768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table
          className="w-full border-collapse"
          role="table"
          aria-label="Leaderboard rankings"
        >
          <thead>
            <tr className="border-b-2 border-slate-200 dark:border-slate-700">
              <th
                scope="col"
                className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Rank
              </th>
              <th
                scope="col"
                className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Player
              </th>
              <th
                scope="col"
                className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Points
              </th>
              <th
                scope="col"
                className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Win %
              </th>
              <th
                scope="col"
                className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Record
              </th>
              <th
                scope="col"
                className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Streak
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isCurrentUser = currentUserId && entry.user.id.toString() === currentUserId;
              const displayPoints = viewMode === 'week'
                ? (entry.weeklyPoints || 0)
                : (entry.totalSeasonPoints || 0);
              const displayPercentage = viewMode === 'week'
                ? (entry.weeklyPercentage || 0)
                : (entry.seasonPercentage || 0);
              const displayPicks = viewMode === 'week'
                ? (entry.weeklyPicks || 0)
                : entry.totalPicks;
              const correctPicks = Math.round((displayPercentage / 100) * displayPicks);
              const incorrectPicks = displayPicks - correctPicks;

              return (
                <tr
                  key={entry.user.id}
                  className={`
                    border-b border-slate-200 dark:border-slate-700
                    transition-colors duration-150
                    hover:bg-slate-50 dark:hover:bg-slate-800/50
                    ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
                  `}
                  role="row"
                  aria-label={`${entry.position}. ${entry.user.displayName || entry.user.name} with ${displayPoints} points`}
                >
                  <td className="py-4 px-4" role="cell">
                    <div className={`flex items-center text-2xl font-bold ${getPositionColor(entry.position)}`}>
                      {getPositionIcon(entry.position)}
                      {getPositionChangeIndicator(entry.position, previousPositions.get(entry.user.id.toString()))}
                    </div>
                  </td>
                  <td className="py-4 px-4" role="cell">
                    <div className="flex flex-col">
                      <span className={`font-bold text-slate-900 dark:text-slate-100 ${isCurrentUser ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                        {entry.user.displayName || entry.user.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">(You)</span>
                        )}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {entry.user.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right" role="cell">
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {displayPoints}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right" role="cell">
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {displayPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right" role="cell">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {correctPicks}-{incorrectPicks}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center" role="cell">
                    {getStreakIndicator(entry.streak)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (<768px) */}
      <div className="md:hidden space-y-3" role="list" aria-label="Leaderboard rankings">
        {entries.map((entry) => {
          const isCurrentUser = currentUserId && entry.user.id.toString() === currentUserId;
          const displayPoints = viewMode === 'week'
            ? (entry.weeklyPoints || 0)
            : (entry.totalSeasonPoints || 0);
          const displayPercentage = viewMode === 'week'
            ? (entry.weeklyPercentage || 0)
            : (entry.seasonPercentage || 0);
          const displayPicks = viewMode === 'week'
            ? (entry.weeklyPicks || 0)
            : entry.totalPicks;
          const correctPicks = Math.round((displayPercentage / 100) * displayPicks);
          const incorrectPicks = displayPicks - correctPicks;

          return (
            <article
              key={entry.user.id}
              className={`
                p-4 rounded-xl border-2 shadow-sm
                transition-shadow duration-200
                hover:shadow-md
                ${getPositionBg(entry.position)}
                ${isCurrentUser ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
              `}
              role="listitem"
              aria-label={`${entry.position}. ${entry.user.displayName || entry.user.name} with ${displayPoints} points`}
            >
              {/* Header: Position and User */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`text-3xl font-bold ${getPositionColor(entry.position)}`}
                      aria-label={`Position ${entry.position}`}
                    >
                      {getPositionIcon(entry.position)}
                    </div>
                    {getPositionChangeIndicator(entry.position, previousPositions.get(entry.user.id.toString()))}
                  </div>
                  <div>
                    <div className={`text-lg font-bold text-slate-900 dark:text-slate-100 ${isCurrentUser ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                      {entry.user.displayName || entry.user.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {entry.user.email}
                    </div>
                  </div>
                </div>

                {/* Points and Streak */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {displayPoints}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {viewMode === 'week' ? 'Week' : 'Season'}
                    </div>
                  </div>
                  {getStreakIndicator(entry.streak)}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {correctPicks}-{incorrectPicks}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {viewMode === 'week' ? 'Week Record' : 'Season Record'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {displayPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {viewMode === 'week' ? 'Week Win %' : 'Season Win %'}
                  </div>
                </div>

                {/* Secondary stats */}
                {viewMode === 'week' ? (
                  <>
                    <div className="text-center">
                      <div className="text-base font-medium text-slate-700 dark:text-slate-300">
                        {entry.totalSeasonPoints || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Season Total
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-medium text-slate-700 dark:text-slate-300">
                        {(entry.seasonPercentage || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Season Win %
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-base font-medium text-slate-700 dark:text-slate-300">
                        {entry.weeklyPoints || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Week {week} Points
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-medium text-slate-700 dark:text-slate-300">
                        {(entry.weeklyPercentage || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Week {week} Win %
                      </div>
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
});

export default LeaderboardTable;
