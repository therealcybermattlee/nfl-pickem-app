import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseMobileNavigationOptions {
  onNavigate?: (page: string) => void;
  enableSwipeNavigation?: boolean;
}

interface NavigationState {
  currentPage: string;
  previousPage: string | null;
  canGoBack: boolean;
  isTransitioning: boolean;
}

export function useMobileNavigation(options: UseMobileNavigationOptions = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPage: location.pathname,
    previousPage: null,
    canGoBack: false,
    isTransitioning: false
  });

  // Update current page when location changes
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      previousPage: prev.currentPage,
      currentPage: location.pathname,
      canGoBack: window.history.length > 1,
      isTransitioning: false
    }));
  }, [location.pathname]);

  // Navigate to page with transition
  const navigateToPage = useCallback((path: string) => {
    if (path === navigationState.currentPage) return;
    
    setNavigationState(prev => ({
      ...prev,
      isTransitioning: true
    }));

    // Call custom navigation handler if provided
    if (options.onNavigate) {
      options.onNavigate(path);
    }

    // Navigate using React Router
    navigate(path);
  }, [navigate, navigationState.currentPage, options]);

  // Go back to previous page
  const goBack = useCallback(() => {
    if (navigationState.canGoBack) {
      setNavigationState(prev => ({
        ...prev,
        isTransitioning: true
      }));
      window.history.back();
    }
  }, [navigationState.canGoBack]);

  return {
    ...navigationState,
    navigateToPage,
    goBack,
    // Helper to check if we're on a specific page
    isActivePage: (path: string) => navigationState.currentPage === path,
    // Helper to get page title
    getPageTitle: () => {
      switch (navigationState.currentPage) {
        case '/': return 'Home';
        case '/games': return 'Games';
        case '/leaderboard': return 'Leaderboard';
        default: return 'NFL Pick\'em';
      }
    }
  };
}

// Hook for mobile viewport detection
export function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({ width, height });
      setIsMobile(width < 768); // Tailwind md breakpoint
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);

    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, []);

  return {
    isMobile,
    viewport,
    isPortrait: viewport.height > viewport.width,
    isLandscape: viewport.width > viewport.height,
    // Safe area detection for iPhone notch/home indicator
    hasSafeArea: typeof window !== 'undefined' && 
      ('CSS' in window && CSS.supports('padding-bottom: env(safe-area-inset-bottom)'))
  };
}

// Hook for swipe gesture detection
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}