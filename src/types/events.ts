// Real-time event system types for NFL Pick'em app
export interface BaseEvent {
  id: number;
  type: string;
  payload: Record<string, any>;
  created_at: string;
  expires_at?: string;
  scope: 'global' | 'user' | string; // 'user:userId' for user-specific events
}

// Specific event payload types
export interface GameLockEventPayload {
  gameId: string;
  lockTime: string;
  teamsAffected: {
    homeTeam: { id: string; name: string; abbreviation: string };
    awayTeam: { id: string; name: string; abbreviation: string };
  };
}

export interface ScoreUpdateEventPayload {
  gameId: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining?: string;
  status: string;
}

export interface PickSubmittedEventPayload {
  userId: number;
  gameId: string;
  teamPicked: {
    id: string;
    name: string;
    abbreviation: string;
  };
  confidence?: number;
  submittedAt: string;
}

export interface AutoPickGeneratedEventPayload {
  userId: number;
  gameId: string;
  teamPicked: {
    id: string;
    name: string;
    abbreviation: string;
  };
  reason: 'game_locked' | 'deadline_missed';
  generatedAt: string;
}

export interface GameCompletedEventPayload {
  gameId: string;
  winnerId: string;
  finalScore: {
    home: number;
    away: number;
  };
  completedAt: string;
  gameDetails: {
    homeTeam: { id: string; name: string; abbreviation: string };
    awayTeam: { id: string; name: string; abbreviation: string };
    week: number;
    season: number;
  };
}

export interface LeaderboardUpdateEventPayload {
  week: number;
  season: number;
  rankings: {
    userId: number;
    position: number;
    points: number;
    change: number; // +/- from previous position
  }[];
  triggeredBy: 'game_completed' | 'picks_finalized';
  updatedAt: string;
}

// Typed event interfaces
export interface GameLockEvent extends BaseEvent {
  type: 'GameLockEvent';
  payload: GameLockEventPayload;
}

export interface ScoreUpdateEvent extends BaseEvent {
  type: 'ScoreUpdateEvent';
  payload: ScoreUpdateEventPayload;
}

export interface PickSubmittedEvent extends BaseEvent {
  type: 'PickSubmittedEvent';
  payload: PickSubmittedEventPayload;
}

export interface AutoPickGeneratedEvent extends BaseEvent {
  type: 'AutoPickGeneratedEvent';
  payload: AutoPickGeneratedEventPayload;
}

export interface GameCompletedEvent extends BaseEvent {
  type: 'GameCompletedEvent';
  payload: GameCompletedEventPayload;
}

export interface LeaderboardUpdateEvent extends BaseEvent {
  type: 'LeaderboardUpdateEvent';
  payload: LeaderboardUpdateEventPayload;
}

// Union type for all events
export type RealTimeEvent = 
  | GameLockEvent 
  | ScoreUpdateEvent 
  | PickSubmittedEvent 
  | AutoPickGeneratedEvent 
  | GameCompletedEvent 
  | LeaderboardUpdateEvent;

// API response types
export interface EventStreamResponse {
  events: RealTimeEvent[];
  lastEventId: number;
  hasMore: boolean;
}

export interface SSEMessage {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}

// Connection management types
export interface ConnectionInfo {
  userId?: number;
  connectionId: string;
  lastEventId: number;
  connectedAt: string;
  lastPingAt: string;
}

// Event creation types
export interface CreateEventRequest {
  type: RealTimeEvent['type'];
  payload: RealTimeEvent['payload'];
  scope?: string;
  expiresInMinutes?: number;
}

// Event storage configuration
export interface EventConfig {
  defaultExpirationMinutes: number;
  cleanupIntervalMinutes: number;
  maxEventsPerUser: number;
  maxGlobalEvents: number;
}