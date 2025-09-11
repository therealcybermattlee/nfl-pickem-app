// Mobile detection and utility functions

export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  hasTouchSupport: boolean;
  hasNotch: boolean;
}

// Get current viewport information
export function getViewportInfo(): ViewportInfo {
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  const height = typeof window !== 'undefined' ? window.innerHeight : 0;
  
  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isPortrait: height > width,
    isLandscape: width > height,
    hasTouchSupport: typeof window !== 'undefined' && 'ontouchstart' in window,
    hasNotch: typeof window !== 'undefined' && 
      window.screen?.height >= 812 && // iPhone X and newer
      /iPhone|iPad|iPod/.test(navigator.userAgent)
  };
}

// Detect if device has safe area insets (iPhone notch/home indicator)
export function hasSafeAreaSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'CSS' in window && 
    CSS.supports('padding-bottom: env(safe-area-inset-bottom)');
}

// Calculate safe area padding for different positions
export function getSafeAreaPadding() {
  if (!hasSafeAreaSupport()) {
    return {
      top: '0px',
      bottom: '0px',
      left: '0px',
      right: '0px'
    };
  }

  return {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)'
  };
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll/touch events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Check if an element is in the viewport
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Smooth scroll to element with mobile optimizations
export function scrollToElement(
  element: Element | string,
  options: ScrollIntoViewOptions & { offset?: number } = {}
) {
  const target = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
    
  if (!target) return;

  const { offset = 0, ...scrollOptions } = options;
  
  if (offset !== 0) {
    // Calculate position with offset
    const rect = target.getBoundingClientRect();
    const scrollTop = window.pageYOffset + rect.top - offset;
    
    window.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
      ...scrollOptions
    });
  } else {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
      ...scrollOptions
    });
  }
}

// Format game time for mobile display
export function formatGameTime(gameTime: string, compact: boolean = false): string {
  try {
    const date = new Date(gameTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    if (compact) {
      if (isToday) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    
    if (isToday) {
      return `Today ${timeString}`;
    }
    if (isTomorrow) {
      return `Tomorrow ${timeString}`;
    }
    
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return gameTime;
  }
}

// Calculate optimal list item height based on viewport
export function getOptimalItemHeight(itemCount: number, maxHeight?: number): number {
  const { height, isMobile } = getViewportInfo();
  const availableHeight = maxHeight || (height * 0.7); // Use 70% of viewport
  const minItemHeight = isMobile ? 60 : 80;
  const maxItemHeight = isMobile ? 120 : 150;
  
  const calculatedHeight = Math.floor(availableHeight / itemCount);
  return Math.min(Math.max(calculatedHeight, minItemHeight), maxItemHeight);
}

// Haptic feedback for mobile interactions (where supported)
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window === 'undefined') return;
  
  // Check if haptic feedback is available
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
  
  // For iOS devices with haptic engine (if available in future)
  if ('Taptic' in window && (window as any).Taptic) {
    const taptic = (window as any).Taptic;
    taptic.impact(type);
  }
}

// Prevent body scroll when modal/overlay is open
export function toggleBodyScroll(disable: boolean) {
  if (typeof document === 'undefined') return;
  
  if (disable) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }
}

// Generate consistent animation duration based on distance
export function getAnimationDuration(distance: number, baseSpeed: number = 0.3): number {
  const minDuration = 150;
  const maxDuration = 500;
  const calculated = Math.abs(distance) * baseSpeed;
  
  return Math.min(Math.max(calculated, minDuration), maxDuration);
}

// Check if reduced motion is preferred
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Performance-optimized intersection observer
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}