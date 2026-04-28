import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAllowed } from '@/lib/authz'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    await requireAllowed(user?.email)

    const { data, error } = await supabase
      .from('shift_assignees')
      .select('user:profiles(id, full_name, email)')
      .eq('shift_id', id)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[app] Error fetching shift assignees', error)
    return NextResponse.json({ error: 'Failed to fetch assignees' }, { status: 400 })
  }
}
