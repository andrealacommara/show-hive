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
import { Plus } from "lucide-react"
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
  unavailabilities?: {
    id: string
    start_date: string
    end_date: string
    user?: { id: string; full_name?: string; email?: string }
  }[]
}

export function CreateShiftDialog({ venues, users, shifts, currentUserId, unavailabilities = [] }: CreateShiftDialogProps) {
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
    const day = new Date(formData.shift_date)
    const set = new Set<string>()
    unavailabilities.forEach((u) => {
      const start = new Date(u.start_date)
      const end = new Date(u.end_date)
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

    try {
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                      <Badge variant="outline" className="text-[10px]">
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

          <div className="space-y-2">
            <Label>Assegna a (multipli)</Label>
            <div className="rounded-md border p-2">
              <ScrollArea className="max-h-40 pr-2">
                <div className="space-y-2">
                  {users.map((user) => {
                    const selected = formData.assignees.includes(user.id)
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            assignees: selected
                              ? prev.assignees.filter((id) => id !== user.id)
                              : [...prev.assignees, user.id],
                          }))
                        }
                        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                          selected ? "border-primary bg-primary/5" : "hover:bg-muted"
                        } ${unavailableMap.has(user.id) && formData.shift_date ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={unavailableMap.has(user.id) && formData.shift_date.length > 0}
                      >
                        <span>{user.full_name || user.email}</span>
                        <div className="flex items-center gap-2">
                          {unavailableMap.has(user.id) && formData.shift_date && (
                            <Badge variant="destructive" className="text-[10px]">
                              ND
                            </Badge>
                          )}
                          {selected && <Badge variant="secondary">Selezionato</Badge>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
              {formData.assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.assignees.map((id) => {
                    const user = users.find((u) => u.id === id)
                    if (!user) return null
                    return <Badge key={id}>{user.full_name || user.email}</Badge>
                  })}
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
