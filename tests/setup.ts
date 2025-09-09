import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'

// Create fetch mock
const fetchMocker = createFetchMock(vi)
fetchMocker.enableMocks()

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Global test setup
beforeAll(() => {
  // Mock Date.now for consistent time testing
  const mockDate = new Date('2025-09-07T12:00:00.000Z')
  vi.setSystemTime(mockDate)
  
  // Mock crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'test-uuid-1234-5678-9012-345678901234'),
      subtle: {}
    }
  })
  
  // Mock EventSource for real-time testing
  global.EventSource = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2
  })) as any
  
  // Mock WebSocket
  global.WebSocket = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  })) as any
  
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
  
  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  })
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })) as any
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })) as any
})

afterAll(() => {
  vi.useRealTimers()
})

// Custom matchers for time-lock testing
expect.extend({
  toBeWithinTimeRange(received: number, expected: number, tolerance: number = 1000) {
    const pass = Math.abs(received - expected) <= tolerance
    return {
      message: () =>
        pass
          ? `Expected ${received} not to be within ${tolerance}ms of ${expected}`
          : `Expected ${received} to be within ${tolerance}ms of ${expected}`,
      pass
    }
  },
  
  toHaveValidPickFormat(received: any) {
    const requiredFields = ['id', 'userId', 'gameId', 'teamId', 'isLocked']
    const hasAllFields = requiredFields.every(field => field in received)
    const hasValidId = typeof received.id === 'string'
    const hasValidTimestamp = received.lockedAt ? !isNaN(new Date(received.lockedAt).getTime()) : true
    
    const pass = hasAllFields && hasValidId && hasValidTimestamp
    return {
      message: () =>
        pass
          ? `Expected pick not to have valid format`
          : `Expected pick to have valid format with fields: ${requiredFields.join(', ')}`,
      pass
    }
  }
})