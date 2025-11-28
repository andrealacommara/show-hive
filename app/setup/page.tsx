"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"

const CENTRAL_CALENDAR_EMAIL = "amministrazione.showhive@gmail.com"
const SERVICE_ACCOUNT_EMAIL = "showhive-calendar-service@amministrazione-showhive.iam.gserviceaccount.com"

export default function SetupPage() {
  const [copiedEnv, setCopiedEnv] = useState(false)

  const envExample = `GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\\\n...\\\\n-----END PRIVATE KEY-----\\\\n","client_email":"${SERVICE_ACCOUNT_EMAIL}","token_uri":"https://oauth2.googleapis.com/token"}'`

  const copyToClipboard = (text: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Configura il calendario centralizzato</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tutti gli eventi verranno creati sul calendario {CENTRAL_CALENDAR_EMAIL} tramite un service account.
          </p>
        </div>

        <Alert>
          <AlertDescription className="text-center">
            Non è più richiesto alcun consenso calendar agli utenti. Serve solo il service account con accesso al
            calendario centrale.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                1
              </div>
              <CardTitle>Crea il service account</CardTitle>
            </div>
            <CardDescription>Usalo solo lato server per firmare le chiamate al calendario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">Apri Google Cloud Console:</p>
              <Button asChild className="w-full" size="lg">
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Vai a Credenziali
                </a>
              </Button>
            </div>

            <div className="rounded-lg bg-slate-50 border p-4 space-y-3">
              <p className="font-medium text-sm">Passaggi rapidi:</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>Crea un nuovo service account e assegna un nome (es. ShowHive Calendar).</li>
                <li>Nel service account crea una nuova chiave JSON e scaricala.</li>
                <li>Abilita la Google Calendar API per il progetto (Library &gt; Calendar API &gt; Enable).</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-semibold">
                2
              </div>
              <CardTitle>Dai accesso al calendario centrale</CardTitle>
            </div>
            <CardDescription>Il service account deve poter creare e invitare gli utenti.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">
              Condividi il calendario {CENTRAL_CALENDAR_EMAIL} con <strong>{SERVICE_ACCOUNT_EMAIL}</strong> e assegna
              i permessi di modifica (Make changes to events).
            </p>
            <p className="text-sm text-muted-foreground">
              Puoi farlo da Google Calendar &gt; Impostazioni e condivisione &gt; Condividi con persone e gruppi.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-semibold">
                3
              </div>
              <CardTitle>Salva la variabile di ambiente</CardTitle>
            </div>
            <CardDescription>Incolla l&apos;intero JSON della chiave nel backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-slate-900 text-slate-50 p-4 text-sm font-mono overflow-x-auto">
              {envExample}
            </div>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(envExample, setCopiedEnv)}>
              {copiedEnv ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copia snippet
            </Button>
            <p className="text-sm text-muted-foreground">
              Assicurati che le sequenze <code>\n</code> restino nel private key e che il file non venga mai esposto al
              client.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Fatto!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-green-800">
              Dopo aver impostato l&apos;env e riavviato il server, i turni creeranno eventi direttamente sul calendario
              centrale e manderanno inviti agli assegnati.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
