# API Response Contracts

This document defines the standardized API response formats for the NFL Pick'em application. These contracts ensure type safety and consistent data exchange between frontend and backend systems.

## Overview

All API endpoints now return responses in a standardized format with proper TypeScript contracts. This resolves previous issues where endpoints returned inconsistent formats.

## Standard Response Format

### Success Response
```typescript
interface ApiSuccessResponse<T> {
  success: true
  data: T
  // Legacy fields for backward compatibility
  [key: string]: any
}
```

### Error Response
```typescript
interface ApiErrorResponse {
  success: false
  error: string
  details?: string
}
```

## Games API (`/api/games`)

### GET `/api/games`

Fetch games with team information.

**Query Parameters:**
- `week` (optional): NFL week number (1-18)
- `season` (optional): NFL season year
- `limit` (optional): Maximum number of results (default: 50, max: 100)

**Response Format:**
```typescript
interface GamesApiResponse {
  success: true
  games: GameWithTeamsForAPI[]
  week: number
  season: number
  count: number
  data: {
    games: GameWithTeamsForAPI[]
    week: number
    season: number
    count: number
  }
}
```

**Game Object Structure:**
```typescript
interface GameWithTeamsForAPI {
  id: string
  espnId: string | null
  week: number
  season: number
  homeTeamId: string
  awayTeamId: string
  gameDate: string // ISO string
  isCompleted: boolean
  homeScore: number | null
  awayScore: number | null
  winnerTeamId: string | null
  homeSpread: number | null
  awaySpread: number | null
  homeMoneyline: number | null
  awayMoneyline: number | null
  overUnder: number | null
  oddsProvider: string | null
  oddsUpdatedAt: string | null
  
  homeTeam: {
    id: string
    name: string
    abbreviation: string
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "games": [
    {
      "id": "nfl-2025-week1-kc-buf",
      "espnId": "401547417",
      "week": 1,
      "season": 2025,
      "homeTeamId": "buf",
      "awayTeamId": "kc",
      "gameDate": "2025-09-08T17:00:00.000Z",
      "isCompleted": false,
      "homeScore": null,
      "awayScore": null,
      "winnerTeamId": null,
      "homeSpread": -2.5,
      "awaySpread": 2.5,
      "homeMoneyline": -130,
      "awayMoneyline": 110,
      "overUnder": 54.5,
      "oddsProvider": "the-odds-api",
      "oddsUpdatedAt": "2025-09-05T12:00:00.000Z",
      "homeTeam": {
        "id": "buf",
        "name": "Buffalo Bills",
        "abbreviation": "BUF"
      },
      "awayTeam": {
        "id": "kc",
        "name": "Kansas City Chiefs",
        "abbreviation": "KC"
      }
    }
  ],
  "week": 1,
  "season": 2025,
  "count": 1,
  "data": {
    "games": [...],
    "week": 1,
    "season": 2025,
    "count": 1
  }
}
```

### POST `/api/games`

Sync games from external API (admin functionality).

**Response Format:**
```typescript
interface SyncGamesResponse {
  success: true
  message: string
  gamesInserted: number
  totalGames: number
  errors: string[]
  data: {
    gamesInserted: number
    totalGames: number
    errors: string[]
  }
}
```

## Teams API (`/api/teams`)

### GET `/api/teams`

Fetch all NFL teams.

**Response Format:**
```typescript
interface TeamsApiResponse {
  success: true
  teams: Team[]
  count: number
  data: {
    teams: Team[]
    count: number
  }
}
```

**Team Object Structure:**
```typescript
interface Team {
  id: string
  name: string
  abbreviation: string
}
```

## Picks API (`/api/picks`)

### GET `/api/picks`

Fetch user's picks for a specific week/season.

**Query Parameters:**
- `week` (optional): NFL week number
- `season` (optional): NFL season year

**Response Format:**
```typescript
interface PicksApiResponse {
  success: true
  picks: PickWithGame[]
  week: number
  season: number
  count: number
  data: {
    picks: PickWithGame[]
    week: number
    season: number
    count: number
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```typescript
interface ApiErrorResponse {
  success: false
  error: string
  details?: string
}
```

**Common Error Scenarios:**

1. **Database Unavailable** (500)
```json
{
  "success": false,
  "error": "Database not available"
}
```

2. **Invalid Parameters** (400)
```json
{
  "success": false,
  "error": "Invalid week parameter. Must be between 1 and 18.",
  "details": "Received week: 25"
}
```

3. **Network Timeout** (500)
```json
{
  "success": false,
  "error": "Request timeout",
  "details": "Request took longer than 10000ms"
}
```

## Migration from Legacy Format

### Before (Legacy)
```typescript
// Frontend expected this but backend returned different formats
interface LegacyResponse {
  success: boolean
  games: Game[]
}

// But backend sometimes returned just:
Game[]
```

### After (Standardized)
```typescript
// All endpoints now return consistent format
interface StandardResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string
  // Plus legacy fields for backward compatibility
}
```

## TypeScript Integration

### Using the API Client

```typescript
import { apiClient } from '@/lib/api-client'
import { isApiSuccess } from '@/types'

// Fetch games with type safety
const response = await apiClient.getGames(1, 2025)

if (isApiSuccess(response)) {
  // TypeScript knows this is GamesApiResponse
  console.log(`Found ${response.count} games`)
  response.games.forEach(game => {
    // Full type safety on game object
    console.log(`${game.awayTeam.name} @ ${game.homeTeam.name}`)
  })
} else {
  // TypeScript knows this is ApiErrorResponse  
  console.error('API Error:', response.error)
  if (response.details) {
    console.error('Details:', response.details)
  }
}
```

### Type Guards

Use the provided type guards for runtime type checking:

```typescript
import { isApiSuccess, isApiError } from '@/types'

const response = await fetch('/api/games')
const data = await response.json()

if (isApiSuccess(data)) {
  // data is ApiSuccessResponse<T>
  handleSuccessData(data.data)
} else if (isApiError(data)) {
  // data is ApiErrorResponse
  handleError(data.error, data.details)
}
```

## CORS Configuration

All endpoints include proper CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

## Caching

Games endpoint includes cache headers:

```
Cache-Control: public, max-age=300
```

Data is cached for 5 minutes to balance freshness with performance.

## Backward Compatibility

The new response format maintains backward compatibility by including legacy fields alongside the standardized `data` field:

```json
{
  "success": true,
  "data": {
    "games": [...],
    "week": 1,
    "season": 2025,
    "count": 16
  },
  "games": [...],
  "week": 1,
  "season": 2025,
  "count": 16
}
```

This allows existing frontend code to continue working while new code can use the standardized format.

## Testing

### Manual Testing

```bash
# Get games for current week
curl "http://localhost:3000/api/games"

# Get games for specific week
curl "http://localhost:3000/api/games?week=1&season=2025"

# Get limited results
curl "http://localhost:3000/api/games?limit=10"
```

### Response Validation

Use the TypeScript types to validate responses in tests:

```typescript
import { GamesApiResponse, isApiSuccess } from '@/types'

test('games API returns proper format', async () => {
  const response = await fetch('/api/games')
  const data: GamesApiResponse = await response.json()
  
  expect(isApiSuccess(data)).toBe(true)
  expect(data.success).toBe(true)
  expect(Array.isArray(data.games)).toBe(true)
  expect(typeof data.week).toBe('number')
  expect(typeof data.season).toBe('number')
  expect(typeof data.count).toBe('number')
})
```

## Summary

The new API contracts provide:

1. **Type Safety**: Full TypeScript support with proper interfaces
2. **Consistency**: Standardized response format across all endpoints  
3. **Error Handling**: Consistent error responses with helpful details
4. **Backward Compatibility**: Legacy fields maintained during transition
5. **Documentation**: Comprehensive JSDoc comments and type definitions
6. **Testing**: Type guards and validation helpers for testing
7. **Performance**: Proper caching and CORS configuration

This resolves the original issue where frontend expected `{success, games}` but backend returned just `games[]`, ensuring robust and maintainable API communication.