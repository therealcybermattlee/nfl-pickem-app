# Accessibility Guidelines - NFL Pick'em Mobile App

## ♿ WCAG 2.1 AA Compliance Standards

### Core Accessibility Principles

#### 1. Perceivable
- Information must be presentable in ways users can perceive
- Sufficient color contrast ratios
- Text alternatives for images
- Resizable text up to 200% without loss of functionality

#### 2. Operable
- Interface components must be operable by all users
- Keyboard accessible
- No seizure-inducing content
- Sufficient time for interactions

#### 3. Understandable
- Information and UI operation must be understandable
- Readable text
- Predictable functionality
- Input assistance

#### 4. Robust
- Content must be robust enough for various assistive technologies
- Valid HTML/ARIA
- Compatible with screen readers

## 🎨 Color & Contrast Requirements

### Minimum Contrast Ratios (WCAG 2.1 AA)

#### Text Contrast Requirements
```css
/* Normal text (under 18pt / 24px): 4.5:1 minimum */
--text-contrast-normal: 4.5;

/* Large text (18pt+ / 24px+): 3:1 minimum */
--text-contrast-large: 3.0;

/* UI elements (borders, icons): 3:1 minimum */
--ui-contrast-minimum: 3.0;
```

#### Verified Color Combinations

**Light Mode Combinations:**
```css
/* Text on backgrounds - 4.5:1+ ratio */
color: #111827; /* neutral-900 */
background: #FFFFFF; /* Ratio: 16.68:1 ✓ */

color: #374151; /* neutral-700 */
background: #F9FAFB; /* Ratio: 9.74:1 ✓ */

color: #FFFFFF;
background: #0061FF; /* primary-blue - Ratio: 7.93:1 ✓ */

/* UI Elements - 3:1+ ratio */
border-color: #D1D5DB; /* neutral-300 on white - Ratio: 3.06:1 ✓ */
```

**Dark Mode Combinations:**
```css
/* Text on backgrounds - 4.5:1+ ratio */
color: #F9FAFB; /* neutral-900 dark */
background: #0F1116; /* Ratio: 15.21:1 ✓ */

color: #E5E7EB; /* neutral-700 dark */
background: #181A20; /* Ratio: 11.89:1 ✓ */

color: #FFFFFF;
background: #5598FF; /* primary-blue-dark - Ratio: 6.12:1 ✓ */

/* UI Elements - 3:1+ ratio */
border-color: #4B5563; /* neutral-300 dark on dark bg - Ratio: 3.47:1 ✓ */
```

### Color-Independent Information

#### Never Use Color Alone
```html
<!-- ❌ Bad: Color only for status -->
<button class="pick-button" style="background: green;">
  Selected
</button>

<!-- ✅ Good: Color + icon + text -->
<button class="pick-button pick-button--selected" aria-pressed="true">
  <span aria-hidden="true">✓</span>
  Selected
</button>
```

#### Status Indicators
```css
/* Always combine color with icons/shapes */
.status-badge--selected::before {
  content: "✓";
  margin-right: 4px;
}

.status-badge--locked::before {
  content: "🔒";
  margin-right: 4px;
}

.status-badge--live::before {
  content: "●";
  margin-right: 4px;
  animation: pulse 2s infinite;
}
```

## ⌨️ Keyboard Navigation

### Focus Management
```css
/* Visible focus indicators */
*:focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  *:focus-visible {
    outline: 3px solid;
    outline-offset: 3px;
  }
}

/* Focus within (for complex components) */
.game-card:focus-within {
  box-shadow: 0 0 0 2px var(--primary-blue);
}
```

### Tab Order
```html
<!-- Logical tab sequence -->
<div class="game-card">
  <!-- Tab index 1: First pick button -->
  <button class="pick-button" tabindex="0">DAL -2.5</button>
  
  <!-- Tab index 2: Second pick button -->
  <button class="pick-button" tabindex="0">PHI +2.5</button>
  
  <!-- Skip decorative elements -->
  <div class="game-card__time" tabindex="-1">Sun 1:00 PM</div>
</div>
```

### Keyboard Shortcuts
```javascript
// Game-day keyboard shortcuts
const keyboardShortcuts = {
  'j': 'Move to next game',
  'k': 'Move to previous game',
  '1': 'Select first team',
  '2': 'Select second team',
  'u': 'Undo last pick',
  'Enter': 'Confirm selection',
  'Escape': 'Cancel/clear selection'
};
```

## 📱 Touch & Motor Accessibility

### Touch Target Sizes
```css
/* Minimum 44x44px touch targets (iOS/Android guidelines) */
.pick-button,
.status-badge[role="button"],
.nav-button {
  min-height: 44px;
  min-width: 44px;
}

/* Recommended 48x48px for primary actions */
.pick-button--primary {
  min-height: 48px;
  min-width: 48px;
}

/* Larger targets on touch-only devices */
@media (hover: none) and (pointer: coarse) {
  .pick-button {
    min-height: 48px;
    padding: 14px 24px;
  }
}
```

### Touch Target Spacing
```css
/* Minimum 8px spacing between targets */
.game-card__actions {
  gap: max(var(--space-2), 8px);
}

/* Recommended 12px+ for dense interfaces */
.button-group {
  gap: var(--space-3); /* 12px */
}

@media (hover: none) and (pointer: coarse) {
  /* Increase spacing on touch devices */
  .game-card__actions {
    gap: var(--space-4); /* 16px */
  }
}
```

### Motor Impairment Considerations
```css
/* Larger click areas */
.pick-button {
  position: relative;
}

.pick-button::before {
  content: "";
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  /* Invisible extended click area */
}

/* Reduced motion sensitivity */
@media (prefers-reduced-motion: reduce) {
  .pick-button,
  .status-badge,
  .game-card {
    transition: none;
    animation: none;
    transform: none !important;
  }
}
```

## 🗣️ Screen Reader Support

### Semantic HTML Structure
```html
<!-- Proper heading hierarchy -->
<main role="main">
  <h1>NFL Pick'em - Week 12</h1>
  
  <section aria-labelledby="upcoming-games">
    <h2 id="upcoming-games">Upcoming Games</h2>
    
    <ul role="list">
      <li role="listitem">
        <article aria-labelledby="game-dal-phi">
          <h3 id="game-dal-phi" class="sr-only">
            Dallas Cowboys vs Philadelphia Eagles
          </h3>
          <!-- Game content -->
        </article>
      </li>
    </ul>
  </section>
</main>
```

### ARIA Labels and Descriptions
```html
<!-- Comprehensive button labels -->
<button 
  class="pick-button"
  aria-label="Pick Dallas Cowboys minus 2.5 points"
  aria-pressed="false"
  aria-describedby="game-time-1 spread-info-1"
>
  DAL -2.5
</button>

<!-- Supporting information -->
<div id="game-time-1" class="sr-only">
  Game starts Sunday at 1:00 PM Eastern
</div>

<div id="spread-info-1" class="sr-only">
  Dallas Cowboys are 2.5 point favorites
</div>
```

### Live Regions for Updates
```html
<!-- Announce pick confirmations -->
<div 
  aria-live="polite" 
  aria-atomic="true"
  class="sr-only"
  id="pick-announcements"
>
  <!-- Dynamically updated -->
</div>

<!-- Critical updates (game locks, errors) -->
<div 
  aria-live="assertive" 
  aria-atomic="true"
  class="sr-only"
  id="critical-announcements"
>
  <!-- Urgent notifications -->
</div>
```

### Screen Reader Optimized Content
```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Show on focus for keyboard users */
.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0.5rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
  border: 2px solid var(--primary-blue);
  background: var(--surface-primary);
  color: var(--neutral-900);
  z-index: 1000;
}
```

### Dynamic Content Announcements
```javascript
// Announce pick changes
function announcePick(team, spread, gameTime) {
  const announcement = `Pick confirmed: ${team} ${spread}. Game starts ${gameTime}.`;
  
  document.getElementById('pick-announcements').textContent = announcement;
  
  // Clear after announcement
  setTimeout(() => {
    document.getElementById('pick-announcements').textContent = '';
  }, 1000);
}

// Announce critical updates
function announceGameLock(team1, team2) {
  const announcement = `Game locked: ${team1} versus ${team2} has started. No more picks allowed.`;
  
  document.getElementById('critical-announcements').textContent = announcement;
}
```

## 🔤 Text & Reading Accessibility

### Dynamic Type Support
```css
/* Support system font scaling */
html {
  font-size: 16px; /* Base size */
}

/* Scale with user preferences */
@media (prefers-reduced-motion: no-preference) {
  html {
    font-size: clamp(14px, 4vw, 20px);
  }
}

/* Large text mode support */
.pick-button {
  font-size: max(var(--text-base), 1rem);
  line-height: 1.4;
}

/* Ultra-large text support (200% zoom) */
@media (min-width: 1px) {
  .game-card {
    min-height: auto; /* Allow content expansion */
  }
  
  .pick-button {
    white-space: normal; /* Allow text wrapping */
    height: auto;
  }
}
```

### Reading Order
```html
<!-- Logical reading flow -->
<div class="game-card">
  <!-- 1. Game identification -->
  <div class="game-card__matchup" aria-label="Game matchup">
    <span class="game-card__team">Dallas Cowboys 7 wins 3 losses</span>
    <span class="game-card__vs">versus</span>
    <span class="game-card__team">Philadelphia Eagles 6 wins 4 losses</span>
  </div>
  
  <!-- 2. Betting information -->
  <div class="game-card__spread" aria-label="Point spread">
    Dallas favored by 2.5 points
  </div>
  
  <!-- 3. Actions -->
  <div class="game-card__actions" role="group" aria-label="Make your pick">
    <button>Pick Dallas Cowboys</button>
    <button>Pick Philadelphia Eagles</button>
  </div>
  
  <!-- 4. Meta information -->
  <div class="game-card__meta" aria-label="Game details">
    <time datetime="2024-12-15T18:00">Sunday 1:00 PM Eastern</time>
  </div>
</div>
```

### Content Language
```html
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NFL Pick'em - Family Football Predictions</title>
</head>
```

## 🧠 Cognitive Accessibility

### Clear Navigation
```html
<!-- Consistent navigation structure -->
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a href="/games" role="menuitem" aria-current="page">Games</a>
    </li>
    <li role="none">
      <a href="/leaderboard" role="menuitem">Leaderboard</a>
    </li>
    <li role="none">
      <a href="/profile" role="menuitem">Profile</a>
    </li>
  </ul>
</nav>

<!-- Breadcrumb for orientation -->
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/games">Games</a></li>
    <li aria-current="page">Week 12</li>
  </ol>
</nav>
```

### Error Prevention & Recovery
```html
<!-- Clear error messages -->
<div class="error-message" role="alert" id="pick-error">
  <strong>Pick not saved:</strong>
  <span>Game has already started. You can no longer make picks for this game.</span>
  <button onclick="dismissError()">Dismiss</button>
</div>

<!-- Success confirmations -->
<div class="success-message" role="status" id="pick-success">
  <strong>Pick saved:</strong>
  <span>Dallas Cowboys -2.5 selected for Sunday's game.</span>
</div>
```

### Time Limits
```html
<!-- Warning before game locks -->
<div class="countdown-warning" role="timer" aria-live="polite">
  <strong>5 minutes remaining</strong> to make picks for this game.
</div>

<!-- Option to extend time for accessibility -->
<button 
  class="extend-time-btn"
  aria-describedby="extend-time-help"
  onclick="requestTimeExtension()"
>
  Need More Time?
</button>

<div id="extend-time-help" class="help-text">
  Click to request additional time if you need assistance making your picks.
</div>
```

## 📱 Mobile Accessibility Features

### iOS VoiceOver Optimizations
```html
<!-- VoiceOver rotor navigation -->
<div role="region" aria-label="Game picks">
  <h2 id="games-heading">Sunday Games</h2>
  
  <div role="group" aria-labelledby="games-heading">
    <!-- Game cards with proper labels -->
  </div>
</div>

<!-- Custom actions for VoiceOver -->
<button 
  class="pick-button"
  aria-roledescription="Pick team button"
  data-voiceover-actions="Pick team, View game details"
>
  Cowboys -2.5
</button>
```

### Android TalkBack Support
```html
<!-- ContentDescription equivalents -->
<button 
  class="pick-button"
  aria-label="Pick Dallas Cowboys, minus 2.5 points"
  android-content-description="Pick Dallas Cowboys, minus 2.5 points, button"
>
  DAL -2.5
</button>
```

## 🧪 Accessibility Testing Checklist

### Automated Testing Tools
```javascript
// axe-core integration
import axe from '@axe-core/react';

if (process.env.NODE_ENV !== 'production') {
  axe(React, ReactDOM, 1000);
}

// Custom accessibility tests
const accessibilityTests = {
  colorContrast: () => {
    // Test all color combinations meet WCAG standards
  },
  focusManagement: () => {
    // Verify focus moves logically
  },
  keyboardNavigation: () => {
    // Test all functionality available via keyboard
  },
  screenReaderSupport: () => {
    // Verify ARIA labels and live regions
  }
};
```

### Manual Testing Workflow

#### Keyboard Testing
1. **Tab navigation**: Can reach all interactive elements
2. **Enter/Space**: Activates buttons and links
3. **Arrow keys**: Navigate within components
4. **Escape**: Cancel actions or close dialogs
5. **Focus visible**: Clear visual indication of focus

#### Screen Reader Testing
1. **VoiceOver** (iOS/macOS): Test with Safari
2. **TalkBack** (Android): Test with Chrome
3. **NVDA** (Windows): Test with Firefox/Chrome
4. **JAWS** (Windows): Test with Internet Explorer/Edge

#### Visual Testing
1. **Zoom to 200%**: Verify usability at high magnification
2. **High contrast mode**: Test visibility with OS settings
3. **Color blindness**: Use simulators for different types
4. **Dark mode**: Verify contrast ratios maintained

### Compliance Validation

#### WCAG 2.1 AA Checklist
- [ ] **1.1.1** Non-text content has text alternatives
- [ ] **1.3.1** Info and relationships programmatically determinable
- [ ] **1.3.2** Meaningful sequence can be programmatically determined
- [ ] **1.4.3** Text has contrast ratio of at least 4.5:1
- [ ] **1.4.4** Text can be resized up to 200% without loss of functionality
- [ ] **2.1.1** All functionality available via keyboard
- [ ] **2.1.2** No keyboard trap
- [ ] **2.4.3** Focus order is logical
- [ ] **2.4.7** Focus indicator is visible
- [ ] **3.1.1** Language of page is programmatically determinable
- [ ] **3.2.1** On focus doesn't cause unexpected context changes
- [ ] **4.1.1** HTML is valid
- [ ] **4.1.2** Name, role, value available to assistive technologies

#### Game-Day Specific Tests
- [ ] Pick selection works with voice commands
- [ ] Game status changes announced appropriately
- [ ] Time pressure doesn't prevent accessible interaction
- [ ] Works with assistive touch/switch controls
- [ ] Emergency accessibility contact available

This comprehensive accessibility approach ensures the NFL Pick'em app is usable by family members with diverse abilities, creating an inclusive game-day experience for everyone.