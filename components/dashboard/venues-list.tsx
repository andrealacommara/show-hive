"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Building2 } from "lucide-react"
import { CreateVenueDialog } from "./create-venue-dialog"

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
}

interface VenuesListProps {
  venues: Venue[]
  currentUserId: string
}

export function VenuesList({ venues, currentUserId }: VenuesListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Locali
          </CardTitle>
          <CreateVenueDialog currentUserId={currentUserId} />
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
                <h4 className="font-medium mb-1">{venue.name}</h4>
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
