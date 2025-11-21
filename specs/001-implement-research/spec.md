# Feature Specification: NFL Pick'em Application with Time-Lock System

**Feature Branch**: `001-implement-research`
**Created**: November 20, 2025
**Status**: Draft
**Input**: User description: "Implement the project based on the RESEARCH file already created"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Submit Picks Before Game Starts (Priority: P1)

A family member visits the application to see upcoming NFL games for the current week and submits their picks for who will win each game. They can change their picks multiple times until the game starts, at which point picks automatically lock.

**Why this priority**: This is the core functionality of the application - without the ability to view games and submit picks, the application has no purpose.

**Independent Test**: Can be fully tested by creating a test user, displaying games for the current week, allowing pick submission for any unlocked game, and verifying picks are saved and displayed back to the user. Delivers immediate value by letting users participate in the weekly competition.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they navigate to the home page, **Then** they see all NFL games for the current week with team information, game times, and betting lines
2. **Given** a game has not started, **When** a user clicks on a team to make their pick, **Then** the pick is saved immediately and visual feedback confirms the selection
3. **Given** a user has already made a pick for a game, **When** they click on the opposite team before the game starts, **Then** their pick is updated to the new selection
4. **Given** a game has already started, **When** a user tries to view the game, **Then** they see their locked pick (or auto-generated pick if they didn't submit one) but cannot change it

---

### User Story 2 - View Real-Time Game Results and Scoring (Priority: P1)

A family member checks the application during or after NFL games to see live scores, whether their picks were correct, and how many points they've earned. The system automatically awards 1 point for each correct pick once a game is completed.

**Why this priority**: Immediate feedback on pick accuracy is essential for user engagement. Users need to see results to understand if they're winning the family competition.

**Independent Test**: Can be tested by marking test games as completed with final scores, calculating points for correct picks, and displaying results to users. Delivers value by showing users their performance without requiring the full leaderboard feature.

**Acceptance Scenarios**:

1. **Given** a game has finished, **When** a user views the game, **Then** they see the final score and whether their pick was correct
2. **Given** a user picked the winning team, **When** the game is marked as completed, **Then** the system automatically awards 1 point to that user
3. **Given** multiple games have completed, **When** a user views their dashboard, **Then** they see their total points for the week and season
4. **Given** a game is in progress, **When** a user checks the game status, **Then** they see the current score updating in real-time

---

### User Story 3 - View Family Competition Leaderboard (Priority: P2)

A family member views the leaderboard to see their ranking compared to other family members, including points, win percentage, and position. They can filter by specific week or view season-long standings.

**Why this priority**: The competitive aspect drives continued engagement, but the core value (making picks and seeing results) can exist without comparing to others.

**Independent Test**: Can be tested independently by displaying all users' scores sorted by total points, showing rankings and statistics. Delivers value by creating competitive motivation even if other features aren't complete.

**Acceptance Scenarios**:

1. **Given** multiple users have earned points, **When** a user navigates to the leaderboard page, **Then** they see all participants ranked by total points with position numbers
2. **Given** a user is viewing the leaderboard, **When** they select a specific week from the dropdown, **Then** the leaderboard updates to show only points from that week
3. **Given** the leaderboard is displayed, **When** scores change due to completed games, **Then** the rankings update automatically without requiring a page refresh
4. **Given** a user views the leaderboard on mobile, **When** the screen is narrow, **Then** the layout adapts to show essential information in a card format instead of a table

---

### User Story 4 - Auto-Generate Picks for Missed Deadlines (Priority: P2)

When a user hasn't submitted a pick before a game starts, the system automatically generates a random pick for them so they don't miss out on earning potential points. The user sees which picks were auto-generated.

**Why this priority**: This prevents users from being completely left out if they miss a deadline, maintaining engagement. However, the core experience works without it.

**Independent Test**: Can be tested by simulating a game lock time passing without a user pick, verifying a random pick is generated, and displaying it with an "auto-generated" indicator. Delivers value by ensuring all users have picks for every game.

**Acceptance Scenarios**:

1. **Given** a game lock time has passed, **When** a user hasn't submitted a pick for that game, **Then** the system automatically generates a random pick for them
2. **Given** a pick was auto-generated, **When** the user views their picks, **Then** they see a clear indicator showing which picks were automatic
3. **Given** an auto-generated pick is correct, **When** the game completes, **Then** the user earns the same 1 point as if they had picked manually
4. **Given** multiple games lock at different times, **When** the automated system runs, **Then** it only generates picks for games that have passed their lock time

---

### User Story 5 - Sign In and Manage Account (Priority: P2)

A family member creates an account with email and password, signs in to access the application, and can sign out when finished. Their session remains active for 24 hours before requiring re-authentication.

**Why this priority**: Authentication is necessary for personalized picks and scoring, but during initial development, a test account can be hardcoded to focus on core features first.

**Independent Test**: Can be tested by creating a new user account, signing in with credentials, verifying access to protected pages, and testing session expiration. Delivers value by ensuring each family member has their own personalized experience.

**Acceptance Scenarios**:

1. **Given** a new user visits the registration page, **When** they provide email, password, and name, **Then** an account is created and they are automatically signed in
2. **Given** a registered user visits the sign-in page, **When** they enter correct credentials, **Then** they are authenticated and redirected to the home page
3. **Given** a user enters incorrect credentials, **When** they attempt to sign in, **Then** they see a clear error message without revealing whether the email or password was wrong
4. **Given** a user has been inactive for 24 hours, **When** they try to perform any action, **Then** their session expires and they are redirected to sign in again

---

### User Story 6 - Receive Real-Time Notifications of Game Locks and Score Updates (Priority: P3)

A user receives real-time notifications when games are about to lock (within 1 hour of start time) and when scores update for games they have picks on. This keeps them engaged without constantly refreshing the page.

**Why this priority**: This is an enhancement feature that improves engagement but is not essential for core functionality. Users can manually refresh to see updates.

**Independent Test**: Can be tested by simulating game lock times approaching, verifying notifications appear in the UI, and testing score update notifications when game results change. Delivers value by proactively alerting users to take action or see results.

**Acceptance Scenarios**:

1. **Given** a game will lock in less than 1 hour, **When** the user is viewing the application, **Then** they see a prominent warning indicator for that game with a countdown timer
2. **Given** a user has made picks on games in progress, **When** scores update, **Then** they see a real-time notification showing the new score
3. **Given** a user has notifications enabled, **When** multiple games lock simultaneously, **Then** they receive a single notification listing all affected games
4. **Given** a user is on a mobile device, **When** the app is in the background, **Then** they receive push notifications for game lock warnings (assuming PWA is installed)

---

### Edge Cases

- What happens when a game is postponed or rescheduled after users have already made picks?
- How does the system handle timezone differences when displaying game times to users in different locations?
- What happens if a user submits a pick at the exact millisecond a game lock time occurs?
- How does the system recover if the automated scoring system fails to run due to external API downtime?
- What happens when two users are tied in points on the leaderboard - how are they ranked?
- How does the system handle corrupted data where a game has no valid winner but is marked as completed?
- What happens when a user tries to delete their account mid-season?
- How does the system handle extremely high concurrent load when a game is about to start and many users submit picks simultaneously?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all NFL games for the current week (week 1-18) with home team, away team, game date/time, and betting lines (spread and over/under)
- **FR-002**: System MUST allow authenticated users to submit picks by selecting which team will win each game
- **FR-003**: System MUST automatically lock picks when a game's scheduled start time is reached, preventing any further changes
- **FR-004**: System MUST automatically generate a random pick for any user who hasn't submitted a pick before the lock time
- **FR-005**: System MUST display a countdown timer for each game showing time remaining until picks lock
- **FR-006**: System MUST fetch current NFL scores and game status from external data source at least every 15 minutes
- **FR-007**: System MUST automatically award 1 point to users who correctly picked the winning team once a game is marked as completed
- **FR-008**: System MUST display a leaderboard showing all users ranked by total points, including weekly and season-long views
- **FR-009**: System MUST allow users to view their pick history and see which picks were correct, incorrect, or auto-generated
- **FR-010**: System MUST authenticate users with email and password, storing passwords securely with industry-standard hashing
- **FR-011**: System MUST maintain user sessions for 24 hours after successful authentication
- **FR-012**: System MUST synchronize NFL game data from ESPN API as the primary source, supplemented by The Odds API for betting lines
- **FR-013**: System MUST run automated background jobs every 15 minutes to update game locks, scores, and point calculations
- **FR-014**: System MUST provide mobile-responsive interfaces that work on phones, tablets, and desktop devices
- **FR-015**: System MUST display clear visual indicators for locked games, upcoming lock times, completed games, and in-progress games
- **FR-016**: System MUST allow users to change their picks unlimited times before the game lock time
- **FR-017**: System MUST calculate win percentage for each user based on correct picks divided by total picks
- **FR-018**: System MUST display game status transitions: upcoming → locked → in_progress → final
- **FR-019**: System MUST store all user picks with timestamps to track submission times
- **FR-020**: System MUST log all automated system events (score updates, lock triggers, pick generation) for auditing and troubleshooting

### Key Entities

- **User**: Represents a family member participating in the pick'em competition. Key attributes include unique identifier, email address, name, role (user/admin), password hash, and account creation date. Users have relationships to picks they've made and appear on the leaderboard.

- **Team**: Represents one of the 32 NFL teams. Key attributes include unique identifier, team name, abbreviation (e.g., "KC", "PHI"), conference (AFC/NFC), division, primary/secondary colors for UI display, and logo URL. Teams are referenced by games and picks.

- **Game**: Represents a single NFL game in the season. Key attributes include unique identifier, ESPN game ID, week number (1-18), season year, home team, away team, scheduled game date/time, lock time (when picks close), current status (upcoming/locked/in_progress/final), home score, away score, betting spread, over/under line, completion flag, and winning team. Games have relationships to teams and picks made on them.

- **Pick**: Represents a user's prediction for a game winner. Key attributes include unique identifier, user who made the pick, game being picked, team predicted to win, timestamp when pick was submitted, lock status, auto-generated flag (true if system created it), points earned (0 before game completes, 1 for correct, 0 for incorrect), and correctness indicator. Each user can have only one pick per game (enforced by unique constraint).

- **Leaderboard Entry**: Represents a user's standing in the competition. Key attributes include user information, current position/rank, total points earned, weekly points (for filtered views), win percentage, and number of correct picks. Calculated dynamically from completed games and user picks.

- **Game Lock**: Represents the locked status of a game. Key attributes include unique identifier, game being locked, timestamp when lock occurred, and reason for lock (scheduled start time reached). Used to enforce time-based pick restrictions.

- **System Log**: Represents automated system events for audit trail. Key attributes include unique identifier, event type (score_update, lock_trigger, pick_generation), status (success/failure), message, detailed information, and timestamp. Helps with troubleshooting and monitoring system health.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view current week's NFL games and submit picks within 30 seconds of opening the application
- **SC-002**: System automatically locks picks within 5 seconds of a game's scheduled start time with no manual intervention required
- **SC-003**: System awards points to correct picks within 20 minutes of a game being marked as completed
- **SC-004**: Leaderboard displays updated rankings within 1 minute of any game completion
- **SC-005**: Application loads and displays game data in under 2 seconds for users with standard internet connections
- **SC-006**: System successfully synchronizes NFL game data with 95% accuracy compared to official NFL sources
- **SC-007**: Mobile users can complete the entire pick submission flow without horizontal scrolling or layout issues on screens as small as 375px wide
- **SC-008**: System handles at least 20 concurrent users submitting picks simultaneously without errors or data loss
- **SC-009**: Auto-generated picks are created for 100% of missed deadlines within 5 minutes of game lock time
- **SC-010**: Users can change their picks up to the exact moment of game lock without any "buffer time" causing early lockouts
- **SC-011**: Countdown timers update every second showing accurate time remaining until game locks
- **SC-012**: System maintains 99% uptime during NFL game days (Thursday, Sunday, Monday)
- **SC-013**: Authentication sessions remain valid for full 24-hour period without unexpected logouts
- **SC-014**: Automated background jobs complete successfully on schedule 99% of the time without manual intervention
- **SC-015**: Application provides clear visual feedback for all user actions (pick submission, authentication, errors) within 500 milliseconds

## Assumptions

- NFL game schedules for the 2025 season are available from ESPN API with minimal changes after initial sync
- The application will be used by a small family group (4-10 users maximum) rather than thousands of concurrent users
- Users will primarily access the application on game days (Thursday evenings, Sunday afternoons/evenings, Monday evenings)
- All users are in similar timezones (or timezone handling is based on server time consistently)
- ESPN API and The Odds API remain available and maintain current data formats throughout the season
- Users have basic familiarity with NFL teams and betting line terminology (spreads, over/under)
- The application will be hosted on Cloudflare infrastructure (Pages for frontend, Workers for API, D1 for database)
- Internet connectivity is available to all users - no offline mode required beyond PWA caching
- Each user will have their own account - no account sharing or guest access
- The competition uses a simple scoring system (1 point per correct pick) without confidence points or other complex scoring rules
- Games are scored as winner/loser only - no handling of ties (pushes) in the scoring system
- All monetary aspects are handled outside the application - this is a friendly competition tracker, not a gambling platform
- The application will be maintained and monitored by a technical family member who can handle deployments and troubleshooting

## Dependencies

- ESPN Sports API for official NFL game schedules, team information, and live score updates
- The Odds API for supplementary betting line data (spreads and over/under values)
- Cloudflare Pages for hosting the frontend React application
- Cloudflare Workers for running the backend API and automated cron jobs
- Cloudflare D1 database for persistent data storage (SQLite-compatible)
- External internet connectivity for all users to access the hosted application
- NFL season schedule being publicly available and stable before season starts

## Out of Scope

This specification explicitly excludes the following functionality:

- Support for multiple simultaneous competitions or pools (only one family competition)
- Confidence points or weighted scoring systems (always 1 point per correct pick)
- Money handling, payment processing, or gambling functionality
- Live chat or messaging between users
- Detailed game statistics beyond final scores (no play-by-play data)
- Historical data beyond the current season
- Export or reporting features for tax purposes or financial tracking
- Integration with sports betting platforms or real-money wagering services
- Multi-language support (English only)
- Social media sharing or integration with external social platforms
- Custom competition rules or scoring formulas (fixed 1 point system)
- Playoff bracket predictions or Super Bowl prop bets
- Admin tools for manually adjusting scores or picks (automated only)
- Email notifications for game reminders or score updates (in-app notifications only)
- Fantasy football integration or player-level statistics
- Video highlights or game replays
- Third-party authentication (Microsoft, Google OAuth) - email/password only
