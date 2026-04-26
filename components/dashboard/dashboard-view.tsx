"use client"

import { useState } from "react"
import { ShiftsCalendar } from "./shifts-calendar"
import { ShiftsList } from "./shifts-list"
import { VenuesList } from "./venues-list"
import { MembersCard } from "./members-card"
import { DashboardHeader } from "./dashboard-header"
import { ShiftsTableView } from "./shifts-table-view"
import type { User, Profile, Venue, Shift, Unavailability, Member } from "@/types"

interface DashboardViewProps {
  user: User
  profile: Profile
  shifts: Shift[]
  venues: Venue[]
  users: User[]
  members: Member[]
  isAdmin: boolean
  unavailabilities: Unavailability[]
  isDemo?: boolean
}

export function DashboardView({ user, profile, shifts, venues, users, members, isAdmin, unavailabilities, isDemo = false }: DashboardViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarMode, setCalendarMode] = useState<"grid" | "table">("grid")

  return (
    <div className="min-h-screen bg-gray-50">
      {isDemo && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm">
          <div className="flex items-center gap-2">
            <span>🧪</span>
            <span>Modalità demo — i dati sono di esempio e le modifiche non vengono salvate</span>
          </div>
          <a
            href="/auth/login"
            className="shrink-0 rounded-md bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-800 transition-colors"
          >
            Accedi
          </a>
        </div>
      )}
      <DashboardHeader user={user} profile={profile} isDemo={isDemo} />

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
                  isDemo={isDemo}
                />
              </div>
            </div>

            <div className="space-y-6 w-full max-w-xl mx-auto">
              <div className="w-full">
                <VenuesList venues={venues} currentUserId={user.id} isAdmin={isAdmin} isDemo={isDemo} />
              </div>
              <div className="w-full">
                <MembersCard
                  members={members || []}
                  profiles={users || []}
                  currentUserEmail={user.email!}
                  isAdmin={isAdmin}
                  isDemo={isDemo}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
