# Mobile Component Library - NFL Pick'em App

## 🎨 Design Tokens

### Color System

#### Light Mode Colors
```css
:root {
  /* Primary Colors */
  --primary-blue: #0061FF;
  --primary-blue-hover: #0051D9;
  --primary-blue-pressed: #0041B3;
  --primary-blue-disabled: #B3D4FF;
  
  /* Success & Error */
  --success-green: #16A34A;
  --success-green-light: #DCFCE7;
  --error-red: #DC2626;
  --error-red-light: #FEE2E2;
  
  /* Warning */
  --warning-orange: #EA580C;
  --warning-orange-light: #FED7AA;
  
  /* Neutral Palette */
  --neutral-0: #FFFFFF;
  --neutral-50: #FAFAFA;
  --neutral-100: #F4F4F5;
  --neutral-200: #E4E4E7;
  --neutral-300: #D4D4D8;
  --neutral-400: #A1A1AA;
  --neutral-500: #71717A;
  --neutral-600: #52525B;
  --neutral-700: #374151;
  --neutral-800: #27272A;
  --neutral-900: #111827;
  
  /* Surface Colors */
  --surface-primary: var(--neutral-0);
  --surface-secondary: var(--neutral-50);
  --surface-elevated: var(--neutral-0);
  --surface-border: var(--neutral-200);
  --surface-divider: var(--neutral-300);
}
```

#### Dark Mode Colors
```css
[data-theme="dark"] {
  /* Primary Colors */
  --primary-blue: #5598FF;
  --primary-blue-hover: #7BAEFF;
  --primary-blue-pressed: #3D7EFF;
  --primary-blue-disabled: #1E3A8A;
  
  /* Success & Error */
  --success-green: #22C55E;
  --success-green-light: #14532D;
  --error-red: #EF4444;
  --error-red-light: #7F1D1D;
  
  /* Warning */
  --warning-orange: #FB923C;
  --warning-orange-light: #9A3412;
  
  /* Neutral Palette */
  --neutral-0: #0F1116;
  --neutral-50: #181A20;
  --neutral-100: #1F2937;
  --neutral-200: #374151;
  --neutral-300: #4B5563;
  --neutral-400: #6B7280;
  --neutral-500: #9CA3AF;
  --neutral-600: #D1D5DB;
  --neutral-700: #E5E7EB;
  --neutral-800: #F3F4F6;
  --neutral-900: #F9FAFB;
  
  /* Surface Colors */
  --surface-primary: var(--neutral-0);
  --surface-secondary: var(--neutral-50);
  --surface-elevated: var(--neutral-100);
  --surface-border: var(--neutral-300);
  --surface-divider: var(--neutral-400);
}
```

### Typography System

```css
/* Font Stacks */
--font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

/* Font Sizes & Line Heights */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */

--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Typography Scale */
--type-h5: var(--text-xl)/var(--leading-tight);     /* 20px/25px */
--type-h6: var(--text-lg)/var(--leading-snug);      /* 18px/24.75px */
--type-body-lg: var(--text-base)/var(--leading-snug); /* 16px/22px */
--type-body: var(--text-sm)/var(--leading-normal);   /* 14px/21px */
--type-caption: var(--text-xs)/var(--leading-normal); /* 12px/18px */
```

### Spacing System

```css
/* Base spacing unit: 4px */
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */

/* Component-specific spacing */
--card-padding-x: var(--space-4);
--card-padding-y: var(--space-3);
--button-padding-x: var(--space-5);
--button-padding-y: var(--space-3);
--input-padding-x: var(--space-4);
--input-padding-y: var(--space-3);
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-full: 9999px;
```

### Shadows

```css
/* Light mode shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Dark mode shadows */
[data-theme="dark"] {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
}
```

### Animation Tokens

```css
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 400ms;

--ease-linear: cubic-bezier(0, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

## 🧩 Core Components

### GameCard Component

#### Base Structure
```css
.game-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  
  background: var(--surface-elevated);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  
  padding: var(--card-padding-y) var(--card-padding-x);
  min-height: 120px;
  
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-normal) var(--ease-out);
}

.game-card:hover {
  box-shadow: var(--shadow-md);
}

/* Game Card Header */
.game-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

/* Team matchup area */
.game-card__matchup {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.game-card__team {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
}

.game-card__team-logo {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.game-card__vs {
  color: var(--neutral-400);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  flex-shrink: 0;
}

/* Pick buttons area */
.game-card__actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

/* Meta information */
.game-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.game-card__time {
  font-size: var(--text-sm);
  color: var(--neutral-500);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.game-card__time::before {
  content: "🕐";
  font-size: var(--text-xs);
}

/* Locked state */
.game-card--locked {
  opacity: 0.7;
  pointer-events: none;
}

.game-card--locked .game-card__actions {
  opacity: 0.5;
}
```

#### Game Card Variants

**Compact Variant** (for high-density views):
```css
.game-card--compact {
  min-height: 80px;
  padding: var(--space-2) var(--space-3);
}

.game-card--compact .game-card__team-logo {
  width: 24px;
  height: 24px;
}

.game-card--compact .game-card__team {
  font-size: var(--text-sm);
}
```

### PickButton Component

#### Base Button Styles
```css
.pick-button {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  
  /* Sizing - CRITICAL: NOT full width */
  min-width: 160px;
  max-width: 200px;
  min-height: 44px; /* Accessibility requirement */
  padding: var(--button-padding-y) var(--button-padding-x);
  
  /* Appearance */
  background: var(--surface-primary);
  border: 2px solid var(--surface-border);
  border-radius: var(--radius-lg);
  
  /* Typography */
  font-family: var(--font-system);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
  text-decoration: none;
  white-space: nowrap;
  
  /* Interaction */
  cursor: pointer;
  user-select: none;
  transition: all var(--duration-normal) var(--ease-out);
  
  /* Focus management */
  outline: none;
  focus-visible: {
    outline: 2px solid var(--primary-blue);
    outline-offset: 2px;
  }
}
```

#### Button States

**Hover State**:
```css
.pick-button:hover:not(:disabled) {
  border-color: var(--primary-blue);
  background: var(--neutral-50);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

**Active/Pressed State**:
```css
.pick-button:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: var(--shadow-sm);
  background: var(--neutral-100);
}
```

**Selected State**:
```css
.pick-button--selected {
  background: var(--primary-blue);
  border-color: var(--primary-blue);
  color: var(--neutral-0);
  box-shadow: var(--shadow-md);
}

.pick-button--selected:hover {
  background: var(--primary-blue-hover);
  border-color: var(--primary-blue-hover);
  transform: none; /* Don't lift selected buttons */
}

.pick-button--selected:active {
  background: var(--primary-blue-pressed);
  border-color: var(--primary-blue-pressed);
}
```

**Disabled State**:
```css
.pick-button:disabled {
  background: var(--neutral-100);
  border-color: var(--neutral-200);
  color: var(--neutral-400);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}
```

**Loading State**:
```css
.pick-button--loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.pick-button--loading::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
```

#### Button Variants

**Small Button** (for secondary actions):
```css
.pick-button--small {
  min-width: 120px;
  min-height: 36px;
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
}
```

**Icon Button** (for favorites, etc.):
```css
.pick-button--icon {
  min-width: 44px;
  width: 44px;
  padding: var(--space-2);
}
```

### StatusBadge Component

#### Base Badge Styles
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  line-height: 1;
  white-space: nowrap;
}
```

#### Badge Variants

**Selected Badge**:
```css
.status-badge--selected {
  background: var(--primary-blue);
  color: var(--neutral-0);
}

.status-badge--selected::before {
  content: "✓";
  font-size: var(--text-xs);
}
```

**Locked Badge**:
```css
.status-badge--locked {
  background: var(--error-red);
  color: var(--neutral-0);
}

.status-badge--locked::before {
  content: "🔒";
  font-size: var(--text-xs);
}
```

**Live Badge**:
```css
.status-badge--live {
  background: var(--success-green);
  color: var(--neutral-0);
  animation: pulse 2s infinite;
}

.status-badge--live::before {
  content: "●";
  font-size: var(--text-xs);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

**Upcoming Badge**:
```css
.status-badge--upcoming {
  background: var(--warning-orange-light);
  color: var(--warning-orange);
}

.status-badge--upcoming::before {
  content: "⏰";
  font-size: var(--text-xs);
}
```

**Final Badge**:
```css
.status-badge--final {
  background: var(--neutral-200);
  color: var(--neutral-600);
}

.status-badge--final::before {
  content: "✓";
  font-size: var(--text-xs);
}
```

### Input Components

#### Text Input
```css
.form-input {
  display: block;
  width: 100%;
  min-height: 44px; /* Accessibility */
  
  padding: var(--input-padding-y) var(--input-padding-x);
  
  background: var(--surface-primary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  
  font-family: var(--font-system);
  font-size: var(--text-base);
  color: var(--neutral-700);
  
  transition: all var(--duration-normal) var(--ease-out);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 97, 255, 0.1);
}

.form-input:disabled {
  background: var(--neutral-100);
  color: var(--neutral-400);
  cursor: not-allowed;
}

.form-input--error {
  border-color: var(--error-red);
}

.form-input--error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}
```

### Loading Components

#### Skeleton Loader
```css
.skeleton {
  background: var(--neutral-200);
  border-radius: var(--radius-md);
  animation: skeleton-loading 1.5s ease-in-out infinite alternate;
}

@keyframes skeleton-loading {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}

.skeleton--text {
  height: 1em;
  margin: 0.25em 0;
}

.skeleton--title {
  height: 1.5em;
  margin: 0.5em 0;
}

.skeleton--button {
  height: 44px;
  width: 160px;
}

.skeleton--circle {
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
}
```

### Utility Classes

#### Responsive Display
```css
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.hidden { display: none; }

/* Responsive variants */
@media (min-width: 640px) {
  .sm\:block { display: block; }
  .sm\:hidden { display: none; }
  /* Add other variants as needed */
}
```

#### Text Utilities
```css
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
```

## 📱 Component Usage Examples

### Basic Game Card
```html
<div class="game-card">
  <div class="game-card__header">
    <div class="game-card__matchup">
      <div class="game-card__team">
        <img src="/logos/dal.svg" alt="Dallas Cowboys" class="game-card__team-logo">
        DAL 7-3
      </div>
      <span class="game-card__vs">vs</span>
      <div class="game-card__team">
        <img src="/logos/phi.svg" alt="Philadelphia Eagles" class="game-card__team-logo">
        PHI 6-4
      </div>
    </div>
  </div>
  
  <div class="game-card__actions">
    <button class="pick-button" aria-label="Pick Dallas Cowboys minus 2.5 points">
      DAL -2.5
    </button>
    <button class="pick-button" aria-label="Pick Philadelphia Eagles plus 2.5 points">
      PHI +2.5
    </button>
  </div>
  
  <div class="game-card__meta">
    <div class="game-card__time">
      Sun 1:00 PM
    </div>
    <div class="status-badge status-badge--upcoming">
      Upcoming
    </div>
  </div>
</div>
```

### Selected State Game Card
```html
<div class="game-card">
  <!-- Same header structure -->
  
  <div class="game-card__actions">
    <button class="pick-button pick-button--selected" aria-pressed="true">
      DAL -2.5
    </button>
    <button class="pick-button">
      PHI +2.5
    </button>
  </div>
  
  <div class="game-card__meta">
    <div class="game-card__time">
      Sun 1:00 PM
    </div>
    <div class="status-badge status-badge--selected">
      Selected
    </div>
  </div>
</div>
```

### Locked Game Card
```html
<div class="game-card game-card--locked">
  <!-- Same structure but disabled -->
  
  <div class="game-card__actions">
    <button class="pick-button" disabled>
      DAL -2.5
    </button>
    <button class="pick-button" disabled>
      PHI +2.5
    </button>
  </div>
  
  <div class="game-card__meta">
    <div class="game-card__time">
      In Progress
    </div>
    <div class="status-badge status-badge--locked">
      Locked
    </div>
  </div>
</div>
```

This component library provides the foundation for a professional, accessible, and game-day optimized mobile interface that solves the current full-width button problems.