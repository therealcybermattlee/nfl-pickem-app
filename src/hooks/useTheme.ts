import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

// Get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get stored theme or default to system
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('nfl-pickem-theme');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  return 'system';
};

// Apply theme to DOM
const applyTheme = (effectiveTheme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply Tailwind dark class
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Apply data-theme attribute for CSS custom properties
  root.setAttribute('data-theme', effectiveTheme);
};

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());

  // Calculate effective theme
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Apply theme changes to DOM
  useEffect(() => {
    applyTheme(effectiveTheme);
  }, [effectiveTheme]);

  // Set theme function with localStorage persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('nfl-pickem-theme', newTheme);
    } catch (error) {
      console.warn('Failed to store theme in localStorage:', error);
    }
  }, []);

  return {
    theme,
    setTheme,
    effectiveTheme,
  };
};

// Initialize theme on app start (called in index.html script)
export const initializeTheme = () => {
  if (typeof window === 'undefined') return;
  
  const storedTheme = getStoredTheme();
  const systemTheme = getSystemTheme();
  const effectiveTheme = storedTheme === 'system' ? systemTheme : storedTheme;
  
  applyTheme(effectiveTheme);
};