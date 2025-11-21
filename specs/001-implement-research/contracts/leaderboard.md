# Leaderboard API Contracts

**Base URL**: `/api/leaderboard`
**Authentication**: None (public leaderboard)

## GET /api/leaderboard

Get rankings for a specific week or entire season.

**Query Parameters**:
- `week` (optional): Integer 1-18, omit for season-long standings
- `season` (required): Integer (e.g., 2025)

**Example**: `/api/leaderboard?week=1&season=2025` (weekly)
**Example**: `/api/leaderboard?season=2025` (season-long)

**Response** (200 OK):
```json
{
  "week": 1,
  "season": 2025,
  "entries": [
    {
      "user": {
        "id": "user-001",
        "name": "Dad",
        "email": "dad@example.com"
      },
      "position": 1,
      "points": 12,
      "weeklyPoints": 12,
      "totalSeasonPoints": 12,
      "winPercentage": 75.0
    },
    {
      "user": {
        "id": "user-002",
        "name": "Mom"
      },
      "position": 2,
      "points": 10,
      "weeklyPoints": 10,
      "totalSeasonPoints": 10,
      "winPercentage": 62.5
    }
  ],
  "totalGames": 16,
  "completedGames": 16
}
```

**Errors**:
- 400: Invalid week or season
- 500: Server error

---

## GET /api/leaderboard/live

Get real-time leaderboard with live game updates.

**Query Parameters**:
- `week` (required): Integer
- `season` (required): Integer

**Response** (200 OK):
```json
{
  "leaderboard": {
    "week": 1,
    "season": 2025,
    "entries": [...]
  },
  "timestamp": "2025-09-05T21:30:00Z"
}
```

**Note**: This endpoint polls for live score updates. Use SSE `/api/events/stream` for real-time push updates.
