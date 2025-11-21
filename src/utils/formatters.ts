/**
 * Utility functions for formatting data display
 */

/**
 * Format game score display
 * @param homeScore - Home team score
 * @param awayScore - Away team score
 * @param isCompleted - Whether the game is completed
 * @returns Formatted score string (e.g., "24-17" or "—")
 */
export const formatScore = (
  homeScore?: number | null,
  awayScore?: number | null,
  isCompleted: boolean = false
): string => {
  if (!isCompleted || homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
    return '—';
  }
  return `${homeScore}-${awayScore}`;
};

/**
 * Format spread display with proper sign
 * @param spread - Point spread value (positive favors home, negative favors away)
 * @param teamType - Whether this is for home or away team
 * @returns Formatted spread string (e.g., "-3.5", "+3.5", "PK")
 */
export const formatSpread = (spread?: number | null, teamType?: 'home' | 'away'): string => {
  if (spread === null || spread === undefined) {
    return '—';
  }

  if (spread === 0) {
    return 'PK'; // Pick'em
  }

  const absoluteSpread = Math.abs(spread);

  // If team type is specified, show from that team's perspective
  if (teamType) {
    const isHome = teamType === 'home';
    const adjustedSpread = isHome ? spread : -spread;
    const sign = adjustedSpread > 0 ? '+' : '';
    return `${sign}${adjustedSpread.toFixed(1)}`;
  }

  // Default: show with sign
  const sign = spread > 0 ? '+' : '';
  return `${sign}${spread.toFixed(1)}`;
};

/**
 * Format over/under display
 * @param overUnder - Total points over/under value
 * @returns Formatted string (e.g., "O/U 47.5")
 */
export const formatOverUnder = (overUnder?: number | null): string => {
  if (overUnder === null || overUnder === undefined) {
    return '—';
  }
  return `O/U ${overUnder.toFixed(1)}`;
};

/**
 * Format percentage display
 * @param value - Percentage value (0-100 or 0-1)
 * @param decimals - Number of decimal places (default 1)
 * @param normalize - Whether to normalize from 0-1 to 0-100 (default true)
 * @returns Formatted percentage string (e.g., "75.5%")
 */
export const formatPercentage = (
  value?: number | null,
  decimals: number = 1,
  normalize: boolean = false
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const percentage = normalize ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format win percentage for leaderboard display
 * @param wins - Number of wins
 * @param total - Total number of picks
 * @returns Formatted percentage string (e.g., "75.0%")
 */
export const formatWinPercentage = (wins: number, total: number): string => {
  if (total === 0) {
    return '0.0%';
  }
  const percentage = (wins / total) * 100;
  return formatPercentage(percentage, 1, false);
};

/**
 * Format points display
 * @param points - Points value
 * @returns Formatted points string (e.g., "12 pts" or "1 pt")
 */
export const formatPoints = (points?: number | null): string => {
  if (points === null || points === undefined) {
    return '0 pts';
  }
  return `${points} ${points === 1 ? 'pt' : 'pts'}`;
};

/**
 * Format record display
 * @param wins - Number of wins
 * @param losses - Number of losses
 * @returns Formatted record string (e.g., "12-4")
 */
export const formatRecord = (wins: number, losses: number): string => {
  return `${wins}-${losses}`;
};

/**
 * Format money line display
 * @param moneyline - Money line value
 * @returns Formatted money line string (e.g., "-150", "+120")
 */
export const formatMoneyline = (moneyline?: number | null): string => {
  if (moneyline === null || moneyline === undefined) {
    return '—';
  }
  const sign = moneyline > 0 ? '+' : '';
  return `${sign}${moneyline}`;
};

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 * @param num - Number to format
 * @returns Formatted ordinal string (e.g., "1st", "2nd", "3rd", "4th")
 */
export const formatOrdinal = (num: number): string => {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return `${num}st`;
  }
  if (j === 2 && k !== 12) {
    return `${num}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${num}rd`;
  }
  return `${num}th`;
};

/**
 * Format rank with ordinal suffix
 * @param position - Leaderboard position
 * @returns Formatted rank string (e.g., "1st", "2nd", "3rd")
 */
export const formatRank = (position: number): string => {
  return formatOrdinal(position);
};

/**
 * Format team abbreviation to uppercase
 * @param abbreviation - Team abbreviation
 * @returns Uppercase abbreviation (e.g., "PHI", "KC")
 */
export const formatTeamAbbreviation = (abbreviation: string): string => {
  return abbreviation.toUpperCase();
};

/**
 * Format confidence points (if using confidence pool)
 * @param confidence - Confidence value (1-16)
 * @returns Formatted confidence string
 */
export const formatConfidence = (confidence?: number | null): string => {
  if (confidence === null || confidence === undefined) {
    return '—';
  }
  return `${confidence} pt${confidence === 1 ? '' : 's'}`;
};

/**
 * Format number with commas for thousands
 * @param num - Number to format
 * @returns Formatted number string (e.g., "1,234,567")
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Format compact number (K, M notation)
 * @param num - Number to format
 * @returns Compact number string (e.g., "1.2K", "3.4M")
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export default {
  formatScore,
  formatSpread,
  formatOverUnder,
  formatPercentage,
  formatWinPercentage,
  formatPoints,
  formatRecord,
  formatMoneyline,
  formatOrdinal,
  formatRank,
  formatTeamAbbreviation,
  formatConfidence,
  formatNumber,
  formatCompactNumber,
};
