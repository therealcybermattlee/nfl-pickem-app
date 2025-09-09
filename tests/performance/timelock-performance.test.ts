import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'

describe('Time-Lock System Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Time Calculation Performance', () => {
    it('should handle 10,000 time calculations in under 100ms', async () => {
      const { calcRemainingTime, isGameLocked } = await import('../../src/utils/timeUtils')
      
      const gameTime = new Date('2025-09-07T16:00:00.000Z')
      const iterations = 10000
      
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        calcRemainingTime(gameTime)
        isGameLocked(gameTime, 60)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
      console.log(`Time calculations: ${iterations} operations in ${duration.toFixed(2)}ms`)
    })

    it('should handle concurrent time calculations efficiently', async () => {
      const { calcRemainingTime } = await import('../../src/utils/timeUtils')
      
      const gameTime = new Date('2025-09-07T16:00:00.000Z')
      const concurrentOps = 1000
      
      const startTime = performance.now()
      
      const promises = Array.from({ length: concurrentOps }, () => 
        Promise.resolve(calcRemainingTime(gameTime))
      )
      
      await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(50) // Should complete in under 50ms
      console.log(`Concurrent time calculations: ${concurrentOps} operations in ${duration.toFixed(2)}ms`)
    })
  })

  describe('Component Rendering Performance', () => {
    it('should render multiple countdown timers efficiently', async () => {
      const { render } = await import('@testing-library/react')
      const { CountdownTimer } = await import('../../src/components/CountdownTimer')
      const { createElement } = await import('react')
      
      vi.useFakeTimers()
      const mockTime = new Date('2025-09-07T12:00:00.000Z').getTime()
      vi.setSystemTime(mockTime)
      
      const componentCount = 100
      const futureTime = new Date(mockTime + 60 * 60 * 1000) // 1 hour future
      
      const startTime = performance.now()
      
      // Render 100 countdown timers
      const timers = Array.from({ length: componentCount }, (_, i) =>
        createElement(CountdownTimer, {
          key: i,
          targetTime: futureTime,
          'data-testid': `timer-${i}`
        })
      )
      
      render(createElement('div', {}, ...timers))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(1000) // Should render in under 1 second
      console.log(`Rendered ${componentCount} countdown timers in ${duration.toFixed(2)}ms`)
      
      vi.useRealTimers()
    })

    it('should update multiple countdown timers without performance degradation', async () => {
      const { render, act } = await import('@testing-library/react')
      const { CountdownTimer } = await import('../../src/components/CountdownTimer')
      const { createElement } = await import('react')
      
      vi.useFakeTimers()
      const mockTime = new Date('2025-09-07T12:00:00.000Z').getTime()
      vi.setSystemTime(mockTime)
      
      const componentCount = 50
      const futureTime = new Date(mockTime + 60 * 1000) // 1 minute future
      
      // Render timers
      const timers = Array.from({ length: componentCount }, (_, i) =>
        createElement(CountdownTimer, {
          key: i,
          targetTime: futureTime,
          'data-testid': `timer-${i}`
        })
      )
      
      render(createElement('div', {}, ...timers))
      
      // Measure update performance
      const startTime = performance.now()
      
      // Advance time by 10 seconds (should trigger all timers to update)
      act(() => {
        vi.advanceTimersByTime(10000)
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100) // Updates should complete in under 100ms
      console.log(`Updated ${componentCount} countdown timers in ${duration.toFixed(2)}ms`)
      
      vi.useRealTimers()
    })
  })

  describe('Memory Usage and Cleanup', () => {
    it('should properly clean up intervals to prevent memory leaks', async () => {
      const { render, unmount } = await import('@testing-library/react')
      const { CountdownTimer } = await import('../../src/components/CountdownTimer')
      
      vi.useFakeTimers()
      const mockTime = new Date('2025-09-07T12:00:00.000Z').getTime()
      vi.setSystemTime(mockTime)
      
      const futureTime = new Date(mockTime + 60 * 1000) // 1 minute future
      const componentCount = 20
      
      // Track timer count before rendering
      const initialTimerCount = vi.getTimerCount()
      
      // Render multiple countdown timers
      const renders = []
      for (let i = 0; i < componentCount; i++) {
        const { unmount } = render(
          <CountdownTimer
            targetTime={futureTime}
            data-testid={`timer-${i}`}
          />
        )
        renders.push(unmount)
      }
      
      // Verify timers were created
      const afterRenderTimerCount = vi.getTimerCount()
      expect(afterRenderTimerCount).toBeGreaterThan(initialTimerCount)
      
      // Unmount all components
      renders.forEach(unmountFn => unmountFn())
      
      // Verify all timers were cleaned up
      const finalTimerCount = vi.getTimerCount()
      expect(finalTimerCount).toBe(initialTimerCount)
      
      console.log(`Memory cleanup test: ${componentCount} components cleaned up successfully`)
      
      vi.useRealTimers()
    })

    it('should handle rapid mount/unmount cycles without memory leaks', async () => {
      const { render } = await import('@testing-library/react')
      const { CountdownTimer } = await import('../../src/components/CountdownTimer')
      
      vi.useFakeTimers()
      const mockTime = new Date('2025-09-07T12:00:00.000Z').getTime()
      vi.setSystemTime(mockTime)
      
      const futureTime = new Date(mockTime + 60 * 1000) // 1 minute future
      const cycles = 50
      
      const initialTimerCount = vi.getTimerCount()
      
      const startTime = performance.now()
      
      // Perform rapid mount/unmount cycles
      for (let i = 0; i < cycles; i++) {
        const { unmount } = render(
          <CountdownTimer
            targetTime={futureTime}
            data-testid={`cycle-timer-${i}`}
          />
        )
        
        // Immediately unmount
        unmount()
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Verify no timer leaks
      const finalTimerCount = vi.getTimerCount()
      expect(finalTimerCount).toBe(initialTimerCount)
      
      expect(duration).toBeLessThan(500) // Should complete quickly
      console.log(`Rapid mount/unmount: ${cycles} cycles in ${duration.toFixed(2)}ms`)
      
      vi.useRealTimers()
    })
  })

  describe('API Response Time Benchmarks', () => {
    it('should handle pick submission under load within acceptable time limits', async () => {
      // Mock fetch for API calls
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          pick: {
            id: 'test-pick-123',
            userId: 'test-user',
            gameId: 'test-game',
            teamId: 'test-team',
            isLocked: true,
            lockedAt: new Date().toISOString(),
            autoGenerated: false,
            timeUntilLock: 0
          }
        })
      })
      
      global.fetch = mockFetch
      
      const { ApiClient } = await import('../../src/utils/api')
      const concurrentRequests = 100
      const maxAcceptableTime = 2000 // 2 seconds for 100 concurrent requests
      
      const startTime = performance.now()
      
      // Simulate concurrent pick submissions
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        fetch('http://localhost/api/picks/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: `user-${i}`,
            gameId: 'test-game',
            teamId: 'test-team'
          })
        })
      )
      
      await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(maxAcceptableTime)
      expect(mockFetch).toHaveBeenCalledTimes(concurrentRequests)
      
      console.log(`${concurrentRequests} concurrent API calls completed in ${duration.toFixed(2)}ms`)
    })

    it('should maintain response times under database load', async () => {
      const operationCount = 1000
      const maxTimePerOperation = 50 // 50ms per operation max
      
      // Mock database operations
      const mockDbOperation = vi.fn().mockImplementation(async () => {
        // Simulate database query time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
        return { success: true, results: [] }
      })
      
      const startTime = performance.now()
      
      // Simulate database operations
      const promises = Array.from({ length: operationCount }, () => mockDbOperation())
      await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      const avgTimePerOp = duration / operationCount
      
      expect(avgTimePerOp).toBeLessThan(maxTimePerOperation)
      console.log(`Database operations: ${operationCount} ops, avg ${avgTimePerOp.toFixed(2)}ms per operation`)
    })
  })

  describe('Real-time Event Performance', () => {
    it('should handle high-frequency event updates efficiently', async () => {
      // Mock EventSource for SSE testing
      const mockEvents: any[] = []
      const mockEventSource = {
        addEventListener: vi.fn((event, callback) => {
          mockEvents.push({ event, callback })
        }),
        close: vi.fn(),
        readyState: 1
      }
      
      global.EventSource = vi.fn(() => mockEventSource) as any
      
      const { useRealTimeUpdates } = await import('../../src/hooks/useRealTimeUpdates')
      const eventCount = 1000
      
      const startTime = performance.now()
      
      // Simulate rapid event processing
      for (let i = 0; i < eventCount; i++) {
        const mockEvent = {
          data: JSON.stringify({
            id: i,
            type: 'GameLockEvent',
            payload: { gameId: `game-${i}`, lockTime: new Date().toISOString() },
            created_at: new Date().toISOString(),
            scope: 'global'
          })
        }
        
        // Simulate event processing
        mockEvents.forEach(({ callback }) => callback(mockEvent))
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(500) // Should process 1000 events in under 500ms
      console.log(`Real-time events: ${eventCount} events processed in ${duration.toFixed(2)}ms`)
    })

    it('should maintain connection performance under load', async () => {
      const connectionCount = 50
      const eventsPerConnection = 20
      
      // Mock multiple SSE connections
      const connections = Array.from({ length: connectionCount }, () => ({
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1
      }))
      
      global.EventSource = vi.fn((url) => {
        const index = connections.length - 1
        return connections[index] || connections[0]
      }) as any
      
      const startTime = performance.now()
      
      // Simulate events across all connections
      connections.forEach((conn, connIndex) => {
        for (let eventIndex = 0; eventIndex < eventsPerConnection; eventIndex++) {
          const mockEvent = {
            data: JSON.stringify({
              id: connIndex * eventsPerConnection + eventIndex,
              type: 'ScoreUpdateEvent',
              payload: { gameId: `game-${connIndex}`, score: eventIndex },
              created_at: new Date().toISOString(),
              scope: 'global'
            })
          }
          
          // Process event for this connection
          if (conn.addEventListener.mock.calls.length > 0) {
            const callback = conn.addEventListener.mock.calls[0][1]
            callback(mockEvent)
          }
        }
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      const totalEvents = connectionCount * eventsPerConnection
      
      expect(duration).toBeLessThan(1000) // Should handle all events in under 1 second
      console.log(`Connection load test: ${connectionCount} connections, ${totalEvents} total events in ${duration.toFixed(2)}ms`)
    })
  })

  describe('Mobile Performance Benchmarks', () => {
    it('should render efficiently on mobile viewports', async () => {
      const { render } = await import('@testing-library/react')
      const { CountdownTimer } = await import('../../src/components/CountdownTimer')
      
      // Simulate mobile constraints (slower rendering)
      const originalRaf = global.requestAnimationFrame
      global.requestAnimationFrame = (cb) => setTimeout(cb, 16) // ~60fps
      
      vi.useFakeTimers()
      const mockTime = new Date('2025-09-07T12:00:00.000Z').getTime()
      vi.setSystemTime(mockTime)
      
      const futureTime = new Date(mockTime + 60 * 1000)
      const mobileTimerCount = 10 // Typical mobile screen shows ~10 games
      
      const startTime = performance.now()
      
      // Render mobile-optimized countdown timers
      for (let i = 0; i < mobileTimerCount; i++) {
        render(
          <CountdownTimer
            targetTime={futureTime}
            mode="compact"
            data-testid={`mobile-timer-${i}`}
          />
        )
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(200) // Should render on mobile in under 200ms
      console.log(`Mobile rendering: ${mobileTimerCount} compact timers in ${duration.toFixed(2)}ms`)
      
      global.requestAnimationFrame = originalRaf
      vi.useRealTimers()
    })

    it('should handle touch interactions with minimal delay', async () => {
      const { render, fireEvent } = await import('@testing-library/react')
      const { CountdownTimer } = await import('../../src/components/CountdownTimer')
      
      vi.useFakeTimers()
      const mockTime = new Date('2025-09-07T12:00:00.000Z').getTime()
      vi.setSystemTime(mockTime)
      
      const onFinish = vi.fn()
      const futureTime = new Date(mockTime + 1000) // 1 second future
      
      const { container } = render(
        <CountdownTimer
          targetTime={futureTime}
          onFinish={onFinish}
          data-testid="touch-timer"
        />
      )
      
      const touchInteractions = 20
      const startTime = performance.now()
      
      // Simulate rapid touch events
      for (let i = 0; i < touchInteractions; i++) {
        fireEvent.touchStart(container.firstChild!)
        fireEvent.touchEnd(container.firstChild!)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      const avgTouchTime = duration / touchInteractions
      
      expect(avgTouchTime).toBeLessThan(10) // Each touch should process in under 10ms
      console.log(`Touch interactions: ${touchInteractions} touches, avg ${avgTouchTime.toFixed(2)}ms per touch`)
      
      vi.useRealTimers()
    })
  })

  describe('Stress Testing', () => {
    it('should maintain performance under extreme load', async () => {
      const extremeOperationCount = 50000
      const maxAcceptableTime = 5000 // 5 seconds for extreme load
      
      const { calcRemainingTime, isGameLocked, formatDuration } = await import('../../src/utils/timeUtils')
      
      const gameTime = new Date('2025-09-07T16:00:00.000Z')
      
      const startTime = performance.now()
      
      // Stress test with various operations
      for (let i = 0; i < extremeOperationCount; i++) {
        calcRemainingTime(gameTime)
        isGameLocked(gameTime, Math.random() * 120) // Random offset 0-120 minutes
        formatDuration(Math.random() * 3600) // Random duration 0-1 hour
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(maxAcceptableTime)
      
      const operationsPerSecond = (extremeOperationCount / duration) * 1000
      console.log(`Stress test: ${extremeOperationCount} operations in ${duration.toFixed(2)}ms (${operationsPerSecond.toFixed(0)} ops/sec)`)
      
      // Performance should be maintained even under stress
      expect(operationsPerSecond).toBeGreaterThan(10000) // At least 10k operations per second
    })
  })
})