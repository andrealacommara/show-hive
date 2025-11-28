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

const CENTRAL_CALENDAR_ID = "amministrazione.showhive@gmail.com"

export async function createGoogleCalendarEvent(event: CalendarEvent) {
  const calendar = getCalendarClient()

  const { data } = await calendar.events.insert({
    calendarId: CENTRAL_CALENDAR_ID,
    requestBody: event,
    sendUpdates: "all",
  })

  return data
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const calendar = getCalendarClient()

  try {
    await calendar.events.delete({
      calendarId: CENTRAL_CALENDAR_ID,
      eventId,
    })
  } catch (error: any) {
    if (error?.code === 404) {
      return true
    }

    throw new Error("Failed to delete calendar event")
  }

  return true
}
