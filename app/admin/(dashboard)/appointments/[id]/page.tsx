"use client"

/**
 * Appointment detail page.
 *
 * Wired up so the per-row "View" action on /admin/appointments no
 * longer no-ops. Real data wiring is pending BE-08 — this stub renders
 * a layout shell for any appointment id and never 404s, so the action
 * button feels correct.
 */

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppointmentDetailPage() {
  const params = useParams()
  const id = (params?.id as string) ?? ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/appointments"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] text-[#344054] hover:bg-gray-50"
            aria-label="Back to appointments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">Appointment details</h1>
            <p className="text-sm text-[#667085] mt-1">ID: {id}</p>
          </div>
        </div>
        <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold">
          Reschedule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-[#101828] mb-4">Overview</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Patient</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Stethoscope className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Doctor</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Date</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Time</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Location</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#101828] mb-4">Status</h2>
          <p className="text-sm text-[#667085]">
            Appointment workflow status will appear here once the consultation flow
            ships.
          </p>
        </div>
      </div>
    </div>
  )
}
