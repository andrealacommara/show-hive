import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isMissingGoogleCalendarEventError, getCentralCalendarId } from '@/lib/google-calendar'

describe('google-calendar utilities', () => {
  describe('isMissingGoogleCalendarEventError', () => {
    it('should return true for 404 status', () => {
      const error = { status: 404 }
      expect(isMissingGoogleCalendarEventError(error)).toBe(true)
    })

    it('should return true for 410 status', () => {
      const error = { status: 410 }
      expect(isMissingGoogleCalendarEventError(error)).toBe(true)
    })

    it('should return true for code 404', () => {
      const error = { code: 404 }
      expect(isMissingGoogleCalendarEventError(error)).toBe(true)
    })

    it('should return true for response.status 404', () => {
      const error = { response: { status: 404 } }
      expect(isMissingGoogleCalendarEventError(error)).toBe(true)
    })

    it('should return false for other status codes', () => {
      const error = { status: 500 }
      expect(isMissingGoogleCalendarEventError(error)).toBe(false)
    })

    it('should return false for empty error object', () => {
      const error = {}
      expect(isMissingGoogleCalendarEventError(error)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isMissingGoogleCalendarEventError(null)).toBe(false)
      expect(isMissingGoogleCalendarEventError(undefined)).toBe(false)
    })
  })

  describe('getCentralCalendarId', () => {
    const originalEnv = process.env.ADMIN_GOOGLE_CALENDAR_ID

    beforeEach(() => {
      delete process.env.ADMIN_GOOGLE_CALENDAR_ID
    })

    afterEach(() => {
      process.env.ADMIN_GOOGLE_CALENDAR_ID = originalEnv
    })

    it('should return calendar ID from environment', () => {
      process.env.ADMIN_GOOGLE_CALENDAR_ID = 'test-calendar@gmail.com'
      expect(getCentralCalendarId()).toBe('test-calendar@gmail.com')
    })

    it('should throw error when ADMIN_GOOGLE_CALENDAR_ID is not set', () => {
      expect(() => getCentralCalendarId()).toThrow('Missing Google Calendar env: ADMIN_GOOGLE_CALENDAR_ID')
    })
  })
})
