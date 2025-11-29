# Tasks: Remove Home Tab

**Input**: Design documents from `/specs/002-remove-home-tab/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: E2E tests included per Constitution requirement (Production-First Testing).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: `src/` at repository root (Vite + React frontend)
- **Tests**: `tests/e2e/` for Playwright E2E tests

---

## Phase 1: Setup

**Purpose**: Verify current state and prepare for changes

- [x] T001 Verify development environment works by running `npm run dev`
- [x] T002 Run existing build to confirm baseline with `npm run build`
- [x] T003 [P] Create feature branch checkpoint commit for easy rollback

---

## Phase 2: Foundational (No Blocking Prerequisites)

**Purpose**: This feature has no foundational dependencies - it's a removal/simplification refactor

**⚠️ NOTE**: No database changes, no API changes, no new infrastructure needed. All user stories can begin immediately after Setup.

**Checkpoint**: Setup verified - user story implementation can now begin

---

## Phase 3: User Story 1 - Two-Tab Navigation (Priority: P1) 🎯 MVP

**Goal**: Simplify navigation from 3 tabs (Home, Games, Leaderboard) to 2 tabs (Games, Leaderboard)

**Independent Test**: Login and verify only Games and Leaderboard tabs appear in both desktop and mobile navigation

### Implementation for User Story 1

- [x] T004 [P] [US1] Remove Home link from desktop navigation in src/components/Navigation.tsx
- [x] T005 [P] [US1] Remove Home icon from mobile bottom navigation in src/components/mobile/MobileNavigation.tsx
- [x] T006 [P] [US1] Remove Home from mobile burger menu in src/components/mobile/MobileNavigation.tsx
- [x] T007 [US1] Update mobile bottom nav layout from 3-column to 2-column in src/components/mobile/MobileNavigation.tsx
- [x] T008 [US1] Verify navigation renders correctly on desktop with only 2 tabs
- [x] T009 [US1] Verify navigation renders correctly on mobile with only 2 icons

**Checkpoint**: Navigation shows exactly 2 tabs on both desktop and mobile. User Story 1 complete and independently testable.

---

## Phase 4: User Story 2 - Family Picks on Games Page (Priority: P2)

**Goal**: Display family member picks on each game card so users can see who picked which team

**Independent Test**: View Games page, find a locked game, verify family picks are displayed as colored initials

### Implementation for User Story 2

- [x] T010 [P] [US2] Add FamilyPick TypeScript interface to src/types/api.ts
- [x] T011 [P] [US2] Add USER_COLORS and USER_INITIALS constants to src/pages/GamesPage.tsx
- [x] T012 [US2] Create FamilyPicksDisplay sub-component in src/components/GameCard.tsx
- [x] T013 [US2] Add familyPicks and showFamilyPicks props to GameCard component in src/components/GameCard.tsx
- [x] T014 [US2] Render FamilyPicksDisplay under each team in GameCard in src/components/GameCard.tsx
- [x] T015 [US2] Add allPicks state to GamesPage in src/pages/GamesPage.tsx
- [x] T016 [US2] Fetch all picks on GamesPage mount in src/pages/GamesPage.tsx
- [x] T017 [US2] Create getFamilyPicksForGame helper function in src/pages/GamesPage.tsx
- [x] T018 [US2] Implement pick privacy logic (only show picks for locked games) in src/pages/GamesPage.tsx
- [x] T019 [US2] Pass familyPicks prop to each GameCard in src/pages/GamesPage.tsx
- [x] T020 [US2] Verify family picks display on locked games
- [x] T021 [US2] Verify family picks are hidden on unlocked games (except own pick)
- [x] T022 [US2] Verify mobile display is compact and doesn't cause horizontal scroll

**Checkpoint**: Family picks visible on Games page for locked games. User Story 2 complete and independently testable.

---

## Phase 5: User Story 3 - Default Landing Page (Priority: P3)

**Goal**: Make Games page the default landing page when users log in or navigate to root URL

**Independent Test**: Log in and verify you land on Games page, then navigate to /games and verify redirect to /

### Implementation for User Story 3

- [x] T023 [US3] Remove HomePage lazy import from src/App.tsx
- [x] T024 [US3] Change root route (/) to render GamesPage in src/App.tsx
- [x] T025 [US3] Add redirect from /games to / using Navigate component in src/App.tsx
- [x] T026 [US3] Update navigation links to use / instead of /games for Games tab in src/components/Navigation.tsx
- [x] T027 [US3] Update mobile navigation links to use / instead of /games in src/components/mobile/MobileNavigation.tsx
- [x] T028 [US3] Delete src/pages/HomePage.tsx file
- [x] T029 [US3] Verify login redirects to Games page (root URL)
- [x] T030 [US3] Verify /games URL redirects to /
- [x] T031 [US3] Verify root URL (/) shows Games page content

**Checkpoint**: Default landing page is now Games. User Story 3 complete and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and E2E testing

- [x] T032 [P] Run TypeScript type check with `npx tsc --noEmit`
- [x] T033 [P] Run ESLint to check for issues with `npm run lint`
- [x] T034 Run full build to verify no errors with `npm run build`
- [x] T035 [P] Create E2E test for 2-tab navigation in tests/e2e/two-tab-navigation.spec.ts
- [x] T036 [P] Create E2E test for family picks display (included in two-tab-navigation.spec.ts)
- [x] T037 [P] Create E2E test for default landing page (included in two-tab-navigation.spec.ts)
- [x] T038 Run E2E tests on production URL per Constitution requirement
- [x] T039 Verify pick submission still works (no regression)
- [x] T040 Verify week selector still works (no regression)
- [x] T041 Verify countdown timers still work (no regression)
- [x] T042 Manual verification of all acceptance scenarios from spec.md
- [x] T043 Deploy to production after all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: No blocking tasks for this feature
- **User Stories (Phase 3+)**: Can begin immediately after Setup
  - User Story 1 and User Story 2 can run in parallel (different files)
  - User Story 3 must wait for US1 completion (navigation links depend on nav changes)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - can start immediately after Setup
- **User Story 2 (P2)**: No dependencies on US1 - can run in parallel
- **User Story 3 (P3)**: Depends on US1 (navigation changes must be complete before updating links)

### Within Each User Story

- Tasks within a story that modify the same file must run sequentially
- Tasks marked [P] that modify different files can run in parallel
- Verification tasks run after implementation tasks

### Parallel Opportunities

- T004, T005, T006 can run in parallel (different navigation files)
- T010, T011 can run in parallel (different files)
- T023-T028 must run sequentially (same files, dependent changes)
- T032, T033 can run in parallel (different checks)
- T035, T036, T037 can run in parallel (different test files)

---

## Parallel Example: User Story 1

```bash
# Launch navigation changes in parallel (different files):
Task: "T004 [P] [US1] Remove Home link from desktop navigation in src/components/Navigation.tsx"
Task: "T005 [P] [US1] Remove Home icon from mobile bottom navigation in src/components/mobile/MobileNavigation.tsx"
Task: "T006 [P] [US1] Remove Home from mobile burger menu in src/components/mobile/MobileNavigation.tsx"

# Then run layout update (same file as T005/T006, must wait):
Task: "T007 [US1] Update mobile bottom nav layout from 3-column to 2-column"
```

## Parallel Example: User Story 2

```bash
# Launch type definitions in parallel (different files):
Task: "T010 [P] [US2] Add FamilyPick TypeScript interface to src/types/api.ts"
Task: "T011 [P] [US2] Add USER_COLORS and USER_INITIALS constants to src/pages/GamesPage.tsx"

# Then implement GameCard changes (after T010 for types):
Task: "T012 [US2] Create FamilyPicksDisplay sub-component in src/components/GameCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (Two-Tab Navigation)
3. **STOP and VALIDATE**: Test navigation independently
4. Deploy/demo if ready - this is a functional 2-tab app

### Incremental Delivery

1. Add User Story 1 → Test independently → Deploy (2-tab nav working!)
2. Add User Story 2 → Test independently → Deploy (family picks visible!)
3. Add User Story 3 → Test independently → Deploy (clean URLs!)
4. Each story adds value without breaking previous stories

### Recommended Order

Since US1 and US2 can run in parallel:
1. Start US1 (navigation changes)
2. Start US2 (family picks) in parallel
3. Once US1 complete, start US3 (routing/landing page)
4. Run Polish phase after all stories complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Constitution requires E2E tests on production URL before declaring success
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This is a **subtractive refactor** - removing code is the primary work
