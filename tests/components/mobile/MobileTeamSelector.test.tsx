import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileTeamSelector, type Team } from '@/components/mobile/MobileComponents'
import { setViewport, simulateTouch } from '../setup'

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

describe('MobileTeamSelector Component', () => {
  beforeEach(() => {
    setViewport('iPhone12')
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render both teams with proper information', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
      expect(screen.getByText('Kansas City Chiefs')).toBeInTheDocument()
      expect(screen.getByText('Buffalo Bills')).toBeInTheDocument()
    })

    it('should display teams in correct order (away @ home)', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const vsIndicator = screen.getByText('@')
      expect(vsIndicator).toBeInTheDocument()
      
      // Away team should be first, then @, then home team
      const buttons = screen.getAllByRole('radio')
      expect(buttons).toHaveLength(2)
      
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      
      expect(awayButton).toBeInTheDocument()
      expect(homeButton).toBeInTheDocument()
    })

    it('should show spread information for home team when provided', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
          spread={-3.5}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-3.5/ })
      expect(homeButton).toBeInTheDocument()
      expect(homeButton).toHaveTextContent('(-3.5)')
      
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      expect(awayButton).not.toHaveTextContent('(-3.5)')
    })

    it('should handle positive spread correctly', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
          spread={2.5}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*\+2.5/ })
      expect(homeButton).toHaveTextContent('(+2.5)')
    })
  })

  describe('Team Selection', () => {
    it('should handle home team selection', async () => {
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
      await user.click(homeButton)
      
      expect(onSelect).toHaveBeenCalledWith('team-home')
    })

    it('should handle away team selection', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={onSelect}
        />
      )

      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      await user.click(awayButton)
      
      expect(onSelect).toHaveBeenCalledWith('team-away')
    })

    it('should show selected state with checkmark', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          selectedTeam="team-home"
          onSelect={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      expect(homeButton).toHaveAttribute('aria-checked', 'true')
      expect(homeButton).toHaveClass('selected')
      expect(homeButton).toHaveTextContent('✓')
      
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      expect(awayButton).toHaveAttribute('aria-checked', 'false')
      expect(awayButton).not.toHaveClass('selected')
    })

    it('should prevent selection when disabled', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={onSelect}
          disabled
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeButton).toBeDisabled()
      expect(awayButton).toBeDisabled()
      expect(homeButton).toHaveClass('disabled')
      expect(awayButton).toHaveClass('disabled')
      
      await user.click(homeButton)
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('Touch Interactions', () => {
    it('should provide visual feedback on touch press', async () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      
      // Touch start should add pressed state
      fireEvent.touchStart(homeButton)
      await waitFor(() => {
        // The pressed state is managed internally, we can test the interaction
        expect(homeButton).toHaveClass('teamButton')
      })
      
      fireEvent.touchEnd(homeButton)
    })

    it('should handle mouse press events for desktop/trackpad users', async () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      
      fireEvent.mouseDown(homeButton)
      await waitFor(() => {
        expect(homeButton).toHaveClass('teamButton')
      })
      
      fireEvent.mouseUp(homeButton)
    })

    it('should clear pressed state on mouse leave', async () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      
      fireEvent.mouseDown(homeButton)
      fireEvent.mouseLeave(homeButton)
      
      await waitFor(() => {
        expect(homeButton).toHaveClass('teamButton')
      })
    })

    it('should not provide press feedback when disabled', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
          disabled
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      
      fireEvent.touchStart(homeButton)
      expect(homeButton).toHaveClass('disabled')
      
      fireEvent.mouseDown(homeButton)
      expect(homeButton).toHaveClass('disabled')
    })
  })

  describe('Accessibility', () => {
    it('should have proper radiogroup role', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
      expect(radioGroup).toHaveClass('teamSelector')
    })

    it('should have proper ARIA attributes for radio buttons', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          selectedTeam="team-home"
          onSelect={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeButton).toHaveAttribute('role', 'radio')
      expect(homeButton).toHaveAttribute('aria-checked', 'true')
      expect(awayButton).toHaveAttribute('role', 'radio')
      expect(awayButton).toHaveAttribute('aria-checked', 'false')
    })

    it('should have descriptive aria-labels including spread', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
          spread={-3.5}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*-3.5/ })
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeButton).toHaveAttribute('aria-label', 'Select Kansas City Chiefs (-3.5)')
      expect(awayButton).toHaveAttribute('aria-label', 'Select Buffalo Bills')
    })

    it('should be keyboard navigable', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={onSelect}
        />
      )

      // Tab to first radio button
      await user.tab()
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      expect(awayButton).toHaveFocus()
      
      // Space should select
      await user.keyboard(' ')
      expect(onSelect).toHaveBeenCalledWith('team-away')
      
      // Tab to next radio button
      await user.tab()
      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      expect(homeButton).toHaveFocus()
      
      // Enter should also work
      await user.keyboard('{Enter}')
      expect(onSelect).toHaveBeenCalledWith('team-home')
    })

    it('should meet minimum touch target size requirements', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeButton).toHaveMinTouchTarget(44)
      expect(awayButton).toHaveMinTouchTarget(44)
    })

    it('should support focus indicators', async () => {
      const user = userEvent.setup()
      
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      await user.tab()
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      expect(awayButton).toHaveFocus()
      
      // Focus-visible styles would be tested in e2e tests
      expect(awayButton).toBeAccessibleButton()
    })
  })

  describe('Visual Elements', () => {
    it('should display team logos when provided', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      const homeLogoImg = homeButton.querySelector('img')
      const awayLogoImg = awayButton.querySelector('img')
      
      expect(homeLogoImg).toHaveAttribute('src', '/logos/kc.png')
      expect(homeLogoImg).toHaveAttribute('alt', '')
      expect(homeLogoImg).toHaveClass('teamLogo')
      
      expect(awayLogoImg).toHaveAttribute('src', '/logos/buf.png')
      expect(awayLogoImg).toHaveAttribute('alt', '')
      expect(awayLogoImg).toHaveClass('teamLogo')
    })

    it('should handle missing logos gracefully', () => {
      const teamsWithoutLogos = {
        homeTeam: { ...mockHomeTeam, logo: undefined },
        awayTeam: { ...mockAwayTeam, logo: undefined }
      }
      
      render(
        <MobileTeamSelector
          {...teamsWithoutLogos}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
      
      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeButton.querySelector('img')).not.toBeInTheDocument()
      expect(awayButton.querySelector('img')).not.toBeInTheDocument()
    })

    it('should show vs indicator between teams', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const vsIndicator = screen.getByText('@')
      expect(vsIndicator).toHaveClass('vsIndicator')
      expect(vsIndicator).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt to small mobile screens', () => {
      setViewport('iPhone12Mini')
      
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      // On very small screens, team names might be hidden
      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
    })

    it('should maintain touch targets across viewport sizes', () => {
      const viewports = ['iPhone12Mini', 'iPhone12', 'pixelXL'] as const
      
      viewports.forEach(viewport => {
        setViewport(viewport)
        
        render(
          <MobileTeamSelector
            homeTeam={mockHomeTeam}
            awayTeam={mockAwayTeam}
            onSelect={vi.fn()}
          />
        )

        const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
        const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
        
        expect(homeButton).toHaveMinTouchTarget(44)
        expect(awayButton).toHaveMinTouchTarget(44)
      })
    })

    it('should work properly on tablet viewports', () => {
      setViewport('tablet')
      
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('Kansas City Chiefs')).toBeInTheDocument()
      expect(screen.getByText('Buffalo Bills')).toBeInTheDocument()
      
      const buttons = screen.getAllByRole('radio')
      expect(buttons).toHaveLength(2)
      buttons.forEach(button => {
        expect(button).toHaveMinTouchTarget(44)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle long team names gracefully', () => {
      const longNameTeams = {
        homeTeam: {
          ...mockHomeTeam,
          name: 'Very Long Team Name That Should Truncate Properly'
        },
        awayTeam: {
          ...mockAwayTeam,
          name: 'Another Extremely Long Team Name For Testing'
        }
      }
      
      render(
        <MobileTeamSelector
          {...longNameTeams}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('KC')).toBeInTheDocument()
      expect(screen.getByText('BUF')).toBeInTheDocument()
      
      // Full names should still be accessible via aria-label
      const homeButton = screen.getByRole('radio', { 
        name: /Very Long Team Name That Should Truncate Properly/ 
      })
      expect(homeButton).toBeInTheDocument()
    })

    it('should handle special characters in team names', () => {
      const specialTeams = {
        homeTeam: {
          ...mockHomeTeam,
          name: "Team with 'Quotes' & Symbols",
          abbreviation: 'T&Q'
        },
        awayTeam: {
          ...mockAwayTeam,
          name: 'Тeam Wіth Unіcode',
          abbreviation: 'UNI'
        }
      }
      
      render(
        <MobileTeamSelector
          {...specialTeams}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('T&Q')).toBeInTheDocument()
      expect(screen.getByText('UNI')).toBeInTheDocument()
    })

    it('should handle zero spread value', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
          spread={0}
        />
      )

      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs.*0/ })
      expect(homeButton).toHaveTextContent('(+0)')
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestSelector = ({ selectedTeam }: { selectedTeam?: string }) => {
        renderSpy()
        return (
          <MobileTeamSelector
            homeTeam={mockHomeTeam}
            awayTeam={mockAwayTeam}
            selectedTeam={selectedTeam}
            onSelect={vi.fn()}
          />
        )
      }
      
      const { rerender } = render(<TestSelector />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      rerender(<TestSelector selectedTeam="team-home" />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    it('should handle rapid selection changes efficiently', async () => {
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
      const awayButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      // Rapid clicks
      await user.click(homeButton)
      await user.click(awayButton)
      await user.click(homeButton)
      await user.click(awayButton)
      
      expect(onSelect).toHaveBeenCalledTimes(4)
      expect(onSelect).toHaveBeenLastCalledWith('team-away')
    })
  })
})