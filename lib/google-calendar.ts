import { createAdminClient } from "@/lib/supabase/admin"

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

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

async function refreshGoogleToken(refreshToken: string) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google OAuth environment variables")
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    }).toString(),
  })

  if (!response.ok) {
    throw new Error("Unable to refresh Google token")
  }

  return response.json() as Promise<{ access_token: string; refresh_token?: string }>
}

export async function getUserCalendarAccessToken(userId: string) {
  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from("profiles")
    .select("google_calendar_token, google_refresh_token")
    .eq("id", userId)
    .single()

  if (error || !profile) {
    throw new Error("Profilo Google non trovato")
  }

  if (profile.google_refresh_token) {
    const newTokens = await refreshGoogleToken(profile.google_refresh_token)

    await admin
      .from("profiles")
      .update({
        google_calendar_token: newTokens.access_token,
        google_refresh_token: newTokens.refresh_token || profile.google_refresh_token,
      })
      .eq("id", userId)

    return newTokens.access_token
  }

  if (profile.google_calendar_token) {
    return profile.google_calendar_token
  }

  throw new Error("Nessun token Google disponibile per l'utente")
}

export async function createGoogleCalendarEvent(accessToken: string, event: CalendarEvent) {
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete calendar event")
  }

  return true
}
