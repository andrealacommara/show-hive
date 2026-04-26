"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Building2, Pencil, Trash2 } from "lucide-react"
import { CreateVenueDialog } from "./create-venue-dialog"
import { EditVenueDialog } from "./edit-venue-dialog"

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
}

interface VenuesListProps {
  venues: Venue[]
  currentUserId: string
  isAdmin?: boolean
  isDemo?: boolean
}

export function VenuesList({ venues, currentUserId, isAdmin = false, isDemo = false }: VenuesListProps) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleDelete = async (venue: Venue) => {
    if (isDemo) { return }
    if (!isAdmin) return
    if (!confirm(`Eliminare il locale "${venue.name}"?`)) return
    setBusyId(venue.id)
    try {
      const res = await fetch(`/api/venues/${venue.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      router.refresh()
    } catch (error) {
      console.error("Delete venue failed", error)
      alert("Impossibile eliminare il locale")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Locali
          </CardTitle>
          <CreateVenueDialog currentUserId={currentUserId} isDemo={isDemo} />
        </div>
      </CardHeader>
      <CardContent>
        {venues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nessun locale aggiunto</p>
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map((venue) => (
              <div key={venue.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium mb-1">{venue.name}</h4>
                  {(isAdmin || isDemo) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <EditVenueDialog venue={venue} onUpdated={() => router.refresh()} isDemo={isDemo}>
                        <button
                          type="button"
                          disabled={busyId === venue.id}
                          className="rounded p-1 hover:bg-accent"
                          aria-label="Modifica locale"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </EditVenueDialog>
                      <button
                        type="button"
                        onClick={() => handleDelete(venue)}
                        disabled={busyId === venue.id}
                        className="rounded p-1 hover:bg-accent"
                        aria-label="Elimina locale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {(venue.address || venue.city) && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="text-pretty">
                      {venue.address}
                      {venue.address && venue.city && ", "}
                      {venue.city}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
