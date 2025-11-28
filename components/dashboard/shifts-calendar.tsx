"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
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
  addMonths,
  subMonths,
} from "date-fns"
import { it } from "date-fns/locale"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  selectedDate?: Date | null
  onSelectDay?: (day: Date) => void
}

export function ShiftsCalendar({ shifts, selectedDate, onSelectDay }: ShiftsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())
  const currentYear = currentMonth.getFullYear()
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i) // 3 anni prima/dopo

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth])
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth])
  const gridDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [monthStart, monthEnd])
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        short: format(new Date(2024, i, 1), "MMM", { locale: it }),
        long: format(new Date(2024, i, 1), "MMMM", { locale: it }),
      })),
    [],
  )
  const monthLabelShort = format(currentMonth, "MMM", { locale: it })
  const monthLabelFull = format(currentMonth, "MMMM", { locale: it })

  const getShiftsForDay = (day: Date) => {
    return shifts.filter((shift) => isSameDay(new Date(shift.shift_date), day))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 items-start">
          <CardTitle className="flex items-center gap-2 shrink-0 text-left">
            <CalendarIcon className="h-5 w-5" />
            Calendario Turni
          </CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-start items-center">
            <div className="flex w-full items-center sm:items-center gap-2 justify-center sm:justify-start">
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
                  setCurrentMonth((prev) => new Date(prev.getFullYear(), Number(value), prev.getDate()))
                }
              >
                <SelectTrigger className="min-w-10 sm:min-w-[140px] h-8 text-xs sm:text-sm whitespace-nowrap">
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
                  setCurrentMonth((prev) => new Date(Number(value), prev.getMonth(), prev.getDate()))
                }
              >
                <SelectTrigger className="min-w-10 max-w-[140px] h-8 text-xs sm:text-sm whitespace-nowrap">
                  <SelectValue placeholder={currentYear}>{currentYear}</SelectValue>
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
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                const today = new Date()
                setCurrentMonth(today)
                onSelectDay?.(today)
              }}
            >
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

          {gridDays.map((day) => {
            const dayShifts = getShiftsForDay(day)
            const isCurrentDay = isToday(day)
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
            const inMonth = isSameMonth(day, currentMonth)

            return (
              <div
                key={day.toString()}
                className={cn(
                  "aspect-square p-2 rounded-lg border cursor-pointer transition-colors flex flex-col items-center justify-center gap-1",
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
                <div className="text-xs sm:text-sm font-medium">{format(day, "d")}</div>
                <div
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] leading-none font-semibold transition-opacity border",
                    dayShifts.length > 0 ? "bg-red-500 text-white border-white opacity-100" : "opacity-0 border-transparent"
                  )}
                >
                  {dayShifts.length || ""}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
