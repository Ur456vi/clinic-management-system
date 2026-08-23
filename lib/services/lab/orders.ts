/**
 * Lab order lifecycle — zero-Salesforce-change model.
 *
 * The partner will not build a no-appointment-time endpoint, so we book against
 * their EXISTING endpoints and source the slot on our side:
 *
 *   1. Consultation SIGNED  → `enqueueLabOrderForConsultation` creates the order
 *      in PENDING_SCHEDULE. No partner call (there is no slot yet).
 *   2. A slot is chosen on our side — by reception (option 1) or the patient
 *      portal (option 2) — from the partner's existing `getAvailableSlots`.
 *   3. `bookOrder` books it via the partner's existing `bookFullAppointment`
 *      (HOME) or `EnquiryCenterAppointment` (CENTER) → SCHEDULED.
 *   4. Inbound status webhooks advance it from there.
 *
 * Everything is inert until `LAB_INTEGRATION_ENABLED=true`. The order row is
 * always persisted (even when disabled) so nothing is lost.
 */

import type { LabBookedVia, LabCollectionMode, LabOrder, Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { ValidationError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { istInstant } from "@/lib/date-utils"
import { parseSelectedTests } from "@/lib/test-catalog"
import { nextDocumentNumber } from "@/lib/services/document-number"

import { labFetch } from "./client"
import { isLabEnabled, getLabConfig } from "./config"
import { resolveItems, type ResolvedItem } from "./mapping"

const log = logger.child({ mod: "lab-orders" })

const ORDER_PREFIX = "IPHMH-LAB"
const SOURCE = "Vyara Clinic"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A slot the UI selected out of the getAvailableSlots response and echoes back. */
export type SlotSelection = {
  /** Partner wall-clock times, "YYYY-MM-DD HH:mm:ss" (IST) or ISO. */
  startTime: string
  endTime: string
  serviceTerritoryId?: string
  serviceMemberId?: string
}

/** Optional structured address override for HOME collection. */
export type AddressInput = {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export type BookInput = {
  collectionMode: LabCollectionMode
  centerCode?: string | null
  slot: SlotSelection
  address?: AddressInput
  paymentMode?: string
  bookedVia: LabBookedVia
}

type PatientForBooking = {
  id: string
  patientNumber: string
  fullName: string
  email: string | null
  phone: string | null
  dateOfBirth: Date | null
  sex: string | null
  address: string | null
  placeOfResidence: string | null
}

const PATIENT_SELECT = {
  id: true,
  patientNumber: true,
  fullName: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  sex: true,
  address: true,
  placeOfResidence: true,
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSection(sections: Prisma.JsonValue, key: string): Record<string, unknown> | null {
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) return null
  const v = (sections as Record<string, unknown>)[key]
  if (!v || typeof v !== "object" || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length <= 1) return { first: full.trim(), last: "" }
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] }
}

function genderLabel(sex: string | null): string {
  if (sex === "MALE") return "Male"
  if (sex === "FEMALE") return "Female"
  return "Other"
}

function toIsoDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ""
}

/** Parse a partner slot time into a Date. "YYYY-MM-DD HH:mm:ss" is IST wall-clock. */
function parseSlotTime(s: string): Date | null {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/.exec(s)
  if (m) return istInstant(m[1], m[2].slice(0, 5))
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Next unique, human-readable order number (FY-scoped serial). */
async function nextOrderNumber(): Promise<string> {
  return nextDocumentNumber(ORDER_PREFIX, async (fyPrefix) => {
    const rows = await db.labOrder.findMany({
      where: { orderNumber: { startsWith: fyPrefix } },
      select: { orderNumber: true },
    })
    return rows.map((r) => r.orderNumber)
  })
}

function itemsPayload(items: ResolvedItem[]) {
  return items.map((it) => ({ testName: it.labTestName ?? it.testName, testId: it.labTestId }))
}

/** Read collection mode + centre defaults from the consultation "test" section. */
function readCollectionPrefs(sections: Prisma.JsonValue): {
  mode: LabCollectionMode
  centerCode: string | null
} {
  const test = readSection(sections, "test")
  const mode: LabCollectionMode = test?.["test__collection_mode"] === "CENTER" ? "CENTER" : "HOME"
  const rawCenter = test?.["test__center_id"]
  const centerCode = typeof rawCenter === "string" && rawCenter.trim() ? rawCenter.trim() : null
  return { mode, centerCode }
}

// ---------------------------------------------------------------------------
// Create on sign
// ---------------------------------------------------------------------------

/**
 * POST-COMMIT entry point, called after a consultation is SIGNED. Creates the
 * lab order in PENDING_SCHEDULE (no partner call). Idempotent on consultationId.
 * Never throws into the sign flow.
 */
export async function enqueueLabOrderForConsultation(consultationId: string): Promise<void> {
  try {
    const consultation = await db.consultation.findUnique({
      where: { id: consultationId },
      select: { id: true, patientId: true, sections: true, labOrder: { select: { id: true } } },
    })
    if (!consultation) return
    if (consultation.labOrder) return // idempotent — order already exists

    const test = readSection(consultation.sections, "test")
    const keys = parseSelectedTests(
      typeof test?.["test__selected_tests"] === "string" ? (test["test__selected_tests"] as string) : "",
    )
    if (keys.length === 0) return // no tests prescribed

    const items = await resolveItems(keys)
    const prefs = readCollectionPrefs(consultation.sections)
    const orderNumber = await nextOrderNumber()
    await db.labOrder.create({
      data: {
        orderNumber,
        patientId: consultation.patientId,
        consultationId: consultation.id,
        collectionMode: prefs.mode,
        centerCode: prefs.mode === "CENTER" ? prefs.centerCode : null,
        status: "PENDING_SCHEDULE",
        items: items as object,
      },
    })
    log.info({ orderNumber, tests: keys.length }, "lab order created (awaiting scheduling)")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error({ consultationId, err: message }, "enqueueLabOrderForConsultation failed")
  }
}

// ---------------------------------------------------------------------------
// Book against the partner's existing endpoints
// ---------------------------------------------------------------------------

function buildHomePayload(args: {
  order: LabOrder
  patient: PatientForBooking
  input: BookInput
  items: ResolvedItem[]
}) {
  const { first, last } = splitName(args.patient.fullName)
  const a = args.input.address ?? {}
  return {
    customer: {
      PFirstName: first,
      PLastName: last,
      Mobile: args.patient.phone ?? "",
      Email: args.patient.email ?? "",
      DateOfBirth: toIsoDate(args.patient.dateOfBirth),
      Gender: genderLabel(args.patient.sex),
      PatientId: args.patient.patientNumber,
      street: a.street ?? args.patient.address ?? args.patient.placeOfResidence ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      postalCode: a.postalCode ?? "",
      country: a.country ?? "India",
    },
    appointment: {
      serviceTerritoryId: args.input.slot.serviceTerritoryId ?? "",
      // Partner spells this "serviceMenberId" on bookFullAppointment; send both
      // spellings so we match whichever their endpoint reads.
      serviceMenberId: args.input.slot.serviceMemberId ?? "",
      serviceMemberId: args.input.slot.serviceMemberId ?? "",
      startTime: args.input.slot.startTime,
      endTime: args.input.slot.endTime,
    },
    order: {
      orderNumber: args.order.orderNumber,
      paymentMode: args.input.paymentMode ?? "Cash",
      items: itemsPayload(args.items),
    },
    attachments: [],
  }
}

function buildCenterPayload(args: {
  order: LabOrder
  patient: PatientForBooking
  input: BookInput
  items: ResolvedItem[]
}) {
  const { first, last } = splitName(args.patient.fullName)
  const a = args.input.address ?? {}
  return {
    // EnquiryCenterAppointment carries order + times flat inside customer.
    customer: {
      PFirstName: first,
      PLastName: last,
      Mobile: args.patient.phone ?? "",
      Email: args.patient.email ?? "",
      DateOfBirth: toIsoDate(args.patient.dateOfBirth),
      Gender: genderLabel(args.patient.sex),
      CentreID: args.input.centerCode ?? args.order.centerCode ?? "",
      PatientId: args.patient.patientNumber,
      street: a.street ?? args.patient.address ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      postalCode: a.postalCode ?? "",
      country: a.country ?? "India",
      orderNumber: args.order.orderNumber,
      startTime: args.input.slot.startTime,
      endTime: args.input.slot.endTime,
      source: SOURCE,
    },
    items: itemsPayload(args.items),
  }
}

function readIds(data: unknown): { appointmentId?: string; workOrderId?: string; orderCaseId?: string; caseId?: string } {
  if (!data || typeof data !== "object") return {}
  const o = data as Record<string, unknown>
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : undefined)
  return { appointmentId: s("appointmentId"), workOrderId: s("workOrderId"), orderCaseId: s("orderCaseId"), caseId: s("caseId") }
}

/**
 * Book a PENDING_SCHEDULE / FAILED order against the partner's existing
 * endpoint for the chosen collection mode. Requires the integration enabled.
 */
export async function bookOrder(orderId: string, input: BookInput): Promise<LabOrder> {
  const order = await db.labOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new ValidationError("Lab order not found")
  if (order.status !== "PENDING_SCHEDULE" && order.status !== "FAILED") {
    throw new ValidationError(`Order is ${order.status} and cannot be booked`)
  }
  if (!isLabEnabled()) {
    throw new ValidationError(
      "Lab integration is disabled or not configured — cannot book (LAB_INTEGRATION_ENABLED + LAB_BASE_URL + LAB_OAUTH_*).",
    )
  }
  if (input.collectionMode === "CENTER" && !(input.centerCode ?? order.centerCode)) {
    throw new ValidationError("A centre must be selected for centre collection")
  }

  const patient = await db.patient.findUnique({ where: { id: order.patientId }, select: PATIENT_SELECT })
  if (!patient) throw new ValidationError("Patient not found")

  const items = (order.items as unknown as ResolvedItem[]) ?? []
  const cfg = getLabConfig()
  const isHome = input.collectionMode === "HOME"
  const path = isHome ? cfg.paths.bookHome : cfg.paths.bookCenter
  const payload = isHome
    ? buildHomePayload({ order, patient, input, items })
    : buildCenterPayload({ order, patient, input, items })

  try {
    const res = await labFetch(path, { method: "POST", body: payload })
    if (!res.ok) {
      log.warn({ orderNumber: order.orderNumber, status: res.status }, "lab booking non-2xx")
      return db.labOrder.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          collectionMode: input.collectionMode,
          centerCode: isHome ? null : input.centerCode ?? order.centerCode,
          requestPayload: payload as object,
          lastResponse: (res.data as object) ?? undefined,
          notifyError: `HTTP ${res.status}`,
        },
      })
    }
    const ids = readIds(res.data)
    return db.labOrder.update({
      where: { id: order.id },
      data: {
        status: "SCHEDULED",
        collectionMode: input.collectionMode,
        centerCode: isHome ? null : input.centerCode ?? order.centerCode,
        appointmentStart: parseSlotTime(input.slot.startTime) ?? undefined,
        appointmentEnd: parseSlotTime(input.slot.endTime) ?? undefined,
        bookedVia: input.bookedVia,
        requestPayload: payload as object,
        lastResponse: (res.data as object) ?? undefined,
        notifyError: null,
        appointmentId: ids.appointmentId ?? undefined,
        workOrderId: ids.workOrderId ?? undefined,
        orderCaseId: ids.orderCaseId ?? ids.caseId ?? undefined,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error({ orderNumber: order.orderNumber, err: message }, "lab booking threw")
    return db.labOrder.update({
      where: { id: order.id },
      data: { status: "FAILED", requestPayload: payload as object, notifyError: message.slice(0, 500) },
    })
  }
}

// ---------------------------------------------------------------------------
// Cancel / reschedule (existing partner endpoints)
// ---------------------------------------------------------------------------

export async function cancelOrder(orderId: string, reason: string): Promise<LabOrder> {
  const order = await db.labOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new ValidationError("Lab order not found")
  if (!isLabEnabled()) throw new ValidationError("Lab integration is disabled — cannot cancel")

  const cfg = getLabConfig()
  const isHome = order.collectionMode === "HOME"
  const path = isHome ? cfg.paths.cancelHome : cfg.paths.cancelCenter
  const body = isHome
    ? { appointmentId: order.appointmentId ?? "", reason }
    : { caseId: order.orderCaseId ?? "", orderNumber: order.orderNumber, reason }

  const res = await labFetch(path, { method: "POST", body })
  if (!res.ok) throw new ValidationError(`Cancel failed: HTTP ${res.status}`)
  return db.labOrder.update({
    where: { id: order.id },
    data: { status: "CANCELLED", reason, lastResponse: (res.data as object) ?? undefined },
  })
}

export async function rescheduleOrder(orderId: string, slot: SlotSelection): Promise<LabOrder> {
  const order = await db.labOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new ValidationError("Lab order not found")
  if (!isLabEnabled()) throw new ValidationError("Lab integration is disabled — cannot reschedule")

  const cfg = getLabConfig()
  const isHome = order.collectionMode === "HOME"
  const path = isHome ? cfg.paths.rescheduleHome : cfg.paths.rescheduleCenter
  const body = isHome
    ? {
        appointmentId: order.appointmentId ?? "",
        serviceMemberId: slot.serviceMemberId ?? "",
        newStartTime: slot.startTime,
        newEndTime: slot.endTime,
      }
    : {
        caseId: order.orderCaseId ?? "",
        orderNumber: order.orderNumber,
        newStartTime: slot.startTime,
        newEndTime: slot.endTime,
      }

  const res = await labFetch(path, { method: "POST", body })
  if (!res.ok) throw new ValidationError(`Reschedule failed: HTTP ${res.status}`)
  return db.labOrder.update({
    where: { id: order.id },
    data: {
      appointmentStart: parseSlotTime(slot.startTime) ?? undefined,
      appointmentEnd: parseSlotTime(slot.endTime) ?? undefined,
      lastResponse: (res.data as object) ?? undefined,
    },
  })
}
