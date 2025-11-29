
 ⛅️ wrangler 4.34.0 (update available 4.51.0)
─────────────────────────────────────────────
🌀 Executing on remote database nfl-pickem-db (5a216c7b-56e1-4ece-a606-1173eb0558b8):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.591ms
[
  {
    "results": [
      {
        "id": "test-user-1",
        "email": "test@example.com",
        "name": "Test User",
        "username": "testuser",
        "image": null,
        "password": "$2b$10$wCNA19yODHDJRzxG0GcmyOgi8oClKBOgC2drQmfY6ySi.zDOqwkW.",
        "passwordHash": null,
        "passwordSalt": null,
        "microsoftId": null,
        "role": "user",
        "isAdmin": 0,
        "emailVerified": null,
        "createdAt": "2025-10-29 13:50:32",
        "updatedAt": "2025-10-29 13:50:32"
      },
      {
        "id": "dad-user-id",
        "email": "Dad@example.com",
        "name": "Dad",
        "username": "dad",
        "image": null,
        "password": "password123",
        "passwordHash": null,
        "passwordSalt": null,
        "microsoftId": null,
        "role": "user",
        "isAdmin": 0,
        "emailVerified": null,
        "createdAt": "2025-10-29 13:54:31",
        "updatedAt": "2025-10-29 13:54:31"
      },
      {
        "id": "mom-user-id",
        "email": "Mom@example.com",
        "name": "Mom",
        "username": "mom",
        "image": null,
        "password": "password123",
        "passwordHash": null,
        "passwordSalt": null,
        "microsoftId": null,
        "role": "user",
        "isAdmin": 0,
        "emailVerified": null,
        "createdAt": "2025-10-29 13:54:31",
        "updatedAt": "2025-10-29 13:54:31"
      },
      {
        "id": "rocky-user-id",
        "email": "RockyDaRock@example.com",
        "name": "RockyDaRock",
        "username": "rockydarock",
        "image": null,
        "password": "password123",
        "passwordHash": null,
        "passwordSalt": null,
        "microsoftId": null,
        "role": "user",
        "isAdmin": 0,
        "emailVerified": null,
        "createdAt": "2025-10-29 13:54:31",
        "updatedAt": "2025-10-29 13:54:31"
      },
      {
        "id": "nick-user-id",
        "email": "Nick@example.com",
        "name": "Nick",
        "username": "nick",
        "image": null,
        "password": "password123",
        "passwordHash": null,
        "passwordSalt": null,
        "microsoftId": null,
        "role": "user",
        "isAdmin": 0,
        "emailVerified": null,
        "createdAt": "2025-10-29 13:54:31",
        "updatedAt": "2025-10-29 13:54:31"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.591
      },
      "duration": 0.591,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 466944,
      "rows_read": 5,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
