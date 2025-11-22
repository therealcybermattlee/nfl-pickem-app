import { useState, useEffect, useRef, useCallback } from 'react'
import { RealTimeEvent, EventStreamResponse } from '../types/events'

interface UseRealTimeUpdatesOptions {
  userId?: number
  authToken?: string
  fallbackToPolling?: boolean
  pollingInterval?: number
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

interface RealTimeState {
  events: RealTimeEvent[]
  isConnected: boolean
  isReconnecting: boolean
  lastEventId: number
  connectionError?: string
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const {
    userId,
    authToken,
    fallbackToPolling = true,
    pollingInterval = 5000, // 5 seconds
    reconnectInterval = 3000, // 3 seconds
    maxReconnectAttempts = 5
  } = options

  const [state, setState] = useState<RealTimeState>({
    events: [],
    isConnected: false,
    isReconnecting: false,
    lastEventId: 0
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const mountedRef = useRef(true)

  // API base URL
  const API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://nfl-pickem-app-production.m-de6.workers.dev'
    : 'http://localhost:8787'

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const handleNewEvent = useCallback((event: RealTimeEvent) => {
    if (!mountedRef.current) return

    setState(prev => ({
      ...prev,
      events: [...prev.events, event],
      lastEventId: Math.max(prev.lastEventId, event.id)
    }))
  }, [])

  const handleConnectionError = useCallback((error: string) => {
    if (!mountedRef.current) return

    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionError: error
    }))

    // Attempt reconnection if not at max attempts
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      setState(prev => ({ ...prev, isReconnecting: true }))
      
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          reconnectAttemptsRef.current++
          connectSSE()
        }
      }, reconnectInterval)
    } else if (fallbackToPolling) {
      console.log('Max SSE reconnect attempts reached, falling back to polling')
      startPolling()
    }
  }, [fallbackToPolling, maxReconnectAttempts, reconnectInterval])

  const connectSSE = useCallback(() => {
    if (!mountedRef.current) return

    cleanup()

    try {
      const headers: Record<string, string> = {}
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const url = new URL(`${API_BASE}/api/events/stream`)
      if (state.lastEventId > 0) {
        url.searchParams.set('lastEventId', state.lastEventId.toString())
      }

      eventSourceRef.current = new EventSource(url.toString())

      eventSourceRef.current.onopen = () => {
        if (!mountedRef.current) return
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isReconnecting: false,
          connectionError: undefined
        }))
        reconnectAttemptsRef.current = 0
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealTimeEvent
          handleNewEvent(data)
        } catch (error) {
          console.error('Failed to parse SSE event:', error)
        }
      }

      eventSourceRef.current.onerror = () => {
        handleConnectionError('SSE connection error')
      }

      // Handle specific event types
      const eventTypes = ['GameLockEvent', 'ScoreUpdateEvent', 'PickSubmittedEvent', 
                         'AutoPickGeneratedEvent', 'GameCompletedEvent', 'LeaderboardUpdateEvent']
      
      eventTypes.forEach(eventType => {
        eventSourceRef.current?.addEventListener(eventType, (event) => {
          try {
            const customEvent = event as MessageEvent
            const data = JSON.parse(customEvent.data) as RealTimeEvent
            handleNewEvent(data)
          } catch (error) {
            console.error(`Failed to parse ${eventType} event:`, error)
          }
        })
      })

    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      if (fallbackToPolling) {
        startPolling()
      }
    }
  }, [API_BASE, authToken, state.lastEventId, handleNewEvent, handleConnectionError, fallbackToPolling, cleanup])

  const pollEvents = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const url = new URL(`${API_BASE}/api/events/poll`)
      url.searchParams.set('lastEventId', state.lastEventId.toString())

      const response = await fetch(url.toString(), { headers })
      
      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status}`)
      }

      const data: EventStreamResponse = await response.json()
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionError: undefined
      }))

      // Process new events
      data.events.forEach(handleNewEvent)

    } catch (error) {
      console.error('Polling error:', error)
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionError: error instanceof Error ? error.message : 'Unknown polling error'
      }))
    }
  }, [API_BASE, authToken, state.lastEventId, handleNewEvent])

  const startPolling = useCallback(() => {
    cleanup()
    
    // Initial poll
    pollEvents()
    
    // Set up polling interval
    pollingTimerRef.current = setInterval(() => {
      if (mountedRef.current) {
        pollEvents()
      }
    }, pollingInterval)
    
    setState(prev => ({
      ...prev,
      isReconnecting: false
    }))
  }, [pollEvents, pollingInterval, cleanup])

  const connect = useCallback(() => {
    if ('EventSource' in window && !fallbackToPolling) {
      connectSSE()
    } else {
      startPolling()
    }
  }, [connectSSE, startPolling, fallbackToPolling])

  const disconnect = useCallback(() => {
    cleanup()
    setState(prev => ({
      ...prev,
      isConnected: false,
      isReconnecting: false
    }))
  }, [cleanup])

  const clearEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      events: []
    }))
  }, [])

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [connect, cleanup])

  // Filter events for specific types
  const getEventsByType = useCallback((eventType: string) => {
    return state.events.filter(event => event.type === eventType)
  }, [state.events])

  // Get events for specific user (if applicable)
  const getUserEvents = useCallback((targetUserId: number) => {
    return state.events.filter(event => 
      event.scope === `user:${targetUserId}` || 
      (event.payload && 'userId' in event.payload && event.payload.userId === targetUserId)
    )
  }, [state.events])

  return {
    // State
    events: state.events,
    isConnected: state.isConnected,
    isReconnecting: state.isReconnecting,
    lastEventId: state.lastEventId,
    connectionError: state.connectionError,
    
    // Actions
    connect,
    disconnect,
    clearEvents,
    
    // Helpers
    getEventsByType,
    getUserEvents
  }
}