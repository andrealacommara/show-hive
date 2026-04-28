import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const { start_date, end_date, reason } = body

    const { error: updateError } = await supabase
      .from('unavailabilities')
      .update({
        start_date,
        end_date,
        reason: reason ? String(reason).slice(0, 280) : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[unavailabilities] PUT error', error)
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { error: deleteError } = await supabase
      .from('unavailabilities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[unavailabilities] DELETE error', error)
    return NextResponse.json({ error: 'Errore nella cancellazione' }, { status: 500 })
  }
}
