"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin, User, Calendar, Filter, Pencil } from "lucide-react";
import { format, startOfDay, isSameDay, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";
import { CreateShiftDialog } from "./create-shift-dialog";
import { EditShiftDialog } from "./edit-shift-dialog";
import { MarkUnavailableDialog } from "./mark-unavailable-dialog";

interface Shift {
  id: string;
  title: string;
  description?: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  venue_id: string;
  venue?: { id: string; name: string; address?: string; city?: string };
  assigned_user?: { id: string; full_name?: string; email?: string };
  shift_assignees?: {
    user: { id: string; full_name?: string; email?: string };
  }[];
  google_calendar_event_id?: string;
}

interface Venue {
  id: string;
  name: string;
}

interface ShiftsListProps {
  shifts: Shift[];
  venues: Venue[];
  users: any[];
  currentUserId: string;
  isAdmin?: boolean;
  unavailabilities?: {
    id: string;
    start_date: string;
    end_date: string;
    reason?: string;
    user?: { id: string; full_name?: string; email?: string };
  }[];
  selectedDate?: Date | null;
  onClearDate?: () => void;
}

export function ShiftsList({
  shifts,
  venues,
  users,
  currentUserId,
  isAdmin = false,
  unavailabilities = [],
  selectedDate,
  onClearDate,
}: ShiftsListProps) {
  const [selectedVenue, setSelectedVenue] = useState<string | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [localShifts, setLocalShifts] = useState<Shift[]>(shifts);

  useEffect(() => {
    setLocalShifts(shifts);
  }, [shifts]);

  const upcomingShifts = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    return localShifts.filter((shift) => {
      const shiftDay = startOfDay(new Date(shift.shift_date)).getTime();
      return shiftDay >= today;
    });
  }, [localShifts]);

  const filteredShifts = useMemo(() => {
    const base = selectedDate
      ? localShifts.filter((shift) =>
          isSameDay(new Date(shift.shift_date), selectedDate)
        )
      : upcomingShifts;

    return base.filter((shift) => {
      const matchesVenue =
        selectedVenue === "all" || shift.venue?.id === selectedVenue;
      const assignees = shift.shift_assignees || [];
      const matchesAssignee =
        assigneeFilter === "all"
          ? true
          : assigneeFilter === "unassigned"
          ? assignees.length === 0
          : assigneeFilter === "me"
          ? assignees.some((a) => a.user?.id === currentUserId)
          : assignees.some((a) => a.user?.id === assigneeFilter);

      return matchesVenue && matchesAssignee;
    });
  }, [
    upcomingShifts,
    selectedVenue,
    assigneeFilter,
    currentUserId,
    selectedDate,
    localShifts,
  ]);

  const unavailableOnSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return unavailabilities.filter((unav) =>
      isWithinInterval(selectedDate, {
        start: new Date(unav.start_date),
        end: new Date(unav.end_date),
      })
    );
  }, [selectedDate, unavailabilities]);

  const handleDeleted = (id: string) => {
    setLocalShifts((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-5 w-5" />
              Eventi
            </CardTitle>
            <div className="hidden sm:flex gap-2">
              <CreateShiftDialog
                shifts={shifts}
                venues={venues}
                users={users}
                unavailabilities={unavailabilities}
                currentUserId={currentUserId}
              />
            </div>
            <div className="sm:hidden">
              <CreateShiftDialog
                shifts={shifts}
                venues={venues}
                users={users}
                unavailabilities={unavailabilities}
                currentUserId={currentUserId}
              />
            </div>
          </div>
          <div className="flex w-full justify-center">
            <MarkUnavailableDialog unavailabilities={unavailabilities} currentUserId={currentUserId} />
          </div>
        </div>
        {selectedDate && (
          <div className="flex flex-row justify-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
            <span>
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
            </span>
            {onClearDate && (
              <button
                type="button"
                onClick={onClearDate}
                className="text-xs underline text-primary hover:text-primary/80"
              >
                Mostra tutti
              </button>
            )}
          </div>
        )}
        {selectedDate && unavailableOnSelectedDay.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <span className="font-semibold">Indisponibili:</span>
            {unavailableOnSelectedDay.map((unav) => (
              <Badge key={unav.id} variant="outline" className="text-amber-800 border-amber-300">
                {unav.user?.full_name || unav.user?.email || "Utente"}
                {unav.reason ? ` · ${unav.reason}` : ""}
              </Badge>
            ))}
          </div>
        )}
        <div className="grid w-full gap-3 sm:grid-cols-[auto,1fr,1fr] items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtra</span>
          </div>
          <Select
            value={assigneeFilter}
            onValueChange={(value) => setAssigneeFilter(value)}
          >
            <SelectTrigger className="text-sm w-full">
              <SelectValue placeholder="Utente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli utenti</SelectItem>
              <SelectItem value="unassigned">Non assegnati</SelectItem>
              <SelectItem value="me">Assegnati a me</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedVenue}
            onValueChange={(value) =>
              setSelectedVenue(value as typeof selectedVenue)
            }
          >
            <SelectTrigger className="text-sm w-full">
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
              <div
                key={shift.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{shift.title}</h3>
                    {shift.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {shift.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(isAdmin ||
                      (shift.shift_assignees || []).some(
                        (a) => a.user?.id === currentUserId
                      )) && (
                      <EditShiftDialog
                        shift={shift as any}
                        venues={venues}
                        users={users}
                        unavailabilities={unavailabilities}
                        onDeleted={handleDeleted}
                      >
                        <button
                          type="button"
                          className="rounded p-2 hover:bg-accent text-muted-foreground"
                          aria-label="Modifica turno"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </EditShiftDialog>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(shift.shift_date), "EEEE d MMMM yyyy", {
                        locale: it,
                      })}
                    </span>
                    <span className="font-medium">
                      {shift.start_time?.slice(0, 5)} -{" "}
                      {shift.end_time?.slice(0, 5)}
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

                  {shift.shift_assignees &&
                    shift.shift_assignees.length > 0 && (
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
  );
}
