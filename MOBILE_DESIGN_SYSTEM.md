# Mobile UX Design System - NFL Pick'em App

## 🎯 Design Problem Statement

**Current Issues:**
- Full-width buttons that look terrible and are hard to use
- Poor visual hierarchy making game scanning difficult
- Cramped layouts unusable during busy game days
- Family members struggling with mobile interface during live NFL games

**Solution Goal:**
Create a mobile-first design system optimized for one-handed, distracted, time-pressured game-day usage.

## 📱 Core Design Principles

### 1. Game-Day Context First
- Users are distracted, emotional, often one-handed, under time pressure
- Interaction cost must be near-zero: no hunting, no confirmation dialogs
- Optimize for speed and error prevention

### 2. Glance-ability Over Density
- Show only decision-critical information: teams, spread, game state
- Hide tertiary data (venue, TV network) until card expansion
- Progressive disclosure for advanced stats

### 3. Thumb-Friendly Touch Economics
- Primary targets: ≤200px wide, ≥44px tall
- Position in lower ⅔ of viewport for thumb reach
- Never use full-width buttons (current problem)

### 4. Predictable Motion
- Micro-animations <150ms for state changes only
- Anything longer feels laggy during live games

## 🗂️ Information Architecture

### Primary Information Hierarchy
1. **Matchup Identity** (highest priority)
   - Team logos + abbreviated names + records
   - Example: "DAL 7-3 vs PHI 6-4"

2. **Betting Line & Pick Options** (action-critical)
   - Spread or money-line adjacent to pick buttons
   - Clear visual connection between line and action

3. **Game Timing/State** (context-critical)
   - Kickoff time, live quarter, or "Final" status
   - Lock status for deadline management

4. **Supplemental Information** (secondary)
   - Public pick percentages, over/under, injury flags
   - Only shown when space allows or card expanded

## 📋 Mobile Game Card Wireframes

### Variant A: Dual Button Layout (Recommended)
```
┌─────────────────────────────────────┐
│  🏈 DAL 7-3    vs    PHI 6-4  🏈   │
│                                     │
│  [  DAL -2.5  ] [  PHI +2.5  ]    │
│   (160px wide)   (160px wide)      │
│                                     │
│  ⏰ Sun 1:00 PM        📍 Selected  │
└─────────────────────────────────────┘
Height: 120px, Padding: 16px
```

### Variant B: Segmented Control Layout
```
┌─────────────────────────────────────┐
│  🏈 DAL 7-3    vs    PHI 6-4  🏈   │
│                                     │
│  [ Spread | Money | O/U ]          │
│                                     │
│  [  DAL -2.5  ] [  PHI +2.5  ]    │
│                                     │
│  ⏰ Sun 1:00 PM        📍 Selected  │
└─────────────────────────────────────┘
Height: 140px, Supports multiple bet types
```

### Variant C: Compact List (High Density)
```
┌─────────────────────────────────────┐
│ 🏈 DAL vs PHI  │ -2.5 │ 1:00 │ ✓  │
└─────────────────────────────────────┘
Height: 60px, Tap to expand to Variant A
```

### Variant D: Swipe Gesture (Advanced)
```
┌─────────────────────────────────────┐
│  🏈 DAL 7-3    vs    PHI 6-4  🏈   │
│                                     │
│       ← Swipe DAL    PHI Swipe →    │
│              -2.5    +2.5           │
│                                     │
│  ⏰ Sun 1:00 PM        📍 Selected  │
└─────────────────────────────────────┘
Whole card swipeable with visual affordances
```

## 🎨 Design System Specifications

### Color Palette (WCAG 2.1 AA Compliant)

#### Light Mode
```css
/* Primary Actions */
--primary-blue: #0061FF;
--primary-blue-hover: #0051D9;
--primary-blue-pressed: #0041B3;

/* Success & Error States */
--success-green: #16A34A;
--error-red: #DC2626;

/* Neutral Scale */
--neutral-50: #FAFAFA;
--neutral-100: #F4F4F5;
--neutral-200: #E4E4E7;
--neutral-300: #D4D4D8;
--neutral-500: #71717A;
--neutral-700: #374151;
--neutral-900: #111827;

/* Surface Colors */
--surface-primary: #FFFFFF;
--surface-elevated: #FFFFFF;
--surface-border: #E5E7EB;
```

#### Dark Mode
```css
/* Primary Actions */
--primary-blue-dark: #5598FF;
--primary-blue-hover-dark: #7BAEFF;
--primary-blue-pressed-dark: #3D7EFF;

/* Success & Error States */
--success-green-dark: #22C55E;
--error-red-dark: #EF4444;

/* Neutral Scale */
--neutral-50-dark: #0F1116;
--neutral-100-dark: #181A20;
--neutral-200-dark: #252830;
--neutral-300-dark: #374151;
--neutral-500-dark: #9CA3AF;
--neutral-700-dark: #D1D5DB;
--neutral-900-dark: #F9FAFB;

/* Surface Colors */
--surface-primary-dark: #0F1116;
--surface-elevated-dark: #181A20;
--surface-border-dark: #374151;
```

### Typography Scale (Mobile Optimized)

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Scale */
--text-h5: 20px/24px; /* Card titles */
--text-h6: 18px/22px; /* Team names */
--text-body-lg: 16px/22px; /* Spreads */
--text-body: 14px/20px; /* Secondary info */
--text-caption: 12px/16px; /* Meta data */

/* Weights */
--font-regular: 400;
--font-semibold: 600;
```

### Spacing System (8px Grid)

```css
/* Base Unit: 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;

/* Component Specific */
--card-padding-x: 16px;
--card-padding-y: 12px;
--button-padding-x: 20px;
--button-padding-y: 12px;
```

### Component Library

#### Game Card Component
```css
.game-card {
  background: var(--surface-elevated);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: var(--card-padding-y) var(--card-padding-x);
  min-height: 120px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.game-card--locked {
  opacity: 0.7;
  pointer-events: none;
}
```

#### Pick Button Component
```css
.pick-button {
  background: var(--surface-primary);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  padding: var(--button-padding-y) var(--button-padding-x);
  min-width: 160px;
  max-width: 200px;
  min-height: 44px;
  
  font-size: var(--text-body-lg);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
  
  transition: all 150ms ease;
}

.pick-button:hover {
  border-color: var(--primary-blue);
  background: var(--neutral-50);
}

.pick-button:active {
  transform: translateY(1px);
  background: var(--neutral-100);
}

.pick-button--selected {
  background: var(--primary-blue);
  border-color: var(--primary-blue);
  color: white;
}

.pick-button:disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

#### Status Badge Component
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: var(--text-caption);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge--locked {
  background: var(--error-red);
  color: white;
}

.status-badge--live {
  background: var(--success-green);
  color: white;
}

.status-badge--selected {
  background: var(--primary-blue);
  color: white;
}
```

### Animation Tokens

```css
/* Durations */
--duration-fast: 100ms;
--duration-standard: 200ms;
--duration-slow: 400ms;

/* Easings */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
```

## 🔄 User Flow Diagrams

### Primary Pick Flow
```
User Opens Game List
        ↓
Card Visible (120px height)
        ↓
Tap Pick Button (DAL -2.5)
        ↓
Immediate Visual Feedback
  • Button turns blue
  • Status badge shows "Selected"
        ↓
Snackbar: "DAL -2.5 saved • Undo" (5s)
        ↓
Pick Count Badge Updates
        ↓
[Game starts → Card locks with "Locked" badge]
```

### Error Prevention Flow
```
User Attempts Pick
        ↓
    Game Started?
   ↙           ↘
  NO           YES
  ↓            ↓
Allow Pick   Show "Game Locked"
  ↓          Disable Buttons
Save Pick       ↓
  ↓          Card Dims 30%
Success        ↓
            Prevent Action
```

## ♿ Accessibility Guidelines

### Touch Targets
- **Minimum size**: 44px × 44px for all interactive elements
- **Recommended size**: 48px × 48px for primary actions
- **Spacing**: Minimum 8px between adjacent touch targets

### Color Contrast (WCAG 2.1 AA)
- **Text on background**: 4.5:1 ratio minimum
- **UI elements**: 3:1 ratio minimum
- **Color + icon redundancy** for all states (selected, locked, error)

### Screen Reader Support
```html
<button 
  aria-label="Pick Dallas Cowboys minus two point five"
  aria-pressed="false"
  aria-describedby="game-time-1"
>
  DAL -2.5
</button>

<div id="game-time-1" class="sr-only">
  Game starts Sunday at 1:00 PM
</div>
```

### Motion Sensitivity
- **Respect `prefers-reduced-motion`**
- **Disable card flip animations** for motion-sensitive users
- **Provide toggle** for advanced motion effects

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
.game-card {
  /* Base: 320px+ (iPhone SE) */
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

@media (min-width: 375px) {
  /* iPhone 12/13/14 standard */
  .pick-button {
    min-width: 170px;
  }
}

@media (min-width: 414px) {
  /* iPhone Plus/Max sizes */
  .pick-button {
    min-width: 180px;
  }
}

@media (min-width: 768px) {
  /* Tablet/Desktop */
  .game-card {
    max-width: 400px;
    margin: 0 auto;
  }
}
```

## 🧪 Testing Checklist

### Usability Testing
- [ ] Can user make 5 random picks in <20 seconds with one thumb?
- [ ] Clear visual feedback for all pick states?
- [ ] Easy to scan and compare games quickly?
- [ ] Works well in bright sunlight (contrast test)?

### Technical Testing
- [ ] 44px minimum touch targets verified?
- [ ] VoiceOver navigation order logical?
- [ ] Dark mode contrast ratios pass WCAG?
- [ ] Dynamic type scaling up to 120% works?
- [ ] Offline pick storage and sync works?

### Game-Day Scenario Testing
- [ ] Usable while watching TV (distracted)?
- [ ] One-handed operation comfortable?
- [ ] Quick pick changes before game lock?
- [ ] Clear indication of locked games?

## 🚀 Implementation Priorities

### Phase 1: Core Card Redesign
1. Implement Variant A dual button layout
2. Replace full-width buttons with constrained buttons
3. Add proper touch target sizing
4. Implement basic state management

### Phase 2: Visual Polish
1. Apply complete color system
2. Add micro-animations and transitions
3. Implement dark mode support
4. Add status badges and indicators

### Phase 3: Advanced Features
1. Add Variant B segmented control option
2. Implement swipe gestures (Variant D)
3. Add progressive disclosure for game details
4. Optimize for larger screens

### Phase 4: Accessibility & Testing
1. Complete WCAG 2.1 AA compliance
2. Add comprehensive screen reader support
3. Implement motion sensitivity controls
4. Conduct game-day usability testing

## 📊 Success Metrics

### User Experience
- **Pick completion time**: <5 seconds per game
- **Error rate**: <2% incorrect picks
- **Accessibility score**: 100% WCAG 2.1 AA compliance
- **User satisfaction**: >4.5/5 for game-day usability

### Technical Performance
- **Touch response**: <100ms visual feedback
- **Card render time**: <200ms
- **Offline resilience**: 100% pick storage success
- **Cross-device sync**: <3 second propagation

This design system prioritizes game-day usability over visual complexity, ensuring family members can make quick, accurate picks even during the most exciting moments of NFL games.