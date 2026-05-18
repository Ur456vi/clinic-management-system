import Link from "next/link"
import React from "react"

/**
 * New-password landing page — step 3 of the BE-05 password-reset flow
 * (request → verify OTP → set new password). The actual form will be
 * built in FE-01b (Sprint 2); for now this is a placeholder so the
 * URL route compiles and the verify-OTP step has somewhere to send
 * the user.
 */
export default function NewPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A] p-8">
      <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] p-10 w-full max-w-[480px] text-center space-y-3 shadow-sm">
        <h1 className="text-2xl font-bold text-[#141414] dark:text-white">
          Set a new password
        </h1>
        <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
          This page is coming in Sprint 2 (FE-01b). For now please contact
          the clinic to reset your password.
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
