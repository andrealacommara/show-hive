"use client"

import type React from "react"

import { useState } from "react"
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

interface CreateShiftDialogProps {
  venues: Venue[]
  users: User[]
  currentUserId: string
}

export function CreateShiftDialog({ venues, users, currentUserId }: CreateShiftDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        throw new Error("Failed to create shift")
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
      alert("Errore durante la creazione del turno")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Turno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Turno</DialogTitle>
          <DialogDescription>Aggiungi un nuovo turno e assegnalo a un membro del team</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo Turno</Label>
            <Input
              id="title"
              placeholder="es. Turno Serale"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea
              id="description"
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
                        }`}
                      >
                        <span>{user.full_name || user.email}</span>
                        {selected && <Badge variant="secondary">Selezionato</Badge>}
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
