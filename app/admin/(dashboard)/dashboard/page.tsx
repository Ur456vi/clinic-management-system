"use client"

/**
 * Admin Dashboard — live counts + upcoming appointments + flagged invoices.
 *
 * Replaces the previous static "1,248 patients / $42,500 revenue" mock
 * card. Pulls the first 200 rows from each list endpoint, aggregates
 * client-side, and shows the next few upcoming appointments + any
 * overdue invoices.
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Loader2,
  TrendingUp,
  UserSquare2,
  Users,
} from "lucide-react"

type ApptStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
type InvStatus = "DRAFT" | "OPEN" | "PARTIALLY_PAID" | "PAID" | "VOID"

interface ApptRow {
  id: string
  startsAt: string
  status: ApptStatus
  patient: { id: string; fullName: string } | null
  staff: { id: string; fullName: string } | null
}

interface InvRow {
  id: string
  invoiceNumber: string
  status: InvStatus
  totalCents: number
  paidCents: number
  currency: string
  issuedAt: string
  dueAt: string | null
  patient: { id: string; fullName: string } | null
}

interface DashboardData {
  patientsCount: number
  staffCount: number
  apptsCount: number
  revenueCents: number
  outstandingCents: number
  currency: string
  upcoming: ApptRow[]
  overdueInvoices: InvRow[]
  pendingAssessments: number
}

const EMPTY: DashboardData = {
  patientsCount: 0,
  staffCount: 0,
  apptsCount: 0,
  revenueCents: 0,
  outstandingCents: 0,
  currency: "INR",
  upcoming: [],
  overdueInvoices: [],
  pendingAssessments: 0,
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    try {
      const [patientsRes, staffRes, apptsRes, invoicesRes, asmRes] =
        await Promise.all([
          fetch("/api/patients?limit=200", { credentials: "include" }),
          fetch("/api/staff?limit=100", { credentials: "include" }),
          fetch("/api/appointments?limit=200", { credentials: "include" }),
          fetch("/api/invoices?limit=200", { credentials: "include" }),
          fetch("/api/admin/assessment-submissions?take=50", {
            credentials: "include",
          }),
        ])

      const patientList = unwrapList(await safeJson(patientsRes))
      const staffList = unwrapList(await safeJson(staffRes))
      const apptList = unwrapList<ApptRow>(await safeJson(apptsRes))
      const invList = unwrapList<InvRow>(await safeJson(invoicesRes))
      const asmList = unwrapList<{ status: string }>(await safeJson(asmRes))

      const now = Date.now()
      const upcoming = apptList
        .filter(
          (a) =>
            new Date(a.startsAt).getTime() >= now &&
            (a.status === "REQUESTED" || a.status === "CONFIRMED"),
        )
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )
        .slice(0, 6)

      let revenue = 0
      let outstanding = 0
      let currency = "INR"
      const overdue: InvRow[] = []
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
      for (const inv of invList) {
        revenue += inv.paidCents
        if (inv.status === "OPEN" || inv.status === "PARTIALLY_PAID") {
          outstanding += Math.max(0, inv.totalCents - inv.paidCents)
          const issued = new Date(inv.issuedAt).getTime()
          if (issued < thirtyDaysAgo) overdue.push(inv)
        }
        if (inv.currency) currency = inv.currency
      }

      setData({
        patientsCount: patientList.length,
        staffCount: staffList.length,
        apptsCount: apptList.length,
        revenueCents: revenue,
        outstandingCents: outstanding,
        currency,
        upcoming,
        overdueInvoices: overdue.slice(0, 5),
        pendingAssessments: asmList.filter((a) => a.status === "REQUESTED").length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchAll()
  }, [fetchAll])
  /* eslint-enable react-hooks/set-state-in-effect */

  const stats = useMemo(
    () => [
      {
        name: "Total Patients",
        value: data.patientsCount.toString(),
        icon: Users,
        color: "text-[#2E37A4]",
        bg: "bg-[#F4F5FF]",
        href: "/admin/patients",
      },
      {
        name: "Total Appointments",
        value: data.apptsCount.toString(),
        icon: Calendar,
        color: "text-[#12B76A]",
        bg: "bg-[#ECFDF3]",
        href: "/admin/appointments",
      },
      {
        name: "Total Staff",
        value: data.staffCount.toString(),
        icon: UserSquare2,
        color: "text-[#F79009]",
        bg: "bg-[#FFFAEB]",
        href: "/admin/staff",
      },
      {
        name: "Revenue Collected",
        value: formatMoney(data.revenueCents, data.currency),
        icon: FileText,
        color: "text-[#175CD3]",
        bg: "bg-[#EFF8FF]",
        href: "/admin/invoices",
      },
    ],
    [data],
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Dashboard</h1>
        <p className="text-sm text-[#667085] mt-1">
          Live snapshot — pulled from the operational endpoints.
        </p>
      </div>

      {error ? (
        <div className="bg-white border border-[#FECDCA] rounded-xl shadow-sm p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#D92D20] mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#B42318]">
              Couldn&apos;t load some widgets
            </p>
            <p className="text-xs text-[#667085] mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#667085]">{stat.name}</p>
              <p className="text-2xl font-bold text-[#101828]">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4]" />
                ) : (
                  stat.value
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-[#EAECF0] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#101828]">Upcoming Appointments</h3>
            <Link
              href="/admin/appointments"
              className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b]"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-sm text-[#667085]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : data.upcoming.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#667085]">
              No upcoming appointments. New bookings will show up here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                    <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase">Patient</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase">When</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0]">
                  {data.upcoming.map((apt) => (
                    <tr key={apt.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/appointments/${apt.id}`}
                          className="block"
                        >
                          <p className="text-sm font-semibold text-[#101828]">
                            {apt.patient?.fullName ?? "—"}
                          </p>
                          <p className="text-xs text-[#667085]">
                            {apt.staff?.fullName ?? "—"}
                          </p>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#667085]">
                        {new Date(apt.startsAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <ApptStatusPill status={apt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Clinic Performance */}
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-6">
          <h3 className="text-base font-bold text-[#101828] mb-6">Clinic Performance</h3>
          <div className="space-y-4">
            <PerformanceRow
              icon={<TrendingUp className="h-5 w-5 text-[#12B76A]" />}
              tintBg="bg-[#ECFDF3]"
              title="Revenue collected"
              subtitle={
                loading
                  ? "Loading…"
                  : `${formatMoney(data.revenueCents, data.currency)} all-time`
              }
              ok
            />
            <PerformanceRow
              icon={<Clock className="h-5 w-5 text-[#2E37A4]" />}
              tintBg="bg-[#F4F5FF]"
              title="Outstanding balance"
              subtitle={
                loading
                  ? "Loading…"
                  : `${formatMoney(data.outstandingCents, data.currency)} across open + partially-paid invoices`
              }
              ok={!loading && data.outstandingCents === 0}
            />
            <PerformanceRow
              icon={<ClipboardCheck className="h-5 w-5 text-[#3538CD]" />}
              tintBg="bg-[#F4F5FF]"
              title="Pending assessment bookings"
              subtitle={
                loading
                  ? "Loading…"
                  : `${data.pendingAssessments} request${data.pendingAssessments === 1 ? "" : "s"} awaiting confirmation`
              }
              actionHref="/admin/assessments"
              actionLabel={data.pendingAssessments > 0 ? "Review" : undefined}
              ok={!loading && data.pendingAssessments === 0}
            />
            {data.overdueInvoices.length > 0 ? (
              <PerformanceRow
                icon={<AlertCircle className="h-5 w-5 text-[#D92D20]" />}
                tintBg="bg-[#FEE4E2]"
                title="Overdue invoices"
                subtitle={`${data.overdueInvoices.length} invoice${
                  data.overdueInvoices.length === 1 ? "" : "s"
                } over 30 days`}
                actionHref="/admin/invoices"
                actionLabel="Take action"
                danger
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── helpers ───────────────────────────────────────────────────────── */

function PerformanceRow({
  icon,
  tintBg,
  title,
  subtitle,
  ok,
  danger,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode
  tintBg: string
  title: string
  subtitle: string
  ok?: boolean
  danger?: boolean
  actionHref?: string
  actionLabel?: string
}) {
  const titleColor = danger ? "text-[#B42318]" : "text-[#101828]"
  const subColor = danger ? "text-[#F04438]" : "text-[#667085]"
  const rowBg = danger
    ? "bg-[#FEF3F2] border-[#FEE4E2]"
    : "bg-[#F9FAFB] border-[#EAECF0]"
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${rowBg}`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tintBg}`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-bold ${titleColor}`}>{title}</p>
          <p className={`text-xs ${subColor}`}>{subtitle}</p>
        </div>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={`text-xs font-bold hover:underline ${
            danger ? "text-[#B42318]" : "text-[#2E37A4]"
          }`}
        >
          {actionLabel}
        </Link>
      ) : ok ? (
        <CheckCircle2 className="h-5 w-5 text-[#12B76A]" />
      ) : null}
    </div>
  )
}

function ApptStatusPill({ status }: { status: ApptStatus }) {
  const map: Record<ApptStatus, { bg: string; fg: string; label: string }> = {
    REQUESTED: { bg: "#EFF8FF", fg: "#175CD3", label: "Requested" },
    CONFIRMED: { bg: "#ECFDF3", fg: "#027A48", label: "Confirmed" },
    COMPLETED: { bg: "#F4F5FF", fg: "#3538CD", label: "Completed" },
    CANCELLED: { bg: "#FEF3F2", fg: "#B42318", label: "Cancelled" },
    NO_SHOW: { bg: "#FFF4ED", fg: "#B93815", label: "No-show" },
  }
  const c = map[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}

async function safeJson(res: Response): Promise<unknown> {
  if (!res.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

function unwrapList<T = unknown>(json: unknown): T[] {
  if (!json || typeof json !== "object") return []
  const j = json as Record<string, unknown>
  const candidates = [
    j.items,
    (j.data as { items?: T[] } | undefined)?.items,
    j.data,
  ]
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[]
  }
  return []
}

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100)
  } catch {
    return `${currency} ${(cents / 100).toFixed(0)}`
  }
}
