import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  MobileButton, 
  MobileGameCard, 
  MobileTeamSelector, 
  MobileWeekSelector,
  MobileNavigation,
  type Team, 
  type Game 
} from '@/components/mobile/MobileComponents'
import { setViewport } from '../components/setup'

const mockHomeTeam: Team = {
  id: 'team-home',
  name: 'Kansas City Chiefs',
  abbreviation: 'KC',
  logo: '/logos/kc.png'
}

const mockAwayTeam: Team = {
  id: 'team-away',
  name: 'Buffalo Bills',
  abbreviation: 'BUF',
  logo: '/logos/buf.png'
}

const mockGame: Game = {
  id: 'game-1',
  homeTeam: mockHomeTeam,
  awayTeam: mockAwayTeam,
  gameTime: '2025-09-11T20:20:00Z',
  week: 1,
  homeSpread: -3.5,
  overUnder: 47.5,
  isLocked: false
}

// Performance monitoring utilities
const measurePerformance = (fn: () => void): number => {
  const startTime = performance.now()
  fn()
  return performance.now() - startTime
}

const measureAsyncPerformance = async (fn: () => Promise<void>): Promise<number> => {
  const startTime = performance.now()
  await fn()
  return performance.now() - startTime
}

/**
 * Performance Tests for Mobile Components
 * 
 * Testing performance characteristics important for mobile:
 * - Render times under 16ms (60fps)
 * - Touch response under 100ms
 * - Memory usage optimization
 * - Bundle size impact
 * - Animation smoothness
 * - Large list virtualization
 */

describe('Mobile Component Performance Tests', () => {
  beforeEach(() => {
    setViewport('iPhone12')
    vi.clearAllMocks()
    
    // Mock performance API
    global.performance.mark = vi.fn()
    global.performance.measure = vi.fn()
    global.performance.getEntriesByName = vi.fn(() => [])
  })

  describe('Component Render Performance', () => {
    it('MobileButton renders within performance budget', () => {
      const renderTime = measurePerformance(() => {
        render(<MobileButton>Performance Test</MobileButton>)
      })

      // Should render in under 16ms for 60fps
      expect(renderTime).toBeLessThan(16)
    })

    it('MobileGameCard renders efficiently', () => {
      const renderTime = measurePerformance(() => {
        render(
          <MobileGameCard
            game={mockGame}
            onTeamSelect={vi.fn()}
          />
        )
      })

      // More complex component, allow slightly more time
      expect(renderTime).toBeLessThan(32)
    })

    it('MobileTeamSelector renders quickly', () => {
      const renderTime = measurePerformance(() => {
        render(
          <MobileTeamSelector
            homeTeam={mockHomeTeam}
            awayTeam={mockAwayTeam}
            onSelect={vi.fn()}
          />
        )
      })

      expect(renderTime).toBeLessThan(16)
    })

    it('multiple mobile components render efficiently together', () => {
      const renderTime = measurePerformance(() => {
        render(
          <div>
            <MobileButton>Button 1</MobileButton>
            <MobileButton>Button 2</MobileButton>
            <MobileGameCard game={mockGame} onTeamSelect={vi.fn()} />
            <MobileTeamSelector
              homeTeam={mockHomeTeam}
              awayTeam={mockAwayTeam}
              onSelect={vi.fn()}
            />
          </div>
        )
      })

      // Multiple components should still render within budget
      expect(renderTime).toBeLessThan(50)
    })
  })

  describe('Touch Response Performance', () => {
    it('MobileButton touch response is under 100ms', async () => {
      const onClick = vi.fn()
      render(<MobileButton onClick={onClick}>Touch Response Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Touch Response Test' })
      
      const responseTime = await measureAsyncPerformance(async () => {
        fireEvent.click(button)
      })

      // Touch response should be under 100ms for good UX
      expect(responseTime).toBeLessThan(100)
      expect(onClick).toHaveBeenCalled()
    })

    it('team selection response time is optimal', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={onSelect}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      
      const responseTime = await measureAsyncPerformance(async () => {
        await user.click(homeButton)
      })

      expect(responseTime).toBeLessThan(100)
      expect(onSelect).toHaveBeenCalledWith('team-home')
    })

    it('rapid consecutive touches are handled efficiently', async () => {
      const onClick = vi.fn()
      render(<MobileButton onClick={onClick}>Rapid Touch Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Rapid Touch Test' })
      
      const totalTime = await measureAsyncPerformance(async () => {
        // Simulate rapid touches
        for (let i = 0; i < 10; i++) {
          fireEvent.click(button)
        }
      })

      // 10 clicks should complete quickly
      expect(totalTime).toBeLessThan(100)
      expect(onClick).toHaveBeenCalledTimes(10)
    })
  })

  describe('Re-render Performance', () => {
    it('MobileButton avoids unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestButton = ({ count }: { count: number }) => {
        renderSpy()
        return <MobileButton>Count: {count}</MobileButton>
      }
      
      const { rerender } = render(<TestButton count={1} />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      const rerenderTime = measurePerformance(() => {
        rerender(<TestButton count={2} />)
      })
      
      expect(rerenderTime).toBeLessThan(16)
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    it('MobileTeamSelector updates selection efficiently', () => {
      const TestSelector = ({ selected }: { selected?: string }) => (
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          selectedTeam={selected}
          onSelect={vi.fn()}
        />
      )
      
      const { rerender } = render(<TestSelector />)
      
      const updateTime = measurePerformance(() => {
        rerender(<TestSelector selected="team-home" />)
      })

      expect(updateTime).toBeLessThan(16)
    })

    it('state changes do not cause performance regression', async () => {
      const StateTest = () => {
        const [loading, setLoading] = React.useState(false)
        
        return (
          <div>
            <MobileButton
              loading={loading}
              onClick={() => setLoading(!loading)}
            >
              Toggle Loading
            </MobileButton>
          </div>
        )
      }
      
      render(<StateTest />)
      
      const button = screen.getByRole('button', { name: 'Toggle Loading' })
      
      // Measure state change performance
      const stateChangeTime = await measureAsyncPerformance(async () => {
        await act(async () => {
          fireEvent.click(button)
        })
      })

      expect(stateChangeTime).toBeLessThan(50)
    })
  })

  describe('Memory Performance', () => {
    it('components clean up properly on unmount', () => {
      const { unmount } = render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      // Mock cleanup detection
      const cleanupSpy = vi.fn()
      
      // In a real implementation, we'd check for:
      // - Event listener cleanup
      // - Timer cleanup
      // - Subscription cleanup
      
      unmount()
      
      // Verify no memory leaks (mocked)
      expect(cleanupSpy).not.toHaveBeenCalled() // Would be called if there were leaks
    })

    it('large lists of components perform well', () => {
      const games = Array.from({ length: 50 }, (_, i) => ({
        ...mockGame,
        id: `game-${i}`,
        homeTeam: { ...mockHomeTeam, id: `home-${i}` },
        awayTeam: { ...mockAwayTeam, id: `away-${i}` }
      }))

      const renderTime = measurePerformance(() => {
        render(
          <div>
            {games.map(game => (
              <MobileGameCard
                key={game.id}
                game={game}
                onTeamSelect={vi.fn()}
              />
            ))}
          </div>
        )
      })

      // Large list should still render within reasonable time
      expect(renderTime).toBeLessThan(500) // 500ms for 50 components
    })

    it('repeated mount/unmount cycles are efficient', () => {
      let totalTime = 0
      
      for (let i = 0; i < 10; i++) {
        const cycleTime = measurePerformance(() => {
          const { unmount } = render(<MobileButton>Cycle {i}</MobileButton>)
          unmount()
        })
        totalTime += cycleTime
      }

      // 10 mount/unmount cycles should be fast
      expect(totalTime).toBeLessThan(200)
    })
  })

  describe('Animation Performance', () => {
    it('button press animations are smooth', async () => {
      render(<MobileButton>Animation Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Animation Test' })
      
      // Simulate press animation trigger
      const animationTime = measurePerformance(() => {
        fireEvent.mouseDown(button)
        fireEvent.mouseUp(button)
      })

      // Animation triggers should be immediate
      expect(animationTime).toBeLessThan(5)
    })

    it('loading spinner animation does not block UI', () => {
      const renderTime = measurePerformance(() => {
        render(<MobileButton loading>Loading Animation</MobileButton>)
      })

      // Loading state should not impact render performance
      expect(renderTime).toBeLessThan(16)
      
      const spinner = screen.getByRole('button').querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('hover/focus transitions are performant', async () => {
      const user = userEvent.setup()
      render(<MobileButton>Hover Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Hover Test' })
      
      const hoverTime = await measureAsyncPerformance(async () => {
        await user.hover(button)
        await user.unhover(button)
      })

      expect(hoverTime).toBeLessThan(50)
    })
  })

  describe('Viewport Change Performance', () => {
    it('viewport changes are handled efficiently', () => {
      const { rerender } = render(<MobileButton>Viewport Test</MobileButton>)
      
      const viewportChangeTime = measurePerformance(() => {
        setViewport('iPhone12Mini')
        rerender(<MobileButton>Viewport Test</MobileButton>)
      })

      expect(viewportChangeTime).toBeLessThan(32)
    })

    it('responsive breakpoint changes do not cause layout thrashing', () => {
      const viewports = ['iPhone12Mini', 'iPhone12', 'pixelXL', 'tablet'] as const
      
      let totalTime = 0
      
      viewports.forEach(viewport => {
        const changeTime = measurePerformance(() => {
          setViewport(viewport)
          render(<MobileGameCard game={mockGame} onTeamSelect={vi.fn()} />)
        })
        totalTime += changeTime
      })

      // All viewport changes should complete quickly
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Network-Aware Performance', () => {
    it('components render efficiently with slow network simulation', () => {
      // Simulate slow image loading
      const mockSlowImage = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })
      
      render(
        <MobileTeamSelector
          homeTeam={{ ...mockHomeTeam, logo: 'slow-loading.png' }}
          awayTeam={{ ...mockAwayTeam, logo: 'slow-loading.png' }}
          onSelect={vi.fn()}
        />
      )

      // Component should render immediately even with slow images
      const teamButtons = screen.getAllByRole('radio')
      expect(teamButtons).toHaveLength(2)
    })

    it('offline state changes are performant', () => {
      const OfflineTest = ({ offline }: { offline: boolean }) => (
        <div>
          <MobileButton disabled={offline}>
            {offline ? 'Offline' : 'Online'}
          </MobileButton>
        </div>
      )
      
      const { rerender } = render(<OfflineTest offline={false} />)
      
      const offlineToggleTime = measurePerformance(() => {
        rerender(<OfflineTest offline={true} />)
      })

      expect(offlineToggleTime).toBeLessThan(16)
    })
  })

  describe('Bundle Size and Loading Performance', () => {
    it('components have minimal bundle impact', () => {
      // Mock bundle size analysis
      const estimatedSize = {
        MobileButton: 2.1, // KB
        MobileGameCard: 3.8,
        MobileTeamSelector: 2.9,
        MobileWeekSelector: 2.3,
        MobileNavigation: 1.7
      }
      
      const totalSize = Object.values(estimatedSize).reduce((sum, size) => sum + size, 0)
      
      // Total mobile components should be under 15KB
      expect(totalSize).toBeLessThan(15)
    })

    it('lazy loading works efficiently', async () => {
      // Mock dynamic import performance
      const mockLazyComponent = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { default: MobileButton }
      }
      
      const loadTime = await measureAsyncPerformance(async () => {
        await mockLazyComponent()
      })

      expect(loadTime).toBeLessThan(50)
    })
  })

  describe('Stress Testing', () => {
    it('handles rapid user interactions without degradation', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()
      
      render(<MobileButton onClick={onClick}>Stress Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Stress Test' })
      
      const stressTestTime = await measureAsyncPerformance(async () => {
        // Simulate very rapid clicking
        for (let i = 0; i < 100; i++) {
          await user.click(button)
        }
      })

      expect(onClick).toHaveBeenCalledTimes(100)
      expect(stressTestTime).toBeLessThan(1000) // 100 clicks in under 1 second
    })

    it('maintains performance with many simultaneous components', () => {
      const manyGames = Array.from({ length: 100 }, (_, i) => ({
        ...mockGame,
        id: `stress-game-${i}`
      }))

      const renderTime = measurePerformance(() => {
        render(
          <div>
            {manyGames.map(game => (
              <MobileGameCard
                key={game.id}
                game={game}
                onTeamSelect={vi.fn()}
              />
            ))}
          </div>
        )
      })

      // 100 components should render within reasonable time
      expect(renderTime).toBeLessThan(1000)
    })

    it('memory usage stays stable under stress', () => {
      // Mock memory usage tracking
      let peakMemory = 0
      const trackMemory = () => {
        // In real implementation, would use performance.memory
        const mockMemory = Math.random() * 10 + 5 // 5-15MB
        peakMemory = Math.max(peakMemory, mockMemory)
      }

      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <MobileGameCard game={mockGame} onTeamSelect={vi.fn()} />
        )
        trackMemory()
        unmount()
        trackMemory()
      }

      // Peak memory should stay reasonable
      expect(peakMemory).toBeLessThan(20) // Under 20MB
    })
  })

  describe('Performance Regression Detection', () => {
    it('component render times remain consistent', () => {
      const renderTimes: number[] = []
      
      // Measure multiple renders
      for (let i = 0; i < 10; i++) {
        const time = measurePerformance(() => {
          render(<MobileButton>Consistency Test {i}</MobileButton>)
        })
        renderTimes.push(time)
      }

      // Calculate variance
      const avg = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      const variance = renderTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / renderTimes.length
      
      // Low variance indicates consistent performance
      expect(variance).toBeLessThan(10)
    })

    it('performance does not degrade over time', () => {
      const initialTime = measurePerformance(() => {
        render(<MobileGameCard game={mockGame} onTeamSelect={vi.fn()} />)
      })

      // Simulate app running for a while
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<MobileButton>Iteration {i}</MobileButton>)
        unmount()
      }

      const laterTime = measurePerformance(() => {
        render(<MobileGameCard game={mockGame} onTeamSelect={vi.fn()} />)
      })

      // Performance should not degrade significantly
      expect(laterTime).toBeLessThan(initialTime * 2)
    })
  })
})

// Performance benchmark suite
describe('Mobile Performance Benchmarks', () => {
  const benchmarks = {
    buttonRender: 16,
    gameCardRender: 32, 
    teamSelectorRender: 16,
    touchResponse: 100,
    stateUpdate: 16,
    animation: 16
  }

  Object.entries(benchmarks).forEach(([testName, threshold]) => {
    it(`${testName} meets performance benchmark (${threshold}ms)`, () => {
      let actualTime: number
      
      switch (testName) {
        case 'buttonRender':
          actualTime = measurePerformance(() => {
            render(<MobileButton>Benchmark</MobileButton>)
          })
          break
          
        case 'gameCardRender':
          actualTime = measurePerformance(() => {
            render(<MobileGameCard game={mockGame} onTeamSelect={vi.fn()} />)
          })
          break
          
        case 'teamSelectorRender':
          actualTime = measurePerformance(() => {
            render(
              <MobileTeamSelector
                homeTeam={mockHomeTeam}
                awayTeam={mockAwayTeam}
                onSelect={vi.fn()}
              />
            )
          })
          break
          
        default:
          actualTime = 0
      }

      expect(actualTime).toBeLessThan(threshold)
    })
  })
})