"use client"

/**
 * Staff list — real fetch from /api/staff.
 *
 * The previous version shipped a hardcoded array of "Sumit Mittal" /
 * "Akanksha Jain" etc. with `@vyara.health` mock emails. This rewrite
 * fetches the live list, supports a role filter + free-text search, and
 * uses the same loading / error / empty / row-action shape as the
 * appointments rewrite for consistency.
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

type Role =
  | "ADMIN"
  | "DOCTOR"
  | "RMO"
  | "RECEPTION"
  | "INFUSION_SPECIALIST"
  | "REHAB_SPECIALIST"
  | "AESTHETICS_SPECIALIST"

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  RMO: "RMO",
  RECEPTION: "Reception",
  INFUSION_SPECIALIST: "Infusion Specialist",
  REHAB_SPECIALIST: "Rehab Specialist",
  AESTHETICS_SPECIALIST: "Aesthetics Specialist",
}

const ROLE_FILTERS: { label: string; value: Role | "ALL" }[] = [
  { label: "All roles", value: "ALL" },
  ...(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({
    label: ROLE_LABEL[r],
    value: r,
  })),
]

interface StaffMember {
  id: string
  fullName: string
  email: string
  role: Role
  phone: string | null
  specialization: string | null
  department: { id: string; name: string } | null
  createdAt: string
}

export default function StaffPage() {
  const router = useRouter()
  const [rows, setRows] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const fetchStaff = useCallback(async () => {
    setError(null)
    try {
      const url = new URL("/api/staff", window.location.origin)
      if (roleFilter !== "ALL") url.searchParams.set("role", roleFilter)
      url.searchParams.set("limit", "100")
      const res = await fetch(url.toString(), { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const items: StaffMember[] = json?.data ?? json?.items ?? []
      // Some service responses include the User shape under .user — surface
      // email + role straight off the row by flattening if needed.
      setRows(
        items.map((r) => ({
          id: r.id,
          fullName: r.fullName,
          email: r.email,
          role: r.role,
          phone: r.phone ?? null,
          specialization: r.specialization ?? null,
          department: r.department ?? null,
          createdAt: r.createdAt,
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff")
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  const deactivate = useCallback(
    async (id: string) => {
      setOpenMenu(null)
      const row = rows.find((r) => r.id === id)
      if (
        !window.confirm(
          `Deactivate ${row?.fullName ?? "this staff member"}? They will lose access until reactivated.`,
        )
      )
        return
      try {
        const res = await fetch(`/api/staff/${id}`, {
          method: "DELETE",
          credentials: "include",
        })
        if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`)
        notify.success("Staff member deactivated")
        void fetchStaff()
      } catch (err) {
        notify.error("Couldn't deactivate staff member", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      }
    },
    [rows, fetchStaff],
  )

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchStaff()
  }, [fetchStaff])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close action menus on outside click
  useEffect(() => {
    if (!openMenu) return
    const close = () => setOpenMenu(null)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [openMenu])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.specialization ?? "").toLowerCase().includes(q) ||
        (r.department?.name ?? "").toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Staff</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            Clinic users — doctors, RMOs, reception, and specialists.
          </p>
        </div>
        <Link href="/admin/staff/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Staff Member
          </Button>
        </Link>
      </div>

      {/* Filter row */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] dark:text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, specialization or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
          className="px-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] font-medium focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
        >
          {ROLE_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!loading && !error ? (
          <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
            {filtered.length} member{filtered.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm">
        <div className="">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151] text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Member</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Department</th>
                <th className="px-6 py-3 font-semibold">Created</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#667085] dark:text-[#94A3B8]">
                      <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] dark:text-[#A5B4FC] mb-3" />
                      <p className="text-sm font-medium">Loading staff…</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-7 w-7 text-[#D92D20]" />
                      <p className="text-sm font-semibold text-[#B42318]">
                        Couldn&apos;t load staff
                      </p>
                      <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">{error}</p>
                      <Button variant="outline" onClick={() => void fetchStaff()}>
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center text-[#667085] dark:text-[#94A3B8] gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
                      </div>
                      <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                        No staff yet
                      </p>
                      <p className="text-xs max-w-sm">
                        Use Add Staff Member to create the first clinic user.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <StaffRow
                    key={row.id}
                    row={row}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onView={(id) => router.push(`/admin/staff/${id}`)}
                    onEdit={(id) => router.push(`/admin/staff/${id}?edit=1`)}
                    onDeactivate={(id) => void deactivate(id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StaffRow({
  row,
  openMenu,
  setOpenMenu,
  onView,
  onEdit,
  onDeactivate,
}: {
  row: StaffMember
  openMenu: string | null
  setOpenMenu: (v: string | null) => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDeactivate: (id: string) => void
}) {
  const isMenuOpen = openMenu === row.id
  return (
    <tr className="hover:bg-[#F9FAFB] transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center text-xs font-bold text-[#2E37A4] dark:text-[#A5B4FC]">
            {initials(row.fullName)}
          </div>
          <div>
            <Link
              href={`/admin/staff/${row.id}`}
              className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] hover:text-[#2E37A4]"
            >
              {row.fullName}
            </Link>
            {row.specialization ? (
              <p className="text-xs text-[#2E37A4] dark:text-[#A5B4FC]">{row.specialization}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4F5FF] dark:bg-[#312E81] text-[#3538CD]">
          {ROLE_LABEL[row.role] ?? row.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-[#101828] dark:text-[#F9FAFB]">{row.email}</p>
        {row.phone ? <p className="text-xs text-[#667085] dark:text-[#94A3B8]">{row.phone}</p> : null}
      </td>
      <td className="px-6 py-4 text-sm text-[#344054] dark:text-[#CBD5E1]">
        {row.department?.name ?? <span className="text-[#98A2B3] dark:text-[#94A3B8]">—</span>}
      </td>
      <td className="px-6 py-4 text-sm text-[#667085] dark:text-[#94A3B8]">
        {new Date(row.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4 text-right relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenu(isMenuOpen ? null : row.id)
          }}
          className="p-1.5 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Open actions menu"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
        {isMenuOpen ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white dark:bg-[#1F2937] ring-1 ring-[#EAECF0] dark:ring-[#374151] z-10"
          >
            <div className="py-1">
              <button
                type="button"
                onClick={() => onView(row.id)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB]"
              >
                <Eye className="h-4 w-4" /> View
              </button>
              <button
                type="button"
                onClick={() => onEdit(row.id)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB]"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDeactivate(row.id)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[#B42318] hover:bg-[#FEF3F2]"
              >
                <Trash2 className="h-4 w-4" /> Deactivate
              </button>
            </div>
          </div>
        ) : null}
      </td>
    </tr>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
