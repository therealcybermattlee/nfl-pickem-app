// Real-time event system for NFL Pick'em app
import { D1DatabaseManager } from './db-workers'
import { 
  RealTimeEvent, 
  CreateEventRequest, 
  EventStreamResponse, 
  SSEMessage,
  EventConfig 
} from '../types/events'

interface Env {
  DB: D1Database
}

export class EventSystem {
  private db: D1DatabaseManager
  private config: EventConfig

  constructor(db: D1DatabaseManager, config?: Partial<EventConfig>) {
    this.db = db
    this.config = {
      defaultExpirationMinutes: 60, // Events expire after 1 hour
      cleanupIntervalMinutes: 15,  // Clean up every 15 minutes
      maxEventsPerUser: 100,       // Max events per user
      maxGlobalEvents: 500,        // Max global events
      ...config
    }
  }

  /**
   * Create and store a new event
   */
  async createEvent(eventRequest: CreateEventRequest): Promise<RealTimeEvent> {
    const expiresInMinutes = eventRequest.expiresInMinutes || this.config.defaultExpirationMinutes
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)
    
    const result = await this.db.query(`
      INSERT INTO events (type, payload, expires_at, scope)
      VALUES (?, ?, ?, ?)
      RETURNING id, created_at
    `, [
      eventRequest.type,
      JSON.stringify(eventRequest.payload),
      expiresAt.toISOString(),
      eventRequest.scope || 'global'
    ])

    if (!result.results.length) {
      throw new Error('Failed to create event')
    }

    const row = result.results[0] as any
    
    // Trigger cleanup periodically
    if (Math.random() < 0.1) { // 10% chance to trigger cleanup
      await this.cleanupExpiredEvents()
    }

    return {
      id: row.id,
      type: eventRequest.type,
      payload: eventRequest.payload,
      created_at: row.created_at,
      expires_at: expiresAt.toISOString(),
      scope: eventRequest.scope || 'global'
    } as RealTimeEvent
  }

  /**
   * Get events since a specific event ID
   */
  async getEventsSince(lastEventId: number, userId?: number, limit: number = 50): Promise<EventStreamResponse> {
    let query = `
      SELECT id, type, payload, created_at, expires_at, scope
      FROM events 
      WHERE id > ? AND expires_at > CURRENT_TIMESTAMP
    `
    const params: any[] = [lastEventId]

    if (userId) {
      query += ` AND (scope = 'global' OR scope = ? OR scope = ?)`
      params.push('global', `user:${userId}`)
    } else {
      query += ` AND scope = 'global'`
    }

    query += ` ORDER BY id ASC LIMIT ?`
    params.push(limit)

    const result = await this.db.query(query, params)
    
    const events: RealTimeEvent[] = result.results.map((row: any) => ({
      id: row.id,
      type: row.type,
      payload: JSON.parse(row.payload),
      created_at: row.created_at,
      expires_at: row.expires_at,
      scope: row.scope
    })) as RealTimeEvent[]

    return {
      events,
      lastEventId: events.length > 0 ? events[events.length - 1].id : lastEventId,
      hasMore: events.length === limit
    }
  }

  /**
   * Get events since a specific timestamp
   */
  async getEventsSinceTimestamp(timestamp: string, userId?: number, limit: number = 50): Promise<EventStreamResponse> {
    let query = `
      SELECT id, type, payload, created_at, expires_at, scope
      FROM events 
      WHERE created_at > ? AND expires_at > CURRENT_TIMESTAMP
    `
    const params: any[] = [timestamp]

    if (userId) {
      query += ` AND (scope = 'global' OR scope = ?)`
      params.push(`user:${userId}`)
    } else {
      query += ` AND scope = 'global'`
    }

    query += ` ORDER BY id ASC LIMIT ?`
    params.push(limit)

    const result = await this.db.query(query, params)
    
    const events: RealTimeEvent[] = result.results.map((row: any) => ({
      id: row.id,
      type: row.type,
      payload: JSON.parse(row.payload),
      created_at: row.created_at,
      expires_at: row.expires_at,
      scope: row.scope
    })) as RealTimeEvent[]

    return {
      events,
      lastEventId: events.length > 0 ? events[events.length - 1].id : 0,
      hasMore: events.length === limit
    }
  }

  /**
   * Clean up expired events
   */
  async cleanupExpiredEvents(): Promise<number> {
    const result = await this.db.query(`
      DELETE FROM events 
      WHERE expires_at < CURRENT_TIMESTAMP
    `)
    
    return result.meta?.changes || 0
  }

  /**
   * Get the latest event ID for a user
   */
  async getLatestEventId(userId?: number): Promise<number> {
    let query = `SELECT MAX(id) as maxId FROM events WHERE expires_at > CURRENT_TIMESTAMP`
    const params: any[] = []

    if (userId) {
      query += ` AND (scope = 'global' OR scope = ?)`
      params.push(`user:${userId}`)
    } else {
      query += ` AND scope = 'global'`
    }

    const result = await this.db.query(query, params)
    
    return result.results[0]?.maxId || 0
  }

  /**
   * Create an SSE-formatted message
   */
  formatSSEMessage(event: RealTimeEvent, retry?: number): string {
    const lines: string[] = []
    
    if (event.id) {
      lines.push(`id: ${event.id}`)
    }
    
    lines.push(`event: ${event.type}`)
    
    if (retry) {
      lines.push(`retry: ${retry}`)
    }
    
    lines.push(`data: ${JSON.stringify({
      id: event.id,
      type: event.type,
      payload: event.payload,
      created_at: event.created_at,
      scope: event.scope
    })}`)
    
    lines.push('') // Empty line to end the message
    
    return lines.join('\n')
  }

  /**
   * Create a heartbeat/keep-alive message
   */
  createHeartbeat(): string {
    return `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`
  }
}

/**
 * Handle Server-Sent Events (SSE) streaming
 */
export async function handleSSEStream(
  request: Request, 
  db: D1DatabaseManager, 
  userId?: number
): Promise<Response> {
  const url = new URL(request.url)
  const lastEventId = parseInt(url.searchParams.get('lastEventId') || '0')
  const heartbeatInterval = 30000 // 30 seconds

  const eventSystem = new EventSystem(db)

  // Create a readable stream for SSE
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  // Connection management
  let isConnected = true
  let heartbeatTimer: any

  const cleanup = () => {
    isConnected = false
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }
    try {
      writer.close()
    } catch (e) {
      // Connection already closed
    }
  }

  // Handle client disconnection
  request.signal?.addEventListener('abort', cleanup)

  // Start the SSE loop
  const startSSELoop = async () => {
    try {
      let currentLastEventId = lastEventId

      // Send initial events
      const initialEvents = await eventSystem.getEventsSince(currentLastEventId, userId)
      for (const event of initialEvents.events) {
        if (!isConnected) break
        
        const sseMessage = eventSystem.formatSSEMessage(event)
        await writer.write(new TextEncoder().encode(sseMessage))
        currentLastEventId = event.id
      }

      // Set up heartbeat
      heartbeatTimer = setInterval(async () => {
        if (!isConnected) return
        
        try {
          const heartbeat = eventSystem.createHeartbeat()
          await writer.write(new TextEncoder().encode(heartbeat))
        } catch (e) {
          cleanup()
        }
      }, heartbeatInterval)

      // Polling loop for new events
      while (isConnected) {
        try {
          const newEvents = await eventSystem.getEventsSince(currentLastEventId, userId, 10)
          
          for (const event of newEvents.events) {
            if (!isConnected) break
            
            const sseMessage = eventSystem.formatSSEMessage(event)
            await writer.write(new TextEncoder().encode(sseMessage))
            currentLastEventId = event.id
          }

          // Wait 2 seconds before next poll
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (error) {
          console.error('SSE polling error:', error)
          break
        }
      }
    } catch (error) {
      console.error('SSE stream error:', error)
    } finally {
      cleanup()
    }
  }

  // Start the SSE loop asynchronously
  startSSELoop()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    }
  })
}

/**
 * Handle polling-based event retrieval (fallback for SSE)
 */
export async function handleEventPolling(
  request: Request,
  db: D1DatabaseManager,
  userId?: number
): Promise<Response> {
  const url = new URL(request.url)
  const lastEventId = parseInt(url.searchParams.get('lastEventId') || '0')
  const timestamp = url.searchParams.get('timestamp')
  
  const eventSystem = new EventSystem(db)
  
  let events: EventStreamResponse
  
  if (timestamp) {
    events = await eventSystem.getEventsSinceTimestamp(timestamp, userId)
  } else {
    events = await eventSystem.getEventsSince(lastEventId, userId)
  }

  return new Response(JSON.stringify(events), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

/**
 * Helper function to broadcast different types of events
 */
export class EventBroadcaster {
  private eventSystem: EventSystem

  constructor(eventSystem: EventSystem) {
    this.eventSystem = eventSystem
  }

  async broadcastGameLock(gameId: string, lockTime: string, homeTeam: any, awayTeam: any) {
    await this.eventSystem.createEvent({
      type: 'GameLockEvent',
      payload: {
        gameId,
        lockTime,
        teamsAffected: {
          homeTeam: {
            id: homeTeam.id,
            name: homeTeam.name,
            abbreviation: homeTeam.abbreviation
          },
          awayTeam: {
            id: awayTeam.id,
            name: awayTeam.name,
            abbreviation: awayTeam.abbreviation
          }
        }
      },
      scope: 'global'
    })
  }

  async broadcastScoreUpdate(gameId: string, homeScore: number, awayScore: number, quarter: number, status: string) {
    await this.eventSystem.createEvent({
      type: 'ScoreUpdateEvent',
      payload: {
        gameId,
        homeScore,
        awayScore,
        quarter,
        status
      },
      scope: 'global'
    })
  }

  async broadcastPickSubmitted(userId: number, gameId: string, teamPicked: any, confidence?: number) {
    await this.eventSystem.createEvent({
      type: 'PickSubmittedEvent',
      payload: {
        userId,
        gameId,
        teamPicked: {
          id: teamPicked.id,
          name: teamPicked.name,
          abbreviation: teamPicked.abbreviation
        },
        confidence,
        submittedAt: new Date().toISOString()
      },
      scope: 'global'
    })
  }

  async broadcastAutoPickGenerated(userId: number, gameId: string, teamPicked: any, reason: 'game_locked' | 'deadline_missed') {
    // Global event for everyone
    await this.eventSystem.createEvent({
      type: 'AutoPickGeneratedEvent',
      payload: {
        userId,
        gameId,
        teamPicked: {
          id: teamPicked.id,
          name: teamPicked.name,
          abbreviation: teamPicked.abbreviation
        },
        reason,
        generatedAt: new Date().toISOString()
      },
      scope: 'global'
    })

    // User-specific event
    await this.eventSystem.createEvent({
      type: 'AutoPickGeneratedEvent',
      payload: {
        userId,
        gameId,
        teamPicked: {
          id: teamPicked.id,
          name: teamPicked.name,
          abbreviation: teamPicked.abbreviation
        },
        reason,
        generatedAt: new Date().toISOString()
      },
      scope: `user:${userId}`
    })
  }

  async broadcastGameCompleted(gameId: string, winnerId: string, homeScore: number, awayScore: number, gameDetails: any) {
    await this.eventSystem.createEvent({
      type: 'GameCompletedEvent',
      payload: {
        gameId,
        winnerId,
        finalScore: {
          home: homeScore,
          away: awayScore
        },
        completedAt: new Date().toISOString(),
        gameDetails
      },
      scope: 'global'
    })
  }

  async broadcastLeaderboardUpdate(week: number, season: number, rankings: any[], triggeredBy: 'game_completed' | 'picks_finalized') {
    await this.eventSystem.createEvent({
      type: 'LeaderboardUpdateEvent',
      payload: {
        week,
        season,
        rankings,
        triggeredBy,
        updatedAt: new Date().toISOString()
      },
      scope: 'global'
    })
  }
}