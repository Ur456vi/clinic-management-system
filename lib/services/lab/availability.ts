/**
 * Slot availability — thin wrapper over the partner's EXISTING
 * `getAvailableSlots` (no Salesforce change). We pass the patient pincode and a
 * preferred date/time; the partner returns bookable slots. The response shape
 * is partner-defined and loosely typed, so we return it through to the caller
 * (the reception / patient UI picks a slot and hands it back to `bookOrder`).
 */

import { labFetch } from "./client"
import { getLabConfig } from "./config"

export type SlotQuery = {
  pincode: string
  /** "YYYY-MM-DD HH:mm:ss" (partner convention) or ISO. */
  preferredDateTime: string
}

export type AvailabilityResult = {
  ok: boolean
  status: number
  /** Raw partner payload — the UI reads slots out of this and echoes a chosen slot back. */
  slots: unknown
}

export async function getAvailableSlots(query: SlotQuery): Promise<AvailabilityResult> {
  const cfg = getLabConfig()
  const res = await labFetch(cfg.paths.slots, {
    method: "POST",
    body: { pincode: query.pincode, preferredDateTime: query.preferredDateTime },
  })
  return { ok: res.ok, status: res.status, slots: res.data }
}
