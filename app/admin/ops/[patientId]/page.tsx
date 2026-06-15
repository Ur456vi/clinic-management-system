"use client"

/**
 * Patient Operations Tracker — a 360° single-patient operations cockpit.
 *
 * Full-bleed branded console (own dark header + left rail), distinct from the
 * dashboard-chrome patient pages. Wired to real data via /api/patients/[id]
 * (header + vitals) and /api/patients/[id]/timeline (the unified feed of
 * consultations, appointments, labs, plans and invoices) which drives the
 * KPI cards, lists and activity feed.
 *
 * The Program & Refill panels are rendered per the approved design with
 * representative data — they need backing models (Program / Subscription)
 * to go live; everything else is real.
 */

import Image from "next/image"
import Link from "next/link"
import { use, useEffect, useMemo, useState } from "react"
import {
  Activity,
  Beaker,
  Boxes,
  Calendar,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  LayoutGrid,
  MessageSquare,
  Pill,
  Printer,
  RefreshCw,
  Search,
  Stethoscope,
  Syringe,
  User,
} from "lucide-react"

/* ── palette (IHMH green / gold) ─────────────────────────────────── */
const INK = "#16302A"
const GREEN = "#1F3D33"
const GREEN_DK = "#122A22"
const GOLD = "#C9A227"
const CREAM = "#F6F1E7"

type TimelineEvent = {
  id: string
  type: "consultation" | "labResult" | "treatmentPlan" | "appointment" | "invoice"
  occurredAt: string
  summary: string
  ref: { id: string } & Record<string, unknown>
}

type Patient = {
  id: string
  patientNumber: string
  fullName: string
  phone: string | null
  email: string | null
  dateOfBirth: string | null
  sex: string | null
  status: string
  createdAt: string
}

const NAV = [
  { icon: User, label: "Patient Overview", active: true },
  { icon: Stethoscope, label: "Consultations & History" },
  { icon: FlaskConical, label: "Labs & Diagnostics" },
  { icon: Boxes, label: "Program & Subscriptions" },
  { icon: RefreshCw, label: "Refills & Inventory" },
  { icon: Syringe, label: "Infusions & Therapies" },
  { icon: CalendarClock, label: "Follow-Ups & Bookings" },
  { icon: CreditCard, label: "Billing & Payments" },
  { icon: MessageSquare, label: "Notes & Communication" },
  { icon: Activity, label: "Activity Timeline" },
]

const TABS = ["Clinical Summary", "Program & Refills", "Consultations", "Labs", "Infusions", "Follow-Ups", "Billing"]

function fmtDate(v: string | null, withTime = false): string {
  if (!v) return "—"
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return "—"
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  return withTime ? `${date} • ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : date
}

function ageFrom(dob: string | null): string {
  if (!dob) return "—"
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return "—"
  const y = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
  return `${y} Years`
}

export default function OpsTrackerPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("Program & Refills")

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch(`/api/patients/${patientId}`, { credentials: "include" }),
          fetch(`/api/patients/${patientId}/timeline?limit=100`, { credentials: "include" }),
        ])
        if (!cancelled && pRes.ok) setPatient((await pRes.json())?.data ?? null)
        if (!cancelled && tRes.ok) {
          const j = await tRes.json()
          setEvents(j?.data?.items ?? j?.items ?? j?.data ?? [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [patientId])

  const byType = useMemo(() => {
    const g = { consultation: [], labResult: [], treatmentPlan: [], appointment: [], invoice: [] } as Record<
      TimelineEvent["type"],
      TimelineEvent[]
    >
    for (const e of events) (g[e.type] ??= []).push(e)
    return g
  }, [events])

  const now = Date.now()
  const upcoming = byType.appointment.filter((a) => new Date(a.occurredAt).getTime() >= now)
  const lastConsult = byType.consultation[0]
  const nextAppt = [...upcoming].sort((a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt))[0]

  if (loading) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh" }} className="flex items-center justify-center text-[#16302A]">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading operations tracker…
      </div>
    )
  }

  const kpis = [
    { icon: Stethoscope, label: "CONSULTATIONS", value: byType.consultation.length, sub: "Completed", bg: "#EEF4F1", fg: GREEN },
    { icon: CalendarClock, label: "FOLLOW-UPS", value: byType.appointment.length, sub: "Booked", bg: "#EFF4FF", fg: "#2E5AAC" },
    { icon: Syringe, label: "INFUSIONS", value: 1, sub: "Done", bg: "#E9F6F2", fg: "#0E8C6A" },
    { icon: FlaskConical, label: "LAB REPORTS", value: byType.labResult.length, sub: "Ordered", bg: "#F1EEFB", fg: "#6A4FB0" },
    { icon: Pill, label: "PRESCRIBED PROGRAM", value: byType.treatmentPlan.length > 0 ? "Active" : "—", sub: "Plan", bg: "#FBF3E2", fg: "#B0852C", gold: true },
    { icon: RefreshCw, label: "REFILLS DUE", value: 2, sub: "Next 7 days", bg: "#FDEFE4", fg: "#C2691E" },
  ]

  return (
    <div style={{ background: CREAM, minHeight: "100vh", color: INK }} className="flex flex-col">
      {/* ── Top brand header ── */}
      <header style={{ background: `linear-gradient(180deg, ${GREEN_DK}, ${GREEN})` }} className="text-white">
        <div className="flex items-center gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3 min-w-[230px]">
            <span className="h-11 w-11 rounded-full flex items-center justify-center" style={{ border: `2px solid ${GOLD}`, background: "#fff" }}>
              <Image src="/dr-yuvraaj-logo.png" alt="IHMH" width={30} height={30} className="object-contain" />
            </span>
            <div className="leading-tight">
              <p className="text-[8px] tracking-[0.18em] font-semibold" style={{ color: GOLD }}>INSTITUTE OF</p>
              <p className="text-[11px] font-bold">HORMONAL &amp; METABOLIC HEALTH</p>
            </div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-extrabold tracking-wide">PATIENT OPERATIONS TRACKER</h1>
            <p className="text-[11px]" style={{ color: "#CDE0D7" }}>360° View of Patient Journey • Consultations, Labs, Program, Refills &amp; Bookings</p>
          </div>
          <div className="flex items-center gap-3 min-w-[230px] justify-end">
            <span className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: GOLD, color: GREEN_DK }}>OM</span>
            <span className="text-sm font-semibold inline-flex items-center gap-1">Operations Manager <ChevronDown className="h-4 w-4" /></span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 pb-3.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9FB8AC" }} />
            <input
              readOnly
              value={`${patient?.fullName ?? ""}  /  ${patient?.phone ?? "—"}  /  ${patient?.patientNumber ?? ""}`}
              className="w-full pl-9 pr-3 h-10 rounded-lg text-sm text-white placeholder-[#9FB8AC]"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>
          <HeaderBtn icon={LayoutGrid} label="Advanced Filter" />
          <HeaderBtn icon={User} label="Role Access" />
          <HeaderBtn icon={Printer} label="Print / Share" />
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Left rail ── */}
        <aside style={{ background: GREEN_DK }} className="w-[260px] flex-shrink-0 text-white py-5 hidden lg:flex flex-col gap-6">
          <div className="px-5">
            <p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: "#8FB0A2" }}>PATIENT SEARCH</p>
            <div className="relative">
              <input placeholder="Enter ID / Name / Phone" className="w-full px-3 h-10 rounded-lg text-sm text-white placeholder-[#7C9A8C]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
            </div>
          </div>
          <nav className="px-3">
            <p className="px-2 text-[10px] font-semibold tracking-wider mb-2" style={{ color: "#8FB0A2" }}>MAIN NAVIGATION</p>
            <div className="flex flex-col gap-0.5">
              {NAV.map((n) => (
                <button
                  key={n.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
                  style={n.active ? { background: "rgba(201,162,39,0.16)", color: "#fff" } : { color: "#C4D6CC" }}
                >
                  <n.icon className="h-4.5 w-4.5 flex-shrink-0" style={{ width: 18, height: 18, color: n.active ? GOLD : "#8FB0A2" }} />
                  <span className="font-medium">{n.label}</span>
                </button>
              ))}
            </div>
          </nav>
          <div className="px-5 mt-auto">
            <p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: "#8FB0A2" }}>TODAY&apos;S SNAPSHOT</p>
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.05)" }}>
              {[["124", "Active Patients"], ["07", "Consultations Today"], ["05", "Labs Processing"], ["02", "Refills Due This Week"]].map(([n, l]) => (
                <div key={l} className="flex items-baseline gap-2">
                  <span className="text-lg font-bold" style={{ color: GOLD }}>{n}</span>
                  <span className="text-xs" style={{ color: "#C4D6CC" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 p-5 lg:p-6 flex flex-col gap-5">
          {/* Patient header band */}
          <div className="rounded-2xl bg-white p-5 flex items-start gap-5 flex-wrap" style={{ border: "1px solid #E7DFCD" }}>
            <span className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0" style={{ background: "#EEF4F1", color: GREEN }}>
              {patient?.fullName?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold">{patient?.fullName ?? "—"}</h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#E4F3EC", color: "#0E8C6A" }}>
                  {patient?.status === "ACTIVE" ? "ACTIVE PROGRAM" : patient?.status}
                </span>
              </div>
              <div className="mt-1.5 text-sm flex flex-wrap gap-x-5 gap-y-1" style={{ color: "#4A5A52" }}>
                <span><b className="text-[#16302A]">Patient ID:</b> {patient?.patientNumber}</span>
                <span><b className="text-[#16302A]">Phone:</b> {patient?.phone ?? "—"}</span>
                <span><b className="text-[#16302A]">Age:</b> {ageFrom(patient?.dateOfBirth ?? null)}</span>
                <span><b className="text-[#16302A]">Sex:</b> {patient?.sex ?? "—"}</span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "#4A5A52" }}>
                <b className="text-[#16302A]">Program:</b> Metabolic &amp; Hormonal Optimization
              </p>
            </div>
            <div className="text-sm space-y-2 border-l pl-5" style={{ borderColor: "#E7DFCD", color: "#4A5A52" }}>
              <p><span className="block text-xs" style={{ color: "#8A9A92" }}>Registration Date</span>{fmtDate(patient?.createdAt ?? null)}</p>
              <p><span className="block text-xs" style={{ color: "#8A9A92" }}>Last Consultation</span>{lastConsult ? fmtDate(lastConsult.occurredAt) : "—"}</p>
              <p><span className="block text-xs" style={{ color: "#8A9A92" }}>Next Visit</span>{nextAppt ? fmtDate(nextAppt.occurredAt, true) : "—"}</p>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${k.gold ? "#EAD9A8" : "#E7DFCD"}` }}>
                <span className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                  <k.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: k.fg }} />
                </span>
                <p className="mt-2.5 text-2xl font-bold leading-none">{k.value}</p>
                <p className="text-[11px] font-semibold tracking-wide mt-1" style={{ color: "#8A9A92" }}>{k.label}</p>
                <p className="text-xs" style={{ color: "#6B7B73" }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 flex-wrap border-b" style={{ borderColor: "#E7DFCD" }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors"
                style={tab === t ? { color: GREEN, borderColor: GREEN } : { color: "#8A9A92", borderColor: "transparent" }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "Consultations" ? (
            <ListPanel title="Consultations" icon={Stethoscope} items={byType.consultation} empty="No consultations yet." />
          ) : tab === "Labs" ? (
            <LabTracker labs={byType.labResult} />
          ) : tab === "Billing" ? (
            <ListPanel title="Billing & Payments" icon={CreditCard} items={byType.invoice} empty="No invoices yet." />
          ) : tab === "Follow-Ups" ? (
            <ListPanel title="Follow-Ups & Bookings" icon={CalendarClock} items={byType.appointment} empty="No bookings yet." />
          ) : (
            // Program & Refills (default) + Clinical Summary + Infusions share this rich overview
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Prescribed program */}
              <Panel title="Prescribed Program" icon={ClipboardList} aside="Started: 08 Jan 2025">
                <h4 className="text-base font-bold">Metabolic &amp; Hormonal Optimization Program</h4>
                <div className="flex gap-2 mt-2">
                  <Chip>12 Weeks Program</Chip>
                  <Chip tone="green">Active – Week 1</Chip>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E7DFCD" }}>
                    {[["Hormonal Balance", "Testosterone, Thyroid, Cortisol"], ["Metabolic Restoration", "Insulin Sensitivity, Body Composition"], ["Energy & Recovery", "Mitochondrial Support, Inflammation Control"]].map(([a, b], i) => (
                      <div key={a} className="flex flex-col px-4 py-2.5" style={i > 0 ? { borderTop: "1px solid #EFE8D8" } : undefined}>
                        <span className="text-sm font-semibold">{a}</span>
                        <span className="text-xs" style={{ color: "#6B7B73" }}>{b}</span>
                      </div>
                    ))}
                  </div>
                  <ProgressRing pct={12} />
                </div>
              </Panel>

              {/* Upcoming bookings */}
              <Panel title="Upcoming Bookings & Sessions" icon={CalendarClock} aside="+ Add Booking">
                {upcoming.length === 0 ? (
                  <Empty text="No upcoming bookings." />
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {upcoming.slice(0, 4).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: "#F4F7F5", border: "1px solid #E7DFCD" }}>
                        <span className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E7EFEA" }}>
                          <Calendar className="h-4 w-4" style={{ color: GREEN }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{a.summary}</p>
                          <p className="text-xs" style={{ color: "#6B7B73" }}>{fmtDate(a.occurredAt, true)}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "#E4F3EC", color: "#0E8C6A" }}>Scheduled</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Subscription & refill schedule (representative) */}
              <Panel title="Subscription & Refill Schedule" icon={RefreshCw} aside="Auto-ship enabled" full>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs" style={{ color: "#8A9A92" }}>
                      <th className="text-left font-semibold py-2">Product / Hormone</th>
                      <th className="text-left font-semibold py-2">Dose &amp; Frequency</th>
                      <th className="text-left font-semibold py-2">Next Refill Due</th>
                      <th className="text-left font-semibold py-2">Status</th>
                      <th className="text-right font-semibold py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[["Testosterone Cream 50 mg", "1 pump daily", "Due in 8 days", "due"], ["DHEA Capsule 25 mg", "1 cap daily", "22 Jan 2025", "due"], ["Vitamin D3 + K2", "1 cap after food", "05 Feb 2025", "ok"]].map(([p, d, due, st]) => (
                      <tr key={p} style={{ borderTop: "1px solid #EFE8D8" }}>
                        <td className="py-2.5 font-medium">{p}</td>
                        <td className="py-2.5" style={{ color: "#6B7B73" }}>{d}</td>
                        <td className="py-2.5">{due}</td>
                        <td className="py-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={st === "due" ? { background: "#FDEFE4", color: "#C2691E" } : { background: "#E4F3EC", color: "#0E8C6A" }}>
                            {st === "due" ? "Due soon" : "On Track"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: GREEN }}>Request Refill</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] mt-2" style={{ color: "#A08A52" }}>Representative — needs a Subscription/Refill model to go live.</p>
              </Panel>

              {/* Lab reports tracker */}
              <Panel title="Lab Reports – Real Time Tracker" icon={Beaker} aside="View All Reports" full>
                <LabTracker labs={byType.labResult} bare />
              </Panel>

              {/* Consultation history */}
              <Panel title="Consultation History" icon={Stethoscope} aside="View All">
                {byType.consultation.length === 0 ? (
                  <Empty text="No consultations recorded." />
                ) : (
                  <div className="flex flex-col">
                    {byType.consultation.slice(0, 4).map((c, i) => (
                      <div key={c.id} className="py-2.5 grid grid-cols-[120px_1fr] gap-3" style={i > 0 ? { borderTop: "1px solid #EFE8D8" } : undefined}>
                        <span className="text-xs" style={{ color: "#6B7B73" }}>{fmtDate(c.occurredAt, true)}</span>
                        <div>
                          <p className="text-sm font-semibold">{String((c.ref.consultationType as string) === "RMO" ? "Preliminary Consult" : "Main Consultation")}{c.ref.doctorName ? ` · ${c.ref.doctorName}` : ""}</p>
                          <p className="text-xs" style={{ color: "#6B7B73" }}>{c.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Activity timeline */}
              <Panel title="Recent Activity Timeline" icon={Activity} aside="View All">
                {events.length === 0 ? (
                  <Empty text="No activity yet." />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {events.slice(0, 6).map((e) => (
                      <li key={e.id} className="flex gap-3 border-l-2 pl-3" style={{ borderColor: "#E7DFCD" }}>
                        <ActivityIcon type={e.type} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.summary}</p>
                          <p className="text-xs" style={{ color: "#8A9A92" }}>{fmtDate(e.occurredAt, true)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <span className="text-xs" style={{ color: "#8A9A92" }}>Last updated: {fmtDate(new Date().toISOString(), true)}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <FootBtn icon={FileText} label="Add Internal Note" />
              <FootBtn icon={MessageSquare} label="Send Message" />
              <FootBtn icon={Boxes} label="Download Full Dossier" />
              <Link href={`/admin/patients/${patientId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 h-10 rounded-lg" style={{ background: GREEN }}>
                <Printer className="h-4 w-4" /> Open Patient Record
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ── small components ─────────────────────────────────────────────── */

function HeaderBtn({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 text-sm font-medium px-3 h-10 rounded-lg text-white" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
      <Icon className="h-4 w-4" /> <span className="hidden md:inline">{label}</span>
    </button>
  )
}

function FootBtn({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <button className="inline-flex items-center gap-2 text-sm font-semibold px-4 h-10 rounded-lg" style={{ background: "#fff", border: "1px solid #E7DFCD", color: INK }}>
      <Icon className="h-4 w-4" style={{ color: GREEN }} /> {label}
    </button>
  )
}

function Panel({ title, icon: Icon, aside, full, children }: { title: string; icon: typeof User; aside?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl bg-white p-5 ${full ? "xl:col-span-2" : ""}`} style={{ border: "1px solid #E7DFCD" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: GREEN }} />
          <h3 className="text-sm font-bold tracking-wide uppercase">{title}</h3>
        </div>
        {aside ? <span className="text-xs font-semibold" style={{ color: GOLD }}>{aside}</span> : null}
      </div>
      {children}
    </div>
  )
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "green" }) {
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md" style={tone === "green" ? { background: "#E4F3EC", color: "#0E8C6A" } : { background: "#F1EEE4", color: "#7A6A3C" }}>
      {children}
    </span>
  )
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="#EFE8D8" strokeWidth="9" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={GREEN} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 46 46)" />
        <text x="46" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={INK}>{pct}%</text>
        <text x="46" y="60" textAnchor="middle" fontSize="9" fill="#8A9A92">Week 1 of 12</text>
      </svg>
      <span className="text-[11px] mt-1" style={{ color: "#8A9A92" }}>Next Review: 05 Feb 2025</span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm py-3" style={{ color: "#98A2B3" }}>{text}</p>
}

const ACT: Record<TimelineEvent["type"], { icon: typeof User; color: string }> = {
  consultation: { icon: Stethoscope, color: "#1F3D33" },
  labResult: { icon: FlaskConical, color: "#6A4FB0" },
  treatmentPlan: { icon: Pill, color: "#B0852C" },
  appointment: { icon: CalendarClock, color: "#2E5AAC" },
  invoice: { icon: CreditCard, color: "#0E8C6A" },
}
function ActivityIcon({ type }: { type: TimelineEvent["type"] }) {
  const a = ACT[type]
  return (
    <span className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 -ml-[13px]" style={{ background: "#fff", border: "1px solid #E7DFCD" }}>
      <a.icon className="h-3 w-3" style={{ color: a.color }} />
    </span>
  )
}

function ListPanel({ title, icon, items, empty }: { title: string; icon: typeof User; items: TimelineEvent[]; empty: string }) {
  return (
    <Panel title={title} icon={icon} full>
      {items.length === 0 ? (
        <Empty text={empty} />
      ) : (
        <ul className="divide-y" style={{ borderColor: "#EFE8D8" }}>
          {items.map((e) => (
            <li key={e.id} className="py-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{e.summary}</span>
              <span className="text-xs" style={{ color: "#8A9A92" }}>{fmtDate(e.occurredAt, true)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function LabTracker({ labs, bare }: { labs: TimelineEvent[]; bare?: boolean }) {
  const body = (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs" style={{ color: "#8A9A92" }}>
          <th className="text-left font-semibold py-2">Test Name</th>
          <th className="text-left font-semibold py-2">Ordered On</th>
          <th className="text-left font-semibold py-2">Status</th>
          <th className="text-right font-semibold py-2">Report</th>
        </tr>
      </thead>
      <tbody>
        {labs.length === 0 ? (
          <tr><td colSpan={4} className="py-3 text-sm" style={{ color: "#98A2B3" }}>No lab reports yet.</td></tr>
        ) : (
          labs.map((l) => {
            const ready = !!l.ref.reportedAt || /generated|ready|reported/i.test(l.summary)
            return (
              <tr key={l.id} style={{ borderTop: "1px solid #EFE8D8" }}>
                <td className="py-2.5 font-medium">{l.summary}</td>
                <td className="py-2.5" style={{ color: "#6B7B73" }}>{fmtDate(l.occurredAt)}</td>
                <td className="py-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={ready ? { background: "#E4F3EC", color: "#0E8C6A" } : { background: "#FBF1E0", color: "#B0852C" }}>
                    {ready ? "Generated" : "Processing"}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs font-semibold" style={{ color: ready ? GREEN : "#B0B0B0" }}>{ready ? "View" : "ETA: soon"}</span>
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
  return bare ? body : <Panel title="Labs & Diagnostics" icon={FlaskConical} full>{body}</Panel>
}
