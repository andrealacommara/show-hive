"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

interface Venue {
  id: string
  name: string
}

interface User {
  id: string
  full_name?: string
  email: string
}

interface Shift {
  id: string
  title: string
  description?: string
  venue_id: string
  shift_date: string
  start_time: string
  end_time: string
  shift_assignees?: { user: User }[]
}

interface EditShiftDialogProps {
  shift: Shift
  venues: Venue[]
  users: User[]
  children: React.ReactNode
  onDeleted?: (id: string) => void
  currentUserId?: string
  isDemo?: boolean
  onUpdateShift?: (id: string, payload: {
    title: string
    description?: string
    venue_id: string
    shift_date: string
    start_time: string
    end_time: string
    assignees: string[]
  }) => void
  onDeleteShift?: (id: string) => void
  unavailabilities?: {
    id: string
    start_date: string
    end_date: string
    user?: { id: string; full_name?: string; email?: string }
  }[]
}

export function EditShiftDialog({
  shift,
  venues,
  users,
  children,
  onDeleted,
  currentUserId,
  isDemo = false,
  onUpdateShift,
  onDeleteShift,
  unavailabilities = [],
}: EditShiftDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    title: shift.title,
    description: shift.description || "",
    venue_id: shift.venue_id,
    shift_date: shift.shift_date,
    start_time: shift.start_time,
    end_time: shift.end_time,
    assignees: (shift.shift_assignees || []).map((a) => a.user.id),
  })
  const [error, setError] = useState<string | null>(null)

  const unavailableMap = useMemo(() => {
    if (!formData.shift_date) return new Set<string>()
    const day = parseLocalDate(formData.shift_date)
    const set = new Set<string>()
    unavailabilities.forEach((u) => {
      const start = parseLocalDate(u.start_date)
      const end = parseLocalDate(u.end_date)
      if (day >= start && day <= end && u.user?.id) {
        set.add(u.user.id)
      }
    })
    return set
  }, [formData.shift_date, unavailabilities])

  const toggleAssignee = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(id)
        ? prev.assignees.filter((item) => item !== id)
        : [...prev.assignees, id],
    }))
  }

  const handleDelete = async () => {
    if (!confirm("Eliminare questo turno?")) return
    if (isDemo) {
      onDeleteShift?.(shift.id)
      onDeleted?.(shift.id)
      setOpen(false)
      return
    }
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Delete failed")
      }
      onDeleted?.(shift.id)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Delete shift failed", error)
      alert("Impossibile eliminare il turno")
    } finally {
      setIsDeleting(false)
    }
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
        onUpdateShift?.(shift.id, {
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
        })
        setOpen(false)
        return
      }

      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Update failed")
      }
      onUpdateShift?.(shift.id, {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Update shift failed", error)
      setError((error as Error).message || "Impossibile aggiornare il turno")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Turno</DialogTitle>
          <DialogDescription>Aggiorna il turno mantenendo la stessa struttura della creazione.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titolo Turno</Label>
            <Input
              id="edit-title"
              name="title"
              placeholder="es. Turno Serale"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrizione (opzionale)</Label>
            <Textarea
              id="edit-description"
              name="description"
              placeholder="Note aggiuntive sul turno..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-venue">Locale</Label>
            <Select
              value={formData.venue_id}
              onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
            >
              <SelectTrigger id="edit-venue" name="venue">
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

          {/* Assignee picker */}
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
                        onClick={() => !unavailable && toggleAssignee(user.id)}
                        disabled={unavailable}
                        className={`
                          w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors
                          ${selected ? "bg-primary/8 text-foreground" : "hover:bg-muted"}
                          ${unavailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                        `}
                      >
                        <span
                          className={`
                            flex h-4 w-4 shrink-0 items-center justify-center rounded border
                            ${selected ? "bg-primary border-primary text-primary-foreground" : "border-input"}
                          `}
                        >
                          {selected && <Check className="h-2.5 w-2.5" />}
                        </span>

                        <span className="flex-1 truncate min-w-0">
                          {user.full_name || user.email}
                        </span>

                        {isMe && (
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 text-muted-foreground">
                            tu
                          </Badge>
                        )}

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
                              onClick={() => toggleAssignee(id)}
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
            <Label htmlFor="edit-date">Data</Label>
            <Input
              id="edit-date"
              name="shift_date"
              type="date"
              value={formData.shift_date}
              onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Ora Inizio</Label>
              <Input
                id="edit-start"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">Ora Fine</Label>
              <Input
                id="edit-end"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
            >
              {isDeleting ? "Eliminazione..." : "Elimina"}
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading || isDeleting}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading || isDeleting}>
                {isLoading ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
