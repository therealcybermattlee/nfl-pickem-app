import { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Game } from '../types/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { 
  MobileWeekSelectorAdvanced, 
  MobilePlayerSelector, 
  MobileQuickStats 
} from '../components/mobile';
import { useMobileViewport } from '../hooks/useMobileNavigation';
import { GameCard } from '../components/GameCard';

interface User {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

interface Pick {
  gameId: string;
  userId: string;
  teamId: string;
  userName: string;
  teamAbbr: string;
}

const USERS: User[] = [
  { id: 'dad-user-id', name: 'Dad', color: '#3B82F6' },
  { id: 'mom-user-id', name: 'Mom', color: '#F59E0B' },
  { id: 'twobow-user-id', name: 'TwoBow', color: '#10B981' },
  { id: 'rocky-user-id', name: 'RockyDaRock', color: '#8B5CF6' }
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
  const { isMobile } = useMobileViewport();

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

  // Calculate games by week for mobile week selector
  const gamesByWeek = Array.from({ length: 18 }, (_, i) => i + 1).reduce((acc, week) => {
    // For now, assume each week has games - in a real app, you'd fetch this from API
    acc[week] = week <= 18 ? Math.floor(Math.random() * 16) + 1 : 0;
    return acc;
  }, {} as Record<number, number>);

  // Set current week games count based on actual data
  if (games.length > 0) {
    gamesByWeek[currentWeek] = games.length;
  }

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
    <div className="px-2 sm:px-4 lg:px-6">
      {!isMobile && (
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 lg:mb-8">NFL Pick'em Dashboard</h1>
      )}
      
      {/* Mobile Week Selector */}
      {isMobile ? (
        <MobileWeekSelectorAdvanced
          currentWeek={currentWeek}
          totalWeeks={18}
          onWeekSelect={handleWeekSelect}
          gamesByWeek={gamesByWeek}
          loading={weekLoading}
          className="mb-4"
        />
      ) : (
        /* Desktop Week Navigation */
        <div className="bg-card rounded-lg border p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Week {currentWeek} - {currentSeason} Season</h2>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Previous Week Button */}
              <button
                onClick={goToPreviousWeek}
                disabled={currentWeek <= 1 || weekLoading}
                className={`flex items-center gap-1 px-2 sm:px-3 py-2 rounded-md font-medium transition-colors text-sm ${
                  currentWeek <= 1 || weekLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <ChevronLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              {/* Week Selector Dropdown */}
              <select
                value={currentWeek}
                onChange={(e) => handleWeekSelect(parseInt(e.target.value))}
                disabled={weekLoading}
                className="px-2 sm:px-3 py-2 border rounded-md bg-background font-medium min-w-[80px] sm:min-w-[120px] disabled:opacity-50 text-sm"
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
                className={`flex items-center gap-1 px-2 sm:px-3 py-2 rounded-md font-medium transition-colors text-sm ${
                  currentWeek >= 18 || weekLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
          
          {/* Quick Week Jump Buttons */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2 self-center">Quick Jump:</span>
            {[1, 2, 3, 4, 5, 10, 15, 18].map(week => (
              <button
                key={week}
                onClick={() => handleWeekSelect(week)}
                disabled={week === currentWeek || weekLoading}
                className={`px-1.5 sm:px-2 py-1 rounded text-xs font-medium transition-colors ${
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
            <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-blue-600">
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Loading Week {currentWeek} games...
            </div>
          )}
        </div>
      )}
      
      {/* Player Selection */}
      {isMobile ? (
        <MobilePlayerSelector
          users={USERS}
          selectedUserId={selectedUser}
          onUserSelect={setSelectedUser}
          loading={loading}
          className="mb-4"
        />
      ) : (
        <div className="bg-card rounded-lg border p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Select Player</h3>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 sm:p-3 border rounded-md bg-background text-sm sm:text-base"
          >
            <option value="">Select a player...</option>
            {USERS.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
      )}
      
      <div className="grid gap-4 sm:gap-6">
        <div className="bg-card rounded-lg border p-3 sm:p-4 lg:p-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4">
            Week {currentWeek} Games ({games.length} games)
            {weekLoading && <span className="text-xs sm:text-sm text-muted-foreground ml-2">(Loading...)</span>}
          </h2>
          
          {games.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-muted-foreground text-base sm:text-lg mb-2">
                No games found for Week {currentWeek}, {currentSeason}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Try selecting a different week or check back later for schedule updates.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {games.map((game) => {
                const userPick = selectedUser ? getUserPickForGame(game.id, selectedUser) : undefined;
                
                return (
                  <GameCard
                    key={game.id}
                    game={game}
                    userHasPick={!!userPick}
                    userPickTeamId={userPick?.teamId}
                    onPickSubmit={(gid, tid) => {
                      const homeId = game.homeTeam?.id || game.homeTeamId;
                      const awayId = game.awayTeam?.id || game.awayTeamId;
                      const abbr = tid === homeId ? game.homeTeam?.abbreviation : game.awayTeam?.abbreviation;
                      handlePickTeam(gid, tid, abbr || '');
                    }}
                    compactMode={isMobile}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* Quick Stats */}
        {isMobile ? (
          <MobileQuickStats
            stats={[
              { label: 'Games This Week', value: games.length, color: 'text-blue-600' },
              { 
                label: selectedUser ? 'Your Picks' : 'Total Picks', 
                value: selectedUser ? picks.filter(p => p.userId === selectedUser).length : picks.length,
                color: 'text-green-600'
              },
              { label: 'Current Week', value: currentWeek, color: 'text-purple-600' },
              { label: 'Season', value: currentSeason, color: 'text-orange-600' }
            ]}
          />
        ) : (
          <div className="bg-card rounded-lg border p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{games.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Games This Week</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                  {selectedUser ? picks.filter(p => p.userId === selectedUser).length : picks.length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {selectedUser ? 'Your Picks' : 'Total Picks'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{currentWeek}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Current Week</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{currentSeason}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Season</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}