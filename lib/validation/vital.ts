/**
 * Zod schemas for vitals readings (BE — patient dashboard support).
 *
 * Every measurement is optional so a partial reading (e.g. just BP) is
 * valid, but at least one measurement must be present — an all-empty row
 * is rejected.
 */

import { z } from "zod"

const intRange = (min: number, max: number) =>
  z.number().int().min(min).max(max).nullable().optional()
const floatRange = (min: number, max: number) =>
  z.number().min(min).max(max).nullable().optional()

export const createVitalSchema = z
  .object({
    systolic: intRange(40, 300),
    diastolic: intRange(20, 200),
    heartRate: intRange(20, 300),
    weightKg: floatRange(1, 500),
    heightCm: floatRange(20, 280),
    temperatureF: floatRange(80, 115),
    spo2: intRange(40, 100),
    notes: z.string().trim().max(500).nullable().optional(),
    recordedAt: z
      .string()
      .datetime()
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
  })
  .refine(
    (v) =>
      [v.systolic, v.diastolic, v.heartRate, v.weightKg, v.heightCm, v.temperatureF, v.spo2].some(
        (x) => x !== null && x !== undefined,
      ),
    { message: "Record at least one measurement" },
  )

export type CreateVitalInput = z.infer<typeof createVitalSchema>

export const listVitalsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
    .pipe(z.number().int().positive().max(100).optional()),
})
