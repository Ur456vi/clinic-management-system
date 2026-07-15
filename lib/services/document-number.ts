/**
 * Human-readable document numbers shared by patients, invoices and
 * prescriptions.
 *
 * Format: `PREFIX/26-27/06-0100`
 *
 *   PREFIX   document kind, e.g. `IPHMH` (patient), `IPHMH-INV` (invoice),
 *            `IPHMH-PRESC` (prescription)
 *   26-27    fiscal year (Indian FY: April→March, so June 2026 → 26-27)
 *   06       month the document was created
 *   0100     serial within the fiscal year, starting at 0100 and resetting
 *            each FY. The serial is clinic-wide per document kind — it counts
 *            every document of that kind issued in the FY, not per patient.
 *
 * TEMPORARY generation: the serial is `max(existing serial this FY) + 1`.
 * Because the month sits *before* the serial in the string, we cannot rely on
 * `ORDER BY … DESC` (that ranks by month); callers hand us the FY's existing
 * numbers and we take the max. There is a race under concurrent inserts — the
 * `@@unique` on each number column rejects the loser as a 5xx. A Postgres
 * sequence is the right long-term fix (BE-09 for patients, Sprint 2 for
 * invoices).
 */

/** Document-kind prefixes. Keep these in one place so the format stays uniform. */
export const DOCUMENT_PREFIX = {
  patient: "IPHMH",
  invoice: "IPHMH-INV",
  prescription: "IPHMH-PRESC",
  /// Partner-lab order number (see lib/services/partner-lab.ts). Minted by the
  /// future outbound order-creation flow; echoed back on inbound webhooks.
  partnerLabOrder: "IPHMH-LAB",
} as const

/** First serial assigned in a fiscal year (numbers start at 0100, not 0/1). */
const SERIAL_START = 100

/**
 * Fiscal-year prefix (`PREFIX/26-27/`) and 2-digit month for a document
 * created at `now`. Indian FY runs April→March.
 */
export function documentNumberParts(
  docPrefix: string,
  now: Date,
): { fyPrefix: string; month: string } {
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12
  const startYear = month >= 4 ? year : year - 1
  const endYear = startYear + 1
  const fyLabel = `${String(startYear % 100).padStart(2, "0")}-${String(
    endYear % 100,
  ).padStart(2, "0")}`
  return {
    fyPrefix: `${docPrefix}/${fyLabel}/`,
    month: String(month).padStart(2, "0"),
  }
}

/** Largest serial among the given document numbers, or `SERIAL_START - 1` if none. */
function maxSerial(numbers: readonly string[]): number {
  let max = SERIAL_START - 1
  for (const n of numbers) {
    const tail = Number(n.slice(n.lastIndexOf("-") + 1))
    if (Number.isFinite(tail) && tail > max) max = tail
  }
  return max
}

/**
 * Compute the next document number for `docPrefix`.
 *
 * `fetchExisting` receives the FY prefix (e.g. `IPHMH-INV/26-27/`) and must
 * return every existing number of this kind in that fiscal year — the caller
 * owns the table/column and the transaction.
 */
export async function nextDocumentNumber(
  docPrefix: string,
  fetchExisting: (fyPrefix: string) => Promise<readonly string[]>,
  now: Date = new Date(),
): Promise<string> {
  const { fyPrefix, month } = documentNumberParts(docPrefix, now)
  const existing = await fetchExisting(fyPrefix)
  const serial = maxSerial(existing) + 1
  return `${fyPrefix}${month}-${String(serial).padStart(4, "0")}`
}
