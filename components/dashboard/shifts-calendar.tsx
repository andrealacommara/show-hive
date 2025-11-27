"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns"
import { it } from "date-fns/locale"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Shift {
  id: string
  title: string
  shift_date: string
  start_time: string
  end_time: string
  venue?: { name: string; address?: string }
  assigned_user?: { full_name?: string }
}

interface ShiftsCalendarProps {
  shifts: Shift[]
}

export function ShiftsCalendar({ shifts }: ShiftsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth])
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth])
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  )

  const getShiftsForDay = (day: Date) => {
    return shifts.filter((shift) => isSameDay(new Date(shift.shift_date), day))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 shrink-0">
            <CalendarIcon className="h-5 w-5" />
            Calendario Turni
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: it })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Oggi
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground pb-2">
              {day}
            </div>
          ))}

          {daysInMonth.map((day) => {
            const dayShifts = getShiftsForDay(day)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-20 sm:min-h-24 p-2 rounded-lg border",
                  isCurrentDay ? "bg-primary/5 border-primary" : "bg-background",
                  !isSameMonth(day, currentMonth) && "opacity-50",
                )}
              >
                <div className={cn("text-xs sm:text-sm font-medium mb-1", isCurrentDay && "text-primary font-bold")}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayShifts.slice(0, 3).map((shift) => (
                    <div key={shift.id} className="text-[11px] sm:text-xs p-1 bg-blue-50 rounded border-l-2 border-blue-500">
                      <div className="font-medium truncate">{shift.title}</div>
                      <div className="text-muted-foreground truncate">{shift.start_time?.slice(0, 5)}</div>
                    </div>
                  ))}
                  {dayShifts.length > 3 && (
                    <div className="text-[11px] sm:text-xs text-muted-foreground">+{dayShifts.length - 3} altri</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
