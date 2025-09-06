import React, { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Game } from '../types/api';

export function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await ApiClient.getGames(1, 2025);
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
  }, []);

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
      
      <div className="grid gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Week 1 Games ({games.length} games)</h2>
          
          {games.length === 0 ? (
            <p className="text-muted-foreground">No games found for Week 1, 2025</p>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => (
                <div key={game.id} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="font-semibold">
                          {game.awayTeam?.abbreviation || `Team ${game.awayTeamId}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {game.awayTeam?.name}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-muted-foreground">@</div>
                      <div className="text-center">
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
                        {game.status || 'Scheduled'}
                      </div>
                    </div>
                  </div>
                  
                  {game.spread && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Spread: {game.spread > 0 ? `+${game.spread}` : game.spread}
                    </div>
                  )}
                </div>
              ))}
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