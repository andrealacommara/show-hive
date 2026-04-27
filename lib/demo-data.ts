import { addDays, format, subDays } from "date-fns"
import type { Member, Profile, Shift, Unavailability } from "@/types"

const today = new Date()
const fmt = (d: Date) => format(d, "yyyy-MM-dd")

export const DEMO_USER = {
  id: "demo-user-id",
  email: "demo@showhive.app",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
}

export const DEMO_PROFILE: Profile = {
  id: "demo-user-id",
  user_id: "demo-user-id",
  full_name: "Demo User",
  email: "demo@showhive.app",
  avatar_url: null,
}

export const DEMO_VENUES = [
  { id: "venue-1", name: "Hiroshima Mon Amour", address: "Via Bossoli 83", city: "Torino" },
  { id: "venue-2", name: "Spazio211", address: "Via Cigna 211", city: "Torino" },
  { id: "venue-3", name: "Magazzino sul Po", address: "Murazzi del Po 55", city: "Torino" },
  { id: "venue-4", name: "Club To Club", address: "Via Agostino da Montefeltro 2", city: "Torino" },
]

export const DEMO_USERS = [
  { id: "user-1", full_name: "Marco Ferretti", email: "marco@showhive.app" },
  { id: "user-2", full_name: "Sara Ricci", email: "sara@showhive.app" },
  { id: "user-3", full_name: "Luca Bianchi", email: "luca@showhive.app" },
  { id: "demo-user-id", full_name: "Demo User", email: "demo@showhive.app" },
]

export const DEMO_MEMBERS: Member[] = [
  { id: "mem-1", email: "marco@showhive.app", role: "member" },
  { id: "mem-2", email: "sara@showhive.app", role: "member" },
  { id: "mem-3", email: "luca@showhive.app", role: "member" },
  { id: "mem-4", email: "demo@showhive.app", role: "admin" },
]

const makeShift = (
  id: string,
  title: string,
  venueId: string,
  daysFromToday: number,
  start: string,
  end: string,
  assigneeIds: string[],
  description?: string,
): Shift => {
  const venue = DEMO_VENUES.find((v) => v.id === venueId)!
  const assignees = assigneeIds.map((uid) => ({
    user_id: uid,
    user: DEMO_USERS.find((u) => u.id === uid)!,
  }))
  return {
    id,
    title,
    description,
    venue_id: venueId,
    venue,
    shift_date: fmt(addDays(today, daysFromToday)),
    start_time: start,
    end_time: end,
    shift_assignees: assignees,
    google_calendar_event_id: `demo_cal_${id}`,
  }
}

export const DEMO_SHIFTS = [
  makeShift("shift-1", "Apertura Cassa", "venue-1", 1, "20:00", "23:00", ["user-1", "demo-user-id"], "Biglietteria serata indie"),
  makeShift("shift-2", "Sicurezza Ingresso", "venue-1", 1, "20:30", "02:00", ["user-2"]),
  makeShift("shift-3", "Stage Manager", "venue-2", 3, "18:00", "23:30", ["user-3"], "Concerto band emergenti"),
  makeShift("shift-4", "Hospitality Artisti", "venue-2", 3, "17:00", "00:00", ["user-1"]),
  makeShift("shift-5", "Apertura Bar", "venue-3", 5, "21:00", "03:00", ["user-2", "user-3"]),
  makeShift("shift-6", "Regia Luci", "venue-4", 7, "15:00", "23:00", ["demo-user-id"], "Festival Club To Club"),
  makeShift("shift-7", "Runner Palco", "venue-1", 10, "19:00", "01:00", ["user-1", "user-2"]),
  makeShift("shift-8", "Cassa Principale", "venue-3", 12, "22:00", "04:00", ["user-3"]),
  makeShift("shift-9", "Guardaroba", "venue-2", 14, "20:00", "02:00", []),
  makeShift("shift-10", "Coordinatore Generale", "venue-4", 0, "14:00", "22:00", ["user-1"], "Oggi"),
]

export const DEMO_UNAVAILABILITIES: Unavailability[] = [
  {
    id: "unav-1",
    user_id: DEMO_USERS[0].id,
    start_date: fmt(addDays(today, 5)),
    end_date: fmt(addDays(today, 8)),
    reason: "Ferie",
    user: DEMO_USERS[0],
  },
  {
    id: "unav-2",
    user_id: DEMO_USERS[1].id,
    start_date: fmt(addDays(today, 2)),
    end_date: fmt(addDays(today, 2)),
    reason: "Visita medica",
    user: DEMO_USERS[1],
  },
  {
    id: "unav-3",
    user_id: DEMO_USERS[2].id,
    start_date: fmt(subDays(today, 1)),
    end_date: fmt(addDays(today, 1)),
    reason: "",
    user: DEMO_USERS[2],
  },
]
