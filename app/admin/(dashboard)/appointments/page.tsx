"use client"

/**
 * Admin Appointments list — fully wired to /api/appointments.
 *
 * The table, filters, and row actions live in the shared
 * <AppointmentsList> component so other scoped views (e.g. the
 * "Dr Yuvraaj Appointment" page) can reuse the exact same UI.
 */

import AppointmentsList from "@/components/admin/AppointmentsList"

export default function AppointmentsPage() {
  return (
    <AppointmentsList
      title="Appointments"
      subtitle="Live booking list — slots created by reception, the patient portal, and the public-site assessment flow all show up here."
    />
  )
}
