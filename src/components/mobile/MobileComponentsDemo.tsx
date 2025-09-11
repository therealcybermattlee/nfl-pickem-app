import React, { useState } from 'react';
import {
  MobileButton,
  MobileGameCard,
  MobileWeekSelector,
  MobileNavigation,
  type Game,
  type Team
} from './index';

// Demo component showing how to integrate mobile components
export const MobileComponentsDemo: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [currentPage, setCurrentPage] = useState('games');
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});

  // Mock data for demonstration
  const sampleTeams: Record<string, Team> = {
    'buf': { id: 'buf', name: 'Buffalo Bills', abbreviation: 'BUF', logo: '/logos/buf.png' },
    'mia': { id: 'mia', name: 'Miami Dolphins', abbreviation: 'MIA', logo: '/logos/mia.png' },
    'ne': { id: 'ne', name: 'New England Patriots', abbreviation: 'NE', logo: '/logos/ne.png' },
    'nyj': { id: 'nyj', name: 'New York Jets', abbreviation: 'NYJ', logo: '/logos/nyj.png' }
  };

  const sampleGames: Game[] = [
    {
      id: 'game1',
      homeTeam: sampleTeams.buf,
      awayTeam: sampleTeams.mia,
      gameTime: '2024-09-15T13:00:00Z',
      week: 1,
      homeSpread: -3.5,
      overUnder: 47.5,
      isLocked: false
    },
    {
      id: 'game2',
      homeTeam: sampleTeams.ne,
      awayTeam: sampleTeams.nyj,
      gameTime: '2024-09-15T16:30:00Z',
      week: 1,
      homeSpread: 1.5,
      overUnder: 42.5,
      isLocked: true
    }
  ];

  const gamesByWeek = {
    1: 16, 2: 15, 3: 16, 4: 15, 5: 14, 6: 13, 7: 15,
    8: 14, 9: 13, 10: 14, 11: 15, 12: 13, 13: 16, 14: 16,
    15: 16, 16: 16, 17: 16, 18: 16
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <span>🏠</span>
    },
    {
      id: 'games',
      label: 'Games',
      icon: <span>🏈</span>,
      badge: sampleGames.filter(g => !userPicks[g.id]).length
    },
    {
      id: 'leaderboard',
      label: 'Scores',
      icon: <span>🏆</span>
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <span>👤</span>
    }
  ];

  const handleTeamSelect = (gameId: string, teamId: string) => {
    setUserPicks(prev => ({
      ...prev,
      [gameId]: teamId
    }));
  };

  const handleSubmitPicks = () => {
    console.log('Submitting picks:', userPicks);
    // In real app, this would call your API
  };

  const handleSyncGames = () => {
    console.log('Syncing games...');
    // In real app, this would call your sync API
  };

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header with Week Selector */}
      <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}>
          NFL Pick'em
        </h1>
        
        <MobileWeekSelector
          currentWeek={selectedWeek}
          totalWeeks={18}
          onWeekSelect={setSelectedWeek}
          gamesByWeek={gamesByWeek}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ 
        padding: '16px', 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap',
        justifyContent: 'flex-start'  // NO center alignment - buttons naturally sized
      }}>
        <MobileButton 
          variant="primary" 
          onClick={handleSubmitPicks}
          disabled={Object.keys(userPicks).length === 0}
        >
          Submit Picks
        </MobileButton>
        
        <MobileButton 
          variant="secondary" 
          onClick={handleSyncGames}
        >
          Sync Games
        </MobileButton>
        
        <MobileButton 
          variant="success" 
          size="sm"
          onClick={() => setUserPicks({})}
        >
          Clear All
        </MobileButton>
      </div>

      {/* Games List */}
      <div style={{ padding: '0 16px' }}>
        <h2 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#374151'
        }}>
          Week {selectedWeek} Games
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sampleGames.map(game => (
            <MobileGameCard
              key={game.id}
              game={game}
              selectedTeam={userPicks[game.id]}
              onTeamSelect={handleTeamSelect}
              showSpread
            />
          ))}
        </div>
      </div>

      {/* Compact Mode Example */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#374151'
        }}>
          Compact Mode (for dense layouts)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sampleGames.map(game => (
            <MobileGameCard
              key={`compact-${game.id}`}
              game={game}
              selectedTeam={userPicks[game.id]}
              onTeamSelect={handleTeamSelect}
              showSpread={false}
              compact
            />
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        items={navItems}
      />
    </div>
  );
};

/* 
INTEGRATION GUIDE FOR HOMEPAGE.TSX:

1. Import the mobile components:
   import { 
     MobileButton, 
     MobileGameCard, 
     MobileWeekSelector 
   } from './components/mobile';

2. Replace existing buttons with MobileButton:
   // OLD (full-width problem):
   <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg">
     Submit Picks
   </button>
   
   // NEW (constrained width):
   <MobileButton variant="primary" onClick={handleSubmit}>
     Submit Picks
   </MobileButton>

3. Replace game cards with MobileGameCard:
   // OLD:
   <div className="game-card">...</div>
   
   // NEW:
   <MobileGameCard
     game={game}
     selectedTeam={picks[game.id]}
     onTeamSelect={handleTeamSelect}
     showSpread
   />

4. Add responsive layout container:
   <div className="pb-20"> // Space for mobile nav
     // Your content here
   </div>

5. Key Benefits:
   - Buttons are max 200px wide (no more full-width stretching)
   - Touch targets are minimum 44px high
   - Proper spacing and visual feedback
   - Accessible with ARIA labels
   - Dark mode support included
   - Responsive breakpoints handled

6. Mobile-first CSS is included in the module
   - No additional Tailwind classes needed
   - All styling is contained in the CSS module
   - Works alongside existing Tailwind styles
*/