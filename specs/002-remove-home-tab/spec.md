# Feature Specification: Remove Home Tab

**Feature Branch**: `002-remove-home-tab`
**Created**: 2025-11-22
**Status**: Draft
**Input**: User description: "Remove the Home tab from the NFL Pick'em app and merge family picks functionality into the Games page to simplify navigation from 3 tabs to 2 tabs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate with Simplified Two-Tab Layout (Priority: P1)

As a user, I want to see only two navigation tabs (Games and Leaderboard) so that I can navigate the app more efficiently without redundant options.

**Why this priority**: This is the core deliverable - simplifying navigation from 3 tabs to 2 tabs. Without this, the feature is not complete.

**Independent Test**: Can be fully tested by logging in and verifying only Games and Leaderboard tabs appear in navigation, and that tapping Games shows the picking interface.

**Acceptance Scenarios**:

1. **Given** I am logged into the app, **When** I view the navigation bar, **Then** I see only two tabs: Games and Leaderboard
2. **Given** I am logged into the app, **When** I tap the Games tab, **Then** I am taken to the game picking interface
3. **Given** I am logged into the app, **When** I tap the Leaderboard tab, **Then** I am taken to the standings page
4. **Given** I am on mobile, **When** I view the bottom navigation, **Then** I see only two icons: Games and Leaderboard

---

### User Story 2 - View Family Picks on Games Page (Priority: P2)

As a user, I want to see my family members' picks while viewing games so that I can compare picks without switching pages.

**Why this priority**: This preserves the key functionality from the removed Home tab. Users previously valued seeing family picks at a glance.

**Independent Test**: Can be fully tested by viewing the Games page and verifying family member picks are visible for each game.

**Acceptance Scenarios**:

1. **Given** I am on the Games page, **When** a game has picks from family members, **Then** I can see which team each family member picked
2. **Given** I am on the Games page on mobile, **When** I view a game card, **Then** family picks are displayed in a compact format that doesn't clutter the interface
3. **Given** I am on the Games page, **When** I view a locked game, **Then** I can see all family members' picks for that game
4. **Given** I am on the Games page, **When** I view an unlocked game, **Then** I can only see picks from family members who have already submitted (no spoilers for pending picks)

---

### User Story 3 - Default Landing Page Updated (Priority: P3)

As a user, when I log in or open the app, I want to land directly on the Games page so that I can immediately start making picks.

**Why this priority**: This is a consequence of removing Home - the default authenticated landing page must change.

**Independent Test**: Can be fully tested by logging in and verifying the Games page loads as the default view.

**Acceptance Scenarios**:

1. **Given** I am not logged in, **When** I successfully log in, **Then** I am redirected to the Games page
2. **Given** I am logged in and close the app, **When** I reopen the app, **Then** I see the Games page
3. **Given** I navigate to the root URL (`/`), **When** I am authenticated, **Then** I am shown the Games page content

---

### Edge Cases

- What happens when a user has a bookmark to the old Home page URL (`/`)? The URL should redirect to or serve the Games page content.
- How does the system handle deep links to the removed Home page? They should gracefully redirect to Games.
- What happens to any Home-specific features like "quick stats display"? These should either be integrated into Games or removed if redundant.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display only two navigation tabs: Games and Leaderboard
- **FR-002**: System MUST remove the Home tab from both desktop and mobile navigation
- **FR-003**: System MUST display family member picks on the Games page for each game
- **FR-004**: System MUST show family picks in a compact, non-intrusive format on mobile
- **FR-005**: System MUST set the Games page as the default landing page for authenticated users
- **FR-006**: System MUST maintain the root URL (`/`) as functional, serving Games page content
- **FR-007**: System MUST hide unpicked games' family picks until the game is locked (prevent pick spoilers)
- **FR-008**: System MUST preserve the week selector functionality on the Games page
- **FR-009**: System MUST preserve game lock status and countdown timer functionality

### Key Entities

- **Navigation**: The tab bar component that now contains only Games and Leaderboard
- **Game Card**: Enhanced to display family member picks alongside game information
- **Family Pick**: A visual indicator showing which team a family member selected for a game

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Navigation contains exactly 2 tabs on both mobile and desktop views
- **SC-002**: Users can view family picks on 100% of games where picks exist
- **SC-003**: App loads directly to Games page within 2 seconds of authentication
- **SC-004**: Mobile game cards display family picks without requiring horizontal scrolling
- **SC-005**: All existing pick submission functionality remains operational with no regressions
- **SC-006**: Page load time does not increase by more than 500ms compared to current Games page

## Assumptions

- The family picks overlay currently on the Home page is the primary unique feature worth preserving
- The "quick stats display" on Home is redundant with Leaderboard and can be removed
- Users primarily use the Games page for the core app functionality (making picks)
- The player selector from Home page is not needed as users view their own picks by default
- Week selector functionality already exists on Games page and doesn't need migration

## Out of Scope

- Redesigning the Leaderboard page
- Adding new features to the Games page beyond family picks integration
- Changing the authentication flow
- Modifying the sign-in or sign-up pages
