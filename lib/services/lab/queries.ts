/**
 * Read-side helpers for lab orders — listing + a safe serializer shared by the
 * staff (reception) and patient-portal routes. The serializer omits the raw
 * request/response payloads (they can hold PII / internal detail).
 */

import type { LabOrder, LabOrderStatus, Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import type { ResolvedItem } from "./mapping"

export type SerializedLabOrder = {
  id: string
  orderNumber: string
  status: LabOrderStatus
  collectionMode: "HOME" | "CENTER"
  centerCode: string | null
  appointmentStart: string | null
  appointmentEnd: string | null
  appointmentId: string | null
  workOrderId: string | null
  reportUrl: string | null
  reportStatus: string | null
  labNumber: string | null
  reason: string | null
  bookedVia: string | null
  items: { testName: string; labTestName: string | null; labTestId: string | null }[]
  createdAt: string
  updatedAt: string
}

export function serializeOrder(order: LabOrder): SerializedLabOrder {
  const items = ((order.items as unknown as ResolvedItem[]) ?? []).map((it) => ({
    testName: it.testName,
    labTestName: it.labTestName ?? null,
    labTestId: it.labTestId ?? null,
  }))
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    collectionMode: order.collectionMode,
    centerCode: order.centerCode,
    appointmentStart: order.appointmentStart?.toISOString() ?? null,
    appointmentEnd: order.appointmentEnd?.toISOString() ?? null,
    appointmentId: order.appointmentId,
    workOrderId: order.workOrderId,
    reportUrl: order.reportUrl,
    reportStatus: order.reportStatus,
    labNumber: order.labNumber,
    reason: order.reason,
    bookedVia: order.bookedVia,
    items,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

/** All of a patient's lab orders, newest first. */
export async function listOrdersForPatient(patientId: string): Promise<SerializedLabOrder[]> {
  const rows = await db.labOrder.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(serializeOrder)
}

/** Staff listing with patient identity, optionally filtered by status / patient. */
export async function listOrdersForStaff(filter: {
  status?: LabOrderStatus
  patientId?: string
  take?: number
}): Promise<(SerializedLabOrder & { patient: { id: string; fullName: string; patientNumber: string } })[]> {
  const where: Prisma.LabOrderWhereInput = {}
  if (filter.status) where.status = filter.status
  if (filter.patientId) where.patientId = filter.patientId
  const rows = await db.labOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filter.take ?? 100,
    include: { patient: { select: { id: true, fullName: true, patientNumber: true } } },
  })
  return rows.map((r) => ({ ...serializeOrder(r), patient: r.patient }))
}

/** Assert an order belongs to a patient (patient-portal authorization). */
export async function assertOrderOwnedByPatient(orderId: string, patientId: string): Promise<void> {
  const order = await db.labOrder.findUnique({ where: { id: orderId }, select: { patientId: true } })
  if (!order || order.patientId !== patientId) {
    throw new Error("NOT_OWNER")
  }
}
