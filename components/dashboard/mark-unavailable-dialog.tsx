"use client"

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
import { CalendarX } from "lucide-react"
import { useRouter } from "next/navigation"

interface Unavailability {
  id: string
  start_date: string
  end_date: string
  reason?: string
  user?: { id: string; full_name?: string; email?: string }
}

interface Props {
  unavailabilities: Unavailability[]
  currentUserId: string
}

export function MarkUnavailableDialog({ unavailabilities, currentUserId }: Props) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const myUnavailabilities = useMemo(
    () => unavailabilities.filter((u) => u.user?.id === currentUserId),
    [unavailabilities, currentUserId],
  )

  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const activeOrUpcomingUnavailabilities = useMemo(() => {
    const toDate = (value: string) => {
      const [year, month, day] = value.split("-").map(Number)
      return new Date(year, (month ?? 1) - 1, day ?? 1)
    }

    return myUnavailabilities.filter((item) => toDate(item.end_date) >= today)
  }, [myUnavailabilities, today])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.start_date || !form.end_date) {
      setError("Seleziona un intervallo di date")
      return
    }
    if (new Date(form.start_date) > new Date(form.end_date)) {
      setError("La data di fine non può precedere l'inizio")
      return
    }

    setIsLoading(true)
    try {
      const endpoint = editingId ? `/api/unavailabilities/${editingId}` : "/api/unavailabilities"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Errore nel salvataggio")
      }

      setForm({ start_date: "", end_date: "", reason: "" })
      setEditingId(null)
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error("[unavailabilities] save error", err)
      setError((err as Error).message || "Non siamo riusciti a salvare l'indisponibilità")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: Unavailability) => {
    setEditingId(item.id)
    setForm({
      start_date: item.start_date,
      end_date: item.end_date,
      reason: item.reason || "",
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/unavailabilities/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Errore nella cancellazione")
      }
      router.refresh()
    } catch (err) {
      console.error("[unavailabilities] delete error", err)
      setError((err as Error).message || "Errore nella cancellazione")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <CalendarX className="h-4 w-4" />
          Gestisci indisponibilità
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{editingId ? "Modifica indisponibilità" : "Segna indisponibilità"}</DialogTitle>
          <DialogDescription>Indica le date in cui non puoi coprire turni.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Dal</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Al</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Note (opzionale)</Label>
            <Textarea
              id="reason"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Motivo o note (facoltativo)"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setEditingId(null)
              }}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvataggio..." : editingId ? "Aggiorna" : "Salva"}
            </Button>
          </div>
        </form>

        {activeOrUpcomingUnavailabilities.length > 0 && (
          <div className="space-y-2 border-t pt-3 mt-3">
            <h4 className="text-sm font-semibold">Le mie indisponibilità</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeOrUpcomingUnavailabilities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-md border bg-muted/60 px-2 py-2"
                >
                  <div className="text-xs leading-tight space-y-1">
                    <div className="font-semibold">
                      {item.start_date} → {item.end_date}
                    </div>
                    {item.reason && <div className="text-muted-foreground">{item.reason}</div>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => handleEdit(item)}
                      disabled={isLoading}
                    >
                      Modifica
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => handleDelete(item.id)}
                      disabled={isLoading}
                    >
                      Elimina
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
