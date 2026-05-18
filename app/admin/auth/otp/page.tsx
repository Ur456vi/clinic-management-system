import Link from "next/link"
import React from "react"

/**
 * Admin OTP-verification page — step 2 of the BE-05 password-reset flow
 * (request → verify OTP → set new password). UI form lands in FE-01b
 * (Sprint 2); placeholder for now so the route compiles.
 */
export default function AdminOtpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A] p-8">
      <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] p-10 w-full max-w-[480px] text-center space-y-3 shadow-sm">
        <h1 className="text-2xl font-bold text-[#141414] dark:text-white">
          Verify your code
        </h1>
        <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
          OTP entry UI is coming in Sprint 2 (FE-01b). For now please
          contact the clinic to recover access.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 text-sm font-semibold text-[#2E37A4] hover:underline"
        >
          Back to login
        </Link>
      </div>
    </main>
  )
}
