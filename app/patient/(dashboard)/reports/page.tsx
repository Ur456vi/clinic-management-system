"use client";

/**
 * Patient health reports — real aggregates derived from the patient's own
 * appointments, treatment plans, lab results, and invoices.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck,
  FlaskConical,
  Loader2,
  Pill,
  Wallet,
} from "lucide-react";

type Appt = { status: string; startsAt: string };
type Plan = { status: string };
type Lab = { id: string };
type Invoice = { status: string; totalCents: number; paidCents: number; currency: string };

async function getList<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.data) ? (json.data as T[]) : [];
}

function money(cents: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(0)}`;
  }
}

export default function PatientReportsPage() {
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const load = useCallback(async () => {
    try {
      const [a, p, l, i] = await Promise.all([
        getList<Appt>("/api/patient/me/appointments?limit=100"),
        getList<Plan>("/api/patient/me/treatment-plans?limit=100"),
        getList<Lab>("/api/patient/me/lab-results?limit=100"),
        getList<Invoice>("/api/patient/me/invoices?limit=100"),
      ]);
      setAppts(a);
      setPlans(p);
      setLabs(l);
      setInvoices(i);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const now = Date.now();
  const upcoming = appts.filter((a) => new Date(a.startsAt).getTime() >= now && (a.status === "REQUESTED" || a.status === "CONFIRMED")).length;
  const completed = appts.filter((a) => a.status === "COMPLETED").length;
  const outstanding = invoices
    .filter((i) => i.status === "OPEN" || i.status === "PARTIALLY_PAID")
    .reduce((sum, i) => sum + Math.max(0, i.totalCents - i.paidCents), 0);
  const currency = invoices.find((i) => i.currency)?.currency ?? "INR";

  const cards = [
    { label: "Total Appointments", value: String(appts.length), sub: `${upcoming} upcoming · ${completed} completed`, icon: CalendarCheck, color: "text-[#2E37A4] dark:text-[#A5B4FC]", bg: "bg-[#F4F5FF] dark:bg-[#312E81]" },
    { label: "Prescriptions", value: String(plans.length), sub: `${plans.filter((p) => p.status === "SIGNED").length} active`, icon: Pill, color: "text-[#12B76A]", bg: "bg-[#ECFDF3]" },
    { label: "Lab Results", value: String(labs.length), sub: "reported", icon: FlaskConical, color: "text-[#175CD3]", bg: "bg-[#EFF8FF] dark:bg-[#1E3A5F]" },
    { label: "Outstanding Balance", value: money(outstanding, currency), sub: `${invoices.length} invoices`, icon: Wallet, color: "text-[#F79009]", bg: "bg-[#FFFAEB]" },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" /> Loading reports…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Health Reports</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          A summary of your appointments, prescriptions, labs, and billing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#667085] dark:text-[#94A3B8]">{c.label}</span>
              <span className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB] mt-3">{c.value}</p>
            <p className="text-xs text-[#98A2B3] dark:text-[#94A3B8] mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
          <h2 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">Appointment breakdown</h2>
        </div>
        <div className="flex flex-col gap-3">
          {["CONFIRMED", "COMPLETED", "REQUESTED", "CANCELLED", "NO_SHOW"].map((s) => {
            const count = appts.filter((a) => a.status === s).length;
            const pct = appts.length ? Math.round((count / appts.length) * 100) : 0;
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-28 text-xs font-semibold text-[#475467] dark:text-[#CBD5E1]">{s}</span>
                <div className="flex-1 h-2 rounded-full bg-[#F2F4F7] dark:bg-[#111827] overflow-hidden">
                  <div className="h-full bg-[#2E37A4] dark:bg-[#A5B4FC] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-[#667085] dark:text-[#94A3B8]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
