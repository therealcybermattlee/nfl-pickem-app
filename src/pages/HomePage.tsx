import React, { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Game } from '../types/api';

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

export function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch games
        const gamesResponse = await ApiClient.getGames(1, 2025);
        if (gamesResponse.success && gamesResponse.data) {
          setGames(gamesResponse.data);
        } else {
          setError(gamesResponse.error || 'Failed to load games');
          return;
        }

        // Fetch picks using ApiClient
        try {
          const picksResponse = await ApiClient.get('/api/picks');
          if (picksResponse.success && picksResponse.data) {
            setPicks(picksResponse.data.picks || []);
          }
        } catch (pickError) {
          console.log('No picks found or picks API unavailable');
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePickTeam = async (gameId: string, teamId: string, teamAbbr: string) => {
    if (!selectedUser) {
      alert('Please select a user first!');
      return;
    }

    // Get auth token (simplified for home page - should use proper auth)
    const authToken = 'dummy-token'; // TODO: Implement proper auth for home page
    
    try {
      const response = await ApiClient.submitPick({
        gameId: gameId,
        teamId: teamId
      }, authToken);

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
          <h2 className="text-2xl font-semibold mb-4">Week 1 Games ({games.length} games)</h2>
          
          {games.length === 0 ? (
            <p className="text-muted-foreground">No games found for Week 1, 2025</p>
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
                          Spread: {game.homeTeam?.abbreviation} {game.homeSpread > 0 ? `+${Math.abs(game.homeSpread / 100).toFixed(1)}` : `-${Math.abs(game.homeSpread / 100).toFixed(1)}`}
                        </div>
                      )}
                      {game.overUnder && (
                        <div>
                          O/U: {Math.abs(game.overUnder / 100).toFixed(1)}
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
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Picks Made</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm text-muted-foreground">Current Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2025</div>
              <div className="text-sm text-muted-foreground">Season</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}