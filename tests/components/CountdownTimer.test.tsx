import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { CountdownTimer, GameCountdown, PickDeadlineCountdown } from '../../src/components/CountdownTimer'

describe('CountdownTimer', () => {
  const mockCurrentTime = new Date('2025-09-07T12:00:00.000Z').getTime()
  
  beforeEach(() => {
    vi.setSystemTime(mockCurrentTime)
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  describe('Basic Functionality', () => {
    it('should render countdown timer with correct initial time', () => {
      const targetTime = new Date(mockCurrentTime + 60 * 1000) // 1 minute future
      render(<CountdownTimer targetTime={targetTime} />)
      
      expect(screen.getByText('01:00')).toBeInTheDocument()
    })

    it('should update every second', async () => {
      const targetTime = new Date(mockCurrentTime + 60 * 1000) // 1 minute future
      render(<CountdownTimer targetTime={targetTime} />)
      
      expect(screen.getByText('01:00')).toBeInTheDocument()
      
      // Advance time by 1 second
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      
      await waitFor(() => {
        expect(screen.getByText('00:59')).toBeInTheDocument()
      })
    })

    it('should show "Expired" when time runs out', async () => {
      const targetTime = new Date(mockCurrentTime + 2 * 1000) // 2 seconds future
      const onFinish = vi.fn()
      render(<CountdownTimer targetTime={targetTime} onFinish={onFinish} />)
      
      expect(screen.getByText('00:02')).toBeInTheDocument()
      
      // Advance past the target time
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument()
        expect(onFinish).toHaveBeenCalledOnce()
      })
    })

    it('should call onFinish callback when timer expires', async () => {
      const targetTime = new Date(mockCurrentTime + 1000) // 1 second future
      const onFinish = vi.fn()
      render(<CountdownTimer targetTime={targetTime} onFinish={onFinish} />)
      
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      
      await waitFor(() => {
        expect(onFinish).toHaveBeenCalledOnce()
      })
    })
  })

  describe('Display Modes', () => {
    it('should render in compact mode', () => {
      const targetTime = new Date(mockCurrentTime + 3725 * 1000) // 1h 2m 5s
      render(<CountdownTimer targetTime={targetTime} mode="compact" />)
      
      expect(screen.getByText('1h 2m')).toBeInTheDocument()
    })

    it('should render in minimal mode', () => {
      const targetTime = new Date(mockCurrentTime + 125 * 1000) // 2m 5s
      render(<CountdownTimer targetTime={targetTime} mode="minimal" />)
      
      expect(screen.getByText('02:05')).toBeInTheDocument()
    })

    it('should render in detailed mode with additional text', () => {
      const targetTime = new Date(mockCurrentTime + 60 * 1000) // 1 minute
      render(<CountdownTimer targetTime={targetTime} mode="detailed" />)
      
      expect(screen.getByText('01:00')).toBeInTheDocument()
      expect(screen.getByText('left')).toBeInTheDocument()
    })
  })

  describe('Urgent State', () => {
    it('should show urgent styling when under threshold', () => {
      const targetTime = new Date(mockCurrentTime + 200 * 1000) // 3m 20s (under 5min default)
      render(<CountdownTimer targetTime={targetTime} urgentThreshold={300} />)
      
      const timerElement = screen.getByRole('timer')
      const timeSpan = timerElement.querySelector('span')
      expect(timeSpan).toHaveClass('text-orange-600', 'animate-pulse')
    })

    it('should show normal styling when above threshold', () => {
      const targetTime = new Date(mockCurrentTime + 400 * 1000) // 6m 40s (above 5min default)
      render(<CountdownTimer targetTime={targetTime} urgentThreshold={300} />)
      
      const timerElement = screen.getByRole('timer')
      const timeSpan = timerElement.querySelector('span')
      expect(timeSpan).toHaveClass('text-gray-700')
      expect(timeSpan).not.toHaveClass('animate-pulse')
    })

    it('should show "remaining!" text in urgent mode', () => {
      const targetTime = new Date(mockCurrentTime + 200 * 1000) // Under urgent threshold
      render(<CountdownTimer targetTime={targetTime} mode="detailed" urgentThreshold={300} />)
      
      expect(screen.getByText('remaining!')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const targetTime = new Date(mockCurrentTime + 3725 * 1000) // 1h 2m 5s
      render(<CountdownTimer targetTime={targetTime} />)
      
      const timer = screen.getByRole('timer')
      expect(timer).toHaveAttribute('aria-live', 'assertive')
      expect(timer).toHaveAttribute('aria-atomic', 'true')
      expect(timer).toHaveAttribute('aria-label', '1 hour 2 minutes 5 seconds remaining')
    })

    it('should update aria-label as time changes', async () => {
      const targetTime = new Date(mockCurrentTime + 65 * 1000) // 1m 5s
      render(<CountdownTimer targetTime={targetTime} />)
      
      let timer = screen.getByRole('timer')
      expect(timer).toHaveAttribute('aria-label', '1 minute 5 seconds remaining')
      
      // Advance to under 1 minute
      act(() => {
        vi.advanceTimersByTime(10000) // 10 seconds
      })
      
      await waitFor(() => {
        timer = screen.getByRole('timer')
        expect(timer).toHaveAttribute('aria-label', '55 seconds remaining')
      })
    })

    it('should show "Time expired" in aria-label when finished', async () => {
      const targetTime = new Date(mockCurrentTime + 1000) // 1 second
      render(<CountdownTimer targetTime={targetTime} />)
      
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      
      await waitFor(() => {
        const timer = screen.getByRole('timer')
        expect(timer).toHaveAttribute('aria-label', 'Time expired')
      })
    })
  })

  describe('Icons and Visual Elements', () => {
    it('should show clock icon when requested', () => {
      const targetTime = new Date(mockCurrentTime + 60 * 1000)
      render(<CountdownTimer targetTime={targetTime} showIcon={true} />)
      
      const icon = screen.getByRole('timer').querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should not show icon by default', () => {
      const targetTime = new Date(mockCurrentTime + 60 * 1000)
      render(<CountdownTimer targetTime={targetTime} />)
      
      const icon = screen.getByRole('timer').querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('Memory Management', () => {
    it('should clean up intervals when unmounted', () => {
      const targetTime = new Date(mockCurrentTime + 60 * 1000)
      const { unmount } = render(<CountdownTimer targetTime={targetTime} />)
      
      // Verify timer is running
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      
      unmount()
      
      // Verify timers are cleaned up
      expect(vi.getTimerCount()).toBe(0)
    })

    it('should not call onFinish after component unmounts', async () => {
      const targetTime = new Date(mockCurrentTime + 1000) // 1 second
      const onFinish = vi.fn()
      const { unmount } = render(<CountdownTimer targetTime={targetTime} onFinish={onFinish} />)
      
      // Unmount before timer expires
      unmount()
      
      // Advance time past expiration
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      
      // onFinish should not have been called
      expect(onFinish).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid target time gracefully', () => {
      expect(() => {
        render(<CountdownTimer targetTime="invalid-date" />)
      }).not.toThrow()
      
      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('should handle past target times', () => {
      const pastTime = new Date(mockCurrentTime - 60 * 1000) // 1 minute ago
      render(<CountdownTimer targetTime={pastTime} />)
      
      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('should handle extremely large time values', () => {
      const farFuture = new Date(mockCurrentTime + 999999999 * 1000)
      render(<CountdownTimer targetTime={farFuture} mode="compact" />)
      
      // Should not crash and should show some time format
      const timer = screen.getByRole('timer')
      expect(timer).toBeInTheDocument()
    })
  })

  describe('Specialized Components', () => {
    describe('GameCountdown', () => {
      it('should render with game-specific styling', () => {
        const gameTime = new Date(mockCurrentTime + 1800 * 1000) // 30 minutes
        const onGameStart = vi.fn()
        render(<GameCountdown gameTime={gameTime} onGameStart={onGameStart} />)
        
        const container = screen.getByRole('timer').parentElement
        expect(container).toHaveClass('bg-blue-50', 'px-3', 'py-2', 'rounded-lg', 'border')
        
        // Should show icon
        const icon = screen.getByRole('timer').querySelector('svg')
        expect(icon).toBeInTheDocument()
      })

      it('should use 30-minute urgent threshold', () => {
        const gameTime = new Date(mockCurrentTime + 1000 * 1000) // 16m 40s (under 30min)
        render(<GameCountdown gameTime={gameTime} />)
        
        const timeSpan = screen.getByRole('timer').querySelector('span')
        expect(timeSpan).toHaveClass('text-orange-600', 'animate-pulse')
      })
    })

    describe('PickDeadlineCountdown', () => {
      it('should render with deadline-specific styling', () => {
        const deadline = new Date(mockCurrentTime + 300 * 1000) // 5 minutes
        render(<PickDeadlineCountdown deadline={deadline} />)
        
        const container = screen.getByRole('timer').parentElement
        expect(container).toHaveClass('bg-orange-50', 'px-2', 'py-1', 'rounded')
      })

      it('should render in compact mode when requested', () => {
        const deadline = new Date(mockCurrentTime + 3725 * 1000) // 1h 2m 5s
        render(<PickDeadlineCountdown deadline={deadline} compact={true} />)
        
        expect(screen.getByText('1h 2m')).toBeInTheDocument()
        
        // Should not show icon in compact mode
        const icon = screen.getByRole('timer').querySelector('svg')
        expect(icon).not.toBeInTheDocument()
      })

      it('should use 5-minute urgent threshold', () => {
        const deadline = new Date(mockCurrentTime + 200 * 1000) // 3m 20s (under 5min)
        render(<PickDeadlineCountdown deadline={deadline} />)
        
        const timeSpan = screen.getByRole('timer').querySelector('span')
        expect(timeSpan).toHaveClass('text-orange-600', 'animate-pulse')
      })
    })
  })

  describe('Performance', () => {
    it('should handle multiple simultaneous timers efficiently', () => {
      const targetTime1 = new Date(mockCurrentTime + 60 * 1000)
      const targetTime2 = new Date(mockCurrentTime + 120 * 1000)
      const targetTime3 = new Date(mockCurrentTime + 180 * 1000)
      
      render(
        <div>
          <CountdownTimer targetTime={targetTime1} data-testid="timer1" />
          <CountdownTimer targetTime={targetTime2} data-testid="timer2" />
          <CountdownTimer targetTime={targetTime3} data-testid="timer3" />
        </div>
      )
      
      // All timers should render correctly
      expect(screen.getByText('01:00')).toBeInTheDocument()
      expect(screen.getByText('02:00')).toBeInTheDocument()
      expect(screen.getByText('03:00')).toBeInTheDocument()
      
      // Advance time and verify all update
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      
      expect(screen.getByText('00:59')).toBeInTheDocument()
      expect(screen.getByText('01:59')).toBeInTheDocument()
      expect(screen.getByText('02:59')).toBeInTheDocument()
    })
  })
})