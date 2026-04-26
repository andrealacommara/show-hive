"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from "date-fns"
import { it } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, AlertCircle, Table as TableIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Shift = {
  id: string
  title: string
  description?: string
  shift_date: string
  start_time: string
  end_time: string
  venue?: { name?: string; city?: string }
  shift_assignees?: { user?: { id: string; full_name?: string; email?: string } }[]
}

type Unavailability = {
  id: string
  start_date: string
  end_date: string
  user?: { id: string; full_name?: string; email?: string }
  reason?: string
}

interface ShiftsTableViewProps {
  shifts: Shift[]
  unavailabilities?: Unavailability[]
  users?: { id: string; full_name?: string; email?: string }[]
}

export function ShiftsTableView({ shifts, unavailabilities = [], users = [] }: ShiftsTableViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const currentYear = currentMonth.getFullYear()
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        short: format(new Date(2024, i, 1), "MMM", { locale: it }),
        long: format(new Date(2024, i, 1), "MMMM", { locale: it }),
      })),
    [],
  )
  const years = useMemo(
    () => Array.from({ length: 7 }, (_, i) => currentYear - 3 + i),
    [currentYear],
  )

  const rows = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const monthDays = eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    })

    return monthDays
      .flatMap((day) =>
        shifts
          .filter((shift) => isSameMonth(parseISO(shift.shift_date), currentMonth) && shift.shift_date === day.toISOString().slice(0, 10))
          .sort((a, b) => a.start_time.localeCompare(b.start_time)),
      )
      .filter((shift) => {
        const assignees = shift.shift_assignees || []
        if (assigneeFilter === "all") return true
        if (assigneeFilter === "unassigned") return assignees.length === 0
        return assignees.some((a) => a.user?.id === assigneeFilter)
      })
      .map((shift) => {
        const assignees =
          shift.shift_assignees?.map(({ user }) => user?.full_name || user?.email || "Utente").filter(Boolean) || []

        const unavailable = (shift.shift_assignees || []).filter(({ user }) => {
          if (!user?.id) return false
          const date = parseISO(shift.shift_date)
          return unavailabilities.some(
            (u) =>
              u.user?.id === user.id &&
              date >= parseISO(u.start_date) &&
              date <= parseISO(u.end_date),
          )
        })

        return { shift, assignees, unavailable }
      })
  }, [shifts, unavailabilities, currentMonth, assigneeFilter])

  const unavailabilityRows = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return unavailabilities
      .filter((u) => {
        const start = parseISO(u.start_date)
        const end = parseISO(u.end_date)
        const matchesUser =
          assigneeFilter === "all" ||
          (assigneeFilter !== "unassigned" && u.user?.id === assigneeFilter)
        return matchesUser && end >= monthStart && start <= monthEnd
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  }, [unavailabilities, currentMonth, assigneeFilter])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 items-start">
          <div className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            <CardTitle className="text-lg sm:text-xl">Tabella turni</CardTitle>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between items-stretch">
            <div className="flex w-full items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select
                value={String(currentMonth.getMonth())}
                onValueChange={(value) => setCurrentMonth((prev) => new Date(prev.getFullYear(), Number(value), 1))}
              >
                <SelectTrigger className="h-8 text-xs sm:text-sm whitespace-nowrap w-full">
                  <SelectValue placeholder={format(currentMonth, "MMM", { locale: it })}>
                    <span className="sm:hidden">{format(currentMonth, "MMM", { locale: it })}</span>
                    <span className="hidden sm:inline">{format(currentMonth, "MMMM", { locale: it })}</span>
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
                onValueChange={(value) => setCurrentMonth((prev) => new Date(Number(value), prev.getMonth(), 1))}
              >
                <SelectTrigger className="h-8 text-xs sm:text-sm whitespace-nowrap w-full max-w-35">
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
                onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setCurrentMonth(new Date())}
            >
              Oggi
            </Button>
            <div className="w-full sm:w-auto">
              <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v)}>
                <SelectTrigger className="h-8 text-xs sm:text-sm w-full sm:w-50">
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
      <CardContent className="space-y-6">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="whitespace-nowrap">Orario</TableHead>
                <TableHead>Luogo</TableHead>
                <TableHead>Assegnati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Nessun turno pianificato
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ shift, assignees, unavailable }) => (
                  <TableRow key={shift.id} className="align-top">
                    <TableCell className="text-sm whitespace-nowrap">
                      <div className="font-semibold">
                        {format(parseISO(shift.shift_date), "EEE d MMM", { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-semibold">{shift.title}</div>
                      {shift.description && (
                        <div className="text-muted-foreground text-xs line-clamp-2">{shift.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                        <Clock className="h-3 w-3" />
                        {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {shift.venue?.name ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-40">{shift.venue.name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1 items-center">
                          {assignees.length === 0 ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              Non assegnato
                            </Badge>
                          ) : (
                            assignees.map((name, idx) => (
                              <Badge key={`${shift.id}-${idx}`} variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {name}
                              </Badge>
                            ))
                          )}
                          {unavailable.length > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1 text-[11px]">
                              <AlertCircle className="h-3 w-3" />
                              ND
                            </Badge>
                          )}
                        </div>
                        {unavailable.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            {unavailable.map((u, idx) => (
                              <Badge key={`${shift.id}-unav-${idx}`} variant="outline" className="text-[11px] border-amber-300 text-amber-800">
                                {u.user?.full_name || u.user?.email || "Utente indisponibile"}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Indisponibilità</h4>
            <Badge variant="outline">{unavailabilityRows.length}</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente</TableHead>
                <TableHead>Dal</TableHead>
                <TableHead>Al</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unavailabilityRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nessuna indisponibilità nel mese
                  </TableCell>
                </TableRow>
              ) : (
                unavailabilityRows.map((item) => (
                  <TableRow key={item.id} className="align-top">
                    <TableCell className="text-sm">{item.user?.full_name || item.user?.email || "Utente"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(parseISO(item.start_date), "d MMM", { locale: it })}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(parseISO(item.end_date), "d MMM", { locale: it })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-50">
                      {item.reason || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
