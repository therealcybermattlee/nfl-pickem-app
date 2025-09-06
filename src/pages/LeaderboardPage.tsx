import React, { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Leaderboard, LeaderboardEntry } from '../types/api';

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState(1);
  const [season, setSeason] = useState(2025);

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
              totalPicks: 2,
              totalGames: 16,
              winPercentage: 50.0,
              streak: 0,
              lastWeekPoints: 0
            },
            {
              user: { id: 2, name: 'Mom', email: 'mom@example.com', displayName: 'Mom' },
              position: 1,
              points: 1,
              totalPicks: 2,
              totalGames: 16,
              winPercentage: 50.0,
              streak: 0,
              lastWeekPoints: 0
            },
            {
              user: { id: 3, name: 'TwoBow', email: 'twobow@example.com', displayName: 'TwoBow' },
              position: 1,
              points: 1,
              totalPicks: 2,
              totalGames: 16,
              winPercentage: 50.0,
              streak: 0,
              lastWeekPoints: 0
            },
            {
              user: { id: 4, name: 'RockyDaRock', email: 'rocky@example.com', displayName: 'RockyDaRock' },
              position: 1,
              points: 1,
              totalPicks: 2,
              totalGames: 16,
              winPercentage: 50.0,
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
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStreakIndicator = (streak?: number) => {
    if (!streak || streak === 0) return null;
    
    const isWinning = streak > 0;
    const streakValue = Math.abs(streak);
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${
        isWinning 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isWinning ? '🔥' : '❄️'} {streakValue}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-muted-foreground">No leaderboard data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">Leaderboard</h1>
        <div className="text-muted-foreground">
          Week {leaderboard.week} • {leaderboard.season} Season
        </div>
        <div className="text-sm text-muted-foreground">
          {leaderboard.completedGames} of {leaderboard.totalGames} games completed
        </div>
      </div>

      {/* Week/Season Selector */}
      <div className="flex justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="week" className="text-sm text-muted-foreground">Week:</label>
          <select
            id="week"
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="px-3 py-1 border rounded-md bg-card text-foreground"
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="season" className="text-sm text-muted-foreground">Season:</label>
          <select
            id="season"
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="px-3 py-1 border rounded-md bg-card text-foreground"
          >
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        {/* Mobile-friendly cards on small screens */}
        <div className="md:hidden space-y-2 p-4">
          {leaderboard.entries.map((entry: LeaderboardEntry, index: number) => (
            <div
              key={entry.user.id}
              className={`p-4 rounded-lg border ${
                entry.position === 1 ? 'border-yellow-300 bg-yellow-50' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${getPositionColor(entry.position)}`}>
                    {getPositionIcon(entry.position)}
                  </div>
                  <div>
                    <div className="font-semibold">{entry.user.displayName || entry.user.name}</div>
                    <div className="text-sm text-muted-foreground">{entry.points} points</div>
                  </div>
                </div>
                {getStreakIndicator(entry.streak)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Record:</span>
                  <div className="font-medium">{entry.totalPicks - (entry.totalPicks - entry.points)}-{entry.totalPicks - entry.points}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Win %:</span>
                  <div className="font-medium">{entry.winPercentage.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-semibold">Rank</th>
                <th className="text-left p-4 font-semibold">Player</th>
                <th className="text-center p-4 font-semibold">Points</th>
                <th className="text-center p-4 font-semibold">Record</th>
                <th className="text-center p-4 font-semibold">Win %</th>
                <th className="text-center p-4 font-semibold">Streak</th>
                <th className="text-center p-4 font-semibold">Last Week</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((entry: LeaderboardEntry, index: number) => (
                <tr
                  key={entry.user.id}
                  className={`border-t hover:bg-muted/50 transition-colors ${
                    entry.position === 1 ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className={`flex items-center gap-2 font-bold text-lg ${getPositionColor(entry.position)}`}>
                      {entry.position <= 3 ? getPositionIcon(entry.position) : entry.position}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold">{entry.user.displayName || entry.user.name}</div>
                    <div className="text-sm text-muted-foreground">{entry.user.email}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-bold text-lg text-primary">{entry.points}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-medium">
                      {entry.points}-{entry.totalPicks - entry.points}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.totalPicks} picks
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-medium">{entry.winPercentage.toFixed(1)}%</div>
                  </td>
                  <td className="p-4 text-center">
                    {getStreakIndicator(entry.streak)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-medium">{entry.lastWeekPoints || 0}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-primary">{leaderboard.entries.length}</div>
          <div className="text-sm text-muted-foreground">Total Players</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-primary">{leaderboard.completedGames}</div>
          <div className="text-sm text-muted-foreground">Games Completed</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-primary">{leaderboard.totalGames - leaderboard.completedGames}</div>
          <div className="text-sm text-muted-foreground">Games Remaining</div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <div>🏆 1st Place • 🥈 2nd Place • 🥉 3rd Place</div>
        <div>🔥 Win Streak • ❄️ Loss Streak</div>
      </div>
    </div>
  );
}