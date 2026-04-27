import { getCalendarClient } from "@/lib/google"

interface CalendarEvent {
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{ email: string }>
}

type GoogleApiError = {
  code?: number
  status?: number
  response?: {
    status?: number
  }
}

function getGoogleApiStatus(error: unknown) {
  const googleError = error as GoogleApiError | undefined
  return googleError?.code ?? googleError?.status ?? googleError?.response?.status
}

export function isMissingGoogleCalendarEventError(error: unknown) {
  const status = getGoogleApiStatus(error)
  return status === 404 || status === 410
}

export function getCentralCalendarId() {
  const calendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID

  if (!calendarId) {
    throw new Error("Missing Google Calendar env: ADMIN_GOOGLE_CALENDAR_ID")
  }

  return calendarId
}

export async function createGoogleCalendarEvent(event: CalendarEvent) {
  const calendar = getCalendarClient()
  const calendarId = getCentralCalendarId()

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: event,
    sendUpdates: "all",
  })

  return data
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const calendar = getCalendarClient()
  const calendarId = getCentralCalendarId()

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    })
  } catch (error) {
    if (isMissingGoogleCalendarEventError(error)) {
      return true
    }

    throw new Error("Failed to delete calendar event")
  }

  return true
}

export async function updateGoogleCalendarEvent(eventId: string, event: Partial<CalendarEvent>) {
  const calendar = getCalendarClient()
  const calendarId = getCentralCalendarId()
  const { data } = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: event,
    sendUpdates: "all",
  })
  return data
}
