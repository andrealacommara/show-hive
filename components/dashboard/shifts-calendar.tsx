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
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i); // 3 anni prima/dopo

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
    []
  );
  const monthLabelShort = format(currentMonth, "MMM", { locale: it });
  const monthLabelFull = format(currentMonth, "MMMM", { locale: it });

  const getShiftsForDay = (day: Date) => {
    const inDay = shifts.filter((shift) =>
      isSameDay(new Date(shift.shift_date), day)
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
          start: new Date(unav.start_date),
          end: new Date(unav.end_date),
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
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between items-stretch">
            {/* --- NAVIGAZIONE + MESE / ANNO --- */}
            <div className="flex w-full items-center gap-2">
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
                onValueChange={(value) =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), Number(value), 1)
                  )
                }
              >
                <SelectTrigger className="h-8 text-xs sm:text-sm whitespace-nowrap w-full">
                  <SelectValue placeholder={monthLabelShort}>
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
                onValueChange={(value) =>
                  setCurrentMonth(
                    (prev) => new Date(Number(value), prev.getMonth(), 1)
                  )
                }
              >
                <SelectTrigger className="h-8 text-xs sm:text-sm whitespace-nowrap w-full max-w-[140px]">
                  <SelectValue placeholder={currentYear}>
                    {currentYear}
                  </SelectValue>
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
            </div>

            {/* --- BOTTONE OGGI --- */}
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                onSelectDay?.(today);
              }}
            >
              Oggi
            </Button>

            {/* --- SELECT FILTRO UTENTI --- */}
            <div className="w-full sm:w-auto">
              <Select
                value={assigneeFilter}
                onValueChange={(v) => setAssigneeFilter(v)}
              >
                <SelectTrigger className="h-8 text-xs sm:text-sm w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtro utenti" />
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
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
            <div
              key={day}
              className="text-center text-[11px] sm:text-sm font-medium text-muted-foreground pb-1 sm:pb-2"
            >
              {day}
            </div>
          ))}

          {gridDays.map((day) => {
            const dayShifts = getShiftsForDay(day);
            const dayUnavailabilities = getUnavailabilitiesForDay(day);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate
              ? isSameDay(day, selectedDate)
              : false;
            const inMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[56px] sm:min-h-[68px] p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-colors flex flex-col gap-1.5",
                  isCurrentDay
                    ? "bg-green-50 border-green-300 text-green-700"
                    : isSelected
                    ? "bg-primary/15 border-primary text-primary font-semibold"
                    : "bg-background",
                  !inMonth && "opacity-50",
                  "hover:bg-accent"
                )}
                onClick={() => onSelectDay?.(day)}
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold">
                  <span className="text-sm sm:text-base">
                    {format(day, "d")}
                  </span>
                  <div className="flex items-center gap-1">
                    {dayUnavailabilities.length > 0 && (
                      <span className="inline-flex h-3 w-3 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-[7px] sm:text-[10px] leading-none font-semibold">
                        {dayUnavailabilities.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  {dayShifts.length > 0 && (
                    <span className="inline-flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-red-500 text-white text-[9px] sm:text-[11px] font-semibold">
                      {dayShifts.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
