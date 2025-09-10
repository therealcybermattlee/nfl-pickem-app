import { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Game } from '../types/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
}

interface Pick {
  gameId: string;
  userId: string;
  teamId: string;
  userName: string;
  teamAbbr: string;
}

const USERS: User[] = [
  { id: 'dad-user-id', name: 'Dad' },
  { id: 'mom-user-id', name: 'Mom' },
  { id: 'twobow-user-id', name: 'TwoBow' },
  { id: 'rocky-user-id', name: 'RockyDaRock' }
];

// Helper function to get current NFL week (rough estimate based on NFL season start)
const getCurrentNFLWeek = (): number => {
  // NFL 2025 season starts around September 4, 2025
  const seasonStart = new Date('2025-09-04');
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceStart < 0) return 1; // Before season starts
  
  const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1;
  return Math.min(Math.max(weeksSinceStart, 1), 18); // Clamp between 1 and 18
};

export function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState<number>(getCurrentNFLWeek());
  const [currentSeason] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (week: number, showWeekLoading: boolean = false) => {
    if (showWeekLoading) {
      setWeekLoading(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      // Fetch games for the specified week
      const gamesResponse = await ApiClient.getGames(week, currentSeason);
      if (gamesResponse.success && gamesResponse.data) {
        setGames(gamesResponse.data);
      } else {
        setError(gamesResponse.error || `Failed to load games for Week ${week}`);
        return;
      }

      // Fetch picks using ApiClient
      try {
        const picksResponse = await ApiClient.get('/api/picks');
        if (picksResponse.success && picksResponse.data) {
          // Filter picks for the current week on the frontend if API doesn't support filtering
          const allPicks = picksResponse.data.picks || [];
          setPicks(allPicks);
        }
      } catch (pickError) {
        console.log(`No picks found for Week ${week} or picks API unavailable`);
      }
    } catch (err) {
      setError(`Failed to load data for Week ${week}`);
    } finally {
      setLoading(false);
      setWeekLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentWeek);
  }, [currentWeek, currentSeason]);

  // Week navigation functions
  const goToPreviousWeek = () => {
    if (currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
    }
  };

  const goToNextWeek = () => {
    if (currentWeek < 18) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  const handleWeekSelect = (week: number) => {
    if (week >= 1 && week <= 18 && week !== currentWeek) {
      setCurrentWeek(week);
    }
  };

  const handlePickTeam = async (gameId: string, teamId: string, teamAbbr: string) => {
    if (!selectedUser) {
      alert('Please select a user first!');
      return;
    }

    try {
      const response = await ApiClient.submitPick({
        gameId: gameId,
        teamId: teamId,
        userId: selectedUser
      }, '');

      if (response.success) {
        // Update picks in state
        const userName = USERS.find(u => u.id === selectedUser)?.name || 'Unknown';
        const newPick: Pick = {
          gameId,
          userId: selectedUser,
          teamId,
          userName,
          teamAbbr
        };
        
        setPicks(prevPicks => [
          ...prevPicks.filter(p => !(p.gameId === gameId && p.userId === selectedUser)),
          newPick
        ]);
      } else {
        alert('Failed to save pick');
      }
    } catch (error) {
      alert('Failed to save pick');
    }
  };

  const getUserPickForGame = (gameId: string, userId: string): Pick | undefined => {
    return picks.find(p => p.gameId === gameId && p.userId === userId);
  };

  const getPicksForGame = (gameId: string): Pick[] => {
    return picks.filter(p => p.gameId === gameId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-muted-foreground">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-destructive mb-4">Error Loading Games</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">NFL Pick'em Dashboard</h1>
      
      {/* Week Navigation */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Week {currentWeek} - {currentSeason} Season</h2>
          
          <div className="flex items-center gap-3">
            {/* Previous Week Button */}
            <button
              onClick={goToPreviousWeek}
              disabled={currentWeek <= 1 || weekLoading}
              className={`flex items-center gap-1 px-3 py-2 rounded-md font-medium transition-colors ${
                currentWeek <= 1 || weekLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>
            
            {/* Week Selector Dropdown */}
            <select
              value={currentWeek}
              onChange={(e) => handleWeekSelect(parseInt(e.target.value))}
              disabled={weekLoading}
              className="px-3 py-2 border rounded-md bg-background font-medium min-w-[120px] disabled:opacity-50"
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
            
            {/* Next Week Button */}
            <button
              onClick={goToNextWeek}
              disabled={currentWeek >= 18 || weekLoading}
              className={`flex items-center gap-1 px-3 py-2 rounded-md font-medium transition-colors ${
                currentWeek >= 18 || weekLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Quick Week Jump Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">Quick Jump:</span>
          {[1, 2, 3, 4, 5, 10, 15, 18].map(week => (
            <button
              key={week}
              onClick={() => handleWeekSelect(week)}
              disabled={week === currentWeek || weekLoading}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                week === currentWeek
                  ? 'bg-blue-600 text-white'
                  : weekLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              W{week}
            </button>
          ))}
        </div>
        
        {/* Loading indicator for week changes */}
        {weekLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading Week {currentWeek} games...
          </div>
        )}
      </div>
      
      {/* User Selection */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Player</h3>
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full p-2 border rounded-md bg-background"
        >
          <option value="">Select a player...</option>
          {USERS.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Week {currentWeek} Games ({games.length} games)
            {weekLoading && <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>}
          </h2>
          
          {games.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-lg mb-2">
                No games found for Week {currentWeek}, {currentSeason}
              </p>
              <p className="text-sm text-muted-foreground">
                Try selecting a different week or check back later for schedule updates.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => {
                const gamePicks = getPicksForGame(game.id);
                const userPick = selectedUser ? getUserPickForGame(game.id, selectedUser) : undefined;
                const gameStarted = game.isCompleted;
                
                return (
                  <div key={game.id} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-4">
                        <div 
                          className={`text-center p-2 rounded cursor-pointer transition-colors ${
                            userPick?.teamId === game.awayTeamId ? 'bg-green-100 border-2 border-green-500' : 
                            selectedUser && !gameStarted ? 'hover:bg-blue-50' : ''
                          }`}
                          onClick={() => !gameStarted && selectedUser ? handlePickTeam(game.id, game.awayTeamId, game.awayTeam?.abbreviation || 'AWAY') : null}
                        >
                          <div className="font-semibold">
                            {game.awayTeam?.abbreviation || `Team ${game.awayTeamId}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {game.awayTeam?.name}
                          </div>
                        </div>
                        
                        <div className="text-2xl font-bold text-muted-foreground">@</div>
                        
                        <div 
                          className={`text-center p-2 rounded cursor-pointer transition-colors ${
                            userPick?.teamId === game.homeTeamId ? 'bg-green-100 border-2 border-green-500' : 
                            selectedUser && !gameStarted ? 'hover:bg-blue-50' : ''
                          }`}
                          onClick={() => !gameStarted && selectedUser ? handlePickTeam(game.id, game.homeTeamId, game.homeTeam?.abbreviation || 'HOME') : null}
                        >
                          <div className="font-semibold">
                            {game.homeTeam?.abbreviation || `Team ${game.homeTeamId}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {game.homeTeam?.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                          {new Date(game.gameDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {game.isCompleted ? 'FINAL' : 'SCHEDULED'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Game Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                      {game.homeSpread && (
                        <div>
                          Spread: {game.homeTeam?.abbreviation} {game.homeSpread > 0 ? `+${game.homeSpread}` : `${game.homeSpread}`}
                        </div>
                      )}
                      {game.overUnder && (
                        <div>
                          O/U: {game.overUnder}
                        </div>
                      )}
                    </div>
                    
                    {/* Current Picks Display */}
                    {gamePicks.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-2">Current Picks:</div>
                        <div className="flex flex-wrap gap-2">
                          {gamePicks.map((pick, index) => (
                            <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {pick.userName}: {pick.teamAbbr}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Pick Status */}
                    {selectedUser && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                        {userPick ? (
                          <span className="text-green-600 font-medium">
                            ✓ You picked: {userPick.teamAbbr}
                          </span>
                        ) : gameStarted ? (
                          <span className="text-red-600">Game has started - no picks allowed</span>
                        ) : (
                          <span className="text-blue-600">Click a team to make your pick</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{games.length}</div>
              <div className="text-sm text-muted-foreground">Games This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {selectedUser ? picks.filter(p => p.userId === selectedUser).length : picks.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedUser ? 'Your Picks' : 'Total Picks'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{currentWeek}</div>
              <div className="text-sm text-muted-foreground">Current Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{currentSeason}</div>
              <div className="text-sm text-muted-foreground">Season</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}