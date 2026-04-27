"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface Venue {
  id: string
  name: string
}

interface User {
  id: string
  full_name?: string
  email: string
}

interface ShiftTemplate {
  id: string
  title: string
  description?: string
  shift_date?: string
  start_time?: string
  end_time?: string
  venue_id?: string
  venue?: { id: string; name: string }
  shift_assignees?: { user?: { id: string } }[]
}

interface CreateShiftDialogProps {
  venues: Venue[]
  users: User[]
  shifts: ShiftTemplate[]
  currentUserId: string
  isDemo?: boolean
  onCreateShift?: (payload: {
    title: string
    description?: string
    venue_id: string
    shift_date: string
    start_time: string
    end_time: string
    assignees: string[]
  }) => void
  unavailabilities?: {
    id: string
    start_date: string
    end_date: string
    user?: { id: string; full_name?: string; email?: string }
  }[]
}

export function CreateShiftDialog({
  venues,
  users,
  shifts,
  currentUserId,
  isDemo = false,
  onCreateShift,
  unavailabilities = [],
}: CreateShiftDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue_id: "",
    assignees: [] as string[],
    shift_date: "",
    start_time: "",
    end_time: "",
  })
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const unavailableMap = useMemo(() => {
    if (!formData.shift_date) return new Set<string>()
    // Parse as local date to avoid UTC offset issues
    const [y, m, d] = formData.shift_date.split("-").map(Number)
    const day = new Date(y, (m ?? 1) - 1, d ?? 1)
    const set = new Set<string>()
    unavailabilities.forEach((u) => {
      const [sy, sm, sd] = u.start_date.split("-").map(Number)
      const [ey, em, ed] = u.end_date.split("-").map(Number)
      const start = new Date(sy, (sm ?? 1) - 1, sd ?? 1)
      const end = new Date(ey, (em ?? 1) - 1, ed ?? 1)
      if (day >= start && day <= end && u.user?.id) {
        set.add(u.user.id)
      }
    })
    return set
  }, [formData.shift_date, unavailabilities])

  const matchingTemplates = useMemo(() => {
    const query = formData.title.trim().toLowerCase()
    if (!query || query.length < 2) return []

    const seenTitles = new Set<string>()
    const matches: ShiftTemplate[] = []

    for (const shift of shifts) {
      const title = shift.title?.trim()
      if (!title) continue
      const normalized = title.toLowerCase()
      if (!normalized.startsWith(query)) continue
      if (seenTitles.has(normalized)) continue
      seenTitles.add(normalized)
      matches.push(shift)
    }

    return matches.slice(0, 5)
  }, [formData.title, shifts])

  const applyTemplate = (shift: ShiftTemplate) => {
    setFormData((prev) => ({
      ...prev,
      title: shift.title || prev.title,
      description: shift.description || "",
      venue_id: shift.venue_id || "",
      start_time: shift.start_time || "",
      end_time: shift.end_time || "",
      shift_date: prev.shift_date || shift.shift_date || "",
      assignees:
        (shift.shift_assignees?.map(({ user }) => user?.id).filter(Boolean) as string[] | undefined) ||
        [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!formData.title.trim()) {
      setError("Il titolo è obbligatorio")
      setIsLoading(false)
      return
    }
    if (!formData.venue_id) {
      setError("Seleziona un venue")
      setIsLoading(false)
      return
    }
    if (!formData.shift_date) {
      setError("Seleziona una data")
      setIsLoading(false)
      return
    }
    if (!formData.start_time) {
      setError("Seleziona l'orario di inizio")
      setIsLoading(false)
      return
    }
    if (!formData.end_time) {
      setError("Seleziona l'orario di fine")
      setIsLoading(false)
      return
    }

    try {
      if (isDemo) {
        onCreateShift?.({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
        })
        setOpen(false)
        setFormData({
          title: "",
          description: "",
          venue_id: "",
          assignees: [],
          shift_date: "",
          start_time: "",
          end_time: "",
        })
        return
      }

      const response = await fetch("/api/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          assignees: formData.assignees,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create shift")
      }

      setOpen(false)
      setFormData({
        title: "",
        description: "",
        venue_id: "",
        assignees: [],
        shift_date: "",
        start_time: "",
        end_time: "",
      })
      router.refresh()
    } catch (error) {
      console.error("[app] Error creating shift:", error)
      setError((error as Error).message || "Errore durante la creazione del turno")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Turno</DialogTitle>
          <DialogDescription>Aggiungi un nuovo turno e assegnalo a un membro del team</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo Turno</Label>
            <Input
              id="title"
              name="title"
              placeholder="es. Turno Serale"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {matchingTemplates.length > 0 && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  Suggerimenti da eventi esistenti
                </p>
                <div className="flex flex-col gap-1">
                  {matchingTemplates.map((shift) => (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => applyTemplate(shift)}
                      className="flex w-full items-start justify-between rounded-md px-2 py-1 text-left transition hover:bg-background"
                    >
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-foreground">{shift.title}</span>
                        <div className="text-[11px] text-muted-foreground">
                          {shift.venue?.name && <span>{shift.venue.name}</span>}
                          {shift.start_time && shift.end_time && (
                            <span className="ml-1">
                              {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                        Compila
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Note aggiuntive sul turno..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Locale</Label>
            <Select
              value={formData.venue_id}
              onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
              required
            >
              <SelectTrigger id="venue" name="venue">
                <SelectValue placeholder="Seleziona un locale" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Assignee picker ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Assegna a (multipli)</Label>
              {formData.assignees.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formData.assignees.length} selezionat{formData.assignees.length === 1 ? "o" : "i"}
                </span>
              )}
            </div>

            <div className="rounded-md border">
              {/* Scrollable list — fixed height so it never stretches the dialog */}
              <ScrollArea className="h-44">
                <div className="p-1 space-y-0.5">
                  {users.map((user) => {
                    const selected = formData.assignees.includes(user.id)
                    const unavailable = unavailableMap.has(user.id) && formData.shift_date.length > 0
                    const isMe = user.id === currentUserId

                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() =>
                          !unavailable &&
                          setFormData((prev) => ({
                            ...prev,
                            assignees: selected
                              ? prev.assignees.filter((id) => id !== user.id)
                              : [...prev.assignees, user.id],
                          }))
                        }
                        disabled={unavailable}
                        className={`
                          w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors
                          ${selected ? "bg-primary/8 text-foreground" : "hover:bg-muted"}
                          ${unavailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                        `}
                      >
                        {/* Checkbox-style indicator */}
                        <span
                          className={`
                            flex h-4 w-4 shrink-0 items-center justify-center rounded border
                            ${selected ? "bg-primary border-primary text-primary-foreground" : "border-input"}
                          `}
                        >
                          {selected && <Check className="h-2.5 w-2.5" />}
                        </span>

                        {/* Name — truncated, never wraps */}
                        <span className="flex-1 truncate min-w-0">
                          {user.full_name || user.email}
                        </span>

                        {/* "Tu" badge — always visible for the current user */}
                        {isMe && (
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 text-muted-foreground">
                            tu
                          </Badge>
                        )}

                        {/* Unavailability badge */}
                        {unavailable && (
                          <Badge variant="destructive" className="shrink-0 text-[10px] px-1 py-0">
                            ND
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Selected summary — shown below the list when at least one is chosen */}
              {formData.assignees.length > 0 && (
                <div className="border-t px-2 py-1.5">
                  <ScrollArea className="max-h-16">
                    <div className="flex flex-wrap gap-1">
                      {formData.assignees.map((id) => {
                        const user = users.find((u) => u.id === id)
                        if (!user) return null
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="flex items-center gap-1 text-xs pr-1"
                          >
                            <span className="max-w-30 truncate">
                              {user.full_name || user.email}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  assignees: prev.assignees.filter((a) => a !== id),
                                }))
                              }
                              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="shift_date"
              type="date"
              value={formData.shift_date}
              onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Ora Inizio</Label>
              <Input
                id="start"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Ora Fine</Label>
              <Input
                id="end"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creazione..." : "Crea Turno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
