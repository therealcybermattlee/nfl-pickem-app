import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useMobileViewport, useSwipeNavigation } from '../../hooks/useMobileNavigation';
import { 
  scrollToElement, 
  formatGameTime, 
  triggerHapticFeedback,
  throttle 
} from '../../utils/mobileHelpers';

interface User {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

interface Week {
  number: number;
  gameCount: number;
  isEmpty: boolean;
  isLocked?: boolean;
}

interface MobileWeekSelectorProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekSelect: (week: number) => void;
  gamesByWeek?: Record<number, number>;
  loading?: boolean;
  className?: string;
}

interface MobilePlayerSelectorProps {
  users: User[];
  selectedUserId: string | null;
  onUserSelect: (userId: string) => void;
  loading?: boolean;
  className?: string;
}

interface MobileGameNavigationProps {
  currentWeek: number;
  totalWeeks: number;
  totalGames: number;
  completedGames?: number;
  userPicks?: number;
  onWeekChange: (week: number) => void;
  onFilterChange?: (filter: 'all' | 'completed' | 'upcoming' | 'picks') => void;
  activeFilter?: string;
  loading?: boolean;
}

// Enhanced week selector with horizontal scrolling and snap
export const MobileWeekSelector: React.FC<MobileWeekSelectorProps> = ({
  currentWeek,
  totalWeeks,
  onWeekSelect,
  gamesByWeek = {},
  loading = false,
  className = ''
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Generate week data
  const weeks: Week[] = Array.from({ length: totalWeeks }, (_, i) => ({
    number: i + 1,
    gameCount: gamesByWeek[i + 1] || 0,
    isEmpty: (gamesByWeek[i + 1] || 0) === 0
  }));

  // Auto-scroll to current week
  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const currentWeekElement = scrollRef.current.querySelector(
        `[data-week="${currentWeek}"]`
      ) as HTMLElement;
      
      if (currentWeekElement) {
        setTimeout(() => {
          scrollToElement(currentWeekElement, {
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
          });
        }, 100);
      }
    }
  }, [currentWeek, isScrolling]);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation(
    () => {
      // Swipe left - next week
      if (currentWeek < totalWeeks) {
        handleWeekSelect(currentWeek + 1);
      }
    },
    () => {
      // Swipe right - previous week
      if (currentWeek > 1) {
        handleWeekSelect(currentWeek - 1);
      }
    }
  );

  const handleWeekSelect = (week: number) => {
    if (loading || week === currentWeek) return;
    triggerHapticFeedback('light');
    onWeekSelect(week);
  };

  const handleScrollStart = () => setIsScrolling(true);
  const handleScrollEnd = throttle(() => setIsScrolling(false), 150);

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleWeekSelect(currentWeek - 1)}
            disabled={currentWeek <= 1 || loading}
            className={`p-2 rounded-full transition-colors ${
              currentWeek <= 1 || loading
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
            }`}
            aria-label="Previous week"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Week {currentWeek}
            </h2>
            <p className="text-sm text-gray-500">
              {gamesByWeek[currentWeek] || 0} games
            </p>
          </div>
          
          <button
            onClick={() => handleWeekSelect(currentWeek + 1)}
            disabled={currentWeek >= totalWeeks || loading}
            className={`p-2 rounded-full transition-colors ${
              currentWeek >= totalWeeks || loading
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
            }`}
            aria-label="Next week"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Week Scroller */}
      <div 
        className="relative overflow-x-auto scrollbar-hide"
        {...swipeHandlers}
      >
        <div
          ref={scrollRef}
          className="flex space-x-2 px-4 pb-4 snap-x snap-mandatory"
          onScrollCapture={handleScrollStart}
          onScrollEnd={handleScrollEnd}
        >
          {weeks.map((week) => {
            const isSelected = week.number === currentWeek;
            const isDisabled = week.isEmpty || loading;
            
            return (
              <button
                key={week.number}
                data-week={week.number}
                onClick={() => handleWeekSelect(week.number)}
                disabled={isDisabled}
                className={`flex-shrink-0 snap-center px-4 py-3 rounded-lg min-w-[80px] transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-blue-50'
                }`}
                aria-label={`Week ${week.number}${week.gameCount ? ` (${week.gameCount} games)` : ' (no games)'}`}
                aria-current={isSelected ? 'page' : undefined}
              >
                <div className="text-center">
                  <div className="text-sm font-medium">
                    Week {week.number}
                  </div>
                  {week.gameCount > 0 && (
                    <div className="text-xs opacity-75 mt-1">
                      {week.gameCount} games
                    </div>
                  )}
                  {week.isEmpty && (
                    <div className="text-xs opacity-50 mt-1">
                      No games
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Modern player selector with avatars and quick switching
export const MobilePlayerSelector: React.FC<MobilePlayerSelectorProps> = ({
  users,
  selectedUserId,
  onUserSelect,
  loading = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleUserSelect = (userId: string) => {
    triggerHapticFeedback('medium');
    onUserSelect(userId);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    triggerHapticFeedback('light');
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Selected User Display */}
      <button
        onClick={toggleExpanded}
        disabled={loading}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
        aria-expanded={isExpanded}
        aria-haspopup="listbox"
      >
        <div className="flex items-center space-x-3">
          {selectedUser ? (
            <>
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: selectedUser.color || '#6B7280' }}
                >
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-base font-medium text-gray-900">
                {selectedUser.name}
              </span>
            </>
          ) : (
            <>
              <UserIcon className="w-8 h-8 text-gray-400" />
              <span className="text-base text-gray-500">
                Select a player...
              </span>
            </>
          )}
        </div>
        
        <ChevronRightIcon 
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} 
        />
      </button>

      {/* User List */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="py-2" role="listbox" aria-label="Select player">
            {users.map((user) => {
              const isSelected = user.id === selectedUserId;
              
              return (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center space-x-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: user.color || '#6B7280' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {user.name}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <CheckIcon className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Comprehensive game navigation with filters and breadcrumbs
export const MobileGameNavigation: React.FC<MobileGameNavigationProps> = ({
  currentWeek,
  totalWeeks,
  totalGames,
  completedGames = 0,
  userPicks = 0,
  onWeekChange,
  onFilterChange,
  activeFilter = 'all',
  loading = false
}) => {
  const filters = [
    { 
      id: 'all', 
      label: 'All Games', 
      count: totalGames,
      color: 'bg-gray-100 text-gray-700'
    },
    { 
      id: 'upcoming', 
      label: 'Upcoming', 
      count: totalGames - completedGames,
      color: 'bg-blue-100 text-blue-700'
    },
    { 
      id: 'completed', 
      label: 'Completed', 
      count: completedGames,
      color: 'bg-green-100 text-green-700'
    },
    { 
      id: 'picks', 
      label: 'My Picks', 
      count: userPicks,
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const handleFilterClick = (filterId: string) => {
    triggerHapticFeedback('light');
    if (onFilterChange) {
      onFilterChange(filterId as any);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>2025 NFL Season</span>
          <span>•</span>
          <span className="font-medium text-gray-900">Week {currentWeek}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onWeekChange(currentWeek - 1)}
            disabled={currentWeek <= 1 || loading}
            className="p-1 rounded hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous week"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onWeekChange(currentWeek + 1)}
            disabled={currentWeek >= totalWeeks || loading}
            className="p-1 rounded hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3">
        <div className="flex space-x-2 min-w-full">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            const hasGames = filter.count > 0;
            
            return (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                disabled={!hasGames || loading}
                className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? filter.color
                    : hasGames
                    ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                aria-pressed={isActive}
                aria-label={`${filter.label} (${filter.count})`}
              >
                <span>{filter.label}</span>
                {hasGames && (
                  <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Quick stats component for mobile dashboard
export const MobileQuickStats: React.FC<{
  stats: Array<{
    label: string;
    value: string | number;
    color?: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
}> = ({ stats, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-4 text-center"
        >
          {stat.icon && (
            <div className="flex justify-center mb-2">
              {stat.icon}
            </div>
          )}
          <div 
            className={`text-2xl font-bold ${stat.color || 'text-gray-900'}`}
          >
            {stat.value}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};