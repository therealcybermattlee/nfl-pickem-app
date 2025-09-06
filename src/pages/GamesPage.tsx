import React, { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Game } from '../types/api';

// Utility function to format odds for display
const formatSpread = (spread: number, isHome: boolean = true): string => {
  // Convert American odds to spread
  // Positive odds (underdog): +150 means +1.5 points
  // Negative odds (favorite): -150 means -1.5 points
  const points = Math.abs(spread) / 100;
  const sign = spread > 0 ? '+' : '-';
  return `${sign}${points.toFixed(1)}`;
};

const formatOverUnder = (overUnder: number): string => {
  return (Math.abs(overUnder) / 100).toFixed(1);
};

export function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState(1);
  const [season] = useState(2025);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const response = await ApiClient.getGames(week, season);
        if (response.success && response.data) {
          setGames(response.data);
        } else {
          setError(response.error || 'Failed to load games');
        }
      } catch (err) {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [week, season]);

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">NFL Games</h1>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Week:</label>
          <select 
            value={week} 
            onChange={(e) => setWeek(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg bg-background"
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map(weekNum => (
              <option key={weekNum} value={weekNum}>Week {weekNum}</option>
            ))}
          </select>
        </div>
      </div>
      
      {games.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-lg text-muted-foreground">No games found for Week {week}, {season}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-card rounded-lg border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-muted-foreground">
                  Game #{game.id} • Week {game.week}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(game.gameDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(game.gameDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Away Team */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                      {game.awayTeam?.logo ? (
                        <img 
                          src={game.awayTeam.logo} 
                          alt={`${game.awayTeam.name} logo`}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span 
                        className={`font-bold text-lg text-primary ${game.awayTeam?.logo ? 'hidden' : ''}`}
                        style={{ display: game.awayTeam?.logo ? 'none' : 'block' }}
                      >
                        {game.awayTeam?.abbreviation || 'AWAY'}
                      </span>
                    </div>
                    <div className="font-semibold">
                      {game.awayTeam?.name || 'Away Team'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {game.awayTeam?.abbreviation}
                    </div>
                    {game.awayScore !== null && game.awayScore !== undefined && (
                      <div className="text-2xl font-bold mt-2">
                        {game.awayScore}
                      </div>
                    )}
                  </div>

                  <div className="text-2xl font-bold text-muted-foreground">@</div>

                  {/* Home Team */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                      {game.homeTeam?.logo ? (
                        <img 
                          src={game.homeTeam.logo} 
                          alt={`${game.homeTeam.name} logo`}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span 
                        className={`font-bold text-lg text-primary ${game.homeTeam?.logo ? 'hidden' : ''}`}
                        style={{ display: game.homeTeam?.logo ? 'none' : 'block' }}
                      >
                        {game.homeTeam?.abbreviation || 'HOME'}
                      </span>
                    </div>
                    <div className="font-semibold">
                      {game.homeTeam?.name || 'Home Team'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {game.homeTeam?.abbreviation}
                    </div>
                    {game.homeScore !== null && game.homeScore !== undefined && (
                      <div className="text-2xl font-bold mt-2">
                        {game.homeScore}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    game.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    game.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {(game.status || 'SCHEDULED').replace('_', ' ').toUpperCase()}
                  </div>
                  
                  {game.homeSpread && (
                    <div className="text-sm text-muted-foreground">
                      {game.homeTeam?.abbreviation} {formatSpread(game.homeSpread)}
                    </div>
                  )}
                  
                  {game.overUnder && (
                    <div className="text-sm text-muted-foreground">
                      O/U: {formatOverUnder(game.overUnder)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-card rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">Week {week} Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{games.length}</div>
            <div className="text-sm text-muted-foreground">Total Games</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {games.filter(g => g.status === 'scheduled').length}
            </div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {games.filter(g => g.status === 'in_progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {games.filter(g => g.status === 'final').length}
            </div>
            <div className="text-sm text-muted-foreground">Final</div>
          </div>
        </div>
      </div>
    </div>
  );
}