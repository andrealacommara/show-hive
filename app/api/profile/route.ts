import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: Request) {
  try {
    const { first_name, last_name } = await request.json()
    const supabase = await createClient()

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

    return NextResponse.json({ success: true, full_name })
  } catch (error) {
    console.error('[profile] PUT error', error)
    return NextResponse.json({ error: 'Impossibile aggiornare il profilo' }, { status: 400 })
  }
}
