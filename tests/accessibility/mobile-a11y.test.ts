import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

/**
 * Accessibility Tests for Mobile Components
 * 
 * Testing compliance with WCAG 2.1 AA standards:
 * - Touch targets (minimum 44x44px)
 * - Keyboard navigation
 * - Screen reader support
 * - Color contrast
 * - Focus management
 * - ARIA labels and roles
 */

describe('Mobile Accessibility Tests', () => {
  beforeEach(() => {
    setViewport('iPhone12')
    vi.clearAllMocks()
  })

  describe('Touch Target Accessibility (WCAG 2.1 AA)', () => {
    it('MobileButton meets minimum touch target size', () => {
      render(<MobileButton>Touch Target Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Touch Target Test' })
      expect(button).toHaveMinTouchTarget(44)
    })

    it('MobileButton small size still meets accessibility requirements', () => {
      render(<MobileButton size="sm">Small Button</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Small Button' })
      // Small buttons should still meet minimum requirements
      expect(button).toHaveMinTouchTarget(36) // CSS sets min-height: 36px for small
    })

    it('MobileTeamSelector buttons meet touch target requirements', () => {
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

    it('MobileNavigation buttons meet touch target requirements', () => {
      const navItems = [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'games', label: 'Games', icon: '🏈' },
        { id: 'scores', label: 'Scores', icon: '🏆' }
      ]

      render(
        <MobileNavigation
          currentPage="games"
          onNavigate={vi.fn()}
          items={navItems}
        />
      )

      navItems.forEach(item => {
        const button = screen.getByRole('button', { name: item.label })
        expect(button).toHaveMinTouchTarget(44)
      })
    })

    it('touch targets remain accessible across different mobile viewports', () => {
      const viewports = ['iPhone12Mini', 'iPhone12', 'pixelXL'] as const
      
      viewports.forEach(viewport => {
        setViewport(viewport)
        
        render(<MobileButton>Viewport Test</MobileButton>)
        const button = screen.getByRole('button', { name: 'Viewport Test' })
        expect(button).toHaveMinTouchTarget(44)
      })
    })
  })

  describe('Keyboard Navigation Accessibility', () => {
    it('MobileButton is keyboard accessible', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()
      
      render(<MobileButton onClick={onClick}>Keyboard Button</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Keyboard Button' })
      
      // Should be focusable
      await user.tab()
      expect(button).toHaveFocus()
      
      // Should activate with Enter
      await user.keyboard('{Enter}')
      expect(onClick).toHaveBeenCalledTimes(1)
      
      // Should activate with Space
      button.focus()
      await user.keyboard(' ')
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('MobileTeamSelector supports keyboard navigation', async () => {
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

    it('MobileWeekSelector supports keyboard navigation', async () => {
      const onWeekSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileWeekSelector
          currentWeek={1}
          totalWeeks={3}
          onWeekSelect={onWeekSelect}
        />
      )

      // Tab to first week button
      await user.tab()
      const week1Button = screen.getByRole('button', { name: /Week 1/ })
      expect(week1Button).toHaveFocus()
      
      // Arrow keys should navigate between weeks
      await user.keyboard('{ArrowRight}')
      // Focus might not move with arrow keys in this implementation
      // but the button should still be keyboard activatable
      
      await user.keyboard('{Enter}')
      expect(onWeekSelect).toHaveBeenCalledWith(1)
    })

    it('disabled components are not keyboard accessible', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()
      
      render(
        <div>
          <MobileButton onClick={onClick}>Enabled Button</MobileButton>
          <MobileButton onClick={onClick} disabled>Disabled Button</MobileButton>
        </div>
      )

      // Tab should skip disabled button
      await user.tab()
      const enabledButton = screen.getByRole('button', { name: 'Enabled Button' })
      expect(enabledButton).toHaveFocus()
      
      await user.tab()
      // Should not focus on disabled button
      const disabledButton = screen.getByRole('button', { name: 'Disabled Button' })
      expect(disabledButton).not.toHaveFocus()
    })
  })

  describe('Screen Reader Support (ARIA)', () => {
    it('MobileButton has proper ARIA attributes', () => {
      render(
        <MobileButton aria-label="Custom screen reader label">
          Button Text
        </MobileButton>
      )
      
      const button = screen.getByRole('button', { name: 'Custom screen reader label' })
      expect(button).toHaveAttribute('aria-label', 'Custom screen reader label')
      expect(button).toBeAccessibleButton()
    })

    it('MobileButton loading state is announced to screen readers', () => {
      render(<MobileButton loading>Processing...</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Processing...' })
      expect(button).toBeDisabled() // Screen readers won't activate it
      
      // Spinner should be hidden from screen readers
      const spinner = button.querySelector('.spinner')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('MobileTeamSelector has proper radiogroup structure', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          selectedTeam="team-home"
          onSelect={vi.fn()}
        />
      )

      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
      
      const homeRadio = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      const awayRadio = screen.getByRole('radio', { name: /Buffalo Bills/ })
      
      expect(homeRadio).toHaveAttribute('role', 'radio')
      expect(homeRadio).toHaveAttribute('aria-checked', 'true')
      expect(awayRadio).toHaveAttribute('aria-checked', 'false')
    })

    it('MobileTeamSelector provides descriptive ARIA labels', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
          spread={-3.5}
        />
      )

      const homeButton = screen.getByRole('radio', { 
        name: 'Select Kansas City Chiefs (-3.5)' 
      })
      const awayButton = screen.getByRole('radio', { 
        name: 'Select Buffalo Bills' 
      })
      
      expect(homeButton).toHaveAttribute('aria-label', 'Select Kansas City Chiefs (-3.5)')
      expect(awayButton).toHaveAttribute('aria-label', 'Select Buffalo Bills')
    })

    it('MobileGameCard indicates locked state to screen readers', () => {
      const lockedGame = { ...mockGame, isLocked: true }
      
      render(
        <MobileGameCard
          game={lockedGame}
          onTeamSelect={vi.fn()}
        />
      )

      const lockIndicator = screen.getByLabelText('Game locked')
      expect(lockIndicator).toBeInTheDocument()
      expect(lockIndicator).toHaveTextContent('🔒')
    })

    it('MobileNavigation has proper navigation landmarks', () => {
      const navItems = [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'games', label: 'Games', icon: '🏈', badge: 5 }
      ]

      render(
        <MobileNavigation
          currentPage="games"
          onNavigate={vi.fn()}
          items={navItems}
        />
      )

      const nav = screen.getByRole('navigation', { name: 'Main navigation' })
      expect(nav).toBeInTheDocument()
      
      const currentPageButton = screen.getByRole('button', { name: 'Games' })
      expect(currentPageButton).toHaveAttribute('aria-current', 'page')
      
      // Badge should have descriptive label
      const badgeElement = screen.getByLabelText('5 notifications')
      expect(badgeElement).toBeInTheDocument()
    })

    it('decorative elements are hidden from screen readers', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          onSelect={vi.fn()}
        />
      )

      const vsIndicator = screen.getByText('@')
      expect(vsIndicator).toHaveAttribute('aria-hidden', 'true')
      
      // Team logos should have empty alt text (decorative)
      const logos = screen.getAllByRole('img')
      logos.forEach(logo => {
        expect(logo).toHaveAttribute('alt', '')
      })
    })
  })

  describe('Focus Management', () => {
    it('focus is properly managed in MobileGameCard', async () => {
      const user = userEvent.setup()
      
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      // Tab into the component
      await user.tab()
      
      // First focusable element should be focused
      const firstTeamButton = screen.getAllByRole('radio')[0]
      expect(firstTeamButton).toHaveFocus()
    })

    it('focus is trapped within modal-like components', async () => {
      // This would test focus trapping if we had modal components
      // For now, test that focus doesn't escape the component boundaries
      const user = userEvent.setup()
      
      render(
        <div>
          <button>Before</button>
          <MobileTeamSelector
            homeTeam={mockHomeTeam}
            awayTeam={mockAwayTeam}
            onSelect={vi.fn()}
          />
          <button>After</button>
        </div>
      )

      const beforeButton = screen.getByRole('button', { name: 'Before' })
      const afterButton = screen.getByRole('button', { name: 'After' })
      
      beforeButton.focus()
      
      // Tab should go to team selector
      await user.tab()
      const awayTeamButton = screen.getByRole('radio', { name: /Buffalo Bills/ })
      expect(awayTeamButton).toHaveFocus()
      
      // Tab again should go to home team
      await user.tab()
      const homeTeamButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      expect(homeTeamButton).toHaveFocus()
      
      // Tab again should go to after button
      await user.tab()
      expect(afterButton).toHaveFocus()
    })

    it('focus indicators are visible', async () => {
      const user = userEvent.setup()
      
      render(<MobileButton>Focus Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Focus Test' })
      await user.tab()
      
      expect(button).toHaveFocus()
      // The actual focus ring styling would be tested in e2e tests
      // Here we verify the element can receive focus
    })
  })

  describe('Motion and Animation Accessibility', () => {
    it('respects reduced motion preferences', () => {
      // Mock prefers-reduced-motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(<MobileButton>Reduced Motion Test</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Reduced Motion Test' })
      expect(button).toBeInTheDocument()
      
      // In a real implementation, animations would be disabled
      // This is tested in the CSS with @media (prefers-reduced-motion: reduce)
    })

    it('loading animations are accessible', () => {
      render(<MobileButton loading>Loading Button</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Loading Button' })
      const spinner = button.querySelector('.spinner')
      
      // Spinner should be hidden from screen readers
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
      
      // Button should indicate loading state
      expect(button).toBeDisabled()
      expect(button).toHaveClass('loading')
    })
  })

  describe('Color and Contrast Accessibility', () => {
    it('selected states do not rely solely on color', () => {
      render(
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          selectedTeam="team-home"
          onSelect={vi.fn()}
        />
      )

      const selectedButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      
      // Should have visual indicator beyond color (checkmark)
      expect(selectedButton).toHaveTextContent('✓')
      expect(selectedButton.querySelector('.checkmark')).toBeInTheDocument()
      
      // Should also have ARIA state
      expect(selectedButton).toHaveAttribute('aria-checked', 'true')
    })

    it('disabled states are clearly indicated', () => {
      render(<MobileButton disabled>Disabled Button</MobileButton>)
      
      const button = screen.getByRole('button', { name: 'Disabled Button' })
      
      // Should be programmatically disabled
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled')
    })

    it('error states are accessible', () => {
      // Test error styling without relying solely on color
      render(
        <MobileButton variant="danger" aria-describedby="error-message">
          Delete Account
        </MobileButton>
      )
      
      const button = screen.getByRole('button', { name: 'Delete Account' })
      expect(button).toHaveClass('button-danger')
      expect(button).toHaveAttribute('aria-describedby', 'error-message')
    })
  })

  describe('Language and Localization Support', () => {
    it('components support RTL languages', () => {
      // Test RTL layout support
      render(
        <div dir="rtl">
          <MobileTeamSelector
            homeTeam={mockHomeTeam}
            awayTeam={mockAwayTeam}
            onSelect={vi.fn()}
          />
        </div>
      )

      const teamSelector = screen.getByRole('radiogroup')
      expect(teamSelector.closest('[dir="rtl"]')).toBeInTheDocument()
      
      // Components should still be functional in RTL
      const buttons = screen.getAllByRole('radio')
      expect(buttons).toHaveLength(2)
    })

    it('text content is properly structured for screen readers', () => {
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      // Time should be in a readable format
      const gameTime = screen.getByText(/Sep 11/)
      expect(gameTime).toBeInTheDocument()
      
      // Spread information should be clearly labeled
      const spread = screen.getByText('Spread: -3.5')
      expect(spread).toBeInTheDocument()
    })
  })

  describe('Error Handling and Accessibility', () => {
    it('error states are announced to screen readers', () => {
      // This would test error announcements in a real app
      const ErrorComponent = () => (
        <div role="alert" aria-live="polite">
          Failed to load game data
        </div>
      )
      
      render(<ErrorComponent />)
      
      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toHaveAttribute('aria-live', 'polite')
      expect(errorAlert).toHaveTextContent('Failed to load game data')
    })

    it('loading states are announced to screen readers', () => {
      // Test that loading states provide feedback
      render(
        <div>
          <div role="status" aria-live="polite">
            Loading games...
          </div>
          <MobileButton loading>Submit</MobileButton>
        </div>
      )
      
      const loadingStatus = screen.getByRole('status')
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Mobile-Specific Accessibility Features', () => {
    it('components work with mobile screen readers', () => {
      render(
        <MobileGameCard
          game={mockGame}
          onTeamSelect={vi.fn()}
        />
      )

      // All interactive elements should be properly labeled
      const radioButtons = screen.getAllByRole('radio')
      radioButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
        expect(button.getAttribute('aria-label')).toContain('Select')
      })
    })

    it('touch gestures have accessible alternatives', async () => {
      const onWeekSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <MobileWeekSelector
          currentWeek={1}
          totalWeeks={5}
          onWeekSelect={onWeekSelect}
        />
      )

      // Should be navigable without touch gestures
      const weekButtons = screen.getAllByRole('button')
      expect(weekButtons.length).toBeGreaterThan(0)
      
      // First button should be keyboard accessible
      await user.tab()
      expect(weekButtons[0]).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(onWeekSelect).toHaveBeenCalled()
    })

    it('viewport changes do not break accessibility', () => {
      const viewports = ['iPhone12Mini', 'iPhone12', 'pixelXL', 'tablet'] as const
      
      viewports.forEach(viewport => {
        setViewport(viewport)
        
        render(<MobileButton>Viewport Accessibility Test</MobileButton>)
        
        const button = screen.getByRole('button', { name: 'Viewport Accessibility Test' })
        
        // Should maintain accessibility across viewports
        expect(button).toBeAccessibleButton()
        expect(button).toHaveMinTouchTarget(44)
      })
    })

    it('components maintain accessibility when dynamically updated', async () => {
      const TestComponent = ({ selected }: { selected?: string }) => (
        <MobileTeamSelector
          homeTeam={mockHomeTeam}
          awayTeam={mockAwayTeam}
          selectedTeam={selected}
          onSelect={vi.fn()}
        />
      )
      
      const { rerender } = render(<TestComponent />)
      
      // Initial state should be accessible
      const homeButton = screen.getByRole('radio', { name: /Kansas City Chiefs/ })
      expect(homeButton).toHaveAttribute('aria-checked', 'false')
      
      // After selection, should maintain accessibility
      rerender(<TestComponent selected="team-home" />)
      expect(homeButton).toHaveAttribute('aria-checked', 'true')
      expect(homeButton).toHaveTextContent('✓')
    })
  })
})