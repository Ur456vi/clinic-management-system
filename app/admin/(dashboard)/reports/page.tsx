"use client"

/**
 * Reports & Analytics — basic stats dashboard.
 *
 * Replaces the previous "Coming Soon" placeholder. Computes counts /
 * totals client-side by hitting the existing list endpoints
 * (`/api/patients`, `/api/appointments`, `/api/invoices`,
 * `/api/admin/assessment-submissions`) with `limit=200` and aggregating.
 * Not the most efficient long-term solution — dedicated `/api/reports/*`
 * aggregation endpoints would let us avoid pulling full payloads — but
 * the numbers are real, the page lights up immediately, and the
 * upgrade path is straightforward.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  ClipboardCheck,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type ApptStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
type InvStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID"
type AsmStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

interface Stats {
  patients: { total: number }
  appointments: { total: number; byStatus: Record<ApptStatus, number>; today: number }
  invoices: {
    total: number
    paidCents: number
    outstandingCents: number
    byStatus: Record<InvStatus, number>
    currency: string
  }
  assessments: {
    total: number
    byStatus: Record<AsmStatus, number>
    recent: { id: string; contactName: string; totalScore: number; band: string; createdAt: string }[]
  }
}

const EMPTY_STATS: Stats = {
  patients: { total: 0 },
  appointments: {
    total: 0,
    byStatus: {
      REQUESTED: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    },
    today: 0,
  },
  invoices: {
    total: 0,
    paidCents: 0,
    outstandingCents: 0,
    byStatus: {
      DRAFT: 0,
      ISSUED: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      VOID: 0,
    },
    currency: "INR",
  },
  assessments: {
    total: 0,
    byStatus: { REQUESTED: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 },
    recent: [],
  },
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async () => {
    setError(null)
    setRefreshing(true)
    try {
      const [patientsRes, apptsRes, invoicesRes, asmRes] = await Promise.all([
        fetch("/api/patients?limit=100", { credentials: "include" }),
        fetch("/api/appointments?limit=100", { credentials: "include" }),
        fetch("/api/invoices?limit=100", { credentials: "include" }),
        fetch("/api/admin/assessment-submissions?take=100", {
          credentials: "include",
        }),
      ])

      const [patients, appts, invoices, asms] = await Promise.all([
        patientsRes.ok ? patientsRes.json() : Promise.resolve({ data: [] }),
        apptsRes.ok ? apptsRes.json() : Promise.resolve({ items: [] }),
        invoicesRes.ok ? invoicesRes.json() : Promise.resolve({ items: [] }),
        asmRes.ok ? asmRes.json() : Promise.resolve({ data: { items: [] } }),
      ])

      const apptList: Array<{ status: ApptStatus; startsAt: string }> =
        appts?.items ?? appts?.data?.items ?? appts?.data ?? []
      const invoiceList: Array<{
        status: InvStatus
        totalCents: number
        paidCents?: number
        payments?: { amountCents?: number; status?: string }[]
        currency: string
      }> = invoices?.items ?? invoices?.data?.items ?? invoices?.data ?? []
      const asmList: Array<{
        id: string
        contactName: string
        totalScore: number
        band: string
        status: AsmStatus
        createdAt: string
      }> = asms?.data?.items ?? asms?.items ?? []
      const patientList: unknown[] = patients?.data ?? patients?.items ?? []

      const today = new Date().toDateString()
      const apptByStatus: Record<ApptStatus, number> = {
        REQUESTED: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        NO_SHOW: 0,
      }
      let apptToday = 0
      for (const a of apptList) {
        apptByStatus[a.status] = (apptByStatus[a.status] ?? 0) + 1
        if (new Date(a.startsAt).toDateString() === today) apptToday++
      }

      const invByStatus: Record<InvStatus, number> = {
        DRAFT: 0,
        ISSUED: 0,
        PARTIALLY_PAID: 0,
        PAID: 0,
        VOID: 0,
      }
      let paid = 0
      let outstanding = 0
      let currency = "INR"
      for (const inv of invoiceList) {
        invByStatus[inv.status] = (invByStatus[inv.status] ?? 0) + 1
        // `paidCents` isn't serialized by the list endpoint — derive it from
        // the included CAPTURED payments; coerce so sums can't become NaN.
        const direct = Number(inv.paidCents)
        const paidC = Number.isFinite(direct)
          ? direct
          : (inv.payments ?? [])
              .filter((p) => p.status === "CAPTURED")
              .reduce((acc, p) => acc + (Number(p.amountCents) || 0), 0)
        const totalC = Number(inv.totalCents ?? 0) || 0
        paid += paidC
        if (inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID") {
          outstanding += Math.max(0, totalC - paidC)
        }
        if (inv.currency) currency = inv.currency
      }

      const asmByStatus: Record<AsmStatus, number> = {
        REQUESTED: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      }
      for (const a of asmList) {
        asmByStatus[a.status] = (asmByStatus[a.status] ?? 0) + 1
      }

      setStats({
        patients: { total: patientList.length },
        appointments: { total: apptList.length, byStatus: apptByStatus, today: apptToday },
        invoices: {
          total: invoiceList.length,
          paidCents: paid,
          outstandingCents: outstanding,
          byStatus: invByStatus,
          currency,
        },
        assessments: {
          total: asmList.length,
          byStatus: asmByStatus,
          recent: asmList.slice(0, 5).map((a) => ({
            id: a.id,
            contactName: a.contactName,
            totalScore: a.totalScore,
            band: a.band,
            createdAt: a.createdAt,
          })),
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchAll()
  }, [fetchAll])
  /* eslint-enable react-hooks/set-state-in-effect */

  const tiles = useMemo(
    () => [
      {
        label: "Total Patients",
        value: stats.patients.total.toString(),
        sub: `${stats.assessments.total} assessment${
          stats.assessments.total === 1 ? "" : "s"
        } received`,
        bg: "#2E37A4",
        icon: <Users className="h-5 w-5 text-white opacity-85" />,
      },
      {
        label: "Appointments Today",
        value: stats.appointments.today.toString(),
        sub: `${stats.appointments.byStatus.REQUESTED} requested · ${stats.appointments.byStatus.CONFIRMED} confirmed`,
        bg: "#12B76A",
        icon: <Calendar className="h-5 w-5 text-white opacity-85" />,
      },
      {
        label: "Revenue Collected",
        value: formatMoney(stats.invoices.paidCents, stats.invoices.currency),
        sub: `${formatMoney(stats.invoices.outstandingCents, stats.invoices.currency)} outstanding`,
        bg: "#0BA5EC",
        icon: <Wallet className="h-5 w-5 text-white opacity-85" />,
      },
      {
        label: "Pending Assessments",
        value: stats.assessments.byStatus.REQUESTED.toString(),
        sub: `${stats.assessments.byStatus.CONFIRMED} confirmed slots`,
        bg: "#FDB022",
        icon: <ClipboardCheck className="h-5 w-5 text-[#141414] dark:text-[#F9FAFB] opacity-85" />,
        textColor: "#141414",
        subColor: "rgba(20,20,20,0.65)",
      },
    ],
    [stats],
  )

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Reports &amp; Analytics</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            Live counts pulled from the operational endpoints — refresh to
            re-fetch.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void fetchAll()}
          disabled={refreshing}
          className="inline-flex items-center gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#FECDCA] rounded-xl shadow-sm p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#D92D20] mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#B42318]">
              Couldn&apos;t load some stats
            </p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-12 flex items-center justify-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
          <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" />
          Loading dashboard…
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[124px]"
                style={{
                  background: t.bg,
                  color: t.textColor ?? "#FFFFFF",
                }}
              >
                <div className="flex items-start justify-between">
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: t.subColor ?? "rgba(255,255,255,0.85)" }}
                  >
                    {t.label}
                  </p>
                  {t.icon}
                </div>
                <div>
                  <p
                    className="text-3xl font-bold leading-none"
                    style={{ color: t.textColor ?? "#FFFFFF" }}
                  >
                    {t.value}
                  </p>
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: t.subColor ?? "rgba(255,255,255,0.75)" }}
                  >
                    {t.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Status breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <BreakdownCard
              title="Appointments by status"
              icon={<Calendar className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />}
              rows={[
                { label: "Requested", value: stats.appointments.byStatus.REQUESTED, fg: "#175CD3" },
                { label: "Confirmed", value: stats.appointments.byStatus.CONFIRMED, fg: "#027A48" },
                { label: "Completed", value: stats.appointments.byStatus.COMPLETED, fg: "#3538CD" },
                { label: "Cancelled", value: stats.appointments.byStatus.CANCELLED, fg: "#B42318" },
                { label: "No-show", value: stats.appointments.byStatus.NO_SHOW, fg: "#B93815" },
              ]}
            />
            <BreakdownCard
              title="Invoices by status"
              icon={<FileText className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />}
              rows={[
                { label: "Issued", value: stats.invoices.byStatus.ISSUED, fg: "#175CD3" },
                {
                  label: "Partially paid",
                  value: stats.invoices.byStatus.PARTIALLY_PAID,
                  fg: "#B5642A",
                },
                {
                  label: "Paid",
                  value: stats.invoices.byStatus.PAID,
                  fg: "#027A48",
                },
                { label: "Void", value: stats.invoices.byStatus.VOID, fg: "#B42318" },
                { label: "Draft", value: stats.invoices.byStatus.DRAFT, fg: "#344054" },
              ]}
            />
            <BreakdownCard
              title="Assessments by status"
              icon={<ClipboardCheck className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />}
              rows={[
                { label: "Requested", value: stats.assessments.byStatus.REQUESTED, fg: "#175CD3" },
                { label: "Confirmed", value: stats.assessments.byStatus.CONFIRMED, fg: "#027A48" },
                { label: "Completed", value: stats.assessments.byStatus.COMPLETED, fg: "#3538CD" },
                { label: "Cancelled", value: stats.assessments.byStatus.CANCELLED, fg: "#B42318" },
              ]}
            />
          </div>

          {/* Recent assessment submissions */}
          <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
                <h2 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">
                  Latest health-assessment submissions
                </h2>
              </div>
              <Link
                href="/admin/assessments"
                className="text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
              >
                View all →
              </Link>
            </div>
            {stats.assessments.recent.length === 0 ? (
              <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">
                No public-site assessment submissions yet. They&apos;ll show up
                here as patients complete the quiz.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2 font-semibold">Patient</th>
                    <th className="text-left py-2 font-semibold">Score</th>
                    <th className="text-left py-2 font-semibold">Band</th>
                    <th className="text-left py-2 font-semibold">Submitted</th>
                    <th className="text-left py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                  {stats.assessments.recent.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 font-semibold text-[#101828] dark:text-[#F9FAFB]">
                        {a.contactName}
                      </td>
                      <td className="py-2.5 text-[#344054] dark:text-[#CBD5E1]">{a.totalScore}</td>
                      <td className="py-2.5">
                        <BandPill band={a.band} />
                      </td>
                      <td className="py-2.5 text-[#667085] dark:text-[#94A3B8]">
                        {new Date(a.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/admin/assessments/${a.id}`}
                          className="text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs text-[#98A2B3] dark:text-[#94A3B8]">
            Totals are computed from the most recent 100 rows per endpoint.
            Dedicated aggregation endpoints will replace this approach as the
            data volume grows.
          </p>
        </>
      )}
    </div>
  )
}

function BreakdownCard({
  title,
  icon,
  rows,
}: {
  title: string
  icon: React.ReactNode
  rows: { label: string; value: number; fg: string }[]
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">{title}</h3>
      </div>
      <div className="space-y-3">
        {rows.map((r) => {
          const pct = Math.min(100, (r.value / max) * 100)
          return (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#344054] dark:text-[#CBD5E1]">{r.label}</span>
                <span className="font-semibold" style={{ color: r.fg }}>
                  {r.value}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[#F2F4F7] dark:bg-[#111827]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: r.fg }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BandPill({ band }: { band: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    OPTIMAL: { bg: "#E4EBD6", fg: "#4E7A3F", label: "Optimal" },
    MILD: { bg: "#FFF1D6", fg: "#B5642A", label: "Mild" },
    MODERATE: { bg: "#FBE2D0", fg: "#B5602A", label: "Moderate" },
    SIGNIFICANT: { bg: "#F4D3D3", fg: "#7A2329", label: "Significant" },
  }
  const c = map[band] ?? { bg: "#F2F4F7", fg: "#344054", label: band }
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
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

