"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"

export default function SetupPage() {
  const [copiedRedirect, setCopiedRedirect] = useState(false)
  const [copiedScope, setCopiedScope] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://YOUR-PROJECT.supabase.co"
  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "")
  const redirectUrl = `${supabaseUrl}/auth/v1/callback`
  const calendarScope = `https://www.googleapis.com/auth/calendar.events`

  const copyToClipboard = (text: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Configurazione Guidata OAuth</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ti guiderò passo dopo passo nella configurazione. Bastano 5 minuti e ti fornirò tutti i link e i valori da
            copiare.
          </p>
        </div>

        <Alert>
          <AlertDescription className="text-center">
            <strong>Nota:</strong> Per motivi di sicurezza, solo tu puoi creare le credenziali OAuth per il tuo progetto
            Google.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                1
              </div>
              <CardTitle>Crea credenziali OAuth in Google Cloud</CardTitle>
            </div>
            <CardDescription>Ci vogliono 2 minuti - Ti apro direttamente la pagina giusta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">Clicca qui per aprire Google Cloud Console:</p>
              <Button asChild className="w-full" size="lg">
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apri Google Cloud Console
                </a>
              </Button>
            </div>

            <div className="rounded-lg bg-slate-50 border p-4 space-y-3">
              <p className="font-medium text-sm">Una volta lì, segui questi passaggi:</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>Crea un nuovo progetto o seleziona uno esistente</li>
                <li>
                  Clicca su <strong>"Crea credenziali"</strong> → <strong>"ID client OAuth 2.0"</strong>
                </li>
                <li>
                  Tipo di applicazione: <strong>"Applicazione web"</strong>
                </li>
                <li>
                  Nella sezione "URI di reindirizzamento autorizzati", copia e incolla questo URL:
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-slate-900 p-3 font-mono text-xs text-slate-50 overflow-x-auto">
                      {redirectUrl}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(redirectUrl, setCopiedRedirect)}>
                      {copiedRedirect ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </li>
                <li>
                  Clicca su <strong>"Crea"</strong>
                </li>
                <li>
                  <strong className="text-red-600">IMPORTANTE:</strong> Copia e salva il <strong>Client ID</strong> e il{" "}
                  <strong>Client Secret</strong> che ti mostra
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Poi abilita la Google Calendar API:</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <a
                  href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abilita Google Calendar API
                </a>
              </Button>
              <p className="text-sm text-muted-foreground">
                Clicca semplicemente su "Abilita" nella pagina che si apre
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-semibold">
                2
              </div>
              <CardTitle>Configura Google OAuth in Supabase</CardTitle>
            </div>
            <CardDescription>Ci vogliono 2 minuti - Incolla le credenziali che hai appena creato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">Clicca qui per aprire il tuo progetto Supabase:</p>
              <Button asChild className="w-full" size="lg">
                <a
                  href={`https://supabase.com/dashboard/project/${projectRef}/auth/providers`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apri Supabase Authentication
                </a>
              </Button>
            </div>

            <div className="rounded-lg bg-slate-50 border p-4 space-y-3">
              <p className="font-medium text-sm">Una volta lì, segui questi passaggi:</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>
                  Cerca <strong>"Google"</strong> nell'elenco dei provider
                </li>
                <li>Clicca per aprire le impostazioni Google</li>
                <li>
                  Attiva il toggle <strong>"Enable Google provider"</strong>
                </li>
                <li>
                  Incolla il <strong>Client ID</strong> e il <strong>Client Secret</strong> copiati dal passo 1
                </li>
                <li>
                  Nel campo "Additional Scopes", copia e incolla questo:
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-slate-900 p-3 font-mono text-xs text-slate-50 overflow-x-auto">
                      {calendarScope}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(calendarScope, setCopiedScope)}>
                      {copiedScope ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </li>
                <li>
                  Clicca su <strong>"Save"</strong> in fondo alla pagina
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Fatto! Prova ad accedere</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-green-800">
              Una volta completati entrambi i passaggi, il login con Google funzionerà perfettamente.
            </p>
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/login">Vai al Login e Prova Subito</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Se qualcosa non funziona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-orange-800">
              <div>
                <strong>Errore "redirect_uri_mismatch":</strong>
                <p>
                  Torna al passo 1 e verifica che l'URL di reindirizzamento sia esattamente quello che ti ho dato da
                  copiare.
                </p>
              </div>
              <div>
                <strong>Errore "Invalid OAuth provider":</strong>
                <p>Torna al passo 2 e assicurati di aver cliccato "Save" dopo aver abilitato Google.</p>
              </div>
              <div>
                <strong>Altri problemi:</strong>
                <p>Aspetta 1-2 minuti dopo aver salvato in Supabase, a volte ci vuole un po' per attivarsi.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
