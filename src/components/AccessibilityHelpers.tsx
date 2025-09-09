import React, { useEffect, useState } from 'react';

// Screen reader announcements for dynamic content
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
  className?: string;
}> = ({ message, priority = 'polite', clearAfter = 5000, className = '' }) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div 
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {currentMessage}
    </div>
  );
};

// High contrast mode detection and toggle
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check if user prefers high contrast
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
    // Store preference
    localStorage.setItem('highContrast', (!isHighContrast).toString());
  };

  return { isHighContrast, toggleHighContrast };
};

// Skip navigation for keyboard users
export const SkipNav: React.FC = () => {
  return (
    <a 
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
};

// Focus management for modal-like components
export const useFocusTrap = (isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = document.querySelector('[data-focus-trap]');
    if (!modal) return;

    const firstFocusableElement = modal.querySelector(focusableElements) as HTMLElement;
    const focusableContent = modal.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const closeButton = modal.querySelector('[data-close]') as HTMLElement;
        closeButton?.click();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);
    firstFocusableElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive]);
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Accessible countdown timer with proper announcements
export const AccessibleCountdown: React.FC<{
  remainingSeconds: number;
  announceIntervals?: number[];
  onAnnouncement?: (message: string) => void;
}> = ({ remainingSeconds, announceIntervals = [300, 120, 60, 30, 10], onAnnouncement }) => {
  const [lastAnnounced, setLastAnnounced] = useState<number | null>(null);

  useEffect(() => {
    const shouldAnnounce = announceIntervals.find(interval => 
      remainingSeconds <= interval && 
      (lastAnnounced === null || lastAnnounced > interval)
    );

    if (shouldAnnounce) {
      const minutes = Math.floor(shouldAnnounce / 60);
      const seconds = shouldAnnounce % 60;
      
      let message = '';
      if (minutes > 0) {
        message = `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
        if (seconds > 0) {
          message += ` and ${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
      } else {
        message = `${seconds} second${seconds !== 1 ? 's' : ''} remaining`;
      }

      setLastAnnounced(shouldAnnounce);
      onAnnouncement?.(message);
    }
  }, [remainingSeconds, announceIntervals, lastAnnounced, onAnnouncement]);

  return null; // This component only handles announcements
};

// Touch-friendly button with proper accessibility
export const TouchButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  size = 'medium',
  ariaLabel,
  className = ''
}) => {
  const baseClasses = 'rounded-lg font-medium transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
  };

  const sizeClasses = {
    small: 'px-3 py-2 text-sm min-h-[40px]',
    medium: 'px-4 py-3 text-base min-h-[44px]',
    large: 'px-6 py-4 text-lg min-h-[48px]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Form field with proper labeling and error handling
export const AccessibleFormField: React.FC<{
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helpText?: string;
}> = ({ id, label, error, required, children, helpText }) => {
  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': `${id}-help ${error ? `${id}-error` : ''}`,
        'aria-invalid': !!error,
        required
      })}
      
      {helpText && (
        <p id={`${id}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Context provider for accessibility preferences
const AccessibilityContext = React.createContext({
  highContrast: false,
  reducedMotion: false,
  toggleHighContrast: () => {},
});

export const AccessibilityProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  const reducedMotion = useReducedMotion();

  const value = {
    highContrast: isHighContrast,
    reducedMotion,
    toggleHighContrast
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <div className={isHighContrast ? 'high-contrast' : ''}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};