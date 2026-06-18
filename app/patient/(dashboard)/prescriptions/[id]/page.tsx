"use client"

/**
 * Patient-facing prescription detail — renders the SAME `PrescriptionSheet`
 * the admin/doctor sees and prints, scoped to the calling patient's own
 * consultation. Reached from the Prescriptions list.
 */

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import PrescriptionSheet from "@/components/prescription/PrescriptionSheet"

type PrescriptionData = {
  id: string
  sections: Record<string, Record<string, unknown>> | null
  patientName: string
  patientNumber: string
  updatedAt: string | null
}

export default function PatientPrescriptionDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [data, setData] = useState<PrescriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setError(null)
      try {
        const res = await fetch(`/api/patient/me/prescriptions/${id}`, { credentials: "include" })
        if (!res.ok) throw new Error(res.status === 404 ? "Prescription not found" : `HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData((json?.data as PrescriptionData) ?? null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load prescription")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085]">
        <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] mb-3" />
        <p className="text-sm font-medium">Preparing prescription…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828] dark:text-white">Couldn&apos;t load prescription</p>
        <p className="text-xs text-[#667085] max-w-md">{error ?? "This prescription is unavailable."}</p>
        <Link href="/patient/prescriptions">
          <Button variant="outline">Back to prescriptions</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Screen-only toolbar */}
      <div className="no-print flex items-center justify-between">
        <Link
          href="/patient/prescriptions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#2E37A4]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to prescriptions
        </Link>
        <Button onClick={() => window.print()} className="bg-[#1F3D33] hover:bg-[#15291F] text-white flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print prescription
        </Button>
      </div>

      <PrescriptionSheet
        sections={data.sections}
        patientName={data.patientName}
        patientNumber={data.patientNumber}
        updatedAt={data.updatedAt}
        consultId={data.id}
      />
    </div>
  )
}
