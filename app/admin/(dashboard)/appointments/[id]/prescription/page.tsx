"use client"

/**
 * Printable Prescription & Clinical Plan for the MAIN (Dr. Yuvraaj)
 * consultation.
 *
 * Reached from the Doctor Consultation workspace ("Print prescription").
 * Renders every captured consultation section in the approved IHMH
 * prescription layout (numbered sections, two-column body, signature
 * block, contact footer) and prints via the browser print dialog — the
 * `rx-root` visibility trick hides the admin chrome so only the sheet
 * lands on paper.
 *
 * Data comes from the same find-or-create consultation endpoint the
 * workspace uses; all values are read from `Consultation.sections`
 * (see lib/main-fields.ts for the field registry) and rendered by the
 * shared <PrescriptionSheet> component.
 */

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import PrescriptionSheet from "@/components/prescription/PrescriptionSheet"

interface Consultation {
  id: string
  type: "RMO" | "MAIN"
  status: string
  sections?: Record<string, Record<string, unknown>> | null
  patient: { id: string; fullName: string; patientNumber: string } | null
  /** Last save — used as the stable "report generated" stamp. */
  updatedAt?: string
}

/* ── page ────────────────────────────────────────────────────────── */

export default function PrescriptionPage() {
  const params = useParams<{ id: string }>()
  const appointmentId = params.id

  const [consult, setConsult] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setError(null)
      try {
        // Read-only GET — viewing a prescription must never create a chart
        // (the POST variant find-or-creates the consultation row).
        const res = await fetch(`/api/appointments/${appointmentId}/consultation`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { data } = await res.json()
        if (!cancelled) {
          setConsult((data as Consultation | null) ?? null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load prescription")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [appointmentId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] mb-3" />
        <p className="text-sm font-medium">Preparing prescription…</p>
      </div>
    )
  }

  if (error || !consult || consult.type !== "MAIN") {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828]">Couldn&apos;t load prescription</p>
        <p className="text-xs text-[#667085] max-w-md">
          {error ?? "This appointment has no doctor (MAIN) consultation to print."}
        </p>
        <Link href="/admin/appointments">
          <Button variant="outline">Back to appointments</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Screen-only toolbar */}
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/admin/appointments/${appointmentId}/consultation`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#6B2B26]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to consultation
        </Link>
        <Button onClick={() => window.print()} className="bg-[#1F3D33] hover:bg-[#15291F] text-white flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print prescription
        </Button>
      </div>

      <PrescriptionSheet
        sections={consult.sections}
        patientName={consult.patient?.fullName ?? ""}
        patientNumber={consult.patient?.patientNumber ?? ""}
        updatedAt={consult.updatedAt}
        consultId={consult.id}
      />
    </div>
  )
}
