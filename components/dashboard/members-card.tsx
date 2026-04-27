"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Shield } from "lucide-react"
import { toast } from "sonner"
import type { Member } from "@/types"

interface MembersCardProps {
  members: Member[]
  currentUserEmail: string
  profiles: { email: string; full_name?: string }[]
  isAdmin?: boolean
  isDemo?: boolean
  onMembersChange?: (members: Member[]) => void
}

function createDemoMemberId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `mem-${crypto.randomUUID()}`
  }

  return `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function MembersCard({ members: initialMembers, currentUserEmail, profiles, isAdmin: isAdminProp, isDemo = false, onMembersChange }: MembersCardProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Member["role"]>("member")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  const handleAdd = async () => {
    if (!email) return
    if (isDemo) {
      const normalizedEmail = email.trim().toLowerCase()
      const nextMember: Member = {
        id: members.find((member) => member.email === normalizedEmail)?.id || createDemoMemberId(),
        email: normalizedEmail,
        role,
      }
      const nextMembers = members.some((member) => member.email === normalizedEmail)
        ? members.map((member) => (member.email === normalizedEmail ? nextMember : member))
        : [...members, nextMember]
      const sorted = nextMembers.sort((a, b) => a.email.localeCompare(b.email))
      setMembers(sorted)
      onMembersChange?.(sorted)
      setEmail("")
      setRole("member")
      toast.success("Collaboratore aggiornato nella demo")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Errore")
      setMembers((prev) => {
        const existing = prev.find((m) => m.email === data.email)
        if (existing) {
          return prev.map((m) => (m.email === data.email ? data : m))
        }
        return [...prev, data].sort((a, b) => a.email.localeCompare(b.email))
      })
      setEmail("")
      setRole("member")
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (isDemo) {
      const nextMembers = members.filter((member) => member.id !== id)
      setMembers(nextMembers)
      onMembersChange?.(nextMembers)
      return
    }
    const member = members.find((m) => m.id === id)
    if (!member) return
    if (!confirm(`Rimuovere ${member.email}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Errore")
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (id: string, nextRole: Member["role"]) => {
    if (isDemo) {
      const nextMembers = members.map((member) => (member.id === id ? { ...member, role: nextRole } : member))
      setMembers(nextMembers)
      onMembersChange?.(nextMembers)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Errore")
      setMembers((prev) => prev.map((m) => (m.id === id ? data : m)))
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const adminCount = members.filter((m) => m.role === "admin").length
  const emailToName = new Map(profiles.map((p) => [p.email.toLowerCase(), p.full_name || ""]))
  const isAdmin = isAdminProp ?? members.some((m) => m.email === currentUserEmail && m.role === "admin")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Collaboratori
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(isAdmin || isDemo) && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="email@show-hive.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2">
            <Select value={role} onValueChange={(value) => setRole(value as Member["role"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ruolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={loading}>
              Aggiungi
            </Button>
          </div>
        </div>
        )}

        <div className="space-y-3">
          {members.length === 0 && <p className="text-sm text-muted-foreground">Nessun collaboratore ancora.</p>}
          {members.map((member) => {
            const removable = !(member.role === "admin" && adminCount <= 1)
            const name = emailToName.get(member.email.toLowerCase()) || member.email
            return (
              <div key={member.id} className="rounded border p-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  </div>
                  {member.email === currentUserEmail && <Badge className="ml-auto" variant="secondary">Tu</Badge>}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {member.role === "admin" && <Shield className="h-4 w-4" />}
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as Member["role"])}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(isAdmin || isDemo) && removable && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-w-22.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(member.id)
                      }}
                      disabled={loading}
                    >
                      Rimuovi
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
