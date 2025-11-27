"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ShiftActionsProps {
  shiftId: string
}

export function ShiftActions({ shiftId }: ShiftActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo turno?")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete shift")
      }

      router.refresh()
    } catch (error) {
      console.error("[app] Error deleting shift:", error)
      alert("Errore durante l'eliminazione del turno")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? "Eliminazione..." : "Elimina"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
