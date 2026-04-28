import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/authz'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await requireAdmin(user?.email)

    const admin = createAdminClient()
    const { data: members, error } = await admin
      .from('allowed_users')
      .select('id, email, role, created_at')
    if (error) throw error

    return NextResponse.json(members || [])
  } catch (error) {
    console.error('[members] GET error', error)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, role } = body
    if (!email || !role) {
      return NextResponse.json({ error: 'Email e ruolo sono obbligatori' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await requireAdmin(user?.email)

    const admin = createAdminClient()
    const { data: member, error } = await admin
      .from('allowed_users')
      .upsert({ email, role, created_by: user?.id }, { onConflict: 'email' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(member)
  } catch (error) {
    console.error('[members] POST error', error)
    return NextResponse.json({ error: 'Impossibile salvare il collaboratore' }, { status: 400 })
  }
}
