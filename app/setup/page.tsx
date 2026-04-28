'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const CENTRAL_CALENDAR_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_GOOGLE_CALENDAR_ID || 'il-tuo-calendario@google.com'

export default function SetupPage() {
  const [copiedClient, setCopiedClient] = useState(false)
  const [copiedScope, setCopiedScope] = useState(false)
  const [copiedEnv, setCopiedEnv] = useState(false)

  const scope = 'https://www.googleapis.com/auth/calendar'
  const envExample = `ADMIN_GOOGLE_CLIENT_ID=\nADMIN_GOOGLE_CLIENT_SECRET=\nADMIN_GOOGLE_REFRESH_TOKEN=\nADMIN_GOOGLE_CALENDAR_ID=\nNEXT_PUBLIC_ADMIN_GOOGLE_CALENDAR_ID=`

  const copyToClipboard = (text: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Configura il calendario centralizzato
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tutti gli eventi verranno creati sul calendario {CENTRAL_CALENDAR_EMAIL} usando le API
            con il suo account (refresh token server-side, nessun consenso utenti).
          </p>
        </div>

        <Alert>
          <AlertDescription className="text-center">
            Non serve più il consenso degli utenti: l&apos;app usa l&apos;account configurato per
            creare e invitare.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                1
              </div>
              <CardTitle>Crea le credenziali OAuth</CardTitle>
            </div>
            <CardDescription>
              Client ID e Secret dell&apos;account che possiede o gestisce il calendario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">
                Apri Google Cloud Console &gt; APIs &amp; Services &gt; Credentials:
              </p>
              <Button asChild className="w-full" size="lg">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Vai a Credenziali
                </a>
              </Button>
            </div>

            <div className="rounded-lg bg-slate-50 border p-4 space-y-3">
              <p className="font-medium text-sm">Passaggi rapidi:</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>Clicca “Create Credentials” → “OAuth client ID”.</li>
                <li>Application type: “Web application”.</li>
                <li>
                  Authorized redirect URIs: puoi usare temporaneamente{' '}
                  <code>https://developers.google.com/oauthplayground</code>.
                </li>
                <li>Salva Client ID e Client Secret.</li>
                <li>
                  Assicurati che la Calendar API sia abilitata (Library → Calendar API → Enable).
                </li>
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
              <CardTitle>Ottieni il refresh token</CardTitle>
            </div>
            <CardDescription>
              Serve un refresh token dell&apos;account che userai per creare gli eventi e mandare
              inviti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">Metodo rapido: Google OAuth Playground.</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>
                Apri{' '}
                <Button asChild variant="link" className="px-0 h-auto">
                  <a
                    href="https://developers.google.com/oauthplayground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OAuth Playground
                  </a>
                </Button>{' '}
                (impostazioni ingranaggio: spunta “Use your own OAuth credentials” e incolla Client
                ID/Secret).
              </li>
              <li>
                Nel box scope incolla:
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={() => copyToClipboard(scope, setCopiedScope)}
                >
                  {copiedScope ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copia
                  scope
                </Button>
              </li>
              <li>Authorize APIs con l&apos;account che userai per il calendario e consenti.</li>
              <li>Exchange authorization code: otterrai un refresh token da copiare.</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-semibold">
                3
              </div>
              <CardTitle>Salva le variabili di ambiente</CardTitle>
            </div>
            <CardDescription>Solo lato server (Vercel + locale).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-slate-900 text-slate-50 p-4 text-sm font-mono overflow-x-auto">
              {envExample}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(envExample, setCopiedEnv)}
            >
              {copiedEnv ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copia
              snippet
            </Button>
            <p className="text-sm text-muted-foreground">
              Imposta anche `ADMIN_GOOGLE_CALENDAR_ID` con la mail del calendario da usare.
              `NEXT_PUBLIC_ADMIN_GOOGLE_CALENDAR_ID` serve solo a mostrare quel valore nella pagina
              setup.
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
              Dopo aver impostato le env e riavviato il server, i turni creeranno eventi sul
              calendario configurato e manderanno inviti agli assegnati.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
