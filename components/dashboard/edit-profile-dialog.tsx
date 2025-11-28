"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface EditProfileDialogProps {
  fullName?: string
  children: React.ReactNode
}

export function EditProfileDialog({ fullName, children }: EditProfileDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ first_name: "", last_name: "" })

  const parsedName = useMemo(() => {
    const parts = (fullName || "").trim().split(" ").filter(Boolean)
    return {
      first: parts[0] || "",
      last: parts.slice(1).join(" ") || "",
    }
  }, [fullName])

  useEffect(() => {
    if (open) {
      setFormData({ first_name: parsedName.first, last_name: parsedName.last })
    }
  }, [open, parsedName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch("/api/profile", {
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
      console.error("Update profile failed", error)
      alert("Impossibile aggiornare il profilo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ first_name: parsedName.first, last_name: parsedName.last })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Modifica profilo</DialogTitle>
          <DialogDescription>Aggiorna nome e cognome visibili in dashboard e calendar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nome</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Cognome</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Cognome"
            />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading} className="w-full">
              Reset
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
