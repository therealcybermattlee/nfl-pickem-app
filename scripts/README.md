# Scripts Directory

This directory contains one-time operational scripts for the NFL Pick'em app.

---

## Available Scripts

### `seed-users.ts` - Pre-Seed User Accounts

**Purpose**: Formalize user accounts for four family members with secure credentials while preserving all existing historical picks data.

**Status**: Implementation in progress (Feature 003-seed-user-data)

**Usage**:
```bash
npm run seed:users
```

**What it does**:
1. Connects to production D1 database (`nfl-pickem-db`)
2. Verifies 4 family users exist (dad-user-id, mom-user-id, nick-user-id, rocky-user-id)
3. Verifies 21 existing picks are present (data preservation check)
4. Generates four secure 16-character passwords using crypto.randomBytes
5. Hashes passwords with bcrypt (10 rounds)
6. Updates users table with passwordHash values (idempotent - safe to re-run)
7. Optionally renames "Nick" to "TwoBow" if specified
8. Generates `.env.seed` file with plaintext credentials for distribution
9. Verifies all 21 picks remain unchanged (foreign key integrity check)

**Safety Features**:
- **Idempotent**: Safe to run multiple times (checks if passwords already set)
- **Atomic**: Uses D1 batch API (all updates succeed or all fail)
- **Non-destructive**: Only UPDATEs existing users, never DELETEs or INSERTs
- **Verification**: Pre and post-checks ensure data integrity

**Output**:
- `.env.seed` file with 4 sets of credentials (gitignored)
- Console log showing operation summary
- Exit code 0 on success, non-zero on failure

**Prerequisites**:
- Wrangler CLI authenticated (`wrangler whoami`)
- Production database access configured in wrangler.toml
- Database backups created (see Backup Procedure below)

**Credential Distribution**:
After seeding, share credentials with family members using ONLY these approved methods:
- ✅ Verbal sharing (read passwords out loud in person or via phone)
- ✅ Screen sharing (show .env.seed briefly during video call)
- ✅ Physical handoff (print file, deliver in person, user destroys after memorizing)
- ✅ Password manager (store in shared family vault like 1Password, Bitwarden)

**NEVER share credentials via**:
- ❌ Email
- ❌ Text message
- ❌ Slack/Discord
- ❌ Any written electronic communication

**Rollback**:
If seed operation needs reversal:
```bash
# Reset passwords to NULL
wrangler d1 execute nfl-pickem-db --remote \
  --command="UPDATE users SET passwordHash = NULL, updatedAt = datetime('now') WHERE id IN ('dad-user-id', 'mom-user-id', 'nick-user-id', 'rocky-user-id');"

# Revert Nick name if changed
wrangler d1 execute nfl-pickem-db --remote \
  --command="UPDATE users SET name = 'Nick', updatedAt = datetime('now') WHERE id = 'nick-user-id';"
```

---

## Database Backup Procedure

**CRITICAL**: Always backup production data before running seed script.

### Create Backups

```bash
# Create backups directory
mkdir -p backups

# Backup users table
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT * FROM users;" > backups/users_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup picks table
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT * FROM picks;" > backups/picks_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup files exist and are not empty
ls -lh backups/
```

### Restore from Backup (if needed)

```bash
# Restore users table
wrangler d1 execute nfl-pickem-db --remote \
  --file=backups/users_backup_[timestamp].sql

# Restore picks table
wrangler d1 execute nfl-pickem-db --remote \
  --file=backups/picks_backup_[timestamp].sql
```

---

## Pre-Seed Verification

Before running seed script, verify database state:

```bash
# Verify 4 family users exist
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT COUNT(*) as user_count FROM users WHERE id IN ('dad-user-id', 'mom-user-id', 'nick-user-id', 'rocky-user-id');"
# Expected: user_count = 4

# Verify 21 picks exist
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT COUNT(*) as total_picks FROM picks;"
# Expected: total_picks = 21

# Verify picks distribution
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT userId, COUNT(*) as pick_count FROM picks GROUP BY userId ORDER BY userId;"
# Expected: dad=5, mom=5, nick=5, rocky=5, test=1

# Check password state (should be NULL before seeding)
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT id, email, name, CASE WHEN passwordHash IS NULL THEN 'NULL' ELSE 'SET' END as password_status FROM users WHERE id IN ('dad-user-id', 'mom-user-id', 'nick-user-id', 'rocky-user-id');"
# Expected: All four users should have password_status = 'NULL'
```

---

## Post-Seed Verification

After running seed script, verify operation success:

```bash
# Verify passwords set
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT id, email, name, CASE WHEN passwordHash IS NULL THEN 'NULL' ELSE 'SET' END as password_status, CASE WHEN passwordHash LIKE '\$2a\$%' OR passwordHash LIKE '\$2b\$%' THEN 'VALID' ELSE 'INVALID' END as hash_format FROM users WHERE id IN ('dad-user-id', 'mom-user-id', 'nick-user-id', 'rocky-user-id');"
# Expected: password_status='SET', hash_format='VALID' for all four

# Verify picks unchanged (CRITICAL)
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT COUNT(*) as total_picks FROM picks;"
# Expected: total_picks = 21 (MUST match pre-seed count)

# Verify foreign key integrity
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT COUNT(*) as orphaned_picks FROM picks p LEFT JOIN users u ON p.userId = u.id WHERE u.id IS NULL;"
# Expected: orphaned_picks = 0

# Verify user IDs stable
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT userId, COUNT(*) as pick_count FROM picks GROUP BY userId ORDER BY userId;"
# Expected: Same distribution as pre-seed (dad=5, mom=5, nick=5, rocky=5, test=1)
```

---

## Testing Authentication

Test seeded credentials:

```bash
# Test Dad's credentials via API
curl -X POST https://nfl-pickem-app-production.m-de6.workers.dev/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"Dad@example.com","password":"[from .env.seed]"}'
# Expected: 200 OK with JWT token

# Test via production frontend
# Navigate to: https://pickem.cyberlees.dev/signin
# Enter credentials from .env.seed
# Expected: Redirect to games page with authentication successful
```

---

## E2E Test Validation

Run comprehensive E2E tests:

```bash
# Run seed verification test suite
npm run test:e2e:seed-verification

# Tests verify:
# - All 4 family members can authenticate
# - Historical picks visible (5+5+5+5 = 20 family picks)
# - Leaderboard points unchanged
# - Family pick initials display correctly (D, M, T, R)
```

---

## Troubleshooting

### Issue: "Users already seeded"

**Symptom**: Seed script reports users already have passwords set.

**Solution**: This is expected (idempotent design). To regenerate passwords:
1. Use rollback procedure to reset passwords to NULL
2. Re-run seed script to generate new credentials

### Issue: Pick count mismatch

**Symptom**: Post-seed verification shows picks count ≠ 21.

**CRITICAL**: Immediately rollback using backup:
```bash
wrangler d1 execute nfl-pickem-db --remote \
  --file=backups/picks_backup_[timestamp].sql
```

This should NEVER happen with proper seed script implementation.

### Issue: Authentication 401 errors

**Symptom**: Login with seeded credentials returns 401 Unauthorized.

**Debug**:
```bash
# Verify user exists and password is set
wrangler d1 execute nfl-pickem-db --remote \
  --command="SELECT id, email, name, LENGTH(passwordHash) as hash_length FROM users WHERE email = 'Dad@example.com';"
# Expected: hash_length = 60 (bcrypt standard)
```

**Possible Causes**:
1. Password hash format incorrect
2. Email address mismatch
3. JWT secret misconfiguration in Workers

---

## Related Documentation

- **Feature Specification**: `/specs/003-seed-user-data/spec.md`
- **Implementation Plan**: `/specs/003-seed-user-data/plan.md`
- **Technical Research**: `/specs/003-seed-user-data/research.md`
- **Data Model**: `/specs/003-seed-user-data/data-model.md`
- **Quickstart Guide**: `/specs/003-seed-user-data/quickstart.md`
- **API Contracts**: `/specs/003-seed-user-data/contracts/README.md`
- **Task List**: `/specs/003-seed-user-data/tasks.md`

---

## Security Notes

**Password Generation**:
- Algorithm: crypto.randomBytes(16) with charset excluding ambiguous characters
- Length: 16 characters
- Entropy: ~95 bits (secure against brute force)

**Password Hashing**:
- Algorithm: bcrypt with 10 rounds (OWASP recommended)
- Format: `$2a$10$...` or `$2b$10$...` (60 characters)
- Salt: Handled internally by bcrypt (no separate salt field)

**Credential Storage**:
- `.env.seed`: Plaintext credentials (gitignored, temporary)
- Database: Only bcrypt hashes stored (never plaintext)
- Distribution: Verbal/in-person only (per security requirements)

**SQL Injection Prevention**:
- All queries use prepared statements with parameter binding
- No raw string concatenation in SQL
- D1 prepared statement API enforced

---

**Last Updated**: 2025-11-25 (Feature 003 implementation)
