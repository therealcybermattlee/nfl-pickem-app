import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme, type Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme, effectiveTheme } = useTheme();

  // Cycle through themes: System -> Light -> Dark -> System
  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      system: 'light',
      light: 'dark',
      dark: 'system',
    };
    setTheme(nextTheme[theme]);
  };

  // Get current theme display info
  const getThemeInfo = () => {
    switch (theme) {
      case 'light':
        return {
          icon: SunIcon,
          label: 'Light mode',
          description: 'Using light theme',
        };
      case 'dark':
        return {
          icon: MoonIcon,
          label: 'Dark mode',
          description: 'Using dark theme',
        };
      case 'system':
        return {
          icon: ComputerDesktopIcon,
          label: 'System mode',
          description: `Following system preference (${effectiveTheme})`,
        };
      default:
        return {
          icon: ComputerDesktopIcon,
          label: 'System mode',
          description: 'Following system preference',
        };
    }
  };

  const themeInfo = getThemeInfo();
  const Icon = themeInfo.icon;

  return (
    <button
      onClick={cycleTheme}
      className={`
        inline-flex items-center justify-center rounded-md p-2
        text-muted-foreground hover:text-foreground
        hover:bg-accent transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-ring focus-visible:ring-offset-2
        ${className}
      `}
      title={themeInfo.description}
      aria-label={`Switch theme. Current: ${themeInfo.label}. Click to cycle through themes.`}
      type="button"
    >
      <Icon 
        className="h-5 w-5" 
        aria-hidden="true"
      />
      <span className="sr-only">
        {themeInfo.label}. {themeInfo.description}
      </span>
    </button>
  );
}

// Optional: Export a more compact version for mobile
export function CompactThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      system: 'light',
      light: 'dark',
      dark: 'system',
    };
    setTheme(nextTheme[theme]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return SunIcon;
      case 'dark':
        return MoonIcon;
      case 'system':
      default:
        return ComputerDesktopIcon;
    }
  };

  const Icon = getIcon();

  return (
    <button
      onClick={cycleTheme}
      className={`
        p-1.5 rounded-md text-muted-foreground hover:text-foreground
        hover:bg-accent/50 transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-1 
        focus-visible:ring-ring
        ${className}
      `}
      aria-label="Toggle theme"
      type="button"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}