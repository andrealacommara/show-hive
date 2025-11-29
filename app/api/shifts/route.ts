import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { createGoogleCalendarEvent } from "@/lib/google-calendar"
import { requireAllowed } from "@/lib/authz"

function buildDateTime(date: string, time: string) {
  return `${date}T${time}`
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
    const admin = createAdminClient()
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
        .map((u: any) => u.user?.full_name || u.user?.email || "Utente")
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

    // Reload shift with relations
    const { data: fullShift } = await admin
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
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 })
  }
}
