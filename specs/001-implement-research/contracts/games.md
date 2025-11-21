# Games API Contracts

**Base URL**: `/api/games`
**Authentication**: Optional for list, required for status updates

## GET /api/games

List games for a specific week and season.

**Query Parameters**:
- `week` (required): Integer 1-18
- `season` (required): Integer (e.g., 2025)

**Example**: `/api/games?week=1&season=2025`

**Response** (200 OK):
```json
[
  {
    "id": "game-001",
    "week": 1,
    "season": 2025,
    "homeTeam": {
      "id": "team-phi-uuid",
      "name": "Philadelphia Eagles",
      "abbreviation": "PHI"
    },
    "awayTeam": {
      "id": "team-dal-uuid",
      "name": "Dallas Cowboys",
      "abbreviation": "DAL"
    },
    "gameDate": "2025-09-05T20:00:00Z",
    "lockTime": "2025-09-05T20:00:00Z",
    "status": "final",
    "homeScore": 24,
    "awayScore": 20,
    "spread": -1.5,
    "overUnder": 47.5,
    "isCompleted": true,
    "winnerTeamId": "team-phi-uuid"
  }
]
```

**Errors**:
- 400: Invalid week or season
- 500: Server error

---

## GET /api/games/status

Get game status with time-lock information.

**Query Parameters**:
- `week` (required): Integer 1-18
- `season` (required): Integer

**Response** (200 OK):
```json
{
  "games": [
    {
      "id": "game-001",
      "isLocked": true,
      "timeUntilLock": 0,
      "isLockingSoon": false,
      ...gameFields
    }
  ],
  "count": 16,
  "timestamp": "2025-09-05T20:00:00Z"
}
```

---

## POST /api/games/update-locks

Trigger game lock updates (cron job or manual).

**Headers**:
```
X-API-Key: ESPN-SYSTEM-SYNC-2025
```

**Response** (200 OK):
```json
{
  "success": true,
  "newlyLockedGames": 3,
  "gameIds": ["game-001", "game-002", "game-003"],
  "timestamp": "2025-09-05T20:00:00Z"
}
```

**Errors**:
- 401: Missing or invalid API key
- 500: Server error

---

## GET /api/games/live-scores

Get live scores for in-progress games.

**Query Parameters**:
- `week` (optional): Integer, defaults to current week
- `season` (optional): Integer, defaults to current season

**Response** (200 OK):
```json
{
  "liveGames": [
    {
      "id": "game-002",
      "homeScore": 14,
      "awayScore": 10,
      "status": "in_progress",
      "quarter": "Q3",
      "timeRemaining": "5:23"
    }
  ],
  "lastUpdated": "2025-09-05T21:15:00Z"
}
```
