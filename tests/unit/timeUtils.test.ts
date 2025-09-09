import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calcRemainingTime,
  formatDuration,
  formatCompactDuration,
  isGameLocked,
  getGameLockTime,
  getGameStatus,
  formatGameTime,
  formatGameDate,
  getTimeUntilGame,
  canSubmitPick,
  getPickSubmissionError
} from '../../src/utils/timeUtils'

describe('timeUtils', () => {
  const mockCurrentTime = new Date('2025-09-07T12:00:00.000Z').getTime()
  
  beforeEach(() => {
    vi.setSystemTime(mockCurrentTime)
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('calcRemainingTime', () => {
    it('should calculate remaining time in seconds', () => {
      const futureTime = new Date(mockCurrentTime + 60 * 1000) // 1 minute future
      expect(calcRemainingTime(futureTime)).toBe(60)
    })

    it('should return 0 for past times', () => {
      const pastTime = new Date(mockCurrentTime - 60 * 1000) // 1 minute ago
      expect(calcRemainingTime(pastTime)).toBe(0)
    })

    it('should handle string dates', () => {
      const futureTimeString = new Date(mockCurrentTime + 120 * 1000).toISOString()
      expect(calcRemainingTime(futureTimeString)).toBe(120)
    })

    it('should handle invalid date strings', () => {
      expect(calcRemainingTime('invalid-date')).toBe(0)
    })

    it('should handle edge case of exactly current time', () => {
      expect(calcRemainingTime(new Date(mockCurrentTime))).toBe(0)
    })
  })

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('00:45')
    })

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('02:05') // 2 minutes, 5 seconds
    })

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3725)).toBe('01:02:05') // 1 hour, 2 minutes, 5 seconds
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('00:00')
    })

    it('should handle large durations', () => {
      expect(formatDuration(359999)).toBe('99:59:59') // Max expected: 99:59:59
    })
  })

  describe('formatCompactDuration', () => {
    it('should format minutes only for durations under 1 hour', () => {
      expect(formatCompactDuration(125)).toBe('2m') // 2 minutes, 5 seconds -> 2m
    })

    it('should format hours and minutes for durations over 1 hour', () => {
      expect(formatCompactDuration(3725)).toBe('1h 2m') // 1 hour, 2 minutes, 5 seconds
    })

    it('should handle zero duration', () => {
      expect(formatCompactDuration(0)).toBe('0m')
    })
  })

  describe('isGameLocked', () => {
    it('should return false for future game times', () => {
      const futureGame = new Date(mockCurrentTime + 60 * 60 * 1000) // 1 hour future
      expect(isGameLocked(futureGame)).toBe(false)
    })

    it('should return true for past game times', () => {
      const pastGame = new Date(mockCurrentTime - 60 * 60 * 1000) // 1 hour past
      expect(isGameLocked(pastGame)).toBe(true)
    })

    it('should handle lock offset minutes', () => {
      const gameTime = new Date(mockCurrentTime + 30 * 60 * 1000) // 30 minutes future
      expect(isGameLocked(gameTime, 60)).toBe(true) // 60 minute offset = locked
      expect(isGameLocked(gameTime, 15)).toBe(false) // 15 minute offset = not locked
    })

    it('should handle string dates', () => {
      const futureGameString = new Date(mockCurrentTime + 60 * 60 * 1000).toISOString()
      expect(isGameLocked(futureGameString)).toBe(false)
    })

    it('should handle invalid dates gracefully', () => {
      expect(isGameLocked('invalid-date')).toBe(true) // Default to locked for safety
    })
  })

  describe('getGameLockTime', () => {
    it('should return game time for zero offset', () => {
      const gameTime = new Date(mockCurrentTime + 60 * 60 * 1000)
      const lockTime = getGameLockTime(gameTime, 0)
      expect(lockTime.getTime()).toBe(gameTime.getTime())
    })

    it('should return earlier time for positive offset', () => {
      const gameTime = new Date(mockCurrentTime + 60 * 60 * 1000) // 1 hour future
      const lockTime = getGameLockTime(gameTime, 30) // 30 minutes before game
      expect(lockTime.getTime()).toBe(gameTime.getTime() - 30 * 60 * 1000)
    })

    it('should handle string dates', () => {
      const gameTimeString = new Date(mockCurrentTime + 60 * 60 * 1000).toISOString()
      const lockTime = getGameLockTime(gameTimeString, 15)
      expect(lockTime.getTime()).toBe(new Date(gameTimeString).getTime() - 15 * 60 * 1000)
    })
  })

  describe('getGameStatus', () => {
    it('should return "final" for completed games', () => {
      const gameTime = new Date(mockCurrentTime - 60 * 60 * 1000) // 1 hour past
      expect(getGameStatus(gameTime, true)).toBe('final')
    })

    it('should return "inProgress" for ongoing games', () => {
      const gameTime = new Date(mockCurrentTime - 30 * 60 * 1000) // 30 minutes past (game started)
      expect(getGameStatus(gameTime, false)).toBe('inProgress')
    })

    it('should return "locked" for games in lock period', () => {
      const gameTime = new Date(mockCurrentTime + 30 * 60 * 1000) // 30 minutes future
      expect(getGameStatus(gameTime, false, 60)).toBe('locked') // 60 minute lock period
    })

    it('should return "upcoming" for future games outside lock period', () => {
      const gameTime = new Date(mockCurrentTime + 2 * 60 * 60 * 1000) // 2 hours future
      expect(getGameStatus(gameTime, false, 60)).toBe('upcoming') // 60 minute lock period
    })

    it('should prioritize completion status', () => {
      const futureGameTime = new Date(mockCurrentTime + 60 * 60 * 1000) // Future game
      expect(getGameStatus(futureGameTime, true)).toBe('final') // Still final if completed
    })
  })

  describe('canSubmitPick', () => {
    it('should allow pick submission for unlocked games', () => {
      const futureGame = new Date(mockCurrentTime + 2 * 60 * 60 * 1000) // 2 hours future
      expect(canSubmitPick(futureGame, 60)).toBe(true) // 1 hour lock period
    })

    it('should prevent pick submission for locked games', () => {
      const nearFutureGame = new Date(mockCurrentTime + 30 * 60 * 1000) // 30 minutes future
      expect(canSubmitPick(nearFutureGame, 60)).toBe(false) // 1 hour lock period
    })
  })

  describe('getPickSubmissionError', () => {
    it('should return null for valid submission timing', () => {
      const futureGame = new Date(mockCurrentTime + 2 * 60 * 60 * 1000) // 2 hours future
      expect(getPickSubmissionError(futureGame, 60)).toBeNull()
    })

    it('should return error message for locked games', () => {
      const nearFutureGame = new Date(mockCurrentTime + 30 * 60 * 1000) // 30 minutes future
      const error = getPickSubmissionError(nearFutureGame, 60)
      expect(error).toBe('This game is locked for picks. Submission deadline has passed.')
    })
  })

  describe('formatGameTime', () => {
    it('should format time with timezone', () => {
      const gameTime = new Date('2025-09-07T13:00:00.000Z')
      const formatted = formatGameTime(gameTime)
      // Should include time and timezone (format may vary by system)
      expect(formatted).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('formatGameDate', () => {
    it('should format date without time', () => {
      const gameTime = new Date('2025-09-07T13:00:00.000Z')
      const formatted = formatGameDate(gameTime)
      expect(formatted).toMatch(/\w{3}, \w{3} \d{1,2}/) // "Sat, Sep 7" format
    })

    it('should format date with time when requested', () => {
      const gameTime = new Date('2025-09-07T13:00:00.000Z')
      const formatted = formatGameDate(gameTime, true)
      expect(formatted).toContain('at')
      expect(formatted).toMatch(/\w{3}, \w{3} \d{1,2} at \d{1,2}:\d{2}/)
    })
  })

  describe('getTimeUntilGame', () => {
    it('should break down time into components', () => {
      const gameTime = new Date(mockCurrentTime + 90065 * 1000) // 1 day, 1 hour, 1 minute, 5 seconds
      const breakdown = getTimeUntilGame(gameTime)
      
      expect(breakdown.days).toBe(1)
      expect(breakdown.hours).toBe(1)
      expect(breakdown.minutes).toBe(1)
      expect(breakdown.seconds).toBe(5)
    })

    it('should handle zero time remaining', () => {
      const gameTime = new Date(mockCurrentTime - 1000) // 1 second past
      const breakdown = getTimeUntilGame(gameTime)
      
      expect(breakdown.days).toBe(0)
      expect(breakdown.hours).toBe(0)
      expect(breakdown.minutes).toBe(0)
      expect(breakdown.seconds).toBe(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle daylight saving time transitions', () => {
      // Test spring forward (2 AM -> 3 AM)
      vi.setSystemTime(new Date('2025-03-09T06:30:00.000Z')) // 1:30 AM EST
      const gameTime = new Date('2025-03-09T08:30:00.000Z') // 3:30 AM EST (after DST)
      
      expect(calcRemainingTime(gameTime)).toBeCloseTo(7200, 0) // ~2 hours
    })

    it('should handle year boundaries correctly', () => {
      vi.setSystemTime(new Date('2024-12-31T23:30:00.000Z'))
      const newYearGame = new Date('2025-01-01T00:30:00.000Z')
      
      expect(calcRemainingTime(newYearGame)).toBe(3600) // 1 hour
      expect(isGameLocked(newYearGame, 30)).toBe(false) // Not locked with 30min offset
    })

    it('should handle leap year dates', () => {
      vi.setSystemTime(new Date('2024-02-28T23:00:00.000Z'))
      const leapDayGame = new Date('2024-02-29T01:00:00.000Z') // Leap day
      
      expect(calcRemainingTime(leapDayGame)).toBe(7200) // 2 hours
    })

    it('should handle maximum JavaScript date values', () => {
      const maxDate = new Date(8640000000000000) // Max JS date
      expect(() => calcRemainingTime(maxDate)).not.toThrow()
    })

    it('should handle negative lock offsets (future lock times)', () => {
      const gameTime = new Date(mockCurrentTime + 60 * 60 * 1000) // 1 hour future
      const lockTime = getGameLockTime(gameTime, -30) // Lock 30 minutes AFTER game
      expect(lockTime.getTime()).toBe(gameTime.getTime() + 30 * 60 * 1000)
    })
  })

  describe('Performance', () => {
    it('should handle large numbers of time calculations efficiently', () => {
      const startTime = performance.now()
      const gameTime = new Date(mockCurrentTime + 60 * 60 * 1000)
      
      // Perform 1000 calculations
      for (let i = 0; i < 1000; i++) {
        calcRemainingTime(gameTime)
        isGameLocked(gameTime, 30)
        formatDuration(i * 60)
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should complete in < 100ms
    })
  })
})