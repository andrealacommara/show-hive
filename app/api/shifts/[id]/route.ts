import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { deleteGoogleCalendarEvent } from "@/lib/google-calendar"
import { requireAllowed } from "@/lib/authz"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await requireAllowed(user.email)

    // Get shift to check if it has a calendar event
    const { data: shift } = await supabase
      .from("shifts")
      .select("google_calendar_event_id, created_by")
      .eq("id", id)
      .single()

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 })
    }

    if (shift.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete from Google Calendar if exists; fail fast if Calendar delete fails to avoid orphan events
    if (shift.google_calendar_event_id) {
      try {
        await deleteGoogleCalendarEvent(shift.google_calendar_event_id)
      } catch (calendarError) {
        console.error("[app] Calendar event deletion failed:", calendarError)
        return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 502 })
      }
    }

    // Delete shift from database
    const { error: deleteError } = await supabase.from("shifts").delete().eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[app] Error deleting shift:", error)
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 })
  }
}
