"use client"

import { useState } from "react"
import { ShiftsCalendar } from "./shifts-calendar"
import { ShiftsList } from "./shifts-list"
import { VenuesList } from "./venues-list"
import { MembersCard } from "./members-card"
import { DashboardHeader } from "./dashboard-header"
type User = { id: string; full_name?: string; email: string }
type Venue = { id: string; name: string; address?: string; city?: string }
type Shift = {
  id: string
  title: string
  description?: string
  shift_date: string
  start_time: string
  end_time: string
  venue_id: string
  venue?: { id: string; name: string; address?: string; city?: string }
  shift_assignees?: { user: User }[]
  google_calendar_event_id?: string
}

interface DashboardViewProps {
  user: any
  profile: any
  shifts: Shift[]
  venues: Venue[]
  users: User[]
  members: any[]
  isAdmin: boolean
}

export function DashboardView({ user, profile, shifts, venues, users, members, isAdmin }: DashboardViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} profile={profile} />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 justify-items-center items-start">
            <div className="space-y-6 md:col-span-2 w-full max-w-2xl mx-auto">
              <div className="w-full max-w-2xl mx-auto">
                <ShiftsCalendar shifts={shifts} selectedDate={selectedDate ?? undefined} onSelectDay={setSelectedDate} />
              </div>
              <div className="w-full max-w-2xl mx-auto">
                <ShiftsList
                  shifts={shifts}
                  venues={venues}
                  users={users}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  selectedDate={selectedDate ?? undefined}
                  onClearDate={() => setSelectedDate(null)}
                />
              </div>
            </div>

            <div className="space-y-6 w-full max-w-xl mx-auto">
              <div className="w-full">
                <VenuesList venues={venues} currentUserId={user.id} isAdmin={isAdmin} />
              </div>
              <div className="w-full">
                <MembersCard
                  members={members || []}
                  profiles={users || []}
                  currentUserEmail={user.email!}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
