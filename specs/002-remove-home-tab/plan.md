# Implementation Plan: Remove Home Tab

**Branch**: `002-remove-home-tab` | **Date**: 2025-11-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-remove-home-tab/spec.md`

## Summary

Remove the Home tab from the NFL Pick'em app navigation and consolidate its family picks display functionality into the Games page. This simplifies navigation from 3 tabs to 2 tabs (Games + Leaderboard) while preserving the ability for users to see family members' picks.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode
**Primary Dependencies**: React 18, React Router, Tailwind CSS, Vite
**Storage**: Cloudflare D1 (SQLite-compatible) - no schema changes needed
**Testing**: Playwright for E2E testing (per constitution)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (Vite + React frontend, Cloudflare Workers API)
**Performance Goals**: Page load within 2 seconds, no additional API calls
**Constraints**: Must preserve all existing pick submission functionality
**Scale/Scope**: Family app (~4 users), ~200 games/season

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Production-First Testing | ✅ WILL COMPLY | E2E Playwright tests on production URL required before deployment |
| II. Specialized Agent Delegation | ✅ WILL COMPLY | Use frontend-developer for UI changes, code-reviewer after implementation |
| III. Data Preservation | ✅ N/A | No database schema changes, code-only deployment |
| IV. Type Safety & Code Quality | ✅ WILL COMPLY | TypeScript strict mode, proper error handling |
| V. Task Transparency | ✅ WILL COMPLY | Using TodoWrite for task tracking |

**Gate Status**: PASSED - No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-remove-home-tab/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no schema changes)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts if needed)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files to modify)

```text
src/
├── App.tsx                              # Modify routing (/ → GamesPage)
├── components/
│   ├── Navigation.tsx                   # Remove Home link from desktop nav
│   ├── GameCard.tsx                     # Enhance with family picks display
│   └── mobile/
│       └── MobileNavigation.tsx         # Remove Home from bottom nav
├── pages/
│   ├── HomePage.tsx                     # DELETE this file
│   └── GamesPage.tsx                    # Merge family picks display from Home
└── [no changes to other files]

tests/e2e/
└── navigation.spec.ts                   # New E2E tests for 2-tab navigation
```

**Structure Decision**: Existing web application structure maintained. Changes are subtractive (remove Home tab) with minimal additive changes (family picks on Games).

## Complexity Tracking

> No violations to justify - this is a simplification refactor.
