# Research: Remove Home Tab

**Feature**: 002-remove-home-tab
**Date**: 2025-11-22
**Status**: Complete

## Research Summary

This feature involves removing the Home tab and consolidating functionality into the Games page. The research focuses on three key areas: route consolidation patterns, family picks display integration, and navigation simplification.

---

## Research Topic 1: Route Consolidation Pattern

### Question
How should we handle the root URL (`/`) when removing the Home page?

### Decision
**Redirect root URL to Games page content** by serving GamesPage component at `/` route.

### Rationale
- Simplest approach with minimal routing changes
- No 301 redirects needed (avoids extra network round-trip)
- Bookmarks to `/` continue to work seamlessly
- React Router allows same component at multiple paths or path reassignment

### Alternatives Considered
1. **301 Redirect from `/` to `/games`**: Would work but adds latency and changes visible URL
2. **Keep `/` as alias, render GamesPage**: Adds unnecessary routing complexity
3. **Rename `/games` to `/`**: Would break any existing `/games` bookmarks

### Implementation
```typescript
// App.tsx - Change from:
<Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
<Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />

// To:
<Route path="/" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
<Route path="/games" element={<Navigate to="/" replace />} />
```

---

## Research Topic 2: Family Picks Display Integration

### Question
How should family picks be displayed on the Games page without cluttering the interface?

### Decision
**Add compact family picks section to each GameCard component** showing colored dots/initials for each family member's pick.

### Rationale
- Minimal UI footprint (doesn't disrupt existing game card layout)
- At-a-glance visibility of who picked which team
- Consistent with mobile-first design principles
- Reuses existing picks data already available in GamesPage

### Alternatives Considered
1. **Separate "Family Picks" collapsible panel**: Adds interaction complexity
2. **Full names with badges**: Takes too much horizontal space on mobile
3. **Hover/tap to reveal**: Not accessible, poor mobile UX
4. **Separate tab within Games page**: Contradicts goal of simplification

### Implementation
```typescript
// Add to GameCard.tsx
interface FamilyPick {
  userId: string;
  userName: string;
  userInitial: string;  // First letter (D, M, T, R)
  userColor: string;    // User's assigned color
  teamId: string;
  teamAbbr: string;
}

// Display as colored circles with initials under each team
// Only show picks for locked games (FR-007)
```

### Existing Data Available
- GamesPage already fetches all picks via `GET /api/picks`
- Picks response includes `userName` and `teamId`
- No additional API calls needed

---

## Research Topic 3: Navigation Simplification

### Question
What's the cleanest way to remove Home from navigation while maintaining UX consistency?

### Decision
**Remove Home nav item entirely** and set Games as the default/first tab.

### Rationale
- Clean removal is simpler than hiding or disabling
- Games becomes the logical "home" of the app
- Two-tab navigation is more scannable on mobile
- Reduces cognitive load for users

### Implementation Details

**Desktop Navigation (Navigation.tsx)**:
- Remove `Home` from navItems array
- Keep `Games` and `Leaderboard`
- Update active state logic if needed

**Mobile Navigation (MobileNavigation.tsx)**:
- Remove `HomeIcon` from bottom nav
- Remove `Home` from burger menu
- Update spacing for 2-icon bottom bar

**Files to Modify**:
1. `src/components/Navigation.tsx` - Remove Home link
2. `src/components/mobile/MobileNavigation.tsx` - Remove Home from bottom nav and menu
3. `src/App.tsx` - Update routing

---

## Research Topic 4: Migration of Home Page Features

### Question
Which features from HomePage need to be preserved vs. dropped?

### Decision Matrix

| HomePage Feature | Decision | Rationale |
|-----------------|----------|-----------|
| Week selector | **KEEP** (already in GamesPage) | Core functionality |
| Player selector | **KEEP** (already in GamesPage) | Core functionality |
| Games list | **MERGE** (redundant) | GamesPage has better implementation |
| Family picks overlay | **MIGRATE** | Unique value - add to GameCard |
| Quick stats | **DROP** | Redundant with Leaderboard |
| MobileWeekSelectorAdvanced | **MIGRATE** if not already in Games | Better mobile UX |
| MobilePlayerSelector | **MIGRATE** if not already in Games | Better mobile UX |
| MobileQuickStats | **DROP** | Redundant with Leaderboard |

### Implementation
1. Review GamesPage to confirm it already has week/player selectors
2. Add family picks display to GameCard component
3. Verify mobile components are available in GamesPage
4. Delete HomePage.tsx after migration complete

---

## Research Topic 5: Pick Spoiler Prevention (FR-007)

### Question
How do we prevent users from seeing other family members' picks before games lock?

### Decision
**Only display family picks for locked games** - check `isLocked` status before rendering family picks.

### Rationale
- Maintains competitive integrity
- Simple boolean check in render logic
- Consistent with existing lock behavior
- Users can already see their own pick regardless

### Implementation
```typescript
// In family picks display logic
const shouldShowFamilyPicks = (game: GameStatus) => {
  return game.isLocked || game.status === 'in_progress' || game.status === 'completed';
};

// For each family member's pick
const pickDisplay = shouldShowFamilyPicks(game) ? familyPicks : [];
```

---

## Resolved Unknowns

All technical questions have been resolved. No "NEEDS CLARIFICATION" items remain.

| Item | Resolution |
|------|------------|
| Route handling for `/` | Serve GamesPage at `/`, redirect `/games` to `/` |
| Family picks UI | Compact colored initials in GameCard |
| Navigation changes | Remove Home entirely from both desktop and mobile |
| Feature migration | Week/player selectors already exist; only migrate family picks display |
| Pick privacy | Only show family picks for locked games |

---

## Next Steps

Proceed to Phase 1: Design & Contracts
- Generate data-model.md (minimal - no schema changes)
- Document API contract for picks endpoint (already exists, no changes needed)
- Create quickstart.md for implementation guidance
