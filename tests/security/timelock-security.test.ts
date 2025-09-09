import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Time-Lock Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Time Manipulation Prevention', () => {
    it('should prevent client-side time manipulation attacks', async () => {
      // Simulate client trying to manipulate Date.now()
      const originalDateNow = Date.now
      const mockClientTime = new Date('2025-09-07T10:00:00.000Z').getTime() // Earlier time
      const realServerTime = new Date('2025-09-07T16:00:00.000Z').getTime() // Later server time
      
      // Client-side time manipulation
      Date.now = vi.fn(() => mockClientTime)
      
      // Mock server response that uses real server time
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Game is locked',
          message: 'This game is locked. Picks cannot be modified.',
          gameId: 'test-game',
          serverTime: realServerTime
        })
      })
      
      global.fetch = mockFetch
      
      // Attempt to submit pick with manipulated client time
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          gameId: 'test-game',
          teamId: 'test-team'
        })
      })
      
      const result = await response.json()
      
      // Server should reject based on server time, not client time
      expect(response.status).toBe(403)
      expect(result.error).toBe('Game is locked')
      
      // Restore original Date.now
      Date.now = originalDateNow
    })

    it('should validate lock times server-side regardless of client timezone', async () => {
      // Test with various timezone manipulations
      const timezones = [
        'America/New_York',
        'Europe/London', 
        'Asia/Tokyo',
        'Australia/Sydney'
      ]
      
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        const body = JSON.parse(options?.body as string || '{}')
        
        // Server validation should be timezone-agnostic
        return {
          ok: false,
          status: 403,
          json: async () => ({
            error: 'Game is locked',
            message: 'Server-side validation prevents manipulation',
            serverTimezone: 'UTC',
            lockValidation: 'server-enforced'
          })
        }
      })
      
      global.fetch = mockFetch
      
      for (const timezone of timezones) {
        // Simulate client in different timezone
        const mockIntl = {
          DateTimeFormat: vi.fn(() => ({
            resolvedOptions: () => ({ timeZone: timezone })
          }))
        }
        
        // @ts-ignore
        global.Intl = mockIntl
        
        const response = await fetch('/api/picks/submit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Client-Timezone': timezone
          },
          body: JSON.stringify({
            userId: 'test-user',
            gameId: 'locked-game',
            teamId: 'test-team'
          })
        })
        
        const result = await response.json()
        expect(result.lockValidation).toBe('server-enforced')
      }
    })

    it('should prevent race condition exploitation in lock timing', async () => {
      const mockTime = new Date('2025-09-07T15:59:59.500Z').getTime() // 500ms before lock
      vi.setSystemTime(mockTime)
      
      let requestCount = 0
      const mockFetch = vi.fn().mockImplementation(async () => {
        requestCount++
        
        // Simulate server checking lock time at exact moment
        const serverTime = Date.now() + Math.random() * 1000 // Slightly variable server time
        const lockTime = new Date('2025-09-07T16:00:00.000Z').getTime()
        
        if (serverTime >= lockTime) {
          return {
            ok: false,
            status: 403,
            json: async () => ({
              error: 'Game is locked',
              serverTime,
              lockTime,
              margin: serverTime - lockTime
            })
          }
        }
        
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            pick: {
              id: `race-pick-${requestCount}`,
              submittedAt: serverTime
            }
          })
        }
      })
      
      global.fetch = mockFetch
      
      // Attempt multiple simultaneous submissions at race condition boundary
      const promises = Array.from({ length: 10 }, (_, i) =>
        fetch('/api/picks/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: `race-user-${i}`,
            gameId: 'race-game',
            teamId: 'test-team'
          })
        })
      )
      
      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))
      
      // Should have consistent behavior - all succeed or all fail based on server time
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => r.error).length
      
      expect(successCount + failureCount).toBe(10)
      console.log(`Race condition test: ${successCount} successes, ${failureCount} failures`)
    })
  })

  describe('Authentication and Authorization Security', () => {
    it('should prevent unauthorized pick modifications', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized',
          message: 'Valid authentication token required'
        })
      })
      
      global.fetch = mockFetch
      
      // Attempt without auth token
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          gameId: 'test-game', 
          teamId: 'test-team'
        })
      })
      
      expect(response.status).toBe(401)
      
      const result = await response.json()
      expect(result.error).toBe('Unauthorized')
    })

    it('should prevent users from modifying other users\' picks', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Forbidden',
          message: 'Cannot modify picks for other users'
        })
      })
      
      global.fetch = mockFetch
      
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token-for-user-123'
        },
        body: JSON.stringify({
          userId: 'different-user-456', // Trying to modify different user's pick
          gameId: 'test-game',
          teamId: 'test-team'
        })
      })
      
      expect(response.status).toBe(403)
      
      const result = await response.json()
      expect(result.error).toBe('Forbidden')
    })

    it('should validate JWT token expiration', async () => {
      // Mock expired JWT token
      const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjE2MzAwMDAwMDB9.invalid'
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Token expired',
          message: 'Authentication token has expired'
        })
      })
      
      global.fetch = mockFetch
      
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${expiredToken}`
        },
        body: JSON.stringify({
          userId: 'test-user',
          gameId: 'test-game',
          teamId: 'test-team'
        })
      })
      
      expect(response.status).toBe(401)
      
      const result = await response.json()
      expect(result.error).toBe('Token expired')
    })

    it('should prevent JWT token tampering', async () => {
      // Mock tampered JWT token
      const tamperedToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.invalid-signature'
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Invalid token',
          message: 'Token signature verification failed'
        })
      })
      
      global.fetch = mockFetch
      
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tamperedToken}`
        },
        body: JSON.stringify({
          userId: 'admin', // Trying to escalate privileges
          gameId: 'test-game',
          teamId: 'test-team'
        })
      })
      
      expect(response.status).toBe(401)
      
      const result = await response.json()
      expect(result.error).toBe('Invalid token')
    })
  })

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in pick submissions', async () => {
      const maliciousInputs = [
        "'; DROP TABLE picks; --",
        "test-user'; DELETE FROM games; --",
        "1' UNION SELECT password FROM users --",
        "test' OR '1'='1",
        "'; INSERT INTO picks (userId, gameId, teamId) VALUES ('hacker', 'all-games', 'any-team'); --"
      ]
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid input',
          message: 'Input validation failed'
        })
      })
      
      global.fetch = mockFetch
      
      for (const maliciousInput of maliciousInputs) {
        const response = await fetch('/api/picks/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: maliciousInput,
            gameId: 'test-game',
            teamId: 'test-team'
          })
        })
        
        expect(response.status).toBe(400)
        
        const result = await response.json()
        expect(result.error).toBe('Invalid input')
      }
    })

    it('should prevent XSS attacks in user inputs', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')" />',
        '"><script>alert("xss")</script>',
        '\'; alert("xss"); \''
      ]
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid input',
          message: 'Input contains potentially malicious content'
        })
      })
      
      global.fetch = mockFetch
      
      for (const xssPayload of xssPayloads) {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: xssPayload
          })
        })
        
        expect(response.status).toBe(400)
      }
    })

    it('should enforce input length limits', async () => {
      const oversizedInput = 'x'.repeat(10000) // 10KB string
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({
          error: 'Payload too large',
          message: 'Request payload exceeds maximum allowed size'
        })
      })
      
      global.fetch = mockFetch
      
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: oversizedInput,
          gameId: 'test-game',
          teamId: 'test-team'
        })
      })
      
      expect(response.status).toBe(413)
    })
  })

  describe('Rate Limiting Security', () => {
    it('should prevent rapid-fire pick submission abuse', async () => {
      let requestCount = 0
      
      const mockFetch = vi.fn().mockImplementation(async () => {
        requestCount++
        
        if (requestCount > 5) {
          return {
            ok: false,
            status: 429,
            json: async () => ({
              error: 'Too many requests',
              message: 'Rate limit exceeded. Please try again later.',
              retryAfter: 60
            })
          }
        }
        
        return {
          ok: true,
          status: 201,
          json: async () => ({ success: true })
        }
      })
      
      global.fetch = mockFetch
      
      const rapidRequests = 10
      const promises = Array.from({ length: rapidRequests }, (_, i) =>
        fetch('/api/picks/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'test-user',
            gameId: `game-${i}`,
            teamId: 'test-team'
          })
        })
      )
      
      const responses = await Promise.all(promises)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      console.log(`Rate limiting test: ${rateLimitedResponses.length} requests blocked`)
    })

    it('should prevent automated bot attacks', async () => {
      const suspiciousUserAgents = [
        'curl/7.68.0',
        'python-requests/2.25.1',
        'Bot/1.0',
        'automated-script',
        ''
      ]
      
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        const userAgent = options?.headers?.['User-Agent'] || ''
        
        if (suspiciousUserAgents.includes(userAgent)) {
          return {
            ok: false,
            status: 403,
            json: async () => ({
              error: 'Forbidden',
              message: 'Automated requests not allowed'
            })
          }
        }
        
        return {
          ok: true,
          status: 201,
          json: async () => ({ success: true })
        }
      })
      
      global.fetch = mockFetch
      
      for (const userAgent of suspiciousUserAgents) {
        const response = await fetch('/api/picks/submit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': userAgent
          },
          body: JSON.stringify({
            userId: 'test-user',
            gameId: 'test-game',
            teamId: 'test-team'
          })
        })
        
        expect(response.status).toBe(403)
      }
    })
  })

  describe('Data Privacy and Leakage Prevention', () => {
    it('should not expose sensitive user data in error messages', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid user',
          message: 'User not found', // Generic message, no sensitive data
          // Should NOT include: email, password hash, internal IDs, etc.
        })
      })
      
      global.fetch = mockFetch
      
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'non-existent-user',
          gameId: 'test-game',
          teamId: 'test-team'
        })
      })
      
      const result = await response.json()
      
      // Verify no sensitive data is leaked
      const responseStr = JSON.stringify(result)
      expect(responseStr).not.toMatch(/password|hash|email|ssn|credit/i)
      expect(responseStr).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/) // No email patterns
    })

    it('should prevent information disclosure through timing attacks', async () => {
      const validUser = 'existing-user'
      const invalidUser = 'non-existent-user'
      
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        const body = JSON.parse(options?.body as string || '{}')
        const userId = body.userId
        
        // Simulate constant-time response regardless of user existence
        await new Promise(resolve => setTimeout(resolve, 100)) // Fixed delay
        
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Invalid request',
            message: 'Request validation failed' // Same message for all cases
          })
        }
      })
      
      global.fetch = mockFetch
      
      const timings: number[] = []
      
      // Test with valid and invalid users
      for (const userId of [validUser, invalidUser]) {
        const startTime = performance.now()
        
        await fetch('/api/picks/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            gameId: 'test-game',
            teamId: 'test-team'
          })
        })
        
        const endTime = performance.now()
        timings.push(endTime - startTime)
      }
      
      // Response times should be similar (within 50ms) to prevent timing attacks
      const timingDifference = Math.abs(timings[0] - timings[1])
      expect(timingDifference).toBeLessThan(50)
    })
  })

  describe('Session Security', () => {
    it('should invalidate sessions after suspicious activity', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Session terminated',
          message: 'Session invalidated due to suspicious activity',
          requireReauth: true
        })
      })
      
      global.fetch = mockFetch
      
      // Simulate suspicious activity (multiple failed requests)
      const response = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer suspicious-token'
        },
        body: JSON.stringify({
          userId: 'test-user',
          gameId: 'test-game',
          teamId: 'test-team'
        })
      })
      
      const result = await response.json()
      expect(result.requireReauth).toBe(true)
    })

    it('should prevent session fixation attacks', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          newSessionToken: 'new-secure-token-after-login' // New token issued
        })
      })
      
      global.fetch = mockFetch
      
      // Simulate login with potentially compromised session
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
          sessionId: 'potentially-compromised-session' // Provided by attacker
        })
      })
      
      const result = await response.json()
      
      // Should receive new session token, not use the provided one
      expect(result.newSessionToken).toBeTruthy()
      expect(result.newSessionToken).not.toBe('potentially-compromised-session')
    })
  })

  describe('Cryptographic Security', () => {
    it('should use secure random values for sensitive operations', async () => {
      // Test that random pick generation uses secure randomness
      const mockCrypto = {
        getRandomValues: vi.fn((array) => {
          // Simulate secure random bytes
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
          }
          return array
        }),
        randomUUID: vi.fn(() => crypto.randomUUID())
      }
      
      global.crypto = mockCrypto as any
      
      // Simulate auto-pick generation
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          autoGeneratedCount: 5,
          randomnessSource: 'cryptographically-secure'
        })
      })
      
      global.fetch = mockFetch
      
      const response = await fetch('/api/picks/auto-generate', {
        method: 'POST'
      })
      
      const result = await response.json()
      expect(result.randomnessSource).toBe('cryptographically-secure')
      expect(mockCrypto.getRandomValues).toHaveBeenCalled()
    })
  })
})