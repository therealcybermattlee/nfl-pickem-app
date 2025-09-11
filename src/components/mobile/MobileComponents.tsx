import React, { useState, useRef, useEffect } from 'react';
import styles from './MobileComponents.module.css';

// Types for component props
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  gameTime: string;
  week: number;
  homeSpread?: number;
  overUnder?: number;
  isLocked?: boolean;
}

export interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
}

export interface MobileGameCardProps {
  game: Game;
  selectedTeam?: string;
  onTeamSelect: (gameId: string, teamId: string) => void;
  showSpread?: boolean;
  compact?: boolean;
}

export interface MobileTeamSelectorProps {
  homeTeam: Team;
  awayTeam: Team;
  selectedTeam?: string;
  onSelect: (teamId: string) => void;
  disabled?: boolean;
  spread?: number;
}

export interface MobileWeekSelectorProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekSelect: (week: number) => void;
  gamesByWeek?: Record<number, number>; // week -> game count
}

export interface MobileNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }>;
}

// MobileButton Component
export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const buttonClass = [
    styles.mobileButton,
    styles[`button-${variant}`],
    styles[`button-${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={loading ? styles.hiddenText : ''}>{children}</span>
    </button>
  );
};

// MobileGameCard Component
export const MobileGameCard: React.FC<MobileGameCardProps> = ({
  game,
  selectedTeam,
  onTeamSelect,
  showSpread = true,
  compact = false
}) => {
  const formatGameTime = (gameTime: string) => {
    try {
      const date = new Date(gameTime);
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
  };

  const cardClass = [
    styles.mobileGameCard,
    compact && styles.compact,
    game.isLocked && styles.locked
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      {/* Game Time Header */}
      <div className={styles.gameHeader}>
        <span className={styles.gameTime}>
          {formatGameTime(game.gameTime)}
        </span>
        {game.isLocked && (
          <span className={styles.lockIndicator} aria-label="Game locked">
            🔒
          </span>
        )}
      </div>

      {/* Team Selection */}
      <div className={styles.teamContainer}>
        <MobileTeamSelector
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          selectedTeam={selectedTeam}
          onSelect={(teamId) => onTeamSelect(game.id, teamId)}
          disabled={game.isLocked}
          spread={showSpread ? game.homeSpread : undefined}
        />
      </div>

      {/* Game Details */}
      {showSpread && !compact && (
        <div className={styles.gameDetails}>
          {game.homeSpread && (
            <span className={styles.spread}>
              Spread: {game.homeSpread > 0 ? '+' : ''}{game.homeSpread}
            </span>
          )}
          {game.overUnder && (
            <span className={styles.overUnder}>
              O/U: {game.overUnder}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// MobileTeamSelector Component
export const MobileTeamSelector: React.FC<MobileTeamSelectorProps> = ({
  homeTeam,
  awayTeam,
  selectedTeam,
  onSelect,
  disabled = false,
  spread
}) => {
  const [pressedTeam, setPressedTeam] = useState<string | null>(null);

  const handleTeamPress = (teamId: string, isPressed: boolean) => {
    if (disabled) return;
    setPressedTeam(isPressed ? teamId : null);
  };

  const TeamButton = ({ team, isHome = false }: { team: Team; isHome?: boolean }) => {
    const isSelected = selectedTeam === team.id;
    const isPressed = pressedTeam === team.id;
    
    const buttonClass = [
      styles.teamButton,
      isSelected && styles.selected,
      isPressed && styles.pressed,
      disabled && styles.disabled
    ].filter(Boolean).join(' ');

    const spreadText = spread && isHome ? 
      (spread > 0 ? ` (+${spread})` : ` (${spread})`) : '';

    return (
      <button
        className={buttonClass}
        onClick={() => onSelect(team.id)}
        onTouchStart={() => handleTeamPress(team.id, true)}
        onTouchEnd={() => handleTeamPress(team.id, false)}
        onMouseDown={() => handleTeamPress(team.id, true)}
        onMouseUp={() => handleTeamPress(team.id, false)}
        onMouseLeave={() => handleTeamPress(team.id, false)}
        disabled={disabled}
        aria-label={`Select ${team.name}${spreadText}`}
        role="radio"
        aria-checked={isSelected}
      >
        {team.logo && (
          <img 
            src={team.logo} 
            alt="" 
            className={styles.teamLogo}
            loading="lazy"
          />
        )}
        <div className={styles.teamInfo}>
          <span className={styles.teamAbbr}>{team.abbreviation}</span>
          <span className={styles.teamName}>{team.name}</span>
          {spread && isHome && (
            <span className={styles.teamSpread}>{spreadText}</span>
          )}
        </div>
        {isSelected && (
          <span className={styles.checkmark} aria-hidden="true">✓</span>
        )}
      </button>
    );
  };

  return (
    <div className={styles.teamSelector} role="radiogroup">
      <TeamButton team={awayTeam} />
      <div className={styles.vsIndicator} aria-hidden="true">@</div>
      <TeamButton team={homeTeam} isHome />
    </div>
  );
};

// MobileWeekSelector Component
export const MobileWeekSelector: React.FC<MobileWeekSelectorProps> = ({
  currentWeek,
  totalWeeks,
  onWeekSelect,
  gamesByWeek = {}
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll current week into view
    if (scrollRef.current) {
      const currentWeekElement = scrollRef.current.querySelector(`[data-week="${currentWeek}"]`) as HTMLElement;
      if (currentWeekElement) {
        currentWeekElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentWeek]);

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className={styles.weekSelector}>
      <div className={styles.weekScrollContainer} ref={scrollRef}>
        {weeks.map(week => {
          const gameCount = gamesByWeek[week] || 0;
          const isSelected = week === currentWeek;
          const isEmpty = gameCount === 0;
          
          const buttonClass = [
            styles.weekButton,
            isSelected && styles.selected,
            isEmpty && styles.empty
          ].filter(Boolean).join(' ');

          return (
            <button
              key={week}
              className={buttonClass}
              onClick={() => onWeekSelect(week)}
              data-week={week}
              disabled={isEmpty}
              aria-label={`Week ${week}${gameCount > 0 ? ` (${gameCount} games)` : ' (no games)'}`}
              aria-current={isSelected ? 'page' : undefined}
            >
              <span className={styles.weekNumber}>Week {week}</span>
              {gameCount > 0 && (
                <span className={styles.gameCount}>{gameCount} games</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// MobileNavigation Component
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage,
  onNavigate,
  items
}) => {
  return (
    <nav className={styles.mobileNavigation} role="navigation" aria-label="Main navigation">
      <div className={styles.navContainer}>
        {items.map(item => {
          const isActive = currentPage === item.id;
          
          const buttonClass = [
            styles.navButton,
            isActive && styles.active
          ].filter(Boolean).join(' ');

          return (
            <button
              key={item.id}
              className={buttonClass}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.navIcon}>
                {item.icon}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className={styles.navBadge} aria-label={`${item.badge} notifications`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Export all components
export default {
  MobileButton,
  MobileGameCard,
  MobileTeamSelector,
  MobileWeekSelector,
  MobileNavigation
};

// Usage Examples (for development reference):
/*
// Basic Button
<MobileButton onClick={handleSubmit} variant="primary">
  Submit Picks
</MobileButton>

// Game Card
<MobileGameCard
  game={gameData}
  selectedTeam={userPick}
  onTeamSelect={(gameId, teamId) => setPick(gameId, teamId)}
  showSpread
/>

// Week Selector
<MobileWeekSelector
  currentWeek={selectedWeek}
  totalWeeks={18}
  onWeekSelect={setSelectedWeek}
  gamesByWeek={weeklyGameCounts}
/>

// Bottom Navigation
<MobileNavigation
  currentPage="games"
  onNavigate={handleNavigation}
  items={[
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'games', label: 'Games', icon: <GameIcon />, badge: 5 },
    { id: 'leaderboard', label: 'Scores', icon: <TrophyIcon /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon /> }
  ]}
/>
*/