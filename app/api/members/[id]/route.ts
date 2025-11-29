import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/authz"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { role } = await request.json()
    if (!role) return NextResponse.json({ error: "Ruolo mancante" }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await requireAdmin(user?.email)

    const admin = createAdminClient()
    const { data: updated, error } = await admin
      .from("allowed_users")
      .update({ role })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[members] PATCH error", error)
    return NextResponse.json({ error: "Impossibile aggiornare il ruolo" }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await requireAdmin(user?.email)

    const admin = createAdminClient()
    const { data: member, error: fetchError } = await admin.from("allowed_users").select("email").eq("id", id).maybeSingle()
    if (fetchError) throw fetchError

    // Delete unavailabilities linked to this collaborator's profile (if found)
    if (member?.email) {
      const { data: profile } = await admin.from("profiles").select("id").eq("email", member.email).maybeSingle()
      if (profile?.id) {
        await admin.from("unavailabilities").delete().eq("user_id", profile.id)
      }
    }

    const { error } = await admin.from("allowed_users").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[members] DELETE error", error)
    return NextResponse.json({ error: "Impossibile eliminare il collaboratore" }, { status: 400 })
  }
}
