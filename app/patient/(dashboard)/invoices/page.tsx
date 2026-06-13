"use client";

/**
 * Patient billing — read-only list of the patient's own invoices.
 *
 * Source: GET /api/patient/me/invoices (invoices with department, line
 * items, and payments inlined). Payment is collected at the clinic (UPI /
 * cash) and marked received by reception; the patient sees the resulting
 * status, amount paid, and balance — there is no online "pay now" here.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Receipt, Building2, ChevronDown, ChevronUp } from "lucide-react";

type Payment = {
  id: string;
  method: string;
  status: string;
  amountCents: number;
  receivedAt: string | null;
};

type Item = {
  id: string;
  description: string;
  quantity: string | number;
  lineTotalCents: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID";
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  issuedAt: string | null;
  createdAt: string;
  department: { id: string; name: string } | null;
  items: Item[];
  payments: Payment[];
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-[#F2F4F7] text-[#475467]",
  ISSUED: "bg-[#FFFAEB] text-[#B54708]",
  PARTIALLY_PAID: "bg-[#EFF8FF] text-[#175CD3]",
  PAID: "bg-[#ECFDF3] text-[#027A48]",
  VOID: "bg-[#FEF3F2] text-[#B42318]",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Unpaid",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  VOID: "Void",
};

function fmt(cents: number): string {
  return `₹${(cents / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function capturedPaid(inv: Invoice): number {
  return inv.payments
    .filter((p) => p.status === "CAPTURED")
    .reduce((acc, p) => acc + (Number(p.amountCents) || 0), 0);
}

function methodLabel(inv: Invoice): string | null {
  const latest = inv.payments.find((p) => p.status === "CAPTURED");
  return latest ? latest.method : null;
}

export default function PatientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/patient/me/invoices?limit=100", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setInvoices(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
      setInvoices([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totals = useMemo(() => {
    const list = invoices ?? [];
    let billed = 0;
    let paid = 0;
    let outstanding = 0;
    for (const inv of list) {
      if (inv.status === "VOID") continue;
      const p = capturedPaid(inv);
      billed += inv.totalCents;
      paid += p;
      if (inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID") {
        outstanding += Math.max(0, inv.totalCents - p);
      }
    }
    return { billed, paid, outstanding };
  }, [invoices]);

  if (invoices === null) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" /> Loading your invoices…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Billing</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          Your invoices and payment history. Payments are collected at the clinic.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total billed" value={fmt(totals.billed)} />
        <SummaryCard label="Paid" value={fmt(totals.paid)} tone="green" />
        <SummaryCard label="Outstanding" value={fmt(totals.outstanding)} tone={totals.outstanding > 0 ? "amber" : "default"} />
      </div>

      {error ? (
        <p className="text-sm text-[#B42318]">{error}</p>
      ) : null}

      {/* Invoice list */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-2 text-center">
            <span className="h-11 w-11 rounded-xl bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
              <Receipt className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
            </span>
            <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">No invoices yet</p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Invoices appear here after a clinic visit.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
            {invoices.map((inv) => {
              const paid = capturedPaid(inv);
              const balance = Math.max(0, inv.totalCents - paid);
              const method = methodLabel(inv);
              const open = expanded === inv.id;
              return (
                <li key={inv.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : inv.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{inv.invoiceNumber}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[inv.status] ?? STATUS_STYLE.ISSUED}`}>
                          {STATUS_LABEL[inv.status] ?? inv.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-[#667085] dark:text-[#94A3B8]">
                        <span>{fmtDate(inv.issuedAt ?? inv.createdAt)}</span>
                        {inv.department ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" /> {inv.department.name}
                          </span>
                        ) : null}
                        {method ? <span>Paid via {method}</span> : null}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">{fmt(inv.totalCents)}</p>
                      <p className={`text-xs ${balance > 0 ? "text-[#B54708]" : "text-[#027A48]"}`}>
                        {balance > 0 ? `${fmt(balance)} due` : "Settled"}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-[#98A2B3] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#98A2B3] flex-shrink-0" />
                    )}
                  </button>

                  {open ? (
                    <div className="px-5 pb-5 pt-1">
                      <div className="rounded-lg border border-[#EAECF0] dark:border-[#374151] overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#F9FAFB] dark:bg-[#111827] text-xs text-[#667085] dark:text-[#94A3B8]">
                              <th className="text-left font-semibold px-3 py-2">Description</th>
                              <th className="text-right font-semibold px-3 py-2 w-16">Qty</th>
                              <th className="text-right font-semibold px-3 py-2 w-28">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                            {inv.items.map((it) => (
                              <tr key={it.id}>
                                <td className="px-3 py-2 text-[#101828] dark:text-[#F9FAFB]">{it.description}</td>
                                <td className="px-3 py-2 text-right text-[#475467] dark:text-[#CBD5E1]">{String(it.quantity)}</td>
                                <td className="px-3 py-2 text-right text-[#101828] dark:text-[#F9FAFB]">{fmt(it.lineTotalCents)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 ml-auto w-full sm:w-64 text-sm">
                        <Row label="Subtotal" value={fmt(inv.subtotalCents)} />
                        <Row label="GST" value={fmt(inv.taxCents)} />
                        <Row label="Total" value={fmt(inv.totalCents)} bold />
                        <Row label="Paid" value={fmt(paid)} />
                        <Row label="Balance" value={fmt(balance)} bold tone={balance > 0 ? "amber" : "green"} />
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "amber" }) {
  const color =
    tone === "green"
      ? "text-[#027A48]"
      : tone === "amber"
        ? "text-[#B54708]"
        : "text-[#101828] dark:text-[#F9FAFB]";
  return (
    <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-4">
      <p className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, bold = false, tone = "default" }: { label: string; value: string; bold?: boolean; tone?: "default" | "green" | "amber" }) {
  const color =
    tone === "green"
      ? "text-[#027A48]"
      : tone === "amber"
        ? "text-[#B54708]"
        : "text-[#475467] dark:text-[#CBD5E1]";
  return (
    <div className={`flex justify-between py-1 ${bold ? "border-t border-[#EAECF0] dark:border-[#374151] mt-1 pt-1.5" : ""}`}>
      <span className="text-[#667085] dark:text-[#94A3B8]">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${color}`}>{value}</span>
    </div>
  );
}
