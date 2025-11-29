"use client"

import { useState } from "react"
import { ShiftsCalendar } from "./shifts-calendar"
import { ShiftsList } from "./shifts-list"
import { VenuesList } from "./venues-list"
import { MembersCard } from "./members-card"
import { DashboardHeader } from "./dashboard-header"
import { ShiftsTableView } from "./shifts-table-view"
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
type Unavailability = {
  id: string
  start_date: string
  end_date: string
  reason?: string
  user: User
}

interface DashboardViewProps {
  user: any
  profile: any
  shifts: Shift[]
  venues: Venue[]
  users: User[]
  members: any[]
  isAdmin: boolean
  unavailabilities: Unavailability[]
}

export function DashboardView({ user, profile, shifts, venues, users, members, isAdmin, unavailabilities }: DashboardViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarMode, setCalendarMode] = useState<"grid" | "table">("grid")

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} profile={profile} />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 justify-items-center items-start">
            <div className="space-y-6 md:col-span-2 w-full max-w-2xl mx-auto">
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarMode("grid")}
                    className={`text-sm px-3 py-1 rounded-md border ${calendarMode === "grid" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
                  >
                    Calendario
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMode("table")}
                    className={`text-sm px-3 py-1 rounded-md border ${calendarMode === "table" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
                  >
                    Tabella
                  </button>
                </div>
                {calendarMode === "grid" ? (
                  <ShiftsCalendar
                    shifts={shifts}
                    users={users}
                    unavailabilities={unavailabilities}
                    selectedDate={selectedDate ?? undefined}
                    onSelectDay={setSelectedDate}
                  />
                ) : (
                  <ShiftsTableView shifts={shifts} unavailabilities={unavailabilities} users={users} />
                )}
              </div>
              <div className="w-full max-w-2xl mx-auto">
                <ShiftsList
                  shifts={shifts}
                  venues={venues}
                  users={users}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  unavailabilities={unavailabilities}
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
