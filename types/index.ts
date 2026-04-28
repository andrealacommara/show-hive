// User and Profile types
export interface User {
  id: string
  full_name?: string
  email: string
}

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  email?: string
  avatar_url?: string | null
  role?: 'admin' | 'member'
  created_at?: string
  updated_at?: string
}

// Venue type
export interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  created_at?: string
  updated_at?: string
}

// Shift types
export interface ShiftAssignee {
  user_id: string
  user?: User
}

export interface Shift {
  id: string
  title: string
  description?: string
  shift_date: string
  start_time: string
  end_time: string
  venue_id: string
  venue?: Venue
  shift_assignees?: ShiftAssignee[]
  google_calendar_event_id?: string
  created_at?: string
  updated_at?: string
}

// Unavailability type
export interface Unavailability {
  id: string
  user_id: string
  start_date: string
  end_date: string
  reason?: string
  user?: User
  created_at?: string
  updated_at?: string
}

// Member type (for members list)
export interface Member {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at?: string
}

// API Response types
export interface ApiShiftResponse extends Shift {
  shift_assignees?: Array<{
    user_id: string
    user?: {
      id: string
      full_name?: string
      email: string
    }
  }>
}

export interface ApiUnavailabilityResponse extends Unavailability {
  user: {
    id: string
    full_name?: string
    email: string
  }
}
