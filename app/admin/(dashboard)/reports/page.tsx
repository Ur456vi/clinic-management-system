import React from "react"

/**
 * Reports — clinic-level analytics + exports (Sprint 2+).
 *
 * Placeholder for now: the sidebar links here but no real data surface
 * is in scope for the May 28 demo. Will revisit in Sprint 2.
 */
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#101828] dark:text-white">
        Reports
      </h1>
      <div className="bg-white dark:bg-[#1F2937] p-12 rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm text-center">
        <p className="text-[#667085] dark:text-[#94A3B8]">
          Reports &amp; analytics are coming in Sprint 2.
        </p>
        <p className="text-xs text-[#94A3B8] mt-2">
          Clinic volume, revenue, treatment-plan throughput, no-show rate.
        </p>
      </div>
    </div>
  )
}
