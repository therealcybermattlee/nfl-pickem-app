# System API Contracts

**Base URL**: `/api/system`
**Authentication**: API Key required

## GET /api/system/logs

Retrieve system logs for monitoring and troubleshooting.

**Query Parameters**:
- `limit` (optional): Max logs to return (default 50)
- `type` (optional): Filter by event type
- `status` (optional): Filter by status (success/failure/warning)

**Response** (200 OK):
```json
{
  "logs": [
    {
      "id": "log-001",
      "eventType": "lock_trigger",
      "status": "success",
      "message": "Locked 16 games for week 1",
      "details": "{\"gameIds\":[...],\"executionId\":\"exec-123\"}",
      "createdAt": "2025-09-05T20:00:05Z"
    }
  ],
  "count": 50
}
```

---

## GET /api/system/metrics

Get system health metrics.

**Query Parameters**:
- `hours` (optional): Hours to look back (default 24)

**Response** (200 OK):
```json
{
  "metrics": {
    "totalCronRuns": 96,
    "successfulRuns": 95,
    "failedRuns": 1,
    "averageDuration": 3500,
    "gamesLocked": 48,
    "picksGenerated": 12,
    "scoresUpdated": 199
  },
  "timeframe": "last_24_hours",
  "cutoffTime": "2025-09-04T20:00:00Z"
}
```

---

## POST /api/system/migrate

Run database migrations.

**Headers**:
```
X-API-Key: ESPN-SYSTEM-SYNC-2025
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Migrations completed successfully",
  "results": [
    {
      "migration": "0001_initial_schema",
      "status": "success"
    }
  ]
}
```

**Errors**:
- 401: Missing or invalid API key
- 500: Migration failed

---

## POST /api/scores/update

Manually trigger score updates from ESPN API.

**Headers**:
```
X-API-Key: ESPN-SYSTEM-SYNC-2025
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Scores updated for 16 games",
  "timestamp": "2025-09-05T21:00:00Z"
}
```
