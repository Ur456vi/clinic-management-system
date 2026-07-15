/**
 * Partner-lab integration service (inbound webhook).
 *
 * Mirrors the Razorpay webhook service shape: pure verify/normalize helpers
 * plus one transactional `ingestLabWebhook` that the route handler calls. The
 * lab pushes status/result updates to `POST /api/webhooks/partner-lab`; we
 * match each event to a `PartnerLabOrder` by our own `orderNumber` and, on a
 * RESULT_READY event, fold the result into the linked `LabResult`.
 *
 * Idempotency: every delivery is recorded in `LabWebhookEvent` keyed on a
 * `dedupeKey` (a lab-supplied event id when present, else a sha256 of the raw
 * body). A replay of an already-PROCESSED event is a no-op.
 *
 * Report-file (S3) ingestion from a webhook-supplied URL is deferred — this
 * step only lands analytes + summary + status.
 */

import { createHash, timingSafeEqual } from "crypto"

import { after } from "next/server"
import { Prisma, LabWebhookStatus, PartnerLabOrderStatus, Sex } from "@prisma/client"
import type { Patient } from "@prisma/client"

import { db } from "@/lib/db"
import { partnerLabApiConfig, partnerLabWebhookToken } from "@/lib/config/partner-lab"
import { computeAnalyteFlags } from "@/lib/services/lab-result"
import {
  createLabOrder,
  type OutboundOrderPayload,
} from "@/lib/services/partner-lab-client"
import { DOCUMENT_PREFIX, nextDocumentNumber } from "@/lib/services/document-number"
import { groupSelectedByPanel, parseSelectedTests, testKey } from "@/lib/test-catalog"
import { toClinicDateInput, toClinicTimeInput } from "@/lib/date-utils"
import type { AnalyteInput } from "@/lib/validation/lab-result"
import type { LabWebhookPayload } from "@/lib/validation/partner-lab"

// ---------------------------------------------------------------------------
// Auth — shared bearer token, constant-time compared
// ---------------------------------------------------------------------------

/**
 * Constant-time compare of the header token against the configured secret.
 * Returns false on any mismatch (including length) rather than throwing —
 * the caller treats false as "unauthorized".
 */
export function verifyWebhookToken(headerValue: string | null | undefined): boolean {
  if (!headerValue) return false
  const expected = Buffer.from(partnerLabWebhookToken(), "utf8")
  const got = Buffer.from(headerValue, "utf8")
  if (expected.length !== got.length) return false
  try {
    return timingSafeEqual(expected, got)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Idempotency key
// ---------------------------------------------------------------------------

/**
 * Prefer a lab-supplied event id (stable across retries of the *same* event);
 * fall back to a content hash of the raw body so a duplicate delivery with no
 * event id is still de-duplicated.
 */
export function dedupeKeyFor(parsed: LabWebhookPayload, rawBody: string): string {
  const eventId = parsed.eventId?.trim()
  if (eventId) return `evt:${eventId}`
  return `sha256:${createHash("sha256").update(rawBody, "utf8").digest("hex")}`
}

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

/**
 * Map the lab's status/event strings → our `PartnerLabOrderStatus`. Keys are
 * normalized (lowercased, non-alphanumerics collapsed to `_`) so "Sample
 * Collected", "sample-collected" and "SAMPLE_COLLECTED" all match. An unknown
 * value maps to `null`, and the caller keeps the order's current status — the
 * event still lands (parked), same as Razorpay's fall-through-to-PENDING.
 */
const STATUS_MAP: Record<string, PartnerLabOrderStatus> = {
  created: PartnerLabOrderStatus.CREATED,
  order_created: PartnerLabOrderStatus.CREATED,
  acknowledged: PartnerLabOrderStatus.ACKNOWLEDGED,
  accepted: PartnerLabOrderStatus.ACKNOWLEDGED,
  confirmed: PartnerLabOrderStatus.ACKNOWLEDGED,
  sample_collected: PartnerLabOrderStatus.SAMPLE_COLLECTED,
  collected: PartnerLabOrderStatus.SAMPLE_COLLECTED,
  in_progress: PartnerLabOrderStatus.IN_PROGRESS,
  processing: PartnerLabOrderStatus.IN_PROGRESS,
  result_ready: PartnerLabOrderStatus.RESULT_READY,
  report_ready: PartnerLabOrderStatus.RESULT_READY,
  result: PartnerLabOrderStatus.RESULT_READY,
  completed: PartnerLabOrderStatus.RESULT_READY,
  cancelled: PartnerLabOrderStatus.CANCELLED,
  canceled: PartnerLabOrderStatus.CANCELLED,
  failed: PartnerLabOrderStatus.FAILED,
  error: PartnerLabOrderStatus.FAILED,
  rejected: PartnerLabOrderStatus.FAILED,
}

function normalizeStatusKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

function mapStatus(value: string | undefined): PartnerLabOrderStatus | null {
  if (!value) return null
  return STATUS_MAP[normalizeStatusKey(value)] ?? null
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export type NormalizedLabWebhook = {
  orderNumber: string | null
  /** The raw status/event string we read (for the inbox `eventType` + audit). */
  statusRaw: string | null
  mappedStatus: PartnerLabOrderStatus | null
  externalOrderId: string | null
  report: LabWebhookPayload["report"] | null
}

/** Collapse the tolerated payload shapes into a single normalized view. */
export function normalizeLabWebhook(parsed: LabWebhookPayload): NormalizedLabWebhook {
  const orderNumber =
    parsed.orderNumber?.trim() || parsed.order?.orderNumber?.trim() || null
  const statusRaw =
    parsed.status?.trim() || parsed.event?.trim() || parsed.eventType?.trim() || null
  return {
    orderNumber,
    statusRaw,
    mappedStatus: mapStatus(statusRaw ?? undefined),
    externalOrderId: parsed.externalOrderId?.trim() || null,
    report: parsed.report ?? parsed.result ?? null,
  }
}

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export type IngestOutcome = "processed" | "unmatched" | "duplicate"

export type IngestResult = {
  outcome: IngestOutcome
  matched: boolean
  orderNumber: string | null
  status: PartnerLabOrderStatus | null
  labResultUpdated: boolean
}

/**
 * Record + apply one inbound webhook delivery in a single transaction.
 *
 * Flow:
 *   1. Idempotency — a matching PROCESSED `LabWebhookEvent` short-circuits.
 *   2. Persist (or reuse) the inbox row with the raw body.
 *   3. Match `orderNumber` → `PartnerLabOrder`; no match → mark UNMATCHED,
 *      still a 200 (parked), like Razorpay's no-invoice branch.
 *   4. Advance the order status (+ externalOrderId / lastEventAt).
 *   5. On RESULT_READY with a linked `LabResult`, stamp `reportedAt` and fold
 *      in analytes (flags computed) + summary.
 *   6. Mark the event PROCESSED and write an AuditLog row (actor = system).
 */
export async function ingestLabWebhook(args: {
  rawBody: string
  parsed: LabWebhookPayload
  signatureOk: boolean
}): Promise<IngestResult> {
  const { parsed, rawBody, signatureOk } = args
  const norm = normalizeLabWebhook(parsed)
  const dedupeKey = dedupeKeyFor(parsed, rawBody)
  const now = new Date()

  return db.$transaction(async (tx) => {
    // 1. Idempotency — already fully processed → no-op replay.
    const existing = await tx.labWebhookEvent.findUnique({ where: { dedupeKey } })
    if (existing && existing.status === LabWebhookStatus.PROCESSED) {
      return {
        outcome: "duplicate" as const,
        matched: existing.matched,
        orderNumber: norm.orderNumber ?? existing.orderNumber ?? null,
        status: null,
        labResultUpdated: false,
      }
    }

    // 2. Persist (or reuse) the inbox row.
    const eventRow =
      existing ??
      (await tx.labWebhookEvent.create({
        data: {
          orderNumber: norm.orderNumber,
          eventType: norm.statusRaw,
          dedupeKey,
          rawPayload: parsed as unknown as Prisma.InputJsonValue,
          signatureOk,
          status: LabWebhookStatus.RECEIVED,
        },
      }))

    // 3. Match the order.
    const order = norm.orderNumber
      ? await tx.partnerLabOrder.findUnique({ where: { orderNumber: norm.orderNumber } })
      : null

    if (!order) {
      await tx.labWebhookEvent.update({
        where: { id: eventRow.id },
        data: {
          status: LabWebhookStatus.UNMATCHED,
          matched: false,
          processedAt: now,
          orderNumber: norm.orderNumber,
          eventType: norm.statusRaw,
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: null,
          action: "CREATE",
          entityType: "LabWebhookEvent",
          entityId: eventRow.id,
          detail: {
            source: "partner-lab-webhook",
            outcome: "unmatched",
            event: norm.statusRaw,
            orderNumber: norm.orderNumber,
          },
        },
      })
      return {
        outcome: "unmatched" as const,
        matched: false,
        orderNumber: norm.orderNumber,
        status: null,
        labResultUpdated: false,
      }
    }

    // 4. Advance the order status.
    const nextStatus = norm.mappedStatus ?? order.status
    await tx.partnerLabOrder.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        lastEventAt: now,
        ...(norm.externalOrderId ? { externalOrderId: norm.externalOrderId } : {}),
      },
    })

    // 5. On RESULT_READY, fold the result into the linked LabResult.
    let labResultUpdated = false
    if (nextStatus === PartnerLabOrderStatus.RESULT_READY && order.labResultId) {
      const report = norm.report
      const analytes = report?.analytes
        ? computeAnalyteFlags(report.analytes as unknown as AnalyteInput[])
        : undefined
      await tx.labResult.update({
        where: { id: order.labResultId },
        data: {
          reportedAt: now,
          ...(analytes
            ? { analytes: analytes as unknown as Prisma.InputJsonValue }
            : {}),
          ...(report?.summary ? { summary: report.summary } : {}),
        },
      })
      labResultUpdated = true
    }

    // 6. Mark processed + audit.
    await tx.labWebhookEvent.update({
      where: { id: eventRow.id },
      data: {
        status: LabWebhookStatus.PROCESSED,
        matched: true,
        partnerLabOrderId: order.id,
        processedAt: now,
        orderNumber: norm.orderNumber,
        eventType: norm.statusRaw,
      },
    })
    await tx.auditLog.create({
      data: {
        actorUserId: null,
        action: "UPDATE",
        entityType: "PartnerLabOrder",
        entityId: order.id,
        detail: {
          source: "partner-lab-webhook",
          outcome: "processed",
          event: norm.statusRaw,
          statusBefore: order.status,
          statusAfter: nextStatus,
          orderNumber: norm.orderNumber,
          labResultUpdated,
        },
      },
    })

    return {
      outcome: "processed" as const,
      matched: true,
      orderNumber: norm.orderNumber,
      status: nextStatus,
      labResultUpdated,
    }
  })
}

// ===========================================================================
// Outbound — create + send an order to the partner lab on consultation sign
// ===========================================================================

/** Read the raw `sections.test.test__selected_tests` string out of a blob. */
function readSelectedTests(sections: Prisma.JsonValue): string {
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) return ""
  const test = (sections as Record<string, unknown>)["test"]
  if (!test || typeof test !== "object" || Array.isArray(test)) return ""
  const raw = (test as Record<string, unknown>)["test__selected_tests"]
  return typeof raw === "string" ? raw : ""
}

export type OrderItem = { testId: string; testName: string }

/**
 * Resolve our selected tests → the lab's `order.items[]` via `LabTestMapping`.
 * Unmapped tests are returned separately so the order snapshot can record them
 * (they are carried, never silently dropped).
 */
export async function resolveOrderItems(
  tx: Prisma.TransactionClient,
  entries: { testKey: string; testName: string }[],
): Promise<{ items: OrderItem[]; unmapped: string[] }> {
  if (entries.length === 0) return { items: [], unmapped: [] }
  const mappings = await tx.labTestMapping.findMany({
    where: { active: true, testKey: { in: entries.map((e) => e.testKey) } },
  })
  const byKey = new Map(mappings.map((m) => [m.testKey, m]))
  const items: OrderItem[] = []
  const unmapped: string[] = []
  for (const e of entries) {
    const m = byKey.get(e.testKey)
    if (m) items.push({ testId: m.labTestId, testName: m.labTestName })
    else unmapped.push(e.testName)
  }
  return { items, unmapped }
}

/** Map our `Sex` enum to the lab's `Gender` string. */
function toGender(sex: Sex | null): string {
  if (sex === Sex.MALE) return "Male"
  if (sex === Sex.FEMALE) return "Female"
  return "Other"
}

/** Build the lab's `customer` object from a patient row (mandatory fields). */
export function buildCustomerPayload(patient: Patient): Record<string, unknown> {
  const name = (patient.fullName ?? "").trim()
  const sp = name.indexOf(" ")
  const first = sp === -1 ? name : name.slice(0, sp)
  const last = sp === -1 ? "." : name.slice(sp + 1).trim() || "."
  return {
    PFirstName: first,
    PLastName: last,
    Mobile: patient.phone ?? "",
    Email: patient.email ?? "",
    DateOfBirth: patient.dateOfBirth ? toClinicDateInput(patient.dateOfBirth) : "",
    Gender: toGender(patient.sex),
    PatientId: patient.patientNumber,
    street: patient.address ?? "",
    postalCode: "",
    source: partnerLabApiConfig().source,
  }
}

/**
 * Build the lab's `appointment` object. Walk-in: we send a nominal IST window
 * (`now` → +45 min) because the lab payload requires start/end but the patient
 * arrives on their own schedule. Placeholder until the lab confirms semantics.
 */
export function buildAppointmentPayload(now: Date): Record<string, unknown> {
  const end = new Date(now.getTime() + 45 * 60 * 1000)
  const fmt = (d: Date) => `${toClinicDateInput(d)} ${toClinicTimeInput(d)}:00`
  return {
    serviceTerritoryId: partnerLabApiConfig().defaultServiceTerritoryId ?? "",
    startTime: fmt(now),
    endTime: fmt(end),
  }
}

/**
 * Create one `PartnerLabOrder` per selected test panel for a just-signed
 * consultation. Runs inside the caller's transaction (right after the
 * LabResult panel rows are materialized). Mints a unique `IPHMH-LAB` order
 * number per panel, links it to that panel's LabResult row, and snapshots the
 * mapped `items` + any `unmapped` tests. Idempotent: panels that already have
 * an order for this consultation are skipped. Returns the created order ids.
 */
export async function createOutboundLabOrders(
  tx: Prisma.TransactionClient,
  args: {
    consultationId: string
    patientId: string
    sections: Prisma.JsonValue
    orderedAt: Date
  },
): Promise<string[]> {
  const keys = parseSelectedTests(readSelectedTests(args.sections))
  if (keys.length === 0) return []
  const grouped = groupSelectedByPanel(keys)
  if (grouped.length === 0) return []

  // The LabResult panel rows materialize created (match by panelName).
  const labResults = await tx.labResult.findMany({
    where: { consultationId: args.consultationId },
    select: { id: true, panelName: true },
  })
  const labResultByPanel = new Map(labResults.map((r) => [r.panelName, r.id]))

  // Panels already ordered for this consultation → skip (idempotent re-sign).
  const existing = await tx.partnerLabOrder.findMany({
    where: { consultationId: args.consultationId },
    select: { labResultId: true },
  })
  const alreadyOrdered = new Set(existing.map((o) => o.labResultId).filter(Boolean))

  const createdIds: string[] = []
  for (const { panel, tests } of grouped) {
    const panelName = `(${panel.code}) ${panel.name}`.slice(0, 200)
    const labResultId = labResultByPanel.get(panelName) ?? null
    if (labResultId && alreadyOrdered.has(labResultId)) continue

    const { items, unmapped } = await resolveOrderItems(
      tx,
      tests.map((t) => ({ testKey: testKey(panel.id, t), testName: t })),
    )

    // Mint sequentially so the fiscal-year serial increments across panels.
    const orderNumber = await nextDocumentNumber(
      DOCUMENT_PREFIX.partnerLabOrder,
      async (fyPrefix) => {
        const rows = await tx.partnerLabOrder.findMany({
          where: { orderNumber: { startsWith: fyPrefix } },
          select: { orderNumber: true },
        })
        return rows.map((r) => r.orderNumber)
      },
      args.orderedAt,
    )

    const created = await tx.partnerLabOrder.create({
      data: {
        orderNumber,
        patientId: args.patientId,
        consultationId: args.consultationId,
        labResultId,
        status: PartnerLabOrderStatus.CREATED,
        requestSnapshot: { panelName, items, unmapped } as Prisma.InputJsonValue,
      },
    })
    createdIds.push(created.id)
  }
  return createdIds
}

/**
 * Send one already-created `PartnerLabOrder` to the partner lab. No-op when the
 * API is disabled (order stays CREATED). On success → ACKNOWLEDGED + the lab's
 * `externalOrderId`; on failure → FAILED + the error on the snapshot. Never
 * rethrows — a failed send must not affect the (already-committed) sign.
 */
export async function sendOutboundLabOrder(orderId: string): Promise<void> {
  const cfg = partnerLabApiConfig()

  const order = await db.partnerLabOrder.findUnique({
    where: { id: orderId },
    include: { patient: true },
  })
  if (!order) return
  if (!cfg.enabled) return // parked as CREATED until the API is turned on
  if (order.status !== PartnerLabOrderStatus.CREATED) return // already sent

  const snapshot = (order.requestSnapshot ?? {}) as Record<string, unknown>
  const items = Array.isArray(snapshot.items) ? (snapshot.items as OrderItem[]) : []

  const payload: OutboundOrderPayload = {
    customer: buildCustomerPayload(order.patient),
    appointment: buildAppointmentPayload(order.createdAt),
    order: { orderNumber: order.orderNumber, items },
  }

  try {
    const result = await createLabOrder(payload)
    await db.partnerLabOrder.update({
      where: { id: order.id },
      data: {
        status: PartnerLabOrderStatus.ACKNOWLEDGED,
        lastEventAt: new Date(),
        ...(result.externalOrderId ? { externalOrderId: result.externalOrderId } : {}),
        requestSnapshot: {
          ...snapshot,
          sentAt: new Date().toISOString(),
          response: result.raw as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    })
    await db.auditLog.create({
      data: {
        actorUserId: null,
        action: "UPDATE",
        entityType: "PartnerLabOrder",
        entityId: order.id,
        detail: {
          source: "partner-lab-outbound",
          outcome: "sent",
          orderNumber: order.orderNumber,
          externalOrderId: result.externalOrderId,
        },
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.partnerLabOrder.update({
      where: { id: order.id },
      data: {
        status: PartnerLabOrderStatus.FAILED,
        lastEventAt: new Date(),
        requestSnapshot: {
          ...snapshot,
          error: message,
          failedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })
    await db.auditLog.create({
      data: {
        actorUserId: null,
        action: "UPDATE",
        entityType: "PartnerLabOrder",
        entityId: order.id,
        detail: {
          source: "partner-lab-outbound",
          outcome: "failed",
          orderNumber: order.orderNumber,
          error: message,
        },
      },
    })
  }
}

/**
 * Schedule the background send of newly-created orders. Uses Next's `after()`
 * so it runs post-response and never blocks signing. When called outside a
 * request context (scripts/tests), `after()` throws — we fall back to a
 * detached promise so the send still runs.
 */
export function enqueueOutboundSend(orderIds: string[]): void {
  if (orderIds.length === 0) return
  const run = () => Promise.all(orderIds.map((id) => sendOutboundLabOrder(id)))
  try {
    after(run)
  } catch {
    void run()
  }
}
