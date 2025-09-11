// Mobile Components Index
// Export all mobile components for easy importing

export {
  MobileButton,
  MobileGameCard,
  MobileTeamSelector,
  MobileWeekSelector,
  MobileNavigation
} from './MobileComponents';

// Export navigation components
export {
  MobileBottomNavigation,
  MobileHeader,
  MobileMenu,
  MobileBurgerMenu,
  MobileNavigationSystem,
  useMobileMenu
} from './MobileNavigation';

// Export selector components
export {
  MobileWeekSelector as MobileWeekSelectorAdvanced,
  MobilePlayerSelector,
  MobileGameNavigation,
  MobileQuickStats
} from './MobileSelectors';

// Re-export types for external use
export type {
  Team,
  Game,
  MobileButtonProps,
  MobileGameCardProps,
  MobileTeamSelectorProps,
  MobileWeekSelectorProps,
  MobileNavigationProps
} from './MobileComponents';

// Default export for convenience
export { default } from './MobileComponents';