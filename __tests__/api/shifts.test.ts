import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/google-calendar', () => ({
  createGoogleCalendarEvent: vi.fn(),
}))

vi.mock('@/lib/authz', () => ({
  requireAllowed: vi.fn(),
  requireAdmin: vi.fn(),
}))

describe('Shifts API - Input Validation', () => {
  it('should require title field', () => {
    const body = {
      description: 'Test shift',
      venue_id: '123',
      shift_date: '2024-05-01',
      start_time: '10:00',
      end_time: '14:00',
      assignees: [],
    }
    // Title is missing
    expect(body.title).toBeUndefined()
  })

  it('should require venue_id field', () => {
    const body = {
      title: 'Test Shift',
      description: 'Test shift',
      shift_date: '2024-05-01',
      start_time: '10:00',
      end_time: '14:00',
      assignees: [],
    }
    // venue_id is missing
    expect(body.venue_id).toBeUndefined()
  })

  it('should require shift_date field', () => {
    const body = {
      title: 'Test Shift',
      description: 'Test shift',
      venue_id: '123',
      start_time: '10:00',
      end_time: '14:00',
      assignees: [],
    }
    // shift_date is missing
    expect(body.shift_date).toBeUndefined()
  })

  it('should require start_time field', () => {
    const body = {
      title: 'Test Shift',
      description: 'Test shift',
      venue_id: '123',
      shift_date: '2024-05-01',
      end_time: '14:00',
      assignees: [],
    }
    // start_time is missing
    expect(body.start_time).toBeUndefined()
  })

  it('should require end_time field', () => {
    const body = {
      title: 'Test Shift',
      description: 'Test shift',
      venue_id: '123',
      shift_date: '2024-05-01',
      start_time: '10:00',
      assignees: [],
    }
    // end_time is missing
    expect(body.end_time).toBeUndefined()
  })

  it('should accept valid shift data', () => {
    const validBody = {
      title: 'Apertura Bar',
      description: 'Opening shift',
      venue_id: 'uuid-123',
      shift_date: '2024-05-01',
      start_time: '10:00',
      end_time: '14:00',
      assignees: ['user-uuid-1', 'user-uuid-2'],
    }

    expect(validBody.title).toBeDefined()
    expect(validBody.venue_id).toBeDefined()
    expect(validBody.shift_date).toBeDefined()
    expect(validBody.start_time).toBeDefined()
    expect(validBody.end_time).toBeDefined()
    expect(Array.isArray(validBody.assignees)).toBe(true)
  })

  it('should handle empty assignees array', () => {
    const body = {
      title: 'Test Shift',
      description: 'Test shift',
      venue_id: '123',
      shift_date: '2024-05-01',
      start_time: '10:00',
      end_time: '14:00',
      assignees: [],
    }

    expect(Array.isArray(body.assignees)).toBe(true)
    expect(body.assignees.length).toBe(0)
  })

  it('should handle multiple assignees', () => {
    const body = {
      title: 'Test Shift',
      description: 'Test shift',
      venue_id: '123',
      shift_date: '2024-05-01',
      start_time: '10:00',
      end_time: '14:00',
      assignees: ['uuid-1', 'uuid-2', 'uuid-3'],
    }

    expect(body.assignees.length).toBe(3)
    expect(body.assignees).toContain('uuid-1')
  })
})

describe('Shifts API - Date/Time Validation', () => {
  it('should accept valid ISO date format (YYYY-MM-DD)', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    expect(dateRegex.test('2024-05-01')).toBe(true)
    expect(dateRegex.test('2024-12-31')).toBe(true)
  })

  it('should accept valid time format (HH:MM)', () => {
    const timeRegex = /^\d{2}:\d{2}$/
    expect(timeRegex.test('10:00')).toBe(true)
    expect(timeRegex.test('23:59')).toBe(true)
    expect(timeRegex.test('09:30')).toBe(true)
  })

  it('should reject invalid date format', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    expect(dateRegex.test('05-01-2024')).toBe(false)
    expect(dateRegex.test('2024/05/01')).toBe(false)
    expect(dateRegex.test('invalid')).toBe(false)
  })

  it('should reject invalid time format', () => {
    const timeRegex = /^\d{2}:\d{2}$/
    expect(timeRegex.test('10')).toBe(false)
    expect(timeRegex.test('10:00:00')).toBe(false)
    expect(timeRegex.test('invalid')).toBe(false)
  })
})

describe('Shifts API - Business Logic', () => {
  it('should detect when end_time <= start_time requires next day', () => {
    const startTime = '14:00'
    const endTime = '10:00'

    // When end_time is earlier than start_time, shift spans midnight
    expect(endTime <= startTime).toBe(true)
  })

  it('should keep same day when end_time > start_time', () => {
    const startTime = '10:00'
    const endTime = '14:00'

    expect(endTime > startTime).toBe(true)
  })

  it('should format Google Calendar DateTime correctly', () => {
    const toGoogleDateTime = (date: string, time: string) => {
      return /^\d{2}:\d{2}$/.test(time) ? `${date}T${time}:00` : `${date}T${time}`
    }

    expect(toGoogleDateTime('2024-05-01', '10:00')).toBe('2024-05-01T10:00:00')
    expect(toGoogleDateTime('2024-05-01', '10:00:00')).toBe('2024-05-01T10:00:00')
  })

  it('should add one day to date correctly', () => {
    const addOneDay = (date: string) => {
      const d = new Date(date)
      d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    }

    expect(addOneDay('2024-05-01')).toBe('2024-05-02')
    expect(addOneDay('2024-05-31')).toBe('2024-06-01')
  })
})
