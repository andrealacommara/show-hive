"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Venue = {
  id: string
  name: string
  address?: string
  city?: string
}

interface EditVenueDialogProps {
  venue: Venue
  onUpdated?: () => void
  children: ReactNode
}

export function EditVenueDialog({ venue, onUpdated, children }: EditVenueDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: venue.name || "",
    address: venue.address || "",
    city: venue.city || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
      }

      if (!payload.name) {
        throw new Error("Nome locale obbligatorio")
      }

      const res = await fetch(`/api/venues/${venue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Update failed")
      setOpen(false)
      onUpdated?.()
      router.refresh()
    } catch (error) {
      console.error("Update venue failed", error)
      alert("Impossibile aggiornare il locale")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Locale</DialogTitle>
          <DialogDescription>Aggiorna i dettagli del locale</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${venue.id}`}>Nome Locale</Label>
            <Input
              id={`name-${venue.id}`}
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`address-${venue.id}`}>Indirizzo</Label>
            <Input
              id={`address-${venue.id}`}
              name="address"
              placeholder="Via Roma 1"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Inserisci via e numero civico per una geolocalizzazione migliore.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`city-${venue.id}`}>Città</Label>
            <Input
              id={`city-${venue.id}`}
              name="city"
              placeholder="Milano"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Aggiungi sempre la città per il parsing corretto in Google Calendar.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
