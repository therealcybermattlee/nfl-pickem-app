import React, { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Leaderboard, LeaderboardEntry } from '../types/api';

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState(1);
  const [season, setSeason] = useState(2025);
  const [viewMode, setViewMode] = useState<'week' | 'season'>('week');

  useEffect(() => {
    loadLeaderboard();
  }, [week, season]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ApiClient.getLeaderboard(week, season);

      if (response.success && response.data) {
        setLeaderboard(response.data);
      } else {
        // Create mock data if API fails
        setLeaderboard({
          week: week,
          season: season,
          totalGames: 16,
          completedGames: 2,
          entries: [
            {
              user: { id: 1, name: 'Dad', email: 'dad@example.com', displayName: 'Dad' },
              position: 1,
              points: 1,
              weeklyPoints: 1,
              totalSeasonPoints: 15,
              totalPicks: 32,
              weeklyPicks: 2,
              totalGames: 16,
              winPercentage: 50.0,
              weeklyPercentage: 50.0,
              seasonPercentage: 46.9,
              streak: 0,
              lastWeekPoints: 1
            },
            {
              user: { id: 2, name: 'Mom', email: 'mom@example.com', displayName: 'Mom' },
              position: 2,
              points: 0,
              weeklyPoints: 0,
              totalSeasonPoints: 12,
              totalPicks: 32,
              weeklyPicks: 2,
              totalGames: 16,
              winPercentage: 0.0,
              weeklyPercentage: 0.0,
              seasonPercentage: 37.5,
              streak: -2,
              lastWeekPoints: 0
            },
            {
              user: { id: 3, name: 'TwoBow', email: 'twobow@example.com', displayName: 'TwoBow' },
              position: 3,
              points: 0,
              weeklyPoints: 0,
              totalSeasonPoints: 10,
              totalPicks: 30,
              weeklyPicks: 2,
              totalGames: 16,
              winPercentage: 0.0,
              weeklyPercentage: 0.0,
              seasonPercentage: 33.3,
              streak: 0,
              lastWeekPoints: 0
            },
            {
              user: { id: 4, name: 'RockyDaRock', email: 'rocky@example.com', displayName: 'RockyDaRock' },
              position: 4,
              points: 0,
              weeklyPoints: 0,
              totalSeasonPoints: 8,
              totalPicks: 28,
              weeklyPicks: 2,
              totalGames: 16,
              winPercentage: 0.0,
              weeklyPercentage: 0.0,
              seasonPercentage: 28.6,
              streak: 0,
              lastWeekPoints: 0
            }
          ]
        });
      }
    } catch (err) {
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
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

  const getPositionColor = (position: number) => {
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

  const getPositionBg = (position: number) => {
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

  const getStreakIndicator = (streak?: number) => {
    if (!streak || streak === 0) return null;

    const isWinning = streak > 0;
    const streakValue = Math.abs(streak);

    return (
      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
        isWinning
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      }`}>
        {isWinning ? '🔥' : '❄️'} {streakValue}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-slate-600 dark:text-slate-400">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg font-medium">Error loading leaderboard</div>
          <div className="text-slate-600 dark:text-slate-400 mt-1">{error}</div>
          <button
            onClick={loadLeaderboard}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-600 dark:text-slate-400">No leaderboard data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">NFL Pick'em Leaderboard</h1>
        <div className="text-slate-600 dark:text-slate-400 text-lg">
          Week {leaderboard.week} • {leaderboard.season} Season
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-500">
          {leaderboard.completedGames} of {leaderboard.totalGames} games completed this week
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        {/* Week/Season Selector */}
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="week" className="text-sm font-medium text-slate-700 dark:text-slate-300">Week:</label>
            <select
              id="week"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="season" className="text-sm font-medium text-slate-700 dark:text-slate-300">Season:</label>
            <select
              id="season"
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode('season')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'season'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Season View
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3">
        {leaderboard.entries.map((entry: LeaderboardEntry, index: number) => {
          const displayPoints = viewMode === 'week' ? (entry.weeklyPoints || 0) : (entry.totalSeasonPoints || 0);
          const displayPercentage = viewMode === 'week' ? (entry.weeklyPercentage || 0) : (entry.seasonPercentage || 0);
          const displayPicks = viewMode === 'week' ? (entry.weeklyPicks || 0) : entry.totalPicks;
          const correctPicks = Math.round((displayPercentage / 100) * displayPicks);

          return (
            <div
              key={entry.user.id}
              className={`p-4 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow ${getPositionBg(entry.position)}`}
            >
              {/* Mobile and Desktop Layout */}
              <div className="flex items-center justify-between">
                {/* Left: Position and User */}
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${getPositionColor(entry.position)} min-w-[3rem] text-center`}>
                    {getPositionIcon(entry.position)}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {entry.user.displayName || entry.user.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {entry.user.email}
                    </div>
                  </div>
                </div>

                {/* Right: Points and Streak */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {displayPoints}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {viewMode === 'week' ? 'Week Points' : 'Season Points'}
                    </div>
                  </div>
                  {getStreakIndicator(entry.streak)}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {correctPicks}-{displayPicks - correctPicks}
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

                {/* Show the opposite metric as secondary info */}
                {viewMode === 'week' ? (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        {entry.totalSeasonPoints || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Season Total
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-slate-700 dark:text-slate-300">
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
                      <div className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        {entry.weeklyPoints || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Week {week} Points
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        {(entry.weeklyPercentage || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Week {week} Win %
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {leaderboard.entries.length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Players</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {leaderboard.completedGames}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Games Completed</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {leaderboard.totalGames - leaderboard.completedGames}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Games Remaining</div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-500 space-y-2 mt-8">
        <div className="flex justify-center items-center gap-6 flex-wrap">
          <span>🏆 1st Place</span>
          <span>🥈 2nd Place</span>
          <span>🥉 3rd Place</span>
        </div>
        <div className="flex justify-center items-center gap-6 flex-wrap">
          <span>🔥 Win Streak</span>
          <span>❄️ Loss Streak</span>
        </div>
        <div className="text-xs">
          Weekly View shows points/stats for the selected week only. Season View shows cumulative totals.
        </div>
      </div>
    </div>
  );
}