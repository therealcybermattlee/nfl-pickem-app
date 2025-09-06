import React, { useState, useEffect } from 'react';
import { ApiClient } from '../utils/api';
import type { Team } from '../types/api';

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await ApiClient.getTeams();
        if (response.success && response.data) {
          setTeams(response.data);
        } else {
          setError(response.error || 'Failed to load teams');
        }
      } catch (err) {
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-muted-foreground">Loading teams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-destructive mb-4">Error Loading Teams</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const afc = teams.filter(team => team.conference === 'AFC');
  const nfc = teams.filter(team => team.conference === 'NFC');

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">NFL Teams</h1>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* AFC Conference */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-6 text-blue-600">AFC Conference</h2>
          <div className="grid gap-3">
            {afc.map((team) => (
              <div key={team.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary">
                    {team.abbreviation}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{team.location} {team.name}</div>
                  <div className="text-sm text-muted-foreground">{team.division}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NFC Conference */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-6 text-red-600">NFC Conference</h2>
          <div className="grid gap-3">
            {nfc.map((team) => (
              <div key={team.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary">
                    {team.abbreviation}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{team.location} {team.name}</div>
                  <div className="text-sm text-muted-foreground">{team.division}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-card rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">Team Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{teams.length}</div>
            <div className="text-sm text-muted-foreground">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{afc.length}</div>
            <div className="text-sm text-muted-foreground">AFC Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{nfc.length}</div>
            <div className="text-sm text-muted-foreground">NFC Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">8</div>
            <div className="text-sm text-muted-foreground">Divisions</div>
          </div>
        </div>
      </div>
    </div>
  );
}