/**
 * Branded 404 page. Replaces the default Next.js "black background, no
 * branding, no navigation" not-found UI flagged in BUG-018. Static and
 * server-rendered so it works even before any client-side JS is loaded.
 */

import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Page not found — Vyara",
}

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center px-6 py-12 font-sans">
      <div className="w-full max-w-lg bg-white border border-[#EAECF0] rounded-2xl shadow-sm p-10 flex flex-col items-center text-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/images/logos/vyara.png"
            alt="Vyara Logo"
            width={56}
            height={57}
            className="object-contain"
            priority
          />
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            404 — Not found
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[#101828]">
            We can&apos;t find that page
          </h1>
          <p className="text-sm text-[#667085] leading-relaxed">
            The page you&apos;re looking for has moved, been renamed, or never
            existed. The address bar might have a typo — otherwise these
            links will get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">
          <Link
            href="/"
            className="inline-flex justify-center items-center h-11 px-5 rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] text-white text-sm font-semibold transition-colors w-full sm:w-auto"
          >
            Back to login
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex justify-center items-center h-11 px-5 rounded-lg border border-[#D0D5DD] hover:bg-gray-50 text-[#344054] text-sm font-semibold transition-colors w-full sm:w-auto"
          >
            Doctor dashboard
          </Link>
          <Link
            href="/patient/dashboard"
            className="inline-flex justify-center items-center h-11 px-5 rounded-lg border border-[#D0D5DD] hover:bg-gray-50 text-[#344054] text-sm font-semibold transition-colors w-full sm:w-auto"
          >
            Patient dashboard
          </Link>
        </div>

        <p className="text-xs text-[#98A2B3]">
          Still stuck? Email{" "}
          <a
            href="mailto:support@vyara.health"
            className="text-[#2E37A4] hover:underline font-semibold"
          >
            support@vyara.health
          </a>
          .
        </p>
      </div>
    </div>
  )
}
