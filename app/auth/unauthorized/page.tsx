"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Accesso non autorizzato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Il tuo account non è abilitato. Chiedi a un admin di aggiungere la tua email ai collaboratori.</p>
          <div className="flex gap-2">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/auth/login">Torna al login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
