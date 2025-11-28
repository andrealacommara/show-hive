import { calendar_v3, google } from "googleapis"

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar"

type ServiceAccountKey = {
  client_email: string
  private_key: string
}

let cachedCalendar: calendar_v3.Calendar | null = null
let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null

function loadServiceAccountKey(): ServiceAccountKey {
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!rawKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY")
  }

  const parsed = JSON.parse(rawKey) as Partial<ServiceAccountKey>
  const client_email = parsed.client_email
  const private_key = (parsed.private_key || "").replace(/\\n/g, "\n")

  if (!client_email || !private_key) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY: client_email or private_key missing")
  }

  return { client_email, private_key }
}

function getAuthClient() {
  if (cachedAuth) return cachedAuth

  const { client_email, private_key } = loadServiceAccountKey()
  cachedAuth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: [CALENDAR_SCOPE],
  })

  return cachedAuth
}

export function getCalendarClient() {
  if (cachedCalendar) return cachedCalendar

  const auth = getAuthClient()
  cachedCalendar = google.calendar({ version: "v3", auth })

  return cachedCalendar
}
