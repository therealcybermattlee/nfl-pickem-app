# Responsive Design Guidelines - NFL Pick'em Mobile App

## 📱 Mobile-First Breakpoint System

### Breakpoint Strategy
```css
/* Mobile First - Base Styles (320px+) */
/* Default styles target smallest devices */

/* Small Mobile (375px+) - iPhone 12/13/14 standard */
@media (min-width: 23.4375em) { /* 375px */ }

/* Large Mobile (414px+) - iPhone Plus/Max sizes */
@media (min-width: 25.875em) { /* 414px */ }

/* Tablet Portrait (768px+) */
@media (min-width: 48em) { /* 768px */ }

/* Tablet Landscape (1024px+) */
@media (min-width: 64em) { /* 1024px */ }

/* Desktop (1280px+) */
@media (min-width: 80em) { /* 1280px */ }
```

### Container System

#### Game List Container
```css
.games-container {
  /* Base: 320px+ */
  width: 100%;
  max-width: none;
  padding: var(--space-4);
  gap: var(--space-4);
}

@media (min-width: 23.4375em) { /* 375px+ */
  .games-container {
    padding: var(--space-4) var(--space-5);
  }
}

@media (min-width: 48em) { /* 768px+ */
  .games-container {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
}

@media (min-width: 80em) { /* 1280px+ */
  .games-container {
    max-width: 800px;
  }
}
```

## 🎴 Game Card Responsive Behavior

### Base Game Card (320px+)
```css
.game-card {
  width: 100%;
  min-height: 120px;
  padding: var(--space-3) var(--space-4);
}

.game-card__matchup {
  flex-direction: column;
  gap: var(--space-2);
  text-align: center;
}

.game-card__team {
  font-size: var(--text-sm); /* 14px */
  justify-content: center;
}

.game-card__team-logo {
  width: 28px;
  height: 28px;
}

.game-card__actions {
  flex-direction: column;
  gap: var(--space-2);
}

.pick-button {
  width: 100%;
  max-width: 280px; /* Prevent extreme stretching */
  min-width: 160px;
}
```

### Small Mobile (375px+)
```css
@media (min-width: 23.4375em) {
  .game-card__matchup {
    flex-direction: row;
    text-align: left;
  }
  
  .game-card__team {
    font-size: var(--text-base); /* 16px */
    justify-content: flex-start;
  }
  
  .game-card__team-logo {
    width: 32px;
    height: 32px;
  }
  
  .game-card__actions {
    flex-direction: row;
    gap: var(--space-3);
  }
  
  .pick-button {
    width: auto;
    min-width: 160px;
    max-width: 180px;
  }
}
```

### Large Mobile (414px+)
```css
@media (min-width: 25.875em) {
  .game-card {
    padding: var(--space-4);
  }
  
  .game-card__team {
    font-size: var(--text-lg); /* 18px */
  }
  
  .pick-button {
    min-width: 170px;
    max-width: 190px;
  }
}
```

### Tablet Portrait (768px+)
```css
@media (min-width: 48em) {
  .game-card {
    max-width: 500px;
    margin: 0 auto;
    padding: var(--space-5) var(--space-6);
  }
  
  .pick-button {
    min-width: 180px;
    max-width: 200px;
  }
  
  /* Optional: Side-by-side layout for tablets */
  .games-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
  
  .games-grid .game-card {
    max-width: none;
  }
}
```

## 🔘 Button Responsive Behavior

### Pick Button Scaling
```css
.pick-button {
  /* Base mobile */
  font-size: var(--text-sm);
  padding: 10px 16px;
  min-height: 44px;
  border-radius: var(--radius-lg);
}

@media (min-width: 23.4375em) { /* 375px+ */
  .pick-button {
    font-size: var(--text-base);
    padding: 12px 20px;
  }
}

@media (min-width: 25.875em) { /* 414px+ */
  .pick-button {
    padding: 12px 24px;
    border-radius: var(--radius-xl);
  }
}

@media (min-width: 48em) { /* 768px+ */
  .pick-button {
    font-size: var(--text-lg);
    padding: 14px 28px;
    min-height: 48px;
  }
}
```

### Critical Button Width Constraints
```css
/* NEVER allow full-width buttons */
.pick-button {
  width: auto !important;
  max-width: 200px !important;
  flex: 0 0 auto !important; /* Never grow to fill container */
}

/* Exception: Only on smallest screens in stacked layout */
@media (max-width: 23.375em) { /* < 375px */
  .pick-button {
    max-width: 280px; /* Still constrained, not full-width */
  }
}
```

## 📝 Typography Scaling

### Responsive Text Sizes
```css
.game-card__team {
  font-size: var(--text-sm); /* 14px base */
  font-weight: var(--font-semibold);
}

@media (min-width: 23.4375em) {
  .game-card__team {
    font-size: var(--text-base); /* 16px */
  }
}

@media (min-width: 25.875em) {
  .game-card__team {
    font-size: var(--text-lg); /* 18px */
  }
}

@media (min-width: 48em) {
  .game-card__team {
    font-size: var(--text-xl); /* 20px */
  }
}

/* Meta information scaling */
.game-card__time {
  font-size: var(--text-xs); /* 12px base */
}

@media (min-width: 23.4375em) {
  .game-card__time {
    font-size: var(--text-sm); /* 14px */
  }
}
```

### Dynamic Type Support (iOS/Android)
```css
/* Support system font scaling */
@media (prefers-reduced-motion: no-preference) {
  html {
    font-size: clamp(14px, 4vw, 18px);
  }
}

/* Large text accessibility */
@media (min-resolution: 2dppx) {
  .pick-button {
    min-height: 48px; /* Larger on high-DPI screens */
  }
}
```

## 🌃 Dark Mode Responsive Considerations

### Contrast Adjustments for Small Screens
```css
/* Base dark mode */
[data-theme="dark"] .game-card {
  background: var(--surface-elevated);
  border-color: var(--surface-border);
}

/* Enhanced contrast on small screens */
@media (max-width: 25.875em) {
  [data-theme="dark"] .game-card {
    background: var(--neutral-100);
    border-color: var(--neutral-300);
  }
  
  [data-theme="dark"] .pick-button {
    border-width: 2px; /* Thicker borders for small screens */
  }
}
```

### Dark Mode Shadows
```css
[data-theme="dark"] .game-card {
  box-shadow: var(--shadow-sm);
}

/* Subtle inner border for separation in dark mode */
[data-theme="dark"] .game-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: inherit;
  pointer-events: none;
}

@media (min-width: 48em) {
  [data-theme="dark"] .game-card {
    box-shadow: var(--shadow-md);
  }
}
```

## 🎯 Touch Target Optimization

### Minimum Touch Areas
```css
/* Ensure 44px minimum for all interactive elements */
.pick-button,
.status-badge,
button,
[role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Larger targets on touch devices */
@media (hover: none) and (pointer: coarse) {
  .pick-button {
    min-height: 48px;
    padding: 14px 24px;
  }
  
  /* Increase spacing between touch targets */
  .game-card__actions {
    gap: var(--space-4);
  }
}
```

### Touch-Friendly Spacing
```css
/* Base mobile spacing */
.game-card__actions {
  gap: var(--space-3); /* 12px */
}

.games-container {
  gap: var(--space-4); /* 16px */
}

@media (hover: none) and (pointer: coarse) {
  /* Increase spacing on touch devices */
  .game-card__actions {
    gap: var(--space-4); /* 16px */
  }
  
  .games-container {
    gap: var(--space-5); /* 20px */
  }
}
```

## 🔄 Layout Patterns

### Single Column Layout (Mobile First)
```css
.games-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}
```

### Grid Layout (Tablet+)
```css
@media (min-width: 48em) {
  .games-list--grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-4);
  }
}

@media (min-width: 64em) {
  .games-list--grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--space-6);
  }
}
```

### Compact List View
```css
@media (max-height: 700px) and (orientation: landscape) {
  /* Compact layout for landscape phones */
  .game-card--compact {
    min-height: 80px;
    padding: var(--space-2) var(--space-3);
  }
  
  .game-card--compact .game-card__team {
    font-size: var(--text-sm);
  }
  
  .game-card--compact .pick-button {
    min-height: 36px;
    font-size: var(--text-sm);
    padding: 8px 16px;
  }
}
```

## 🧭 Navigation Responsive Patterns

### Week Navigation
```css
.week-navigation {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding: var(--space-3) var(--space-4);
  -webkit-overflow-scrolling: touch;
}

.week-nav-button {
  flex: 0 0 auto;
  min-width: 60px;
  height: 36px;
  border-radius: var(--radius-full);
}

@media (min-width: 48em) {
  .week-navigation {
    justify-content: center;
    overflow-x: visible;
  }
  
  .week-nav-button {
    min-width: 80px;
    height: 40px;
  }
}
```

## 📊 Performance Considerations

### CSS Optimization
```css
/* Use transform for smooth animations on mobile */
.pick-button {
  transform: translateZ(0); /* Force hardware acceleration */
  will-change: transform;
}

.pick-button:hover {
  transform: translateY(-1px) translateZ(0);
}

/* Optimize scrolling performance */
.games-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .pick-button,
  .game-card,
  .status-badge {
    transition: none;
    animation: none;
  }
  
  .pick-button:hover {
    transform: none;
  }
}
```

## 🧪 Responsive Testing Checklist

### Device Testing Priority
1. **iPhone SE (320px)** - Smallest supported screen
2. **iPhone 12/13/14 (375px)** - Most common size
3. **iPhone Plus/Max (414px)** - Large mobile
4. **iPad Mini (768px)** - Tablet portrait
5. **iPad Pro (1024px)** - Tablet landscape

### Key Responsive Validations
- [ ] Buttons never exceed 200px width
- [ ] Touch targets are minimum 44px
- [ ] Text remains readable at all sizes
- [ ] Game cards don't become too cramped
- [ ] Pick actions remain thumb-reachable
- [ ] Dark mode maintains proper contrast
- [ ] Layout works in both portrait/landscape
- [ ] Scrolling performance is smooth
- [ ] Dynamic type scaling works properly
- [ ] Focus states are clearly visible

### Performance Targets
- [ ] First paint < 1.5s on 3G
- [ ] Touch response < 100ms
- [ ] Smooth 60fps scrolling
- [ ] No layout shifts during loading
- [ ] Offline functionality works

This responsive system ensures the NFL Pick'em app provides an optimal experience across all mobile devices while maintaining the critical constraint that buttons never become full-width and remain easy to use during live games.