import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { createGoogleCalendarEvent } from "@/lib/google-calendar"
import { requireAllowed } from "@/lib/authz"

function addOneDay(date: string) {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function toGoogleDateTime(date: string, time: string) {
  return /^\d{2}:\d{2}$/.test(time) ? `${date}T${time}:00` : `${date}T${time}`
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await requireAllowed(user.email)

    const { title, description, venue_id, shift_date, start_time, end_time, assignees: rawAssignees } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!venue_id) {
      return NextResponse.json({ error: "Venue is required" }, { status: 400 })
    }
    if (!shift_date) {
      return NextResponse.json({ error: "Shift date is required" }, { status: 400 })
    }
    if (!start_time) {
      return NextResponse.json({ error: "Start time is required" }, { status: 400 })
    }
    if (!end_time) {
      return NextResponse.json({ error: "End time is required" }, { status: 400 })
    }

    const assignees: string[] = Array.isArray(rawAssignees) ? rawAssignees : []
    const assignedTo = assignees[0] || null

    // Check unavailability
    const unavailable = await getUnavailableAssignees(supabase, assignees, shift_date)
    if (unavailable.length > 0) {
      const names = unavailable
        .map((u) => {
          const profile = (Array.isArray(u.user) ? u.user[0] : u.user) as { full_name?: string; email?: string } | undefined
          return profile?.full_name || profile?.email || "Utente"
        })
        .filter(Boolean)
        .join(", ")
      return NextResponse.json(
        { error: `Indisponibile in questa data: ${names}` },
        { status: 400 },
      )
    }

    // Create shift
    const { data: newShift, error: insertError } = await admin
      .from("shifts")
      .insert({
        title: title.trim(),
        description: description || null,
        venue_id,
        shift_date,
        start_time,
        end_time,
        assigned_to: assignedTo,
        created_by: user.id,
      })
      .select("id, venue:venues(name, address, city)")
      .single()

    if (insertError) throw insertError

    const shiftId = newShift.id

    // Insert assignees
    if (assignees.length > 0) {
      const assigneeRows = assignees.map((userId) => ({ shift_id: shiftId, user_id: userId }))
      const { error: assigneeError } = await admin.from("shift_assignees").insert(assigneeRows)
      if (assigneeError) throw assigneeError
    }

    // Create Google Calendar event if there are assignees
    if (assignees.length > 0) {
      try {
        const startDateTime = toGoogleDateTime(shift_date, start_time)
        const endDateDate = end_time <= start_time ? addOneDay(shift_date) : shift_date
        const endDateTime = toGoogleDateTime(endDateDate, end_time)

        // Get full shift data with venue and assignees for calendar
        const { data: fullShiftData } = await admin
          .from("shifts")
          .select(
            `
            *,
            venue:venues(name, address, city),
            shift_assignees:shift_assignees(user:profiles(email))
          `
          )
          .eq("id", shiftId)
          .single()

        if (!fullShiftData) {
          throw new Error("Failed to load shift data for calendar")
        }

        const venueInfo = Array.isArray(fullShiftData.venue) ? fullShiftData.venue[0] : fullShiftData.venue
        const locationParts = []
        if (venueInfo?.address && venueInfo?.city) {
          locationParts.push(`${venueInfo.address}, ${venueInfo.city}`)
        } else if (venueInfo?.address) {
          locationParts.push(venueInfo.address)
        }
        const location = locationParts.join(", ")
        const venueName = venueInfo?.name?.trim()

        const attendees = (fullShiftData.shift_assignees || [])
          .map((sa: any) => {
            if (Array.isArray(sa.user)) {
              const user = sa.user[0]
              return user?.email ? { email: user.email } : null
            } else if (sa.user?.email) {
              return { email: sa.user.email }
            }
            return null
          })
          .filter((a: any): a is { email: string } => a !== null)

        const calendarPayload = {
          summary: venueName ? `${title} - ${venueName}` : title,
          description: description || "",
          location,
          start: { dateTime: startDateTime, timeZone: "Europe/Rome" },
          end: { dateTime: endDateTime, timeZone: "Europe/Rome" },
          attendees,
        }

        const calendarEvent = await createGoogleCalendarEvent(calendarPayload)

        if (calendarEvent?.id) {
          await admin.from("shifts").update({ google_calendar_event_id: calendarEvent.id }).eq("id", shiftId)
        }
      } catch (calendarError) {
        const errorMsg = calendarError instanceof Error ? calendarError.message : "Unknown error"
        console.error("[app] Calendar event creation failed:", errorMsg)
        // Don't fail the request if calendar creation fails
      }
    }

    return NextResponse.json({ success: true, id: shiftId })
  } catch (error) {
    console.error("[app] Error creating shift:", error)
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 })
  }
}
