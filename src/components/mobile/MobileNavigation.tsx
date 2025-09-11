import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserGroupIcon as UserGroupIconSolid
} from '@heroicons/react/24/solid';
import { useMobileNavigation, useMobileViewport } from '../../hooks/useMobileNavigation';
import { getSafeAreaPadding, triggerHapticFeedback } from '../../utils/mobileHelpers';

interface MobileBottomNavigationProps {
  onNavigate?: (path: string) => void;
  gameBadgeCount?: number;
  className?: string;
}

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
}

// Main bottom navigation component
export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  onNavigate,
  gameBadgeCount = 0,
  className = ''
}) => {
  const location = useLocation();
  const { hasSafeArea } = useMobileViewport();
  const { navigateToPage, isActivePage } = useMobileNavigation({ onNavigate });
  
  const navigationItems = [
    {
      id: 'home',
      path: '/',
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeIconSolid
    },
    {
      id: 'games',
      path: '/games',
      label: 'Games',
      icon: UserGroupIcon,
      activeIcon: UserGroupIconSolid,
      badge: gameBadgeCount > 0 ? gameBadgeCount : undefined
    },
    {
      id: 'leaderboard',
      path: '/leaderboard',
      label: 'Leaderboard',
      icon: TrophyIcon,
      activeIcon: TrophyIconSolid
    }
  ];

  const handleNavClick = (path: string) => {
    triggerHapticFeedback('light');
    navigateToPage(path);
  };

  const safeAreaPadding = getSafeAreaPadding();

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 ${className}`}
      style={{
        paddingBottom: hasSafeArea ? safeAreaPadding.bottom : '0px'
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const isActive = isActivePage(item.path);
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-colors duration-200 ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 active:text-blue-600'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="w-6 h-6 mb-1" />
                {item.badge && (
                  <span 
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium"
                    aria-label={`${item.badge} notifications`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Mobile header component with back navigation
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  rightAction,
  className = ''
}) => {
  const { hasSafeArea } = useMobileViewport();
  const { goBack } = useMobileNavigation();
  const safeAreaPadding = getSafeAreaPadding();

  const handleBackClick = () => {
    triggerHapticFeedback('light');
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  return (
    <header
      className={`sticky top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40 ${className}`}
      style={{
        paddingTop: hasSafeArea ? safeAreaPadding.top : '0px'
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center min-w-0 flex-1">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="mr-3 p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>
        
        {rightAction && (
          <div className="ml-3 flex-shrink-0">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
};

// Full-screen mobile menu
export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentPath
}) => {
  const { hasSafeArea } = useMobileViewport();
  const safeAreaPadding = getSafeAreaPadding();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/games', label: 'Games', icon: UserGroupIcon },
    { path: '/leaderboard', label: 'Leaderboard', icon: TrophyIcon }
  ];

  const handleMenuItemClick = (path: string) => {
    triggerHapticFeedback('medium');
    onNavigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200"
        style={{
          paddingTop: hasSafeArea ? `calc(${safeAreaPadding.top} + 12px)` : '12px'
        }}
      >
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Menu Items */}
      <div
        className="flex-1 px-4 py-6"
        style={{
          paddingBottom: hasSafeArea ? safeAreaPadding.bottom : '24px'
        }}
      >
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => handleMenuItemClick(item.path)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-6 h-6 mr-3" />
                <span className="text-base font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Burger menu button component
export const MobileBurgerMenu: React.FC<{
  onToggle: () => void;
  isOpen: boolean;
  className?: string;
}> = ({ onToggle, isOpen, className = '' }) => {
  const handleClick = () => {
    triggerHapticFeedback('light');
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors ${className}`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <XMarkIcon className="w-6 h-6 text-gray-600" />
      ) : (
        <Bars3Icon className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );
};

// Hook for managing mobile menu state
export function useMobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  return {
    isMenuOpen,
    openMenu,
    closeMenu,
    toggleMenu
  };
}

// Composite component that handles all mobile navigation
export const MobileNavigationSystem: React.FC<{
  gameBadgeCount?: number;
  onNavigate?: (path: string) => void;
}> = ({ gameBadgeCount, onNavigate }) => {
  const location = useLocation();
  const { isMobile } = useMobileViewport();
  const { navigateToPage, getPageTitle } = useMobileNavigation({ onNavigate });
  const { isMenuOpen, closeMenu, toggleMenu } = useMobileMenu();

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader
        title={getPageTitle()}
        rightAction={
          <MobileBurgerMenu
            onToggle={toggleMenu}
            isOpen={isMenuOpen}
          />
        }
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onNavigate={navigateToPage}
        currentPath={location.pathname}
      />

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        onNavigate={onNavigate}
        gameBadgeCount={gameBadgeCount}
      />

      {/* Bottom padding for content to account for bottom nav */}
      <div className="h-20" aria-hidden="true" />
    </>
  );
};