import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"
import { ShiftsList } from "@/components/dashboard/shifts-list"
import { VenuesList } from "@/components/dashboard/venues-list"
import { MembersCard } from "@/components/dashboard/members-card"

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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} profile={profile} />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 justify-items-center items-start">
            <div className="space-y-6 md:col-span-2 w-full max-w-2xl mx-auto">
              <div className="w-full max-w-2xl mx-auto">
                <ShiftsCalendar shifts={shifts || []} />
              </div>
              <div className="w-full max-w-2xl mx-auto">
                <ShiftsList shifts={shifts || []} venues={venues || []} users={allUsers || []} currentUserId={user.id} />
              </div>
            </div>

            <div className="space-y-6 w-full max-w-xl mx-auto">
              <div className="w-full">
                <VenuesList venues={venues || []} currentUserId={user.id} />
              </div>
              {access?.role === "admin" && (
                <div className="w-full">
                  <MembersCard members={members || []} currentUserEmail={user.email!} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
