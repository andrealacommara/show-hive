"use client"

import { useState } from "react"
import { ShiftsCalendar } from "./shifts-calendar"
import { ShiftsList } from "./shifts-list"
import { VenuesList } from "./venues-list"
import { MembersCard } from "./members-card"
import { DashboardHeader } from "./dashboard-header"
import { ShiftsTableView } from "./shifts-table-view"
import type { User, Profile, Venue, Shift, Unavailability, Member } from "@/types"

function createDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

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
  const [profileState, setProfileState] = useState(profile)
  const [shiftsState, setShiftsState] = useState(shifts)
  const [venuesState, setVenuesState] = useState(venues)
  const [usersState, setUsersState] = useState(users)
  const [membersState, setMembersState] = useState(members)
  const [unavailabilitiesState, setUnavailabilitiesState] = useState(unavailabilities)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarMode, setCalendarMode] = useState<"grid" | "table">("grid")

  const handleProfileSaved = (fullName: string) => {
    setProfileState((prev) => ({ ...prev, full_name: fullName }))
    setUsersState((prev) =>
      prev.map((item) => (item.id === user.id ? { ...item, full_name: fullName } : item)),
    )
  }

  const handleCreateVenue = (payload: { name: string; address?: string; city?: string }) => {
    const venue: Venue = {
      id: createDemoId("venue"),
      name: payload.name,
      address: payload.address || "",
      city: payload.city || "",
    }

    setVenuesState((prev) => [...prev, venue].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleUpdateVenue = (venueId: string, payload: { name: string; address?: string; city?: string }) => {
    setVenuesState((prev) =>
      prev
        .map((venue) => (venue.id === venueId ? { ...venue, ...payload } : venue))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    setShiftsState((prev) =>
      prev.map((shift) =>
        shift.venue_id === venueId
          ? {
              ...shift,
              venue: {
                id: venueId,
                name: payload.name,
                address: payload.address,
                city: payload.city,
              },
            }
          : shift,
      ),
    )
  }

  const handleDeleteVenue = (venueId: string) => {
    setVenuesState((prev) => prev.filter((venue) => venue.id !== venueId))
    setShiftsState((prev) => prev.filter((shift) => shift.venue_id !== venueId))
  }

  const handleCreateShift = (payload: {
    title: string
    description?: string
    venue_id: string
    shift_date: string
    start_time: string
    end_time: string
    assignees: string[]
  }) => {
    const venue = venuesState.find((item) => item.id === payload.venue_id)
    const shift: Shift = {
      id: createDemoId("shift"),
      title: payload.title,
      description: payload.description || "",
      venue_id: payload.venue_id,
      venue,
      shift_date: payload.shift_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      shift_assignees: payload.assignees
        .map((assigneeId) => {
          const assignedUser = usersState.find((item) => item.id === assigneeId)
          return assignedUser ? { user_id: assigneeId, user: assignedUser } : null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
      google_calendar_event_id: createDemoId("demo-cal"),
    }

    setShiftsState((prev) =>
      [...prev, shift].sort((a, b) =>
        a.shift_date === b.shift_date ? a.start_time.localeCompare(b.start_time) : a.shift_date.localeCompare(b.shift_date),
      ),
    )
  }

  const handleUpdateShift = (
    shiftId: string,
    payload: {
      title: string
      description?: string
      venue_id: string
      shift_date: string
      start_time: string
      end_time: string
      assignees: string[]
    },
  ) => {
    const venue = venuesState.find((item) => item.id === payload.venue_id)
    setShiftsState((prev) =>
      prev
        .map((shift) =>
          shift.id === shiftId
            ? {
                ...shift,
                title: payload.title,
                description: payload.description || "",
                venue_id: payload.venue_id,
                venue,
                shift_date: payload.shift_date,
                start_time: payload.start_time,
                end_time: payload.end_time,
                shift_assignees: payload.assignees
                  .map((assigneeId) => {
                    const assignedUser = usersState.find((item) => item.id === assigneeId)
                    return assignedUser ? { user_id: assigneeId, user: assignedUser } : null
                  })
                  .filter((item): item is NonNullable<typeof item> => item !== null),
              }
            : shift,
        )
        .sort((a, b) =>
          a.shift_date === b.shift_date ? a.start_time.localeCompare(b.start_time) : a.shift_date.localeCompare(b.shift_date),
        ),
    )
  }

  const handleDeleteShift = (shiftId: string) => {
    setShiftsState((prev) => prev.filter((shift) => shift.id !== shiftId))
  }

  const handleSaveUnavailability = (payload: { id?: string; start_date: string; end_date: string; reason?: string }) => {
    const existing = payload.id
    const currentUser = usersState.find((item) => item.id === user.id) || {
      id: user.id,
      email: user.email,
      full_name: profileState.full_name,
    }

    if (existing) {
      setUnavailabilitiesState((prev) =>
        prev
          .map((item) =>
            item.id === existing
              ? { ...item, start_date: payload.start_date, end_date: payload.end_date, reason: payload.reason || "" }
              : item,
          )
          .sort((a, b) => a.start_date.localeCompare(b.start_date)),
      )
      return
    }

    const nextItem: Unavailability = {
      id: createDemoId("unav"),
      user_id: user.id,
      start_date: payload.start_date,
      end_date: payload.end_date,
      reason: payload.reason || "",
      user: currentUser,
    }

    setUnavailabilitiesState((prev) => [...prev, nextItem].sort((a, b) => a.start_date.localeCompare(b.start_date)))
  }

  const handleDeleteUnavailability = (id: string) => {
    setUnavailabilitiesState((prev) => prev.filter((item) => item.id !== id))
  }

  const handleMembersChange = (nextMembers: Member[]) => {
    setMembersState(nextMembers)
  }

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
      <DashboardHeader user={user} profile={profileState} isDemo={isDemo} onProfileSaved={handleProfileSaved} />

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
                    shifts={shiftsState}
                    users={usersState}
                    unavailabilities={unavailabilitiesState}
                    selectedDate={selectedDate ?? undefined}
                    onSelectDay={setSelectedDate}
                  />
                ) : (
                  <ShiftsTableView shifts={shiftsState} unavailabilities={unavailabilitiesState} users={usersState} />
                )}
              </div>
              <div className="w-full max-w-2xl mx-auto">
                <ShiftsList
                  shifts={shiftsState}
                  venues={venuesState}
                  users={usersState}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  unavailabilities={unavailabilitiesState}
                  selectedDate={selectedDate ?? undefined}
                  onClearDate={() => setSelectedDate(null)}
                  isDemo={isDemo}
                  onCreateShift={handleCreateShift}
                  onUpdateShift={handleUpdateShift}
                  onDeleteShift={handleDeleteShift}
                  onSaveUnavailability={handleSaveUnavailability}
                  onDeleteUnavailability={handleDeleteUnavailability}
                />
              </div>
            </div>

            <div className="space-y-6 w-full max-w-xl mx-auto">
              <div className="w-full">
                <VenuesList
                  venues={venuesState}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  isDemo={isDemo}
                  onCreateVenue={handleCreateVenue}
                  onUpdateVenue={handleUpdateVenue}
                  onDeleteVenue={handleDeleteVenue}
                />
              </div>
              <div className="w-full">
                <MembersCard
                  members={membersState || []}
                  profiles={usersState || []}
                  currentUserEmail={user.email!}
                  isAdmin={isAdmin}
                  isDemo={isDemo}
                  onMembersChange={handleMembersChange}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
