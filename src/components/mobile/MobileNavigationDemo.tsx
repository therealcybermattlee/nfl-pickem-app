import React, { useState } from 'react';
import {
  MobileBottomNavigation,
  MobileHeader,
  MobileWeekSelectorAdvanced,
  MobilePlayerSelector,
  MobileGameNavigation,
  MobileQuickStats
} from './index';
import { useMobileViewport } from '../../hooks/useMobileNavigation';

// Demo component to showcase mobile navigation features
export const MobileNavigationDemo: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedUser, setSelectedUser] = useState('');
  const [currentPage, setCurrentPage] = useState('/');
  const { isMobile } = useMobileViewport();

  // Sample data
  const users = [
    { id: 'dad-user-id', name: 'Dad', color: '#3B82F6' },
    { id: 'mom-user-id', name: 'Mom', color: '#F59E0B' },
    { id: 'twobow-user-id', name: 'TwoBow', color: '#10B981' },
    { id: 'rocky-user-id', name: 'RockyDaRock', color: '#8B5CF6' }
  ];

  const gamesByWeek = {
    1: 16, 2: 15, 3: 14, 4: 13, 5: 12, 6: 11, 7: 10, 8: 9,
    9: 8, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 1, 17: 1, 18: 1
  };

  const stats = [
    { label: 'Games This Week', value: gamesByWeek[currentWeek] || 0, color: 'text-blue-600' },
    { label: 'Your Picks', value: selectedUser ? 8 : 0, color: 'text-green-600' },
    { label: 'Current Week', value: currentWeek, color: 'text-purple-600' },
    { label: 'Season', value: 2025, color: 'text-orange-600' }
  ];

  if (!isMobile) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Mobile Navigation Demo</h3>
          <p className="text-gray-600">
            Switch to mobile view (width &lt; 768px) to see the mobile navigation components in action.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Try resizing your browser window or using developer tools device emulation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader 
        title="Mobile Nav Demo"
        showBackButton={currentPage !== '/'}
        onBack={() => setCurrentPage('/')}
      />

      {/* Demo Content */}
      <div className="pt-20 pb-24 px-4 space-y-6">
        <div className="bg-white rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Mobile Week Selector</h2>
          <MobileWeekSelectorAdvanced
            currentWeek={currentWeek}
            totalWeeks={18}
            onWeekSelect={setCurrentWeek}
            gamesByWeek={gamesByWeek}
            loading={false}
          />
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Mobile Player Selector</h2>
          <MobilePlayerSelector
            users={users}
            selectedUserId={selectedUser}
            onUserSelect={setSelectedUser}
            loading={false}
          />
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Mobile Game Navigation</h2>
          <MobileGameNavigation
            currentWeek={currentWeek}
            totalWeeks={18}
            totalGames={gamesByWeek[currentWeek] || 0}
            completedGames={Math.floor((gamesByWeek[currentWeek] || 0) / 2)}
            userPicks={selectedUser ? 8 : 0}
            onWeekChange={setCurrentWeek}
            onFilterChange={(filter) => console.log('Filter changed:', filter)}
            activeFilter="all"
            loading={false}
          />
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Mobile Quick Stats</h2>
          <MobileQuickStats stats={stats} />
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Navigation State</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Current Page:</strong> {currentPage}</div>
            <div><strong>Selected Week:</strong> {currentWeek}</div>
            <div><strong>Selected User:</strong> {selectedUser || 'None'}</div>
            <div><strong>Games This Week:</strong> {gamesByWeek[currentWeek] || 0}</div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-blue-900 font-medium mb-2">✨ Mobile Features Active</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Touch-optimized controls</li>
            <li>• Swipe gesture support</li>
            <li>• Safe area padding</li>
            <li>• Haptic feedback (where supported)</li>
            <li>• Accessibility features</li>
          </ul>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation
        onNavigate={setCurrentPage}
        gameBadgeCount={5}
      />
    </div>
  );
};

export default MobileNavigationDemo;