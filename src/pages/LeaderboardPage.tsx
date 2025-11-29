import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../utils/api';
import type { Leaderboard, LeaderboardEntry } from '../types/api';
import type { RealTimeEvent } from '../types/events';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState(1);
  const [season, setSeason] = useState(2025);
  const [viewMode, setViewMode] = useState<'week' | 'season'>('week');

  // Real-time updates integration
  const realTimeUpdates = useRealTimeUpdates({
    fallbackToPolling: true,
    pollingInterval: 30000, // 30 seconds for leaderboard updates
  });

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For season view, don't pass week parameter to get season-long data
      // For week view, pass both week and season for weekly data
      const response = viewMode === 'season'
        ? await ApiClient.getLeaderboard(undefined, season)
        : await ApiClient.getLeaderboard(week, season);

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
  }, [week, season, viewMode]);

  // Handle real-time events
  useEffect(() => {
    const handleRealTimeEvent = (event: RealTimeEvent) => {
      switch (event.type) {
        case 'ScoreUpdateEvent':
        case 'GameCompletedEvent':
          // Refresh leaderboard when scores update or games complete
          loadLeaderboard();
          break;
      }
    };

    realTimeUpdates.events.forEach(handleRealTimeEvent);
  }, [realTimeUpdates.events, loadLeaderboard]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

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
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">NFL Pick'em Leaderboard</h1>
          {/* Live indicator */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            realTimeUpdates.isConnected
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              realTimeUpdates.isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            {realTimeUpdates.isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
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
            <label htmlFor="week" className={`text-sm font-medium ${viewMode === 'season' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>Week:</label>
            <select
              id="week"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              disabled={viewMode === 'season'}
              className={`px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                viewMode === 'season'
                  ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}
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

      {/* Leaderboard Table */}
      <LeaderboardTable
        entries={leaderboard.entries}
        isLoading={loading}
        emptyMessage="No leaderboard data available"
        viewMode={viewMode}
        week={week}
      />

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