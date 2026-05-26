"use client"

/**
 * Departments list — real fetch from /api/departments.
 *
 * Replaces the previous static dashboard of 6 hardcoded department
 * cards with mock "activity" data. The new card grid is data-driven:
 * one card per department row from the API, with the real staffCount
 * and a colour mapped off the slug so repeat visits look stable.
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Building2,
  ChevronRight,
  Loader2,
  Search,
  UserCheck,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface Department {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  staffCount: number
  createdAt: string
  updatedAt: string
}

/** Pick a stable colour per department slug — same slug always gets the
 *  same palette so cards don't shuffle between renders. */
const PALETTE: { themeColor: string; lightThemeColor: string }[] = [
  { themeColor: "bg-[#475467]", lightThemeColor: "bg-[#475467]/10" }, // gray
  { themeColor: "bg-[#2E90FA]", lightThemeColor: "bg-[#2E90FA]/10" }, // blue
  { themeColor: "bg-[#F04438]", lightThemeColor: "bg-[#F04438]/10" }, // red
  { themeColor: "bg-[#00A3FF]", lightThemeColor: "bg-[#00A3FF]/10" }, // cyan
  { themeColor: "bg-[#12B76A]", lightThemeColor: "bg-[#12B76A]/10" }, // green
  { themeColor: "bg-[#7A5AF8]", lightThemeColor: "bg-[#7A5AF8]/10" }, // violet
  { themeColor: "bg-[#FB6514]", lightThemeColor: "bg-[#FB6514]/10" }, // orange
  { themeColor: "bg-[#2E37A4]", lightThemeColor: "bg-[#2E37A4]/10" }, // indigo
]

function paletteFor(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function DepartmentsPage() {
  const [rows, setRows] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const fetchDepartments = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/departments?limit=100", { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const items: Department[] = json?.data ?? json?.items ?? []
      setRows(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments")
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchDepartments()
  }, [fetchDepartments])
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Departments</h1>
          <p className="text-sm text-[#667085] mt-1">
            Care lanes inside the clinic — used to route staff and slot patient
            appointments.
          </p>
        </div>
        <Link href="/admin/departments/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold inline-flex items-center gap-2">
            Add Department
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          />
        </div>
        {!loading && !error ? (
          <span className="text-sm text-[#667085]">
            {filtered.length} department{filtered.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-sm text-[#667085]">
          <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4]" />
          Loading departments…
        </div>
      ) : error ? (
        <div className="bg-white border border-[#FECDCA] rounded-xl shadow-sm p-10 flex flex-col items-center text-center gap-3">
          <AlertCircle className="h-7 w-7 text-[#D92D20]" />
          <p className="text-sm font-semibold text-[#B42318]">
            Couldn&apos;t load departments
          </p>
          <p className="text-xs text-[#667085] max-w-md">{error}</p>
          <Button variant="outline" onClick={() => void fetchDepartments()}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-16 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F5FF] flex items-center justify-center">
            <Building2 className="h-5 w-5 text-[#2E37A4]" />
          </div>
          <p className="text-sm font-semibold text-[#101828]">No departments yet</p>
          <p className="text-xs text-[#667085] max-w-sm">
            Add the first care lane (e.g. Reception, RMO, Aesthetics) to start routing staff and appointments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <DepartmentCard key={d.id} dept={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function DepartmentCard({ dept }: { dept: Department }) {
  const palette = paletteFor(dept.slug)
  return (
    <Link
      href={`/admin/departments/${dept.id}`}
      className="bg-white rounded-xl border border-[#EAECF0] shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className={`p-5 ${palette.lightThemeColor} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${palette.themeColor} flex items-center justify-center text-white`}>
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#101828]">{dept.name}</h3>
            <p className="text-xs text-[#667085] font-mono">{dept.slug}</p>
          </div>
        </div>
        {!dept.isActive ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B42318] bg-white px-2 py-1 rounded-full">
            Inactive
          </span>
        ) : null}
      </div>
      <div className="p-5 flex-1 flex flex-col gap-4">
        <p className="text-sm text-[#667085] line-clamp-3 min-h-[60px]">
          {dept.description ?? "No description provided."}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Metric
            icon={<Users className="h-4 w-4" />}
            label="Total staff"
            value={dept.staffCount.toString()}
          />
          <Metric
            icon={<UserCheck className="h-4 w-4" />}
            label="Status"
            value={dept.isActive ? "Active" : "Inactive"}
          />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#EAECF0]">
          <span className="text-xs text-[#667085]">
            Created{" "}
            {new Date(dept.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-sm font-semibold text-[#2E37A4] inline-flex items-center gap-1">
            Open <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-[#EAECF0] p-3 bg-[#F9FAFB]">
      <div className="flex items-center gap-2 mb-1 text-[#2E37A4]">{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
        {label}
      </p>
      <p className="text-sm font-bold text-[#101828]">{value}</p>
    </div>
  )
}
