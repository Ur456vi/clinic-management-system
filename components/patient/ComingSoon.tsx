import { Clock } from "lucide-react"

/**
 * Placeholder shown for patient-portal sections that aren't live yet
 * (Lab Management, Reports). Centered card matching the portal's light
 * indigo theme.
 */
export default function ComingSoon({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[60vh] px-6">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "#E8EEFB" }}
      >
        <Clock className="h-8 w-8" style={{ color: "#2E37A4" }} />
      </div>
      <h1 className="text-2xl font-bold text-[#101828]">{title}</h1>
      <span
        className="mt-2.5 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase"
        style={{ background: "#EEF2FF", color: "#2E37A4" }}
      >
        Coming soon
      </span>
      <p className="mt-4 text-sm text-[#667085] max-w-sm leading-relaxed">
        {description ??
          `${title} is on its way. We're putting the finishing touches on it — please check back shortly.`}
      </p>
    </div>
  )
}
