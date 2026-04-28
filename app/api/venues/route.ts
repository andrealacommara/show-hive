import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAllowed } from '@/lib/authz'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, city } = body
    if (!name) {
      return NextResponse.json({ error: 'Nome locale obbligatorio' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAllowed(user.email)

    const { error } = await supabase.from('venues').insert({
      name,
      address,
      city,
      created_by: user.id,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[venues] POST error', error)
    return NextResponse.json({ error: 'Impossibile creare il locale' }, { status: 400 })
  }
}
