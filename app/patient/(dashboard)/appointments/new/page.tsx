"use client"

/**
 * Patient self-booking — real flow.
 *
 *   GET  /api/doctors                       pick a clinician
 *   GET  /api/appointments/availability     open slots for a doctor + date
 *   POST /api/appointments/book             create the booking (self)
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarPlus, Check, Loader2 } from "lucide-react"

import { notify } from "@/lib/notify"

type Doctor = {
  id: string
  fullName: string
  specialization: string | null
  role: string
  department: { id: string; name: string } | null
}
type Slot = { start: string; end: string }

export default function PatientBookAppointmentPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorId, setDoctorId] = useState("")
  const [date, setDate] = useState("")
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Load bookable doctors.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/doctors", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && Array.isArray(json?.data)) {
          setDoctors(json.data)
          if (json.data[0]) setDoctorId(json.data[0].id)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadSlots = useCallback(async () => {
    if (!doctorId || !date) {
      setSlots(null)
      return
    }
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const from = new Date(`${date}T00:00:00`)
      const to = new Date(`${date}T00:00:00`)
      to.setDate(to.getDate() + 1)
      const qs = new URLSearchParams({
        staffId: doctorId,
        from: from.toISOString(),
        to: to.toISOString(),
        durationMins: "30",
      })
      const res = await fetch(`/api/appointments/availability?${qs.toString()}`, {
        credentials: "include",
      })
      if (!res.ok) {
        setSlots([])
        return
      }
      const json = await res.json()
      setSlots(Array.isArray(json?.data) ? json.data : [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [doctorId, date])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadSlots()
  }, [loadSlots])
  /* eslint-enable react-hooks/set-state-in-effect */

  const book = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staffId: doctorId,
          scheduledAt: selectedSlot.start,
          durationMins: Math.max(
            5,
            Math.round(
              (new Date(selectedSlot.end).getTime() -
                new Date(selectedSlot.start).getTime()) /
                60000,
            ),
          ),
          reason: reason.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Couldn't book the appointment")
      }
      setDone(true)
      notify.success("Appointment requested")
    } catch (err) {
      notify.error("Couldn't book", {
        description: err instanceof Error ? err.message : "Please try another slot.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/patient/appointments"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#EAECF0] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 dark:hover:bg-[#111827]"
          aria-label="Back to appointments"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Book an appointment</h1>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            Pick a doctor, date, and an open slot.
          </p>
        </div>
      </div>

      {done ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#ECFDF3] flex items-center justify-center">
            <CalendarPlus className="h-6 w-6 text-[#027A48]" />
          </div>
          <h2 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB] mt-3">Appointment requested</h2>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            Your request has been sent. You can track its status under Appointments.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => router.push("/patient/appointments")}
              className="bg-[#2E37A4] hover:bg-[#1d246b] text-white rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              View my appointments
            </button>
            <button
              onClick={() => {
                setDone(false)
                setSelectedSlot(null)
                setReason("")
              }}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#6C7688] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-white"
            >
              Book another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={book} className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-6 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Doctor</span>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB]"
            >
              {doctors.length === 0 ? <option value="">No doctors available</option> : null}
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                  {d.specialization ? ` — ${d.specialization}` : d.department ? ` — ${d.department.name}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Date</span>
            <input
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] w-full"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Available slots</span>
            {!date ? (
              <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">Pick a date to see open slots.</p>
            ) : slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
              </div>
            ) : slots && slots.length === 0 ? (
              <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">No open slots that day. Try another date.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots?.map((s) => {
                  const active = selectedSlot?.start === s.start
                  return (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#2E37A4] border-[#2E37A4] text-white"
                          : "bg-white dark:bg-[#111827] border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:border-[#2E37A4]"
                      }`}
                    >
                      {new Date(s.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What would you like to discuss?"
              className="px-3 py-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={!selectedSlot || submitting}
            className="h-11 rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitting ? "Booking…" : "Request appointment"}
          </button>
        </form>
      )}
    </div>
  )
}
