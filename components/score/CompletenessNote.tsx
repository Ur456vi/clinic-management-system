"use client"

import { PATIENT_COMPLETENESS_THRESHOLD } from "@/lib/scoring"

/**
 * The caveat that has to travel with a partial score on a patient-facing page.
 *
 * The portal shows a score drawn from an unfinished assessment rather than
 * withholding it. That is only safe if the number arrives with the reason it is
 * low: a 25% score taken from a third of the questions is not a health verdict,
 * and without this line a patient has no way to tell the two apart.
 *
 * Above the threshold it renders nothing — a finished assessment needs no
 * apology, and a permanent "97% complete" badge would only invite the patient
 * to chase the last 3%.
 */
export function CompletenessNote({
  completeness,
  className = "",
}: {
  /** 0..1, from the patient score payload. */
  completeness: number | null | undefined
  className?: string
}) {
  if (completeness == null || completeness >= PATIENT_COMPLETENESS_THRESHOLD) return null

  const percent = Math.round(completeness * 100)

  return (
    <p
      className={`text-xs text-[#B54708] dark:text-[#FDB022] ${className}`}
      // Announced on load: the number above it is incomplete, and a screen
      // reader user should not have to reach this line to find that out.
      role="note"
    >
      Assessment {percent}% complete — this score will change as your clinician
      finishes it.
    </p>
  )
}
