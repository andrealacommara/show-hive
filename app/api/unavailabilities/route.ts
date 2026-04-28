import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAllowed } from '@/lib/authz'

export async function GET() {
  const supabase = await createClient()

  // FIX: authenticate the caller before returning any data.
  // The POST/PUT/DELETE handlers already do this; the GET was the only one missing it.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    await requireAllowed(user?.email)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('unavailabilities')
    .select(
      `
        id,
        start_date,
        end_date,
        reason,
        user:profiles(id, full_name, email)
      `
    )
    .order('start_date', { ascending: true })

  if (error) {
    console.error('[unavailabilities] GET error', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle indisponibilita' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const body = await req.json()
  const { start_date, end_date, reason } = body

  if (!start_date || !end_date) {
    return NextResponse.json({ error: 'Date mancanti' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('unavailabilities')
    .insert({
      user_id: user.id,
      start_date,
      end_date,
      reason: reason ? String(reason).slice(0, 280) : null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[unavailabilities] POST error', error)
    return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
