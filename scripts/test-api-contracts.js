#!/usr/bin/env node

/**
 * API Contract Testing Script
 * 
 * Tests the Games API endpoint to ensure it returns the expected format
 * Run with: node scripts/test-api-contracts.js
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

/**
 * Test helper to make HTTP requests
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  console.log(`🔍 Testing: ${url}`)
  
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    
    return {
      success: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Validate Games API response format
 */
function validateGamesResponse(response) {
  const errors = []
  const { data } = response
  
  // Check basic response structure
  if (typeof data !== 'object') {
    errors.push('Response is not an object')
    return errors
  }
  
  // Check required fields
  if (typeof data.success !== 'boolean') {
    errors.push('Missing or invalid "success" field')
  }
  
  if (data.success) {
    // Success response validation
    if (!Array.isArray(data.games)) {
      errors.push('Missing or invalid "games" array')
    }
    
    if (typeof data.week !== 'number') {
      errors.push('Missing or invalid "week" number')
    }
    
    if (typeof data.season !== 'number') {
      errors.push('Missing or invalid "season" number')
    }
    
    if (typeof data.count !== 'number') {
      errors.push('Missing or invalid "count" number')
    }
    
    // Validate data structure (new format)
    if (data.data && typeof data.data === 'object') {
      if (!Array.isArray(data.data.games)) {
        errors.push('Missing or invalid "data.games" array')
      }
      
      if (typeof data.data.week !== 'number') {
        errors.push('Missing or invalid "data.week" number')
      }
      
      if (typeof data.data.season !== 'number') {
        errors.push('Missing or invalid "data.season" number')
      }
      
      if (typeof data.data.count !== 'number') {
        errors.push('Missing or invalid "data.count" number')
      }
    }
    
    // Validate individual game objects
    if (data.games && data.games.length > 0) {
      const game = data.games[0]
      const gameErrors = validateGameObject(game)
      errors.push(...gameErrors)
    }
    
  } else {
    // Error response validation
    if (typeof data.error !== 'string') {
      errors.push('Missing or invalid "error" message')
    }
  }
  
  return errors
}

/**
 * Validate individual game object structure
 */
function validateGameObject(game) {
  const errors = []
  const requiredFields = [
    'id', 'week', 'season', 'homeTeamId', 'awayTeamId', 
    'gameDate', 'isCompleted'
  ]
  
  for (const field of requiredFields) {
    if (!(field in game)) {
      errors.push(`Game missing required field: ${field}`)
    }
  }
  
  // Validate team objects
  if (!game.homeTeam || typeof game.homeTeam !== 'object') {
    errors.push('Game missing or invalid homeTeam object')
  } else {
    const teamFields = ['id', 'name', 'abbreviation']
    for (const field of teamFields) {
      if (typeof game.homeTeam[field] !== 'string') {
        errors.push(`homeTeam missing or invalid field: ${field}`)
      }
    }
  }
  
  if (!game.awayTeam || typeof game.awayTeam !== 'object') {
    errors.push('Game missing or invalid awayTeam object')
  } else {
    const teamFields = ['id', 'name', 'abbreviation']
    for (const field of teamFields) {
      if (typeof game.awayTeam[field] !== 'string') {
        errors.push(`awayTeam missing or invalid field: ${field}`)
      }
    }
  }
  
  return errors
}

/**
 * Test CORS headers
 */
function validateCorsHeaders(headers) {
  const errors = []
  
  if (!headers['access-control-allow-origin']) {
    errors.push('Missing CORS header: Access-Control-Allow-Origin')
  }
  
  return errors
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting API Contract Tests')
  console.log('===============================')
  
  let totalTests = 0
  let passedTests = 0
  
  // Test 1: GET /api/games (default)
  totalTests++
  console.log('\\n📋 Test 1: GET /api/games (default)')
  const test1 = await makeRequest('/api/games')
  
  if (!test1.success) {
    console.log('❌ Request failed:', test1.error || `HTTP ${test1.status}`)
    if (test1.data) {
      console.log('Response:', JSON.stringify(test1.data, null, 2))
    }
  } else {
    const errors = validateGamesResponse(test1)
    const corsErrors = validateCorsHeaders(test1.headers)
    
    if (errors.length === 0 && corsErrors.length === 0) {
      console.log('✅ Test passed')
      passedTests++
    } else {
      console.log('❌ Test failed:')
      errors.forEach(error => console.log(`  - ${error}`))
      corsErrors.forEach(error => console.log(`  - ${error}`))
    }
  }
  
  // Test 2: GET /api/games?week=1&season=2025
  totalTests++
  console.log('\\n📋 Test 2: GET /api/games?week=1&season=2025')
  const test2 = await makeRequest('/api/games?week=1&season=2025')
  
  if (!test2.success) {
    console.log('❌ Request failed:', test2.error || `HTTP ${test2.status}`)
  } else {
    const errors = validateGamesResponse(test2)
    
    // Additional validation for specific week/season
    if (test2.data.success && test2.data.week !== 1) {
      errors.push(`Expected week 1, got ${test2.data.week}`)
    }
    if (test2.data.success && test2.data.season !== 2025) {
      errors.push(`Expected season 2025, got ${test2.data.season}`)
    }
    
    if (errors.length === 0) {
      console.log('✅ Test passed')
      passedTests++
    } else {
      console.log('❌ Test failed:')
      errors.forEach(error => console.log(`  - ${error}`))
    }
  }
  
  // Test 3: GET /api/games?limit=5
  totalTests++
  console.log('\\n📋 Test 3: GET /api/games?limit=5')
  const test3 = await makeRequest('/api/games?limit=5')
  
  if (!test3.success) {
    console.log('❌ Request failed:', test3.error || `HTTP ${test3.status}`)
  } else {
    const errors = validateGamesResponse(test3)
    
    // Additional validation for limit
    if (test3.data.success && test3.data.games && test3.data.games.length > 5) {
      errors.push(`Expected max 5 games, got ${test3.data.games.length}`)
    }
    
    if (errors.length === 0) {
      console.log('✅ Test passed')
      passedTests++
    } else {
      console.log('❌ Test failed:')
      errors.forEach(error => console.log(`  - ${error}`))
    }
  }
  
  // Test 4: Invalid parameters
  totalTests++
  console.log('\\n📋 Test 4: GET /api/games?week=25 (invalid)')
  const test4 = await makeRequest('/api/games?week=25')
  
  if (test4.success && test4.data.success === false) {
    console.log('✅ Test passed (correctly returned error)')
    passedTests++
  } else {
    console.log('❌ Test failed: Should have returned error for invalid week')
    if (test4.data) {
      console.log('Response:', JSON.stringify(test4.data, null, 2))
    }
  }
  
  // Test 5: OPTIONS request (CORS preflight)
  totalTests++
  console.log('\\n📋 Test 5: OPTIONS /api/games (CORS)')
  const test5 = await makeRequest('/api/games', { method: 'OPTIONS' })
  
  if (test5.success && test5.status === 204) {
    const corsErrors = validateCorsHeaders(test5.headers)
    if (corsErrors.length === 0) {
      console.log('✅ Test passed')
      passedTests++
    } else {
      console.log('❌ Test failed:')
      corsErrors.forEach(error => console.log(`  - ${error}`))
    }
  } else {
    console.log('❌ Test failed: OPTIONS request should return 204')
  }
  
  // Summary
  console.log('\\n===============================')
  console.log('📊 Test Results Summary')
  console.log('===============================')
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log('\\n🎉 All tests passed! API contracts are working correctly.')
    process.exit(0)
  } else {
    console.log('\\n⚠️  Some tests failed. Please check the API implementation.')
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}

module.exports = { runTests, validateGamesResponse, validateGameObject }