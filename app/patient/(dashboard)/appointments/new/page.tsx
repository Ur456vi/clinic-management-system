"use client"

/**
 * Patient-side "book an appointment" stub.
 *
 * Wired up so the "New Appointment" button (BUG-016) in the patient
 * portal lands somewhere useful instead of console.log'ing. The real
 * FE-08 booking flow lands here.
 */

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarPlus } from "lucide-react"

const doctors = [
  { id: "STF-1004", name: "Dr. Federico Birri", specialty: "Cardiology" },
  { id: "STF-1005", name: "Dr. Akanksha Jain", specialty: "General Medicine" },
  { id: "STF-1001", name: "Dr. Yuvraj Singh", specialty: "Internal Medicine" },
  { id: "STF-1002", name: "Dr. Simran Goel", specialty: "Infusion Therapy" },
]

export default function PatientBookAppointmentPage() {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState(doctors[0].id)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = doctorId && date && time && !submitting

  return (
    <div className="p-8 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/patient/appointments"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#EAECF0] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50"
          aria-label="Back to appointments"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#141414] dark:text-[#F9FAFB]">Book an appointment</h1>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            Pick a doctor, date, and time — we&apos;ll confirm by email.
          </p>
        </div>
      </div>

      {done ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#ECFDF3] flex items-center justify-center">
            <CalendarPlus className="h-6 w-6 text-[#027A48]" />
          </div>
          <h2 className="text-lg font-bold text-[#141414] dark:text-[#F9FAFB] mt-3">
            Appointment requested
          </h2>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            Your request has been sent. You&apos;ll receive a confirmation email shortly.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => router.push("/patient/appointments")}
              className="bg-[#2E37A4] hover:bg-[#1e2570] text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer"
            >
              View my appointments
            </button>
            <button
              onClick={() => setDone(false)}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#6C7688] dark:text-[#94A3B8] hover:text-[#141414]"
            >
              Book another
            </button>
          </div>
        </div>
      ) : (
        <form
          className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-6 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSubmit) return
            setSubmitting(true)
            // Optimistic local-only confirmation. The real POST will be
            // wired up alongside the BE-08 booking endpoint.
            setTimeout(() => {
              setSubmitting(false)
              setDone(true)
            }, 400)
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[#141414] dark:text-[#F9FAFB] font-semibold">Doctor</span>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="h-11 rounded-lg border border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 text-sm"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#141414] dark:text-[#F9FAFB] font-semibold">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-lg border border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#141414] dark:text-[#F9FAFB] font-semibold">Time</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 rounded-lg border border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[#141414] dark:text-[#F9FAFB] font-semibold">Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly describe what you'd like to discuss…"
              className="rounded-lg border border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937] p-3 text-sm"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-[#2E37A4] hover:bg-[#1e2570] disabled:bg-[#B3B5E2] text-white border-none rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
            >
              {submitting ? "Requesting…" : "Request appointment"}
            </button>
            <Link
              href="/patient/appointments"
              className="text-sm font-semibold text-[#6C7688] dark:text-[#94A3B8] hover:text-[#141414]"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
