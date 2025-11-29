#!/usr/bin/env node

/**
 * Password Hashing Utility
 *
 * Generate bcrypt password hashes for database updates
 *
 * Usage:
 *   node scripts/hash-password.js "your-password-here"
 *   npm run hash-password "your-password-here"
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12 // Match production settings

async function hashPassword(password) {
  if (!password) {
    console.error('❌ Error: Password is required')
    console.log('\nUsage:')
    console.log('  node scripts/hash-password.js "your-password-here"')
    console.log('  npm run hash-password "your-password-here"')
    process.exit(1)
  }

  try {
    console.log('🔐 Hashing password...\n')

    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    console.log('✅ Password hashed successfully!\n')
    console.log('Password Hash:')
    console.log('─'.repeat(80))
    console.log(hash)
    console.log('─'.repeat(80))
    console.log('\n📋 SQL Update Example:')
    console.log('─'.repeat(80))
    console.log(`UPDATE users SET password = '${hash}' WHERE email = 'user@example.com';`)
    console.log('─'.repeat(80))
    console.log('\n💡 Tip: Use wrangler d1 execute to update production database:')
    console.log('  wrangler d1 execute nfl-pickem-db --remote --command="UPDATE users SET password = \'${hash}\' WHERE email = \'user@example.com\';"')
    console.log('')

  } catch (error) {
    console.error('❌ Error hashing password:', error.message)
    process.exit(1)
  }
}

// Get password from command line arguments
const password = process.argv[2]

hashPassword(password)
