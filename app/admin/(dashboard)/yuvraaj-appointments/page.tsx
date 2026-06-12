"use client"

/**
 * "Dr Yuvraaj Appointment" — admin-only view listing only the appointments
 * assigned to Dr. Yuvraaj Singh.
 *
 * The clinic reseeds with fresh UUIDs, so we resolve his staff id at runtime
 * from /api/doctors (match on name) rather than hard-coding it, then hand the
 * id to the shared <AppointmentsList>, which fetches /api/appointments scoped
 * by `staffId`.
 */

import { useEffect, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"

import AppointmentsList from "@/components/admin/AppointmentsList"

interface Doctor {
  id: string
  fullName: string
  role: string
}

export default function YuvraajAppointmentsPage() {
  const [staffId, setStaffId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setError(null)
      try {
        const res = await fetch("/api/doctors", { credentials: "include" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const doctors: Doctor[] = json?.data ?? json ?? []
        // Prefer an actual DOCTOR named Yuvraaj; fall back to any name match.
        const match =
          doctors.find(
            (d) => d.role === "DOCTOR" && d.fullName.toLowerCase().includes("yuvraaj"),
          ) ?? doctors.find((d) => d.fullName.toLowerCase().includes("yuvraaj"))
        if (cancelled) return
        if (!match) {
          setError("Dr. Yuvraaj Singh was not found in the staff directory.")
          return
        }
        setStaffId(match.id)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load doctor")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Loading Dr. Yuvraaj&apos;s appointments…</p>
      </div>
    )
  }

  if (error || !staffId) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
          Couldn&apos;t load appointments
        </p>
        <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">
          {error ?? "Dr. Yuvraaj Singh was not found."}
        </p>
      </div>
    )
  }

  return (
    <AppointmentsList
      staffId={staffId}
      showRmoSummary
      title="Dr. Yuvraaj Singh — Appointments"
      subtitle="Every booking assigned to Dr. Yuvraaj Singh."
      emptyHint="No appointments are currently assigned to Dr. Yuvraaj Singh. Adjust the status filter above to widen your search."
    />
  )
}
