import { useEffect, useCallback, useRef } from 'react';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  RealTimeEvent,
  GameLockEvent,
  ScoreUpdateEvent,
  PickSubmittedEvent,
  AutoPickGeneratedEvent,
  GameCompletedEvent,
  LeaderboardUpdateEvent
} from '../types/events';

interface UseRealTimeNotificationsOptions {
  enabled?: boolean;
  fallbackToPolling?: boolean;
}

/**
 * Hook that integrates real-time events with the notification system.
 * Automatically shows notifications for relevant real-time events.
 */
export function useRealTimeNotifications(options: UseRealTimeNotificationsOptions = {}) {
  const { enabled = true, fallbackToPolling = true } = options;

  const { user, token } = useAuth();
  const { success, info, warning, error } = useNotifications();
  const processedEventIds = useRef(new Set<number>());

  // Connect to real-time updates
  const {
    events,
    isConnected,
    isReconnecting,
    connectionError,
    clearEvents
  } = useRealTimeUpdates({
    userId: user?.id ? parseInt(user.id) : undefined,
    authToken: token || undefined,
    fallbackToPolling,
  });

  /**
   * Handle GameLockEvent - notify when game is about to lock
   */
  const handleGameLockEvent = useCallback((event: GameLockEvent) => {
    const { teamsAffected, lockTime } = event.payload;
    const lockDate = new Date(lockTime);
    const minutesUntilLock = Math.floor((lockDate.getTime() - Date.now()) / 60000);

    if (minutesUntilLock <= 15 && minutesUntilLock > 0) {
      warning(
        'Game Locking Soon',
        `${teamsAffected.awayTeam.abbreviation} @ ${teamsAffected.homeTeam.abbreviation} locks in ${minutesUntilLock} minutes`,
        { duration: 10000 }
      );
    } else if (minutesUntilLock <= 0) {
      info(
        'Game Locked',
        `${teamsAffected.awayTeam.abbreviation} @ ${teamsAffected.homeTeam.abbreviation} is now locked`,
        { duration: 5000 }
      );
    }
  }, [warning, info]);

  /**
   * Handle ScoreUpdateEvent - notify on score changes
   */
  const handleScoreUpdateEvent = useCallback((event: ScoreUpdateEvent) => {
    const { homeScore, awayScore, quarter, status } = event.payload;

    // Only show notifications for significant events (game start, half, end)
    if (status === 'in_progress' && (quarter === 1 || quarter === 3)) {
      info(
        'Game Started',
        `Score: ${awayScore}-${homeScore} (Q${quarter})`,
        { duration: 5000 }
      );
    } else if (status === 'final') {
      success(
        'Game Final',
        `Final Score: ${awayScore}-${homeScore}`,
        { duration: 7000 }
      );
    }
  }, [info, success]);

  /**
   * Handle PickSubmittedEvent - notify when user submits a pick
   */
  const handlePickSubmittedEvent = useCallback((event: PickSubmittedEvent) => {
    const { userId, teamPicked, confidence } = event.payload;

    // Only show notification for current user's picks
    if (user && userId === parseInt(user.id)) {
      const confidenceText = confidence ? ` (${confidence} pts)` : '';
      success(
        'Pick Submitted',
        `You picked ${teamPicked.name}${confidenceText}`,
        { duration: 5000 }
      );
    }
  }, [success, user]);

  /**
   * Handle AutoPickGeneratedEvent - notify when auto-pick is generated
   */
  const handleAutoPickGeneratedEvent = useCallback((event: AutoPickGeneratedEvent) => {
    const { userId, teamPicked, reason } = event.payload;

    // Only show notification for current user's auto-picks
    if (user && userId === parseInt(user.id)) {
      const reasonText = reason === 'game_locked'
        ? 'game started without your pick'
        : 'you missed the deadline';

      warning(
        'Auto-Pick Generated',
        `${teamPicked.name} was automatically selected because ${reasonText}`,
        { duration: 10000 }
      );
    }
  }, [warning, user]);

  /**
   * Handle GameCompletedEvent - notify when game is completed
   */
  const handleGameCompletedEvent = useCallback((event: GameCompletedEvent) => {
    const { gameDetails, finalScore, winnerId } = event.payload;
    const { homeTeam, awayTeam } = gameDetails;

    const winner = winnerId === homeTeam.id ? homeTeam : awayTeam;

    success(
      'Game Completed',
      `${winner.abbreviation} wins! Final: ${awayTeam.abbreviation} ${finalScore.away}-${finalScore.home} ${homeTeam.abbreviation}`,
      { duration: 7000 }
    );
  }, [success]);

  /**
   * Handle LeaderboardUpdateEvent - notify on leaderboard changes
   */
  const handleLeaderboardUpdateEvent = useCallback((event: LeaderboardUpdateEvent) => {
    const { week, rankings, triggeredBy } = event.payload;

    // Find current user's ranking
    if (user) {
      const userRanking = rankings.find(r => r.userId === parseInt(user.id));

      if (userRanking) {
        const changeText = userRanking.change > 0
          ? `↑ ${userRanking.change}`
          : userRanking.change < 0
            ? `↓ ${Math.abs(userRanking.change)}`
            : '—';

        const emoji = userRanking.change > 0 ? '📈' : userRanking.change < 0 ? '📉' : '📊';

        info(
          `${emoji} Leaderboard Updated`,
          `Week ${week}: You're #${userRanking.position} with ${userRanking.points} pts (${changeText})`,
          { duration: 8000 }
        );
      }
    }
  }, [info, user]);

  /**
   * Process a single event and show appropriate notification
   */
  const processEvent = useCallback((event: RealTimeEvent) => {
    // Skip if already processed
    if (processedEventIds.current.has(event.id)) {
      return;
    }

    // Mark as processed
    processedEventIds.current.add(event.id);

    // Route to appropriate handler based on event type
    switch (event.type) {
      case 'GameLockEvent':
        handleGameLockEvent(event as GameLockEvent);
        break;
      case 'ScoreUpdateEvent':
        handleScoreUpdateEvent(event as ScoreUpdateEvent);
        break;
      case 'PickSubmittedEvent':
        handlePickSubmittedEvent(event as PickSubmittedEvent);
        break;
      case 'AutoPickGeneratedEvent':
        handleAutoPickGeneratedEvent(event as AutoPickGeneratedEvent);
        break;
      case 'GameCompletedEvent':
        handleGameCompletedEvent(event as GameCompletedEvent);
        break;
      case 'LeaderboardUpdateEvent':
        handleLeaderboardUpdateEvent(event as LeaderboardUpdateEvent);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  }, [
    handleGameLockEvent,
    handleScoreUpdateEvent,
    handlePickSubmittedEvent,
    handleAutoPickGeneratedEvent,
    handleGameCompletedEvent,
    handleLeaderboardUpdateEvent
  ]);

  /**
   * Process new events when they arrive
   */
  useEffect(() => {
    if (!enabled) return;

    // Process any new events
    events.forEach(processEvent);
  }, [events, enabled, processEvent]);

  /**
   * Show notification on connection status changes
   */
  useEffect(() => {
    if (!enabled) return;

    if (isReconnecting) {
      info('Reconnecting...', 'Attempting to restore real-time connection', {
        duration: 3000
      });
    }

    if (connectionError) {
      error(
        'Connection Lost',
        fallbackToPolling
          ? 'Switched to polling mode for updates'
          : 'Real-time updates unavailable',
        { duration: 5000 }
      );
    }
  }, [isConnected, isReconnecting, connectionError, enabled, fallbackToPolling, info, error]);

  /**
   * Clean up processed events periodically (keep last 100)
   */
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (processedEventIds.current.size > 100) {
        const idsArray = Array.from(processedEventIds.current);
        const toKeep = new Set(idsArray.slice(-100));
        processedEventIds.current = toKeep;
      }
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  return {
    isConnected,
    isReconnecting,
    connectionError,
    eventsReceived: events.length,
    clearEvents
  };
}
