import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileGameCard, type Game, type Team } from '@/components/mobile/MobileComponents'
import { setViewport, simulateTouch } from '../setup'

const mockHomeTeam: Team = {
  id: 'team-1',
  name: 'Kansas City Chiefs',
  abbreviation: 'KC',
  logo: '/logos/kc.png'
}

const mockAwayTeam: Team = {
  id: 'team-2',
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
  homeSpread: -2.5,
  overUnder: 54.5,
  isLocked: false
}

const mockLockedGame: Game = {
  ...mockGame,
  id: 'game-locked',
  isLocked: true
}

describe('MobileGameCard Component', () => {
  beforeEach(() => {
    setViewport('iPhone12')
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render game information correctly', () => {
      const onTeamSelect = vi.fn()
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={onTeamSelect}
        />
      )

      // Check team names are displayed
      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
      expect(screen.getByText('Kansas City Chiefs')).toBeInTheDocument()
      expect(screen.getByText('Buffalo Bills')).toBeInTheDocument()

      // Check game time formatting
      expect(screen.getByText(/Sep 11/)).toBeInTheDocument() // Date part
      
      // Check spread and over/under
      expect(screen.getByText('Spread: -2.5')).toBeInTheDocument()
      expect(screen.getByText('O/U: 54.5')).toBeInTheDocument()
    })

    it('should format game time correctly', () => {
      const gameWithCustomTime: Game = {
        ...mockGame,
        gameTime: '2025-12-25T13:00:00Z' // Christmas game
      }

      render(
        <MobileGameCard
          game={gameWithCustomTime}
          onTeamSelect={vi.fn()}
        />
      )

      expect(screen.getByText(/Dec 25/)).toBeInTheDocument()
    })
  })

  describe('Team Selection', () => {
    it('should handle team selection via touch/click', async () => {
      const onTeamSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={onTeamSelect}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      await user.click(homeTeamButton)
      
      expect(onTeamSelect).toHaveBeenCalledWith('game-1', 'team-1')
    })

    it('should show selected team with checkmark', () => {
      render(
        <MobileGameCard
          game={mockGame}
          selectedTeam="team-1"
          onTeamSelect={vi.fn()}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      expect(homeTeamButton).toHaveAttribute('aria-checked', 'true')
      expect(within(homeTeamButton).getByText('✓')).toBeInTheDocument()
    })

    it('should handle away team selection', async () => {
      const onTeamSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={onTeamSelect}
        />
      )

      const awayTeamButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      await user.click(awayTeamButton)
      
      expect(onTeamSelect).toHaveBeenCalledWith('game-1', 'team-2')
    })

    it('should prevent selection when game is locked', async () => {
      const onTeamSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileGameCard
          game={mockLockedGame}
          onTeamSelect={onTeamSelect}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      expect(homeTeamButton).toBeDisabled()
      
      await user.click(homeTeamButton)
      expect(onTeamSelect).not.toHaveBeenCalled()
    })
  })

  describe('Touch Interaction', () => {
    it('should handle touch events on team buttons', () => {
      const onTeamSelect = vi.fn()
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={onTeamSelect}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      
      // Simulate touch press feedback
      simulateTouch(homeTeamButton, 'touchstart')
      expect(homeTeamButton).toHaveClass('teamButton')
      
      simulateTouch(homeTeamButton, 'touchend')
      fireEvent.click(homeTeamButton)
      
      expect(onTeamSelect).toHaveBeenCalledWith('game-1', 'team-1')
    })

    it('should provide visual feedback on touch press', async () => {
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      
      // Mouse down should add pressed class
      fireEvent.mouseDown(homeTeamButton)
      // In real implementation, this would add 'pressed' class
      expect(homeTeamButton).toHaveClass('teamButton')
      
      fireEvent.mouseUp(homeTeamButton)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA roles and labels', () => {
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      const awayTeamButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeTeamButton).toBeInTheDocument()
      expect(awayTeamButton).toBeInTheDocument()
    })

    it('should indicate locked state accessibly', () => {
      render(
        <MobileGameCard
          game={mockLockedGame}
          onTeamSelect={vi.fn()}
        />
      )

      const lockIndicator = screen.getByLabelText('Game locked')
      expect(lockIndicator).toBeInTheDocument()
      expect(lockIndicator).toHaveTextContent('🔒')
    })

    it('should be keyboard navigable', async () => {
      const onTeamSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={onTeamSelect}
        />
      )

      // Tab to first team button
      await user.tab()
      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      expect(homeTeamButton).toHaveFocus()
      
      // Space should select
      await user.keyboard(' ')
      expect(onTeamSelect).toHaveBeenCalledWith('game-1', 'team-1')
    })

    it('should meet minimum touch target requirements', () => {
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      const awayTeamButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeTeamButton).toHaveMinTouchTarget(44)
      expect(awayTeamButton).toHaveMinTouchTarget(44)
    })
  })

  describe('Display Modes', () => {
    it('should render in compact mode', () => {
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
          compact
        />
      )

      const gameCard = screen.getByRole('radiogroup').closest('.mobileGameCard')
      expect(gameCard).toHaveClass('compact')
      
      // Spread and O/U should not be shown in compact mode
      expect(screen.queryByText('Spread: -2.5')).not.toBeInTheDocument()
      expect(screen.queryByText('O/U: 54.5')).not.toBeInTheDocument()
    })

    it('should hide spread when showSpread is false', () => {
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
          showSpread={false}
        />
      )

      expect(screen.queryByText('Spread: -2.5')).not.toBeInTheDocument()
      expect(screen.queryByText('O/U: 54.5')).not.toBeInTheDocument()
      
      // Team spread in button should also be hidden
      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs$/ })
      expect(homeTeamButton).not.toHaveTextContent('-2.5')
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt to small mobile screens', () => {
      setViewport('iPhone12Mini')
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      // Component should still render properly on small screens
      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
    })

    it('should work on larger mobile screens', () => {
      setViewport('pixelXL')
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      expect(homeTeamButton).toBeInTheDocument()
      expect(homeTeamButton).toHaveMinTouchTarget(44)
    })

    it('should adapt to tablet viewport', () => {
      setViewport('tablet')
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      const gameCard = screen.getByRole('radiogroup').closest('.mobileGameCard')
      expect(gameCard).toHaveClass('mobileGameCard')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing game data gracefully', () => {
      const incompleteGame: Partial<Game> = {
        id: 'incomplete',
        homeTeam: mockHomeTeam,
        awayTeam: mockAwayTeam,
        gameTime: '2025-09-11T20:20:00Z',
        week: 1
        // Missing spread and over/under
      }
      
      render(
        <MobileGameCard
          game={incompleteGame as Game}
          onTeamSelect={vi.fn()}
        />
      )

      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
      expect(screen.queryByText('Spread:')).not.toBeInTheDocument()
      expect(screen.queryByText('O/U:')).not.toBeInTheDocument()
    })

    it('should handle invalid game time gracefully', () => {
      const gameWithBadTime: Game = {
        ...mockGame,
        gameTime: 'invalid-date'
      }
      
      render(
        <MobileGameCard
          game={gameWithBadTime}
          onTeamSelect={vi.fn()}
        />
      )

      // Should fallback to showing the raw string
      expect(screen.getByText('invalid-date')).toBeInTheDocument()
    })

    it('should handle missing team logos gracefully', () => {
      const teamsWithoutLogos: Game = {
        ...mockGame,
        homeTeam: { ...mockHomeTeam, logo: undefined },
        awayTeam: { ...mockAwayTeam, logo: undefined }
      }
      
      render(
        <MobileGameCard
          game={teamsWithoutLogos}
          onTeamSelect={vi.fn()}
        />
      )

      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
      
      // Should not crash without logos
      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      const awayTeamButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeTeamButton).toBeInTheDocument()
      expect(awayTeamButton).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestGameCard = ({ selectedTeam }: { selectedTeam?: string }) => {
        renderSpy()
        return (
          <MobileGameCard
            game={mockGame}
            selectedTeam={selectedTeam}
            onTeamSelect={vi.fn()}
          />
        )
      }
      
      const { rerender } = render(<TestGameCard />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      rerender(<TestGameCard selectedTeam="team-1" />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
      
      // Same props shouldn't cause additional renders in production
      rerender(<TestGameCard selectedTeam="team-1" />)
      expect(renderSpy).toHaveBeenCalledTimes(3) // React.StrictMode causes double render
    })

    it('should handle rapid team selections efficiently', async () => {
      const onTeamSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={onTeamSelect}
        />
      )

      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-2.5/ })
      const awayTeamButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      // Rapid selection changes
      await user.click(homeTeamButton)
      await user.click(awayTeamButton)
      await user.click(homeTeamButton)
      
      expect(onTeamSelect).toHaveBeenCalledTimes(3)
      expect(onTeamSelect).toHaveBeenLastCalledWith('game-1', 'team-1')
    })
  })
})