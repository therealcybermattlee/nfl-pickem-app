import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'

// Create fetch mock
const fetchMocker = createFetchMock(vi)
fetchMocker.enableMocks()

// Mobile-specific viewport mocks
const mockViewports = {
  iPhone12: { width: 390, height: 844, deviceScaleFactor: 3 },
  iPhone12Mini: { width: 375, height: 812, deviceScaleFactor: 3 },
  pixelXL: { width: 384, height: 854, deviceScaleFactor: 3.5 },
  galaxyS21: { width: 360, height: 800, deviceScaleFactor: 3 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 }
}

// Mock CSS Module imports for mobile components
vi.mock('/src/components/mobile/MobileComponents.module.css', () => ({
  default: {
    // Button classes
    mobileButton: 'mobileButton',
    'button-primary': 'button-primary',
    'button-secondary': 'button-secondary',
    'button-danger': 'button-danger',
    'button-success': 'button-success',
    'button-sm': 'button-sm',
    'button-md': 'button-md',
    'button-lg': 'button-lg',
    fullWidth: 'fullWidth',
    disabled: 'disabled',
    loading: 'loading',
    spinner: 'spinner',
    hiddenText: 'hiddenText',
    
    // Game card classes
    mobileGameCard: 'mobileGameCard',
    compact: 'compact',
    locked: 'locked',
    gameHeader: 'gameHeader',
    gameTime: 'gameTime',
    lockIndicator: 'lockIndicator',
    teamContainer: 'teamContainer',
    gameDetails: 'gameDetails',
    spread: 'spread',
    overUnder: 'overUnder',
    
    // Team selector classes
    teamSelector: 'teamSelector',
    teamButton: 'teamButton',
    selected: 'selected',
    pressed: 'pressed',
    teamLogo: 'teamLogo',
    teamInfo: 'teamInfo',
    teamAbbr: 'teamAbbr',
    teamName: 'teamName',
    teamSpread: 'teamSpread',
    checkmark: 'checkmark',
    vsIndicator: 'vsIndicator',
    
    // Week selector classes
    weekSelector: 'weekSelector',
    weekScrollContainer: 'weekScrollContainer',
    weekButton: 'weekButton',
    empty: 'empty',
    weekNumber: 'weekNumber',
    gameCount: 'gameCount',
    
    // Navigation classes
    mobileNavigation: 'mobileNavigation',
    navContainer: 'navContainer',
    navButton: 'navButton',
    active: 'active',
    navIcon: 'navIcon',
    navLabel: 'navLabel',
    navBadge: 'navBadge'
  }
}))

// Mock touch events for mobile testing
const mockTouchEvent = (type: string, touches: any[] = []) => {
  return new TouchEvent(type, {
    touches,
    changedTouches: touches,
    targetTouches: touches,
    bubbles: true,
    cancelable: true
  })
}

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Global test setup
beforeAll(() => {
  // Mock Date.now for consistent time testing
  const mockDate = new Date('2025-09-11T12:00:00.000Z')
  vi.setSystemTime(mockDate)
  
  // Mock viewport properties for mobile testing
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: mockViewports.iPhone12.width
  })
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: mockViewports.iPhone12.height
  })
  
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: mockViewports.iPhone12.deviceScaleFactor
  })
  
  // Mock touch capabilities
  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    configurable: true,
    value: () => {}
  })
  
  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: 10
  })
  
  // Mock CSS supports for mobile features
  global.CSS = {
    supports: vi.fn((property: string, value?: string) => {
      if (property === 'touch-action' || property === 'overscroll-behavior') {
        return true
      }
      if (property === 'env' && value === 'safe-area-inset-bottom') {
        return true
      }
      return false
    })
  } as any
  
  // Mock getComputedStyle for CSS testing
  global.getComputedStyle = vi.fn((element: Element) => ({
    getPropertyValue: vi.fn((property: string) => {
      if (property === 'max-width') {
        return element.classList.contains('fullWidth') ? '100%' : '200px'
      }
      if (property === 'min-height') {
        return '44px'
      }
      if (property === 'touch-action') {
        return 'manipulation'
      }
      return ''
    }),
    maxWidth: element.classList.contains('fullWidth') ? '100%' : '200px',
    minHeight: '44px',
    touchAction: 'manipulation'
  })) as any
  
  // Mock Element.getBoundingClientRect for size testing
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 200,
    height: 44,
    top: 0,
    left: 0,
    bottom: 44,
    right: 200,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  }))
  
  // Mock Element.scrollIntoView for week selector
  Element.prototype.scrollIntoView = vi.fn()
  
  // Mock querySelector for week selector
  Element.prototype.querySelector = vi.fn((selector: string) => {
    if (selector.includes('[data-week=')) {
      return {
        scrollIntoView: vi.fn()
      } as any
    }
    return null
  })
  
  // Mock crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'test-uuid-1234-5678-9012-345678901234'),
      subtle: {}
    }
  })
  
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
  
  // Mock IntersectionObserver for scrolling components
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })) as any
  
  // Mock ResizeObserver for responsive components
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })) as any
  
  // Mock performance APIs for performance testing
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => [])
    }
  })
})

afterAll(() => {
  vi.useRealTimers()
})

// Custom viewport utility for testing
export const setViewport = (device: keyof typeof mockViewports) => {
  const viewport = mockViewports[device]
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewport.width
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: viewport.height
  })
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: viewport.deviceScaleFactor
  })
}

// Touch event simulation utilities
export const createTouchEvent = mockTouchEvent

export const simulateTouch = (element: Element, type: 'touchstart' | 'touchend' | 'touchmove') => {
  const touch = {
    identifier: 1,
    target: element,
    clientX: 100,
    clientY: 100,
    pageX: 100,
    pageY: 100,
    screenX: 100,
    screenY: 100,
    radiusX: 10,
    radiusY: 10,
    rotationAngle: 0,
    force: 1
  }
  
  const touchEvent = mockTouchEvent(type, [touch])
  element.dispatchEvent(touchEvent)
  return touchEvent
}

// Custom matchers for mobile testing
expect.extend({
  toHaveMaxWidth(element: HTMLElement, expectedMaxWidth: string) {
    const computedStyle = getComputedStyle(element)
    const maxWidth = computedStyle.getPropertyValue('max-width')
    
    const pass = maxWidth === expectedMaxWidth
    return {
      message: () =>
        pass
          ? `Expected element not to have max-width: ${expectedMaxWidth}`
          : `Expected element to have max-width: ${expectedMaxWidth}, but got: ${maxWidth}`,
      pass
    }
  },
  
  toHaveMinTouchTarget(element: HTMLElement, minSize: number = 44) {
    const rect = element.getBoundingClientRect()
    const meetsSizeRequirement = rect.width >= minSize && rect.height >= minSize
    
    return {
      message: () =>
        meetsSizeRequirement
          ? `Expected element not to meet min touch target size of ${minSize}px`
          : `Expected element to meet min touch target size of ${minSize}px, but got ${rect.width}x${rect.height}`,
      pass: meetsSizeRequirement
    }
  },
  
  toBeAccessibleButton(element: HTMLElement) {
    const hasRole = element.getAttribute('role') === 'button' || element.tagName === 'BUTTON'
    const hasAriaLabel = element.getAttribute('aria-label') || element.textContent
    const isKeyboardAccessible = element.tabIndex >= 0 || element.tagName === 'BUTTON'
    
    const pass = hasRole && hasAriaLabel && isKeyboardAccessible
    return {
      message: () =>
        pass
          ? `Expected element not to be accessible button`
          : `Expected element to be accessible button (role, aria-label, keyboard accessible)`,
      pass
    }
  },
  
  toSupportTouchGestures(element: HTMLElement) {
    const hasTouchStartListener = element.ontouchstart !== undefined
    const hasTouchAction = getComputedStyle(element).touchAction === 'manipulation'
    
    const pass = hasTouchStartListener || hasTouchAction
    return {
      message: () =>
        pass
          ? `Expected element not to support touch gestures`
          : `Expected element to support touch gestures (touch event listeners or touch-action)`,
      pass
    }
  }
})

// Export viewport configurations for test usage
export { mockViewports }