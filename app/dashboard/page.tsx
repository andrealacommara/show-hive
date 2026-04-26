import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import type { Profile, Unavailability, User } from "@/types"
import {
  DEMO_USER,
  DEMO_PROFILE,
  DEMO_SHIFTS,
  DEMO_VENUES,
  DEMO_USERS,
  DEMO_MEMBERS,
  DEMO_UNAVAILABILITIES,
} from "@/lib/demo-data"

interface DashboardPageProps {
  searchParams: Promise<{ demo?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const isDemo = params?.demo === "true"

  if (isDemo) {
    return (
      <DashboardView
        user={DEMO_USER}
        profile={DEMO_PROFILE}
        shifts={DEMO_SHIFTS}
        venues={DEMO_VENUES}
        users={DEMO_USERS}
        members={DEMO_MEMBERS}
        isAdmin={false}
        unavailabilities={DEMO_UNAVAILABILITIES}
        isDemo={true}
      />
    )
  }

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
    .select("id, user_id, full_name, email, avatar_url")
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
  const { data: unavailabilities } = await admin
    .from("unavailabilities")
    .select("id, user_id, start_date, end_date, reason, user:profiles(id, full_name, email)")
    .order("start_date", { ascending: true })

  const dashboardUser: User = {
    id: user.id,
    email: user.email ?? "",
    full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined,
  }

  const dashboardProfile: Profile = profile ?? {
    id: user.id,
    user_id: user.id,
    full_name: dashboardUser.full_name,
    email: dashboardUser.email,
    avatar_url: null,
  }

  const normalizedUnavailabilities: Unavailability[] = (unavailabilities ?? []).map((unavailability) => {
    const relatedUser = Array.isArray(unavailability.user) ? unavailability.user[0] : unavailability.user

    return {
      id: unavailability.id,
      user_id: unavailability.user_id,
      start_date: unavailability.start_date,
      end_date: unavailability.end_date,
      reason: unavailability.reason,
      user: relatedUser
        ? {
            id: relatedUser.id,
            full_name: relatedUser.full_name,
            email: relatedUser.email,
          }
        : undefined,
    }
  })

  return (
    <DashboardView
      user={dashboardUser}
      profile={dashboardProfile}
      shifts={shifts || []}
      venues={venues || []}
      users={allUsers || []}
      members={members || []}
      isAdmin={access?.role === "admin"}
      unavailabilities={normalizedUnavailabilities}
      isDemo={false}
    />
  )
}
