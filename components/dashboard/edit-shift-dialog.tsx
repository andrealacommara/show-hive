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
  unavailabilities?: {
    id: string
    start_date: string
    end_date: string
    user?: { id: string; full_name?: string; email?: string }
  }[]
}

export function EditShiftDialog({ shift, venues, users, children, onDeleted, unavailabilities = [] }: EditShiftDialogProps) {
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
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Update failed")
      }
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
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-125 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Turno</DialogTitle>
          <DialogDescription>Aggiorna dettagli, assegnazioni e orari.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Locale</Label>
            <Select value={formData.venue_id} onValueChange={(value) => setFormData({ ...formData, venue_id: value })}>
              <SelectTrigger>
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
            <Label>Assegnati</Label>
            <div className="rounded-md border p-2">
              <ScrollArea className="max-h-40 pr-2">
                <div className="space-y-2">
                  {users.map((user) => {
                    const selected = formData.assignees.includes(user.id)
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => toggleAssignee(user.id)}
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
              type="date"
              value={formData.shift_date}
              onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Ora Inizio</Label>
              <Input
                id="start"
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
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" disabled={isLoading || isDeleting} className="w-full">
              {isLoading ? "Salvataggio..." : "Salva"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
              className="w-full"
            >
              {isDeleting ? "Eliminazione..." : "Elimina"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
