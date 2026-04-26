import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { deleteGoogleCalendarEvent, updateGoogleCalendarEvent, createGoogleCalendarEvent } from "@/lib/google-calendar"
import { requireAllowed } from "@/lib/authz"
import type { User } from "@/types"

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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Determine role
    const { data: access } = await admin.from("allowed_users").select("role").eq("email", user.email).maybeSingle()

    // Get shift to check permissions and keep data for potential rollback (admin client bypasses RLS)
    const { data: shift } = await admin
      .from("shifts")
      .select("*, shift_assignees:shift_assignees(user_id)")
      .eq("id", id)
      .single()

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 })
    }

    const isAdmin = access?.role === "admin"
    const isAssignee =
      shift.assigned_to === user.id ||
      (Array.isArray(shift.shift_assignees) && shift.shift_assignees.some((sa) => sa?.user_id === user.id))

    if (!isAdmin) {
      if (shift.created_by !== user.id && !isAssignee) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Delete shift from database first (admin to allow assignees)
    const { error: deleteError } = await admin.from("shifts").delete().eq("id", id)

    if (deleteError) throw deleteError

    // After DB delete, delete from Google Calendar; on failure, rollback DB delete
    if (shift.google_calendar_event_id) {
      try {
        await deleteGoogleCalendarEvent(shift.google_calendar_event_id)
      } catch (calendarError) {
        console.error("[app] Calendar event deletion failed, rolling back DB delete:", calendarError)
        try {
          const { shift_assignees, ...shiftRow } = shift
          await admin.from("shifts").insert(shiftRow)
          if (Array.isArray(shift_assignees) && shift_assignees.length > 0) {
            const assigneeRows = shift_assignees.map((sa) => ({ shift_id: id, user_id: sa.user_id }))
            await admin.from("shift_assignees").insert(assigneeRows)
          }
        } catch (rollbackError) {
          console.error("[app] Rollback failed after calendar delete error:", rollbackError)
        }
        return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 502 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[app] Error deleting shift:", error)
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Check access: admin or assignee
    const { data: access } = await supabase
      .from("allowed_users")
      .select("role")
      .eq("email", user.email)
      .maybeSingle()

    const { data: existingShift } = await admin
      .from("shifts")
      .select(
        `
        *,
        shift_assignees:shift_assignees(user:profiles(id, email, full_name)),
        venue:venues(name, address, city)
      `,
      )
      .eq("id", id)
      .single()

    if (!existingShift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 })
    }

    const isAssignee =
      existingShift.shift_assignees?.some((a) => a.user?.id === user.id) ||
      existingShift.assigned_to === user.id

    if (access?.role !== "admin" && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const assignees: string[] = Array.isArray(body.assignees) ? body.assignees : []
    const assignedTo = assignees[0] || null

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

    const { error: updateError } = await admin
      .from("shifts")
      .update({
        title: body.title,
        description: body.description,
        venue_id: body.venue_id,
        shift_date: body.shift_date,
        start_time: body.start_time,
        end_time: body.end_time,
        assigned_to: assignedTo,
      })
      .eq("id", id)

    if (updateError) throw updateError

    // Replace assignees
    await admin.from("shift_assignees").delete().eq("shift_id", id)
    if (assignees.length > 0) {
      const rows = assignees.map((assigneeId) => ({ shift_id: id, user_id: assigneeId }))
      await admin.from("shift_assignees").upsert(rows)
    }

    // Reload with relations for calendar payload
    const { data: fullShift } = await admin
      .from("shifts")
      .select(
        `
        *,
        venue:venues(*),
        shift_assignees:shift_assignees(user:profiles(id, full_name, email))
      `,
      )
      .eq("id", id)
      .single()

    if (fullShift && (access?.role === "admin" || isAssignee)) {
      const startDateTime = `${fullShift.shift_date}T${fullShift.start_time}`
      const endDateDate = fullShift.end_time <= fullShift.start_time ? addOneDay(fullShift.shift_date) : fullShift.shift_date
      const endDateTime = `${endDateDate}T${fullShift.end_time}`

      const venueInfo = fullShift.venue
      const locationParts = []
      if (venueInfo?.address && venueInfo.city) {
        locationParts.push(`${venueInfo.address}, ${venueInfo.city}`)
      } else if (venueInfo?.address) {
        locationParts.push(venueInfo.address)
      }
      const location = locationParts.join(", ")
      const venueName = venueInfo?.name?.trim()

      const attendees =
        fullShift.shift_assignees?.map((a) => (a.user?.email ? { email: a.user.email } : null)).filter(Boolean) ||
        []

      try {
        if (fullShift.google_calendar_event_id) {
          await updateGoogleCalendarEvent(fullShift.google_calendar_event_id, {
            summary: venueName ? `${fullShift.title} - ${venueName}` : fullShift.title,
            description: fullShift.description || "",
            location,
            start: { dateTime: startDateTime, timeZone: "Europe/Rome" },
            end: { dateTime: endDateTime, timeZone: "Europe/Rome" },
            attendees,
          })
        } else if (assignees.length > 0) {
          const calendarEvent = await createGoogleCalendarEvent({
            summary: venueName ? `${fullShift.title} - ${venueName}` : fullShift.title,
            description: fullShift.description || "",
            location,
            start: { dateTime: startDateTime, timeZone: "Europe/Rome" },
            end: { dateTime: endDateTime, timeZone: "Europe/Rome" },
            attendees,
          })
          if (calendarEvent?.id) {
            await supabase.from("shifts").update({ google_calendar_event_id: calendarEvent.id }).eq("id", id)
          }
        }
      } catch (calendarError) {
        console.error("[app] Calendar event update failed:", calendarError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[app] Error updating shift:", error)
    return NextResponse.json({ error: "Failed to update shift" }, { status: 500 })
  }
}
