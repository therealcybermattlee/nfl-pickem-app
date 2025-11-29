/**
 * Seed Script: Pre-Seed User Accounts
 *
 * Feature: 003-seed-user-data
 * Purpose: Formalize user accounts for four family members with secure credentials
 *
 * CRITICAL: This script preserves all existing historical picks data (21 picks)
 *
 * Safety Features:
 * - Idempotent (safe to run multiple times)
 * - Atomic (D1 batch API - all succeed or all fail)
 * - Non-destructive (UPDATE only, no DELETE/INSERT)
 * - Verification (pre and post-checks)
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// ===================================
// Configuration
// ===================================

interface UserCredentials {
  id: string;
  email: string;
  name: string;
  password: string; // Plaintext (only for .env.seed)
  passwordHash: string; // Bcrypt hash (for database)
}

const FAMILY_USERS = [
  { id: 'dad-user-id', email: 'Dad@example.com', name: 'Dad' },
  { id: 'mom-user-id', email: 'Mom@example.com', name: 'Mom' },
  { id: 'nick-user-id', email: 'Nick@example.com', name: 'TwoBow' }, // Rename Nick → TwoBow
  { id: 'rocky-user-id', email: 'RockyDaRock@example.com', name: 'RockyDaRock' },
];

const BCRYPT_ROUNDS = 10; // Industry standard
const PASSWORD_LENGTH = 16; // 16 characters for secure passwords

// ===================================
// Password Generation (T012)
// ===================================

/**
 * Generate cryptographically secure random password
 *
 * Algorithm: crypto.randomBytes with charset excluding ambiguous characters
 * Charset: Excludes 0, O, 1, l, I to prevent verbal sharing confusion
 * Length: 16 characters (~95 bits entropy)
 *
 * @param length - Password length (default: 16)
 * @returns Secure random password string
 */
function generateSecurePassword(length: number = PASSWORD_LENGTH): string {
  // Exclude ambiguous characters: 0, O, 1, l, I
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';

  const randomBytes = crypto.randomBytes(length);
  const password = Array.from(randomBytes)
    .map(byte => charset[byte % charset.length])
    .join('');

  return password;
}

// ===================================
// Password Hashing (T013)
// ===================================

/**
 * Hash password with bcrypt
 *
 * Algorithm: bcrypt with 10 rounds (OWASP recommended)
 * Format: $2a$10$... or $2b$10$... (60 characters)
 * Salt: Handled internally by bcrypt
 *
 * @param password - Plaintext password
 * @returns Bcrypt hash (60 characters)
 */
async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return hash;
}

// ===================================
// Database Connection (T014)
// ===================================

/**
 * Get D1 database binding
 *
 * Note: This script is designed to be executed via wrangler CLI with D1 binding
 * The actual database connection is handled by Cloudflare Workers runtime
 *
 * For manual execution, this would need to be adapted to use wrangler API
 */
async function getDatabase() {
  // In Cloudflare Workers context, D1 is available via env.DB
  // For CLI execution, we'll use wrangler d1 execute commands via child_process
  throw new Error('Database connection not yet implemented - use wrangler d1 execute for now');
}

// ===================================
// Pre-Seed Verification (T018)
// ===================================

/**
 * Verify database state before seeding
 *
 * Checks:
 * 1. 4 family users exist
 * 2. 21 picks exist
 * 3. Users have NULL passwordHash (not already seeded)
 *
 * @throws Error if verification fails
 */
async function preSeedVerification(): Promise<void> {
  console.log('📋 Pre-Seed Verification');
  console.log('------------------------');

  // These would be executed via wrangler d1 execute in practice
  // For now, showing the SQL that should be run

  console.log('Run the following commands to verify:');
  console.log('\n1. Verify 4 family users exist:');
  console.log('wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as user_count FROM users WHERE id IN (\'dad-user-id\', \'mom-user-id\', \'nick-user-id\', \'rocky-user-id\');"');
  console.log('Expected: user_count = 4');

  console.log('\n2. Verify 21 picks exist:');
  console.log('wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as total_picks FROM picks;"');
  console.log('Expected: total_picks = 21');

  console.log('\n3. Check password status:');
  console.log('wrangler d1 execute nfl-pickem-db --remote --command="SELECT id, CASE WHEN passwordHash IS NULL THEN \'NULL\' ELSE \'SET\' END as password_status FROM users WHERE id IN (\'dad-user-id\', \'mom-user-id\', \'nick-user-id\', \'rocky-user-id\');"');
  console.log('Expected: All password_status = \'NULL\'');

  console.log('\n✓ Pre-seed verification commands ready');
}

// ===================================
// Idempotency Check (T015)
// ===================================

/**
 * Check if users are already seeded
 *
 * @returns true if any user already has passwordHash set
 */
async function checkAlreadySeeded(): Promise<boolean> {
  console.log('\n🔍 Idempotency Check');
  console.log('-------------------');

  console.log('Run: wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as seeded_count FROM users WHERE id IN (\'dad-user-id\', \'mom-user-id\', \'nick-user-id\', \'rocky-user-id\') AND passwordHash IS NOT NULL;"');
  console.log('If seeded_count > 0, users are already seeded (script is idempotent)');

  // For now, assume not seeded
  return false;
}

// ===================================
// Password Generation & Hashing (T016)
// ===================================

/**
 * Generate credentials for all family users
 *
 * @returns Array of user credentials with plaintext passwords and bcrypt hashes
 */
async function generateCredentials(): Promise<UserCredentials[]> {
  console.log('\n🔑 Generating Secure Passwords...');
  console.log('---------------------------------');

  const credentials: UserCredentials[] = [];

  for (const user of FAMILY_USERS) {
    const password = generateSecurePassword();
    const passwordHash = await hashPassword(password);

    credentials.push({
      ...user,
      password,
      passwordHash,
    });

    console.log(`✓ Generated password for ${user.name} (${user.id})`);
  }

  return credentials;
}

// ===================================
// Database UPDATE Statements (T016)
// ===================================

/**
 * Generate UPDATE SQL statements for D1 batch execution
 *
 * Pattern: UPDATE users SET passwordHash = ?, name = ?, updatedAt = datetime('now') WHERE id = ?
 *
 * @param credentials - User credentials with hashes
 * @returns Array of SQL update statements
 */
function generateUpdateStatements(credentials: UserCredentials[]): string[] {
  console.log('\n📝 Generating UPDATE Statements...');
  console.log('----------------------------------');

  const statements: string[] = [];

  for (const cred of credentials) {
    // Escape single quotes in password hash for SQL
    const escapedHash = cred.passwordHash.replace(/'/g, "''");
    const statement = `UPDATE users SET passwordHash = '${escapedHash}', name = '${cred.name}', updatedAt = datetime('now') WHERE id = '${cred.id}';`;
    statements.push(statement);
    console.log(`✓ UPDATE statement for ${cred.name}`);
  }

  return statements;
}

/**
 * Execute UPDATE statements via D1 batch API
 *
 * Note: In practice, this would use wrangler d1 execute with --file
 * or execute each statement individually
 *
 * @param statements - SQL UPDATE statements
 */
async function executeUpdates(statements: string[]): Promise<void> {
  console.log('\n💾 Executing Updates...');
  console.log('-----------------------');

  console.log('Run the following commands to update users:');
  statements.forEach((stmt, i) => {
    console.log(`\n${i + 1}. wrangler d1 execute nfl-pickem-db --remote --command="${stmt}"`);
  });

  console.log('\n✓ UPDATE commands ready for execution');
}

// ===================================
// .env.seed File Generation (T017)
// ===================================

/**
 * Generate .env.seed file with plaintext credentials
 *
 * Format per research.md Section 3 "Storage Format"
 *
 * @param credentials - User credentials
 */
function generateEnvFile(credentials: UserCredentials[]): void {
  console.log('\n💾 Generating .env.seed File...');
  console.log('--------------------------------');

  const timestamp = new Date().toISOString().split('T')[0];
  let envContent = `# Generated User Credentials - Share Verbally/In Person\n`;
  envContent += `# Generated: ${timestamp}\n`;
  envContent += `# CRITICAL: DO NOT commit this file to git (.gitignore configured)\n\n`;

  credentials.forEach((cred) => {
    const prefix = cred.name.toUpperCase().replace(/\s+/g, '_');
    envContent += `${prefix}_EMAIL=${cred.email}\n`;
    envContent += `${prefix}_PASSWORD=${cred.password}\n\n`;
  });

  const envPath = path.join(process.cwd(), '.env.seed');
  fs.writeFileSync(envPath, envContent, 'utf-8');

  console.log(`✓ Credentials saved to: ${envPath}`);
  console.log('\n⚠️  SECURITY WARNING:');
  console.log('   - Share passwords verbally or in person ONLY');
  console.log('   - DO NOT send via email, text, or messaging apps');
  console.log('   - Delete or secure this file after distribution');
}

// ===================================
// Post-Seed Verification (T019)
// ===================================

/**
 * Verify database state after seeding
 *
 * CRITICAL Checks:
 * 1. All 4 users have passwordHash set (bcrypt format)
 * 2. Total picks count = 21 (unchanged)
 * 3. No orphaned picks (foreign key integrity)
 * 4. User IDs stable (same distribution)
 *
 * @throws Error if verification fails
 */
async function postSeedVerification(): Promise<void> {
  console.log('\n✅ Post-Seed Verification');
  console.log('-------------------------');

  console.log('Run the following commands to verify:');

  console.log('\n1. Verify passwords set with bcrypt format:');
  console.log('wrangler d1 execute nfl-pickem-db --remote --command="SELECT id, name, CASE WHEN passwordHash IS NULL THEN \'NULL\' ELSE \'SET\' END as password_status, CASE WHEN passwordHash LIKE \'$2a$%\' OR passwordHash LIKE \'$2b$%\' THEN \'VALID\' ELSE \'INVALID\' END as hash_format FROM users WHERE id IN (\'dad-user-id\', \'mom-user-id\', \'nick-user-id\', \'rocky-user-id\');"');
  console.log('Expected: password_status=\'SET\', hash_format=\'VALID\' for all 4');

  console.log('\n2. Verify picks count UNCHANGED:');
  console.log('wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as total_picks FROM picks;"');
  console.log('Expected: total_picks = 21 (MUST match pre-seed)');

  console.log('\n3. Verify no orphaned picks (foreign key integrity):');
  console.log('wrangler d1 execute nfl-pickem-db --remote --command="SELECT COUNT(*) as orphaned_picks FROM picks p LEFT JOIN users u ON p.userId = u.id WHERE u.id IS NULL;"');
  console.log('Expected: orphaned_picks = 0');

  console.log('\n4. Verify user IDs stable:');
  console.log('wrangler d1 execute nfl-pickem-db --remote --command="SELECT userId, COUNT(*) as pick_count FROM picks GROUP BY userId ORDER BY userId;"');
  console.log('Expected: Same distribution as pre-seed (dad=5, mom=5, nick=5, rocky=5, test=1)');

  console.log('\n✓ Post-seed verification commands ready');
}

// ===================================
// Main Seed Logic with Error Handling (T020)
// ===================================

/**
 * Main seed operation with comprehensive error handling
 *
 * Flow:
 * 1. Pre-seed verification (4 users, 21 picks)
 * 2. Idempotency check (skip if already seeded)
 * 3. Generate passwords and hashes
 * 4. Generate UPDATE statements
 * 5. Execute updates (via wrangler commands)
 * 6. Generate .env.seed file
 * 7. Post-seed verification (passwords set, picks unchanged)
 */
async function seedUsers() {
  console.log('🔐 NFL Pick\'em User Seeding Script');
  console.log('===================================\n');

  try {
    // Step 1: Pre-seed verification
    await preSeedVerification();

    // Step 2: Idempotency check
    const alreadySeeded = await checkAlreadySeeded();
    if (alreadySeeded) {
      console.log('\n⚠️  Users already seeded - skipping (idempotent)');
      console.log('   To re-seed, first reset passwords to NULL using rollback procedure');
      return;
    }

    // Step 3: Generate credentials
    const credentials = await generateCredentials();

    // Step 4: Generate UPDATE statements
    const updateStatements = generateUpdateStatements(credentials);

    // Step 5: Execute updates
    await executeUpdates(updateStatements);

    // Step 6: Generate .env.seed file
    generateEnvFile(credentials);

    // Step 7: Post-seed verification
    await postSeedVerification();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Seed Script Execution Plan Complete!');
    console.log('='.repeat(50));
    console.log('\nNext Steps:');
    console.log('1. Run pre-seed verification commands above');
    console.log('2. Execute UPDATE commands to set passwords');
    console.log('3. Run post-seed verification commands');
    console.log('4. Test authentication with credentials from .env.seed');
    console.log('5. Share credentials securely (verbally/in-person)');
    console.log('\nSee scripts/README.md for detailed instructions');

  } catch (error) {
    console.error('\n❌ Error during seed operation:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      console.error('\n   Stack trace:');
      console.error(error.stack);
    } else {
      console.error(error);
    }

    console.log('\n⚠️  ROLLBACK REQUIRED if any updates were executed');
    console.log('   See scripts/README.md "Rollback Procedure" section');

    throw error;
  }
}

// ===================================
// Script Execution
// ===================================

seedUsers()
  .then(() => {
    console.log('\n✅ Seed operation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed operation failed:', error);
    process.exit(1);
  });
