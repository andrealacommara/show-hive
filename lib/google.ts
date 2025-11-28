import { calendar_v3, google } from "googleapis"

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar"

type OAuthEnv = {
  clientId: string
  clientSecret: string
  refreshToken: string
}

let cachedCalendar: calendar_v3.Calendar | null = null
let cachedAuth: InstanceType<typeof google.auth.OAuth2> | null = null

function loadOAuthEnv(): OAuthEnv {
  const clientId = process.env.ADMIN_GOOGLE_CLIENT_ID
  const clientSecret = process.env.ADMIN_GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.ADMIN_GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth env: ADMIN_GOOGLE_CLIENT_ID / ADMIN_GOOGLE_CLIENT_SECRET / ADMIN_GOOGLE_REFRESH_TOKEN")
  }

  return { clientId, clientSecret, refreshToken }
}

function getAuthClient() {
  if (cachedAuth) return cachedAuth

  const { clientId, clientSecret, refreshToken } = loadOAuthEnv()
  const oauth = new google.auth.OAuth2({
    clientId,
    clientSecret,
  })

  oauth.setCredentials({ refresh_token: refreshToken, scope: CALENDAR_SCOPE })
  cachedAuth = oauth

  return cachedAuth
}

export function getCalendarClient() {
  if (cachedCalendar) return cachedCalendar

  const auth = getAuthClient()
  cachedCalendar = google.calendar({ version: "v3", auth })

  return cachedCalendar
}
