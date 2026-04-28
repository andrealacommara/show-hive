import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateGoogleCalendarEvent } from '@/lib/google-calendar'

export async function PUT(request: Request) {
  try {
    const { first_name, last_name } = await request.json()
    const supabase = await createClient()
    const admin = createAdminClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const first = (first_name || '').trim()
    const last = (last_name || '').trim()
    if (!first && !last) {
      return NextResponse.json({ error: 'Nome o cognome obbligatori' }, { status: 400 })
    }

    const full_name = [first, last].filter(Boolean).join(' ')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name })
      .eq('id', user.id)
    if (updateError) throw updateError

    // Update Google Calendar events with new attendee list
    try {
      const { data: userShifts } = await admin
        .from('shift_assignees')
        .select(
          'shift:shifts(id, google_calendar_event_id, title, description, shift_assignees:shift_assignees(user:profiles(full_name, email)))'
        )
        .eq('user_id', user.id)

      if (userShifts && userShifts.length > 0) {
        for (const assignment of userShifts) {
          const shift = assignment.shift as any
          if (shift?.google_calendar_event_id) {
            const attendees = (shift.shift_assignees || [])
              .map((sa: any) => {
                if (Array.isArray(sa.user)) {
                  const u = sa.user[0]
                  return u?.email ? { email: u.email } : null
                } else if (sa.user?.email) {
                  return { email: sa.user.email }
                }
                return null
              })
              .filter((a: any): a is { email: string } => a !== null)

            await updateGoogleCalendarEvent(shift.google_calendar_event_id, {
              description: shift.description || '',
              attendees,
            }).catch((error) => {
              console.error(
                `Failed to update calendar event ${shift.google_calendar_event_id}`,
                error
              )
            })
          }
        }
      }
    } catch (calendarError) {
      console.error('Failed to update calendar events:', calendarError)
    }

    return NextResponse.json({ success: true, full_name })
  } catch (error) {
    console.error('[profile] PUT error', error)
    return NextResponse.json({ error: 'Impossibile aggiornare il profilo' }, { status: 400 })
  }
}
