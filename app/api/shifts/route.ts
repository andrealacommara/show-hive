import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { createGoogleCalendarEvent } from "@/lib/google-calendar"
import { requireAllowed } from "@/lib/authz"
import type { User } from "@/types"

function toErrorResponse(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message || "Failed to create shift")
    const code = "code" in error ? String(error.code || "") : ""

    if (message === "Unauthorized") {
      return { error: "Unauthorized", status: 401 }
    }
    if (message === "Forbidden") {
      return { error: "Forbidden", status: 403 }
    }

    // PostgreSQL / PostgREST errors are usually client-side input or constraint issues.
    if (code.startsWith("22") || code.startsWith("23") || code === "PGRST116") {
      return { error: message, status: 400 }
    }

    return { error: message, status: 500 }
  }

  return { error: "Failed to create shift", status: 500 }
}

function buildDateTime(date: string, time: string) {
  return `${date}T${time}`
}

type ShiftWithRelations = {
  venue?: {
    name?: string | null
    address?: string | null
    city?: string | null
  } | null
  shift_assignees?: {
    user?: {
      email?: string | null
    } | null
  }[] | null
  google_calendar_event_id?: string | null
}

function addOneDay(date: string) {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function getUnavailableAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assignees: string[],
  date: string,
) {
  if (!assignees.length) return []

  const { data, error } = await supabase
    .from("unavailabilities")
    .select("user_id, user:profiles(full_name, email)")
    .in("user_id", assignees)
    .lte("start_date", date)
    .gte("end_date", date)

  if (error) throw error
  return data || []
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const assignees: string[] = Array.isArray(body.assignees) ? body.assignees : []
    const assignedTo = assignees[0] || null

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await requireAllowed(user.email)

    const unavailable = await getUnavailableAssignees(supabase, assignees, body.shift_date)
    if (unavailable.length > 0) {
      const names = unavailable
        .map((u) => (u.user as User | undefined)?.full_name || (u.user as User | undefined)?.email || "Utente")
        .filter(Boolean)
        .join(", ")
      return NextResponse.json(
        { error: `Indisponibile in questa data: ${names}` },
        { status: 400 },
      )
    }

    // Create shift in database
    // Insert shift
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .insert({
        title: body.title,
        description: body.description,
        venue_id: body.venue_id,
        shift_date: body.shift_date,
        start_time: body.start_time,
        end_time: body.end_time,
        created_by: user.id,
        assigned_to: assignedTo,
      })
      .select("*")
      .single()

    if (shiftError) throw shiftError

    // Insert assignees (if any)
    if (assignees.length > 0) {
      const rows = assignees.map((assigneeId) => ({ shift_id: shift.id, user_id: assigneeId }))
      const { error: assignError } = await supabase.from("shift_assignees").upsert(rows)
      if (assignError) throw assignError
    }

    // Reload shift with relations. If admin env/config is missing, don't fail creation.
    let fullShift: ShiftWithRelations | null = null
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from("shifts")
        .select(
          `
          *,
          venue:venues(*),
          shift_assignees:shift_assignees(user:profiles(id, full_name, email))
        `,
        )
        .eq("id", shift.id)
        .single()
      fullShift = data
    } catch (reloadError) {
      console.error("[app] Failed to reload shift with relations:", reloadError)
    }

    // If shift is assigned to someone, create Google Calendar event on the central calendar
    if (assignees.length > 0) {
      try {
        // Format datetime for Google Calendar (handle overnight shifts)
        const startDateTime = buildDateTime(shift.shift_date, shift.start_time)
        const endDateDate = shift.end_time <= shift.start_time ? addOneDay(shift.shift_date) : shift.shift_date
        const endDateTime = buildDateTime(endDateDate, shift.end_time)

        const venueInfo = fullShift?.venue
        const name = venueInfo?.name?.trim()
        const street = venueInfo?.address?.trim()
        const city = venueInfo?.city?.trim()

        // Prefer address + city for better Google parsing; fall back to name + city or just name
        const location = street && city ? `${street}, ${city}` : street || (name && city ? `${name}, ${city}` : name || "")

        const attendees =
          fullShift?.shift_assignees?.map((a) => (a.user?.email ? { email: a.user.email } : null)).filter(Boolean) ||
          []

        const venueName = venueInfo?.name?.trim()
        const calendarEvent = await createGoogleCalendarEvent({
          summary: venueName ? `${shift.title} - ${venueName}` : shift.title,
          description: shift.description || "",
          location,
          start: {
            dateTime: startDateTime,
            timeZone: "Europe/Rome",
          },
          end: {
            dateTime: endDateTime,
            timeZone: "Europe/Rome",
          },
          attendees,
        })

        // Update shift with calendar event ID
        await supabase.from("shifts").update({ google_calendar_event_id: calendarEvent.id }).eq("id", shift.id)

        if (fullShift) {
          fullShift.google_calendar_event_id = calendarEvent.id
        }
      } catch (calendarError) {
        console.error("[app] Calendar event creation failed:", calendarError)
        // Continue even if calendar creation fails
      }
    }

    return NextResponse.json(fullShift || shift)
  } catch (error) {
    console.error("[app] Error creating shift:", error)
    const apiError = toErrorResponse(error)
    return NextResponse.json({ error: apiError.error }, { status: apiError.status })
  }
}
