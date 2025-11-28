import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export default async function DashboardPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: access } = await admin.from("allowed_users").select("id, role").eq("email", user.email).maybeSingle()
  if (!access) {
    redirect("/auth/unauthorized")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", user.id)
    .single()

  const { data: allUsers } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true })

  const { data: shifts } = await admin
    .from("shifts")
    .select(`
      *,
      venue:venues(*),
      assigned_user:profiles!shifts_assigned_to_fkey(id, full_name, email),
      shift_assignees:shift_assignees(user:profiles(id, full_name, email))
    `)
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true })

  const { data: venues } = await admin.from("venues").select("*").order("name", { ascending: true })
  const { data: members } = await admin.from("allowed_users").select("*").order("email", { ascending: true })

  return (
    <DashboardView
      user={user}
      profile={profile}
      shifts={shifts || []}
      venues={venues || []}
      users={allUsers || []}
      members={members || []}
      isAdmin={access?.role === "admin"}
    />
  )
}
