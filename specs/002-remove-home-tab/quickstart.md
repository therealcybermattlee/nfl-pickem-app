# Quickstart Guide: Remove Home Tab

**Feature**: 002-remove-home-tab
**Date**: 2025-11-22

## Overview

This guide provides step-by-step implementation instructions for removing the Home tab and consolidating functionality into the Games page.

## Prerequisites

- Node.js installed
- Access to the repository
- Familiarity with React, TypeScript, and Tailwind CSS

## Implementation Steps

### Step 1: Update Routing (App.tsx)

**File**: `src/App.tsx`

1. Remove the HomePage import
2. Change the `/` route to render GamesPage
3. Add redirect from `/games` to `/`

```typescript
// Before
import HomePage from './pages/HomePage';

<Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
<Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />

// After
// Remove: import HomePage from './pages/HomePage';
import { Navigate } from 'react-router-dom';

<Route path="/" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
<Route path="/games" element={<Navigate to="/" replace />} />
```

### Step 2: Update Desktop Navigation (Navigation.tsx)

**File**: `src/components/Navigation.tsx`

Remove "Home" from the navigation links array:

```typescript
// Before
const navItems = [
  { path: '/', label: 'Home' },
  { path: '/games', label: 'Games' },
  { path: '/leaderboard', label: 'Leaderboard' },
];

// After
const navItems = [
  { path: '/', label: 'Games' },
  { path: '/leaderboard', label: 'Leaderboard' },
];
```

### Step 3: Update Mobile Navigation (MobileNavigation.tsx)

**File**: `src/components/mobile/MobileNavigation.tsx`

1. Remove Home icon from `MobileBottomNavigation`
2. Remove Home from `MobileMenu` items
3. Update spacing for 2-item layout

```typescript
// In MobileBottomNavigation - remove Home nav item
// Change grid from grid-cols-3 to grid-cols-2 or use flex with space-around

// Before: 3 icons (Home, Games, Leaderboard)
// After: 2 icons (Games, Leaderboard)
```

### Step 4: Add Family Picks to GameCard (GameCard.tsx)

**File**: `src/components/GameCard.tsx`

1. Add new props for family picks
2. Create FamilyPicksDisplay sub-component
3. Render family picks under each team

```typescript
// New prop
interface GameCardProps {
  // ... existing props
  familyPicks?: FamilyPick[];
  showFamilyPicks?: boolean;
}

// New sub-component
function FamilyPicksDisplay({
  picks,
  teamId
}: {
  picks: FamilyPick[];
  teamId: string;
}) {
  const teamPicks = picks.filter(p => p.teamId === teamId);

  if (teamPicks.length === 0) return null;

  return (
    <div className="flex gap-1 mt-1">
      {teamPicks.map(pick => (
        <div
          key={pick.userId}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: pick.userColor }}
          title={pick.userName}
        >
          {pick.userInitial}
        </div>
      ))}
    </div>
  );
}
```

### Step 5: Update GamesPage State Management

**File**: `src/pages/GamesPage.tsx`

1. Add allPicks state (if not already present)
2. Create family picks grouping logic
3. Pass family picks to GameCard

```typescript
// Add state
const [allPicks, setAllPicks] = useState<Pick[]>([]);

// Fetch all picks (may already exist)
useEffect(() => {
  const fetchAllPicks = async () => {
    const response = await ApiClient.get('/api/picks');
    if (response.data?.picks) {
      setAllPicks(response.data.picks);
    }
  };
  fetchAllPicks();
}, [week]);

// Helper function
function getFamilyPicksForGame(gameId: string, isLocked: boolean): FamilyPick[] {
  return allPicks
    .filter(p => p.gameId === gameId)
    .filter(p => isLocked || p.userId === currentUserId) // Privacy logic
    .map(p => ({
      userId: p.userId,
      userName: p.userName,
      userInitial: p.userName[0],
      userColor: USER_COLORS[p.userId] || '#6B7280',
      teamId: p.teamId,
      teamAbbr: p.teamAbbr,
      isCurrentUser: p.userId === currentUserId,
    }));
}

// In render
<GameCard
  game={game}
  familyPicks={getFamilyPicksForGame(game.id, game.isLocked)}
  showFamilyPicks={true}
  // ... other props
/>
```

### Step 6: Delete HomePage.tsx

**File**: `src/pages/HomePage.tsx`

Delete this file after confirming all functionality works on the Games page.

```bash
rm src/pages/HomePage.tsx
```

### Step 7: Write E2E Tests

**File**: `tests/e2e/navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Two-Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('https://pickem.cyberlees.dev/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('https://pickem.cyberlees.dev/');
  });

  test('should show only 2 navigation tabs', async ({ page }) => {
    // Desktop nav
    const navLinks = await page.locator('nav a').count();
    expect(navLinks).toBe(2);

    // Verify labels
    await expect(page.locator('nav a:has-text("Games")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Leaderboard")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Home")')).not.toBeVisible();
  });

  test('should land on Games page after login', async ({ page }) => {
    await expect(page).toHaveURL('https://pickem.cyberlees.dev/');
    // Verify Games page content
    await expect(page.locator('text=Week')).toBeVisible();
  });

  test('should redirect /games to /', async ({ page }) => {
    await page.goto('https://pickem.cyberlees.dev/games');
    await expect(page).toHaveURL('https://pickem.cyberlees.dev/');
  });

  test('should show family picks on locked games', async ({ page }) => {
    // Find a locked game and verify family picks are visible
    // This will need adjustment based on actual game state
  });
});
```

## Verification Checklist

- [ ] Navigation shows only Games and Leaderboard tabs
- [ ] Root URL (`/`) shows Games page
- [ ] `/games` redirects to `/`
- [ ] Family picks visible on locked games
- [ ] Family picks hidden on unlocked games (except own pick)
- [ ] Pick submission still works
- [ ] Mobile navigation has 2 icons
- [ ] No console errors
- [ ] Build passes (`npm run build`)
- [ ] E2E tests pass on production

## Common Issues

### Issue: Old route cached
**Solution**: Clear browser cache or hard refresh (Ctrl+Shift+R)

### Issue: TypeScript errors after removing HomePage
**Solution**: Check for any remaining imports of HomePage in other files

### Issue: Mobile nav spacing looks off with 2 items
**Solution**: Change from `grid-cols-3` to `flex justify-around` or `grid-cols-2`

## Deployment

After implementation is complete:

1. `npm run build` - Build frontend
2. `npm run test:e2e` - Run E2E tests on production
3. Deploy if all tests pass
