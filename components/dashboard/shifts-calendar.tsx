"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { it } from "date-fns/locale";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Shift {
  id: string;
  title: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  venue?: { name: string; address?: string };
  assigned_user?: { full_name?: string; email?: string };
  shift_assignees?: {
    user?: { id?: string; full_name?: string; email?: string };
  }[];
}

interface ShiftsCalendarProps {
  shifts: Shift[];
  users?: { id: string; full_name?: string; email?: string }[];
  unavailabilities?: {
    id: string;
    start_date: string;
    end_date: string;
    user?: { id: string; full_name?: string; email?: string };
  }[];
  selectedDate?: Date | null;
  onSelectDay?: (day: Date) => void;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function ShiftsCalendar({
  shifts,
  users = [],
  unavailabilities = [],
  selectedDate,
  onSelectDay,
}: ShiftsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const currentYear = currentMonth.getFullYear();
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const gridDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        short: format(new Date(2024, i, 1), "MMM", { locale: it }),
        long: format(new Date(2024, i, 1), "MMMM", { locale: it }),
      })),
    [],
  );
  const monthLabelShort = format(currentMonth, "MMM", { locale: it });
  const monthLabelFull = format(currentMonth, "MMMM", { locale: it });

  const getShiftsForDay = (day: Date) => {
    const inDay = shifts.filter((shift) =>
      isSameDay(parseLocalDate(shift.shift_date), day),
    );
    if (assigneeFilter === "all") return inDay;
    return inDay.filter((shift) => {
      const assignees = shift.shift_assignees || [];
      if (assigneeFilter === "unassigned") return assignees.length === 0;
      return assignees.some((a) => a.user?.id === assigneeFilter);
    });
  };

  const getUnavailabilitiesForDay = (day: Date) => {
    return unavailabilities.filter((unav) => {
      const matchesUser =
        assigneeFilter === "all" ||
        (assigneeFilter !== "unassigned" && unav.user?.id === assigneeFilter);
      return (
        matchesUser &&
        isWithinInterval(day, {
          start: parseLocalDate(unav.start_date),
          end: parseLocalDate(unav.end_date),
        })
      );
    });
  };

  const formatAssignees = (shift: Shift) => {
    const assignees = shift.shift_assignees
      ?.map(({ user }) => user?.full_name || user?.email)
      .filter(Boolean);
    if (assignees && assignees.length > 0) {
      return (
        assignees.slice(0, 2).join(", ") +
        (assignees.length > 2 ? " +" + (assignees.length - 2) : "")
      );
    }
    if (shift.assigned_user?.full_name || shift.assigned_user?.email) {
      return shift.assigned_user.full_name || shift.assigned_user.email;
    }
    return "Non assegnato";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 items-start">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <CardTitle className="text-lg sm:text-xl">
              Calendario Turni
            </CardTitle>
          </div>
          <div className="flex w-full flex-col gap-2 items-center sm:flex-row sm:items-center sm:justify-between">
            {/* SINISTRA */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Select
                value={String(currentMonth.getMonth())}
                onValueChange={(val) =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), Number(val), 1),
                  )
                }
              >
                <SelectTrigger className="h-8 w-auto min-w-20 sm:min-w-28 text-sm font-medium">
                  <SelectValue>
                    <span className="sm:hidden">{monthLabelShort}</span>
                    <span className="hidden sm:inline">{monthLabelFull}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="sm:hidden">{m.short}</span>
                      <span className="hidden sm:inline">{m.long}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(currentYear)}
                onValueChange={(val) =>
                  setCurrentMonth(
                    (prev) => new Date(Number(val), prev.getMonth(), 1),
                  )
                }
              >
                <SelectTrigger className="h-8 w-22 text-sm font-medium">
                  <SelectValue>{currentYear}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={() => {
                  const today = new Date();
                  setCurrentMonth(today);
                  onSelectDay?.(today);
                }}
              >
                Oggi
              </Button>
            </div>

            {/* DESTRA */}
            {users.length > 0 && (
              <div className="w-full sm:w-auto">
                <Select
                  value={assigneeFilter}
                  onValueChange={setAssigneeFilter}
                >
                  <SelectTrigger className="h-8 w-full sm:w-40 text-sm">
                    <SelectValue placeholder="Filtra per persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="unassigned">Non assegnati</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 sm:pt-0">
        {/* Intestazioni giorni */}
        <div className="grid grid-cols-7 mb-1">
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Griglia giorni */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {gridDays.map((day) => {
            const dayShifts = getShiftsForDay(day);
            const dayUnavs = getUnavailabilitiesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate
              ? isSameDay(day, selectedDate)
              : false;
            const hasContent = dayShifts.length > 0 || dayUnavs.length > 0;

            return (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDay?.(day)}
                className={cn(
                  "bg-background flex flex-col",
                  "min-h-10 sm:min-h-22.5",
                  "p-0.5 sm:p-1",
                  "gap-0.5",
                  !isCurrentMonth && "bg-muted/30",
                  onSelectDay &&
                    "cursor-pointer hover:bg-accent/30 transition-colors",
                  isSelected && "bg-blue-400/30",
                )}
              >
                {/* Numero del giorno */}
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium self-end flex items-center justify-center",
                    "w-5 h-5 rounded-full transition-colors",

                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isToday(day) && "bg-red-500 text-white",
                    isSelected && isToday(day) && "bg-red-500 text-white border border-black",
                    !isCurrentMonth && "text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* MOBILE: dot indicators */}
                <div className="sm:hidden flex flex-col items-center gap-0.5 pb-0.5">
                  {hasContent && (
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {dayUnavs.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      )}
                      {dayShifts.slice(0, 3).map((shift) => (
                        <span
                          key={shift.id}
                          className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                          title={shift.title}
                        />
                      ))}
                      {dayShifts.length > 3 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                      )}
                    </div>
                  )}
                </div>

                {/* DESKTOP: testo completo */}
                <div className="hidden sm:flex flex-col gap-0.5">
                  {dayUnavs.map((unav) => (
                    <div
                      key={unav.id}
                      className="text-[10px] rounded px-1 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 truncate"
                      title={`${unav.user?.full_name || unav.user?.email || "Utente"} — indisponibile`}
                    >
                      {unav.user?.full_name || unav.user?.email || "N/D"}
                    </div>
                  ))}
                  {dayShifts.slice(0, 3).map((shift) => (
                    <div
                      key={shift.id}
                      className="text-[10px] rounded px-1 py-0.5 bg-primary/10 text-primary truncate"
                      title={`${shift.title} — ${formatAssignees(shift)}`}
                    >
                      <span className="font-medium">
                        {shift.start_time.slice(0, 5)}{" "}
                      </span>
                      {shift.title}
                    </div>
                  ))}
                  {dayShifts.length > 3 && (
                    <div className="text-[9px] text-muted-foreground px-1">
                      +{dayShifts.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda mobile */}
        <div className="sm:hidden flex items-center gap-3 mt-2 px-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Turno
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Indisponibile
          </span>
          <span className="ml-auto italic">Tocca un giorno per i dettagli</span>
        </div>
      </CardContent>
    </Card>
  );
}
