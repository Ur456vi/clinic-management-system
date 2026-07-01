/**
 * Clinic date/time formatting — single source of truth.
 *
 * The clinic runs in India, so every wall-clock time the staff or patients
 * see or enter is IST (Asia/Kolkata, a fixed UTC+05:30, no DST).
 *
 * Two failure modes this module exists to prevent:
 *
 *  1. Formatting a stored UTC instant WITHOUT a timeZone. `toLocaleTimeString`
 *     then uses the runtime's zone — which on the server is UTC — so a 2:30 PM
 *     appointment (stored 09:00Z) renders as "9:00 AM". Always pass
 *     `timeZone: CLINIC_TIME_ZONE`.
 *
 *  2. Building a Date from `"YYYY-MM-DDTHH:MM:00"` with no offset. Per spec
 *     that parses in the *runtime* zone — fine in an IST browser, wrong on a
 *     UTC server. `istInstant()` pins the offset so it's correct everywhere.
 */

export const CLINIC_TIME_ZONE = "Asia/Kolkata"

/** Fixed IST offset. IST has no DST, so a literal offset is safe. */
const IST_OFFSET = "+05:30"

/**
 * Build the correct UTC instant from an IST wall-clock date + time, e.g.
 * `istInstant("2026-06-15", "14:30")` → the Date for 2:30 PM IST regardless
 * of the runtime timezone. Returns an Invalid Date if the parts don't parse.
 */
export function istInstant(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00${IST_OFFSET}`)
}

/** "2:30 PM" — a stored instant rendered in clinic (IST) time. */
export function formatClinicTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CLINIC_TIME_ZONE,
  })
}

/** "Wednesday, 2 July 2026" — long date in clinic (IST) time. */
export function formatClinicDateLong(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: CLINIC_TIME_ZONE,
  })
}

/** "02 Jul 2026" — compact date in clinic (IST) time. */
export function formatClinicDateShort(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: CLINIC_TIME_ZONE,
  })
}

/** IST calendar date as `YYYY-MM-DD` — for seeding a `<input type="date">`. */
export function toClinicDateInput(date: Date): string {
  // en-CA renders as YYYY-MM-DD.
  return date.toLocaleDateString("en-CA", { timeZone: CLINIC_TIME_ZONE })
}

/** IST wall-clock as 24h `HH:MM` — for seeding a `<input type="time">`. */
export function toClinicTimeInput(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: CLINIC_TIME_ZONE,
  })
}

/**
 * Turn a raw 24h wall-clock string ("14:30") into "2:30 PM" without going
 * through a Date — used where we only hold the string the user picked.
 */
export function formatWallClockTime12h(timeStr: string): string {
  const [hStr, mStr = "00"] = timeStr.split(":")
  const h = Number(hStr)
  const m = Number(mStr)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return timeStr
  const period = h < 12 ? "AM" : "PM"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, "0")} ${period}`
}
