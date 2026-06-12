"use client";

/**
 * Patient prescriptions — backed by treatment plans
 * (GET /api/patient/me/treatment-plans). Each plan lists its items
 * (medications / supplements / IV / rehab / aesthetic).
 */

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, Pill } from "lucide-react";

type PlanItem = {
  id: string;
  kind: "RX" | "SUPPLEMENT" | "IV" | "REHAB" | "AESTHETIC";
  name: string;
  dose: string | null;
  frequency: string | null;
  durationDays: number | null;
  instructions: string | null;
};

type Plan = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  createdAt: string;
  signedBy: { id: string; staff: { fullName: string } | null } | null;
  items: PlanItem[];
};

const KIND_LABEL: Record<string, string> = {
  RX: "Medication",
  SUPPLEMENT: "Supplement",
  IV: "IV therapy",
  REHAB: "Rehab",
  AESTHETIC: "Aesthetic",
};
const STATUS_STYLE: Record<string, string> = {
  SIGNED: "bg-[#ECFDF3] text-[#027A48]",
  REVOKED: "bg-[#FEF3F2] text-[#B42318]",
};

export default function PatientPrescriptionsPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/patient/me/treatment-plans?limit=50", { credentials: "include" });
      if (!res.ok) {
        setPlans([]);
        return;
      }
      const json = await res.json();
      const list: Plan[] = Array.isArray(json?.data) ? json.data : [];
      setPlans(list);
      if (list.length) setOpen(list[0].id);
    } catch {
      setPlans([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Prescriptions</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          Treatment plans and medications prescribed to you.
        </p>
      </div>

      {plans === null ? (
        <div className="p-8 flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl p-10 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
          No prescriptions yet. They&apos;ll appear here once a doctor signs a treatment plan.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((p) => {
            const isOpen = open === p.id;
            return (
              <div key={p.id} className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 rounded-lg bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center flex-shrink-0">
                      <Pill className="h-4 w-4 text-[#2E37A4] dark:text-[#A5B4FC]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">{p.title}</p>
                      <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                        {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        {p.signedBy?.staff?.fullName ? ` · ${p.signedBy.staff.fullName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status] ?? "bg-[#F2F4F7] text-[#475467]"}`}>
                      {p.status}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-[#667085] dark:text-[#94A3B8] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen ? (
                  <div className="px-5 pb-5 border-t border-[#EAECF0] dark:border-[#374151]">
                    {p.summary ? (
                      <p className="text-sm text-[#475467] dark:text-[#CBD5E1] mt-4">{p.summary}</p>
                    ) : null}
                    {p.items.length === 0 ? (
                      <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-4">No items on this plan.</p>
                    ) : (
                      <ul className="mt-4 flex flex-col divide-y divide-[#EAECF0] dark:divide-[#374151]">
                        {p.items.map((it) => (
                          <li key={it.id} className="py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{it.name}</span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] text-[#2E37A4] dark:text-[#A5B4FC]">
                                {KIND_LABEL[it.kind] ?? it.kind}
                              </span>
                            </div>
                            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1">
                              {[it.dose, it.frequency, it.durationDays ? `${it.durationDays} days` : null].filter(Boolean).join(" · ") || "—"}
                            </p>
                            {it.instructions ? (
                              <p className="text-xs text-[#475467] dark:text-[#CBD5E1] mt-1">{it.instructions}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
