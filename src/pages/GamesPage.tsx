import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../utils/api';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { GameCard } from '../components/GameCard';
import { BatchPickDeadlines } from '../components/PickDeadlineIndicator';
import { GameLockStatus } from '../components/GameLockStatus';
import type { Game, GameStatus } from '../types/api';
import type { RealTimeEvent } from '../types/events';

// Define available users (same as HomePage)
const USERS = [
  { id: 'dad-user-id', name: 'Dad' },
  { id: 'mom-user-id', name: 'Mom' },
  { id: 'twobow-user-id', name: 'TwoBow' },
  { id: 'rocky-user-id', name: 'RockyDaRock' }
];

export function GamesPage() {
  const [games, setGames] = useState<GameStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState(1);
  const [season] = useState(2025);
  const [userPicks, setUserPicks] = useState<Map<string, string>>(new Map());
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');
  const [lockOffsetMinutes] = useState(0); // Can be made configurable
  const [isAutoPickEnabled] = useState(true); // Can be made configurable
  const [selectedUser, setSelectedUser] = useState<string>(''); // User selector

  const authToken = undefined; // No authentication needed
  const currentUserId = selectedUser || undefined; // Use selected user

  // Real-time updates integration
  const realTimeUpdates = useRealTimeUpdates({
    userId: currentUserId,
    authToken,
    fallbackToPolling: true,
    pollingInterval: 10000, // 10 seconds for games page
  });

  // Fetch games data with lock status
  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      // Try to get games with full team data first
      const gamesResponse = await ApiClient.getGames(week, season);
      
      if (gamesResponse.success && gamesResponse.data) {
        // Enhance games with lock status from the time-lock API
        try {
          const statusResponse = await ApiClient.getGameStatus(week, season);
          if (statusResponse.success && statusResponse.data) {
            // Merge lock status with full game data
            const enhancedGames = gamesResponse.data.map(game => {
              const statusGame = statusResponse.data?.find(sg => sg.id === game.id);
              return {
                ...game,
                isLocked: statusGame?.isLocked || false,
                lockTime: statusGame?.lockTime || game.gameDate,
                timeToLock: statusGame?.timeUntilLock || 0,
                isLockingSoon: (statusGame?.timeUntilLock || 0) <= 3600000 && !statusGame?.isLocked // 1 hour
              };
            });
            setGames(enhancedGames);
          } else {
            // Fallback to games without lock status
            setGames(gamesResponse.data);
          }
        } catch (statusErr) {
          // If status API fails, use games without lock status
          setGames(gamesResponse.data);
        }
      } else {
        setError(gamesResponse.error || 'Failed to load games');
      }
    } catch (err) {
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [week, season]);

  // Fetch user picks for the current week
  const fetchUserPicks = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      // Fetch all picks and filter by user
      const response = await ApiClient.get('/api/picks');
      if (response.success && response.data) {
        const allPicks = response.data.picks || [];
        const weekGames = games.map(g => g.id);
        const userPicksForWeek = allPicks.filter(
          pick => pick.userId === currentUserId && weekGames.includes(pick.gameId)
        );
        const picksMap = new Map(userPicksForWeek.map(pick => [pick.gameId, pick.teamId]));
        setUserPicks(picksMap);
      }
    } catch (err) {
      console.error('Failed to fetch user picks:', err);
    }
  }, [currentUserId, games]);

  // Handle pick submission
  const handlePickSubmit = useCallback(async (gameId: string, teamId: string) => {
    if (!currentUserId) {
      setError('Please select a user to submit picks');
      return;
    }

    try {
      const response = await ApiClient.submitPick({
        gameId,
        teamId,
        userId: currentUserId
      }, '');
      
      if (response.success) {
        setUserPicks(prev => new Map(prev).set(gameId, teamId));
        setError(null); // Clear any previous errors
      } else {
        setError(response.error || 'Failed to submit pick');
      }
      
    } catch (err) {
      setError('Failed to submit pick');
    }
  }, [currentUserId]);

  // Handle real-time events
  useEffect(() => {
    const handleRealTimeEvent = (event: RealTimeEvent) => {
      switch (event.type) {
        case 'GameLockEvent':
          // Refresh games when a game locks
          fetchGames();
          break;
        case 'ScoreUpdateEvent':
          // Update specific game score
          setGames(prev => prev.map(game => 
            game.id === event.payload.gameId 
              ? { ...game, homeScore: event.payload.homeScore, awayScore: event.payload.awayScore }
              : game
          ));
          break;
        case 'GameCompletedEvent':
          // Mark game as completed
          setGames(prev => prev.map(game => 
            game.id === event.payload.gameId 
              ? { ...game, isCompleted: true, winnerTeamId: event.payload.winnerId }
              : game
          ));
          break;
        case 'AutoPickGeneratedEvent':
          // Update user picks with auto-generated pick
          if (event.payload.userId === currentUserId) {
            setUserPicks(prev => new Map(prev).set(event.payload.gameId, event.payload.teamPicked.id));
          }
          break;
      }
    };

    realTimeUpdates.events.forEach(handleRealTimeEvent);
  }, [realTimeUpdates.events, fetchGames, currentUserId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    fetchUserPicks();
  }, [fetchUserPicks, selectedUser]);

  // Loading skeleton for mobile-first design
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Games</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            fetchGames();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const gamesWithDeadlines = games.map(game => ({
    id: game.id,
    deadline: new Date(new Date(game.gameDate).getTime() - lockOffsetMinutes * 60 * 1000),
    userHasPick: userPicks.has(game.id)
  }));

  const statusCounts = {
    upcoming: games.filter(g => !g.isCompleted && !g.isLocked).length,
    locked: games.filter(g => !g.isCompleted && g.isLocked).length,
    inProgress: games.filter(g => !g.isCompleted && g.isLocked && new Date(g.gameDate) <= new Date()).length,
    final: games.filter(g => g.isCompleted).length
  };

  return (
    <div className="space-y-6">
      {/* Header with controls and connection status */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b p-4 -m-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-4xl font-bold">NFL Games</h1>
            
            {/* Real-time connection status */}
            <div className="flex items-center space-x-2 sm:hidden">
              <div className={`w-2 h-2 rounded-full ${
                realTimeUpdates.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-500">
                {realTimeUpdates.isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">User:</label>
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-sm sm:text-base"
              >
                <option value="">Select user...</option>
                {USERS.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Week selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Week:</label>
              <select 
                value={week} 
                onChange={(e) => setWeek(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg bg-white text-sm sm:text-base"
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map(weekNum => (
                  <option key={weekNum} value={weekNum}>Week {weekNum}</option>
                ))}
              </select>
            </div>

            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'compact' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Compact
              </button>
            </div>

            {/* Connection status for desktop */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                realTimeUpdates.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-500">
                {realTimeUpdates.isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch pick deadlines summary */}
      {currentUserId && gamesWithDeadlines.length > 0 && (
        <BatchPickDeadlines 
          games={gamesWithDeadlines}
          className="sticky top-20 z-5"
        />
      )}

      {/* Time-lock alerts for games locking soon */}
      {games.some(g => g.isLockingSoon && !g.isLocked) && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-orange-800">Games Locking Soon!</h3>
          </div>
          <div className="space-y-2">
            {games
              .filter(g => g.isLockingSoon && !g.isLocked)
              .map(game => (
                <div key={game.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    {game.awayTeam?.abbreviation} @ {game.homeTeam?.abbreviation}
                  </span>
                  {game.timeToLock && (
                    <span className="text-orange-600 font-mono">
                      {Math.floor(game.timeToLock / (1000 * 60))}m remaining
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
      
      {games.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg text-gray-500 mb-2">No games found</p>
          <p className="text-sm text-gray-400">Week {week}, {season}</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'compact' ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              userHasPick={userPicks.has(game.id)}
              userPickTeamId={userPicks.get(game.id)}
              onPickSubmit={handlePickSubmit}
              lockOffsetMinutes={lockOffsetMinutes}
              isAutoPickEnabled={isAutoPickEnabled}
              compactMode={viewMode === 'compact'}
              className="hover:shadow-lg transition-shadow duration-200"
            />
          ))}
        </div>
      )}

      {/* Enhanced week summary with time-aware stats */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9z" />
          </svg>
          Week {week} Summary
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{games.length}</div>
            <div className="text-sm text-gray-500">Total Games</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.upcoming}</div>
            <div className="text-sm text-gray-500">Open for Picks</div>
            <GameLockStatus status="upcoming" size="small" className="mt-1" />
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{statusCounts.locked}</div>
            <div className="text-sm text-gray-500">Locked</div>
            <GameLockStatus status="locked" size="small" className="mt-1" />
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.final}</div>
            <div className="text-sm text-gray-500">Final</div>
            <GameLockStatus status="final" size="small" className="mt-1" />
          </div>
        </div>

        {currentUserId && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {userPicks.size}
                </div>
                <div className="text-xs text-gray-500">Your Picks</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {games.filter(g => !g.isCompleted).length - userPicks.size}
                </div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-lg font-semibold text-blue-600">
                  {games.length > 0 ? Math.round((userPicks.size / games.length) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}