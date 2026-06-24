/**
 * Derived installment (EMI) plan for an invoice.
 *
 * We do NOT store a schedule table. An invoice keeps a single `installmentCount`
 * (1 = pay in full). The per-installment amount + paid/due status are computed
 * here from the total and the captured-payment sum, so the same logic drives
 * the admin detail view, the patient portal, and the "record next installment"
 * default amount. Pure + dependency-free so client components can import it.
 *
 * Splitting rule: equal parts, with any rounding remainder added to the LAST
 * installment so the parts always sum back to the exact total. Captured money
 * is allocated to installments oldest-first (FIFO).
 */

export type InstallmentStatus = "PAID" | "PARTIAL" | "DUE"

export type Installment = {
  /** 1-based position. */
  seq: number
  amountCents: number
  paidCents: number
  remainingCents: number
  status: InstallmentStatus
}

export type InstallmentPlan = {
  count: number
  installments: Installment[]
  totalCents: number
  paidCents: number
  balanceCents: number
  /** First not-fully-paid installment, or null when the invoice is settled. */
  nextDue: Installment | null
}

/** Equal split of `totalCents` into `count` parts, remainder on the last. */
export function splitInstallments(totalCents: number, count: number): number[] {
  const n = Math.max(1, Math.floor(count) || 1)
  const total = Math.max(0, Math.round(totalCents))
  if (n === 1) return [total]
  const base = Math.floor(total / n)
  const parts = Array.from({ length: n }, () => base)
  parts[n - 1] = total - base * (n - 1) // remainder lands on the last part
  return parts
}

export function computeInstallments(
  totalCents: number,
  installmentCount: number,
  paidCents: number,
): InstallmentPlan {
  const total = Math.max(0, Math.round(totalCents))
  const paid = Math.max(0, Math.round(paidCents))
  const amounts = splitInstallments(total, installmentCount)

  let remainingPaid = paid
  const installments: Installment[] = amounts.map((amountCents, i) => {
    const applied = Math.min(remainingPaid, amountCents)
    remainingPaid -= applied
    const status: InstallmentStatus =
      amountCents > 0 && applied >= amountCents ? "PAID" : applied > 0 ? "PARTIAL" : "DUE"
    return {
      seq: i + 1,
      amountCents,
      paidCents: applied,
      remainingCents: amountCents - applied,
      status,
    }
  })

  return {
    count: amounts.length,
    installments,
    totalCents: total,
    paidCents: Math.min(paid, total),
    balanceCents: Math.max(0, total - paid),
    nextDue: installments.find((x) => x.status !== "PAID") ?? null,
  }
}
