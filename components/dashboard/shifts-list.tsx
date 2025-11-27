"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, User, Calendar, Filter } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CreateShiftDialog } from "./create-shift-dialog"
import { ShiftActions } from "./shift-actions"

interface Shift {
  id: string
  title: string
  description?: string
  shift_date: string
  start_time: string
  end_time: string
  venue?: { id: string; name: string; address?: string; city?: string }
  assigned_user?: { id: string; full_name?: string; email?: string }
  shift_assignees?: { user: { id: string; full_name?: string; email?: string } }[]
  google_calendar_event_id?: string
}

interface Venue {
  id: string
  name: string
}

interface ShiftsListProps {
  shifts: Shift[]
  venues: Venue[]
  users: any[]
  currentUserId: string
}

export function ShiftsList({ shifts, venues, users, currentUserId }: ShiftsListProps) {
  const [selectedVenue, setSelectedVenue] = useState<string | "all">("all")
  const [selectedUser, setSelectedUser] = useState<string | "all">("all")
  const [onlyMine, setOnlyMine] = useState(false)

  const upcomingShifts = useMemo(
    () => shifts.filter((shift) => new Date(shift.shift_date) >= new Date()),
    [shifts],
  )

  const filteredShifts = useMemo(() => {
    return upcomingShifts.filter((shift) => {
      const matchesVenue = selectedVenue === "all" || shift.venue?.id === selectedVenue
      const matchesUser =
        selectedUser === "all"
          ? true
          : selectedUser === "unassigned"
            ? (shift.shift_assignees?.length || 0) === 0
            : (shift.shift_assignees || []).some((a) => a.user?.id === selectedUser)
      const matchesMine =
        !onlyMine || (shift.shift_assignees || []).some((a) => a.user?.id === currentUserId)

      return matchesVenue && matchesUser && matchesMine
    })
  }, [upcomingShifts, selectedVenue, selectedUser, onlyMine, currentUserId])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prossimi Turni
          </CardTitle>
          <CreateShiftDialog venues={venues} users={users} currentUserId={currentUserId} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtra</span>
          </div>
          <Select value={selectedUser} onValueChange={(value) => setSelectedUser(value as typeof selectedUser)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Utente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli utenti</SelectItem>
              <SelectItem value="unassigned">Non assegnati</SelectItem>
              <SelectItem value={currentUserId}>Assegnati a me</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedVenue}
            onValueChange={(value) => setSelectedVenue(value as typeof selectedVenue)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Locale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i locali</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={onlyMine ? "default" : "outline"}
            className="md:col-span-3"
            onClick={() => setOnlyMine((prev) => !prev)}
            size="sm"
          >
            {onlyMine ? "Mostra tutti i turni" : "Mostra solo i miei turni"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredShifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nessun turno programmato</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShifts.map((shift) => (
              <div key={shift.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{shift.title}</h3>
                    {shift.description && <p className="text-sm text-muted-foreground mt-1">{shift.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {shift.google_calendar_event_id && <Badge variant="secondary">Su Calendar</Badge>}
                    <ShiftActions shiftId={shift.id} />
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(shift.shift_date), "EEEE d MMMM yyyy", { locale: it })}</span>
                    <span className="font-medium">
                      {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                    </span>
                  </div>

                  {shift.venue && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {shift.venue.name}
                        {shift.venue.city && `, ${shift.venue.city}`}
                      </span>
                    </div>
                  )}

                  {shift.shift_assignees && shift.shift_assignees.length > 0 && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <User className="h-4 w-4 mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {shift.shift_assignees.map(({ user }) => (
                          <Badge key={user.id} variant="secondary">
                            {user.full_name || user.email}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
