"use client"

/**
 * Staff/patient sign-in page.
 *
 * Previously lived at `/`. As of the public-website rollout it moved to
 * `/login` so the root URL can host the marketing home. The middleware
 * redirects unauthenticated requests to protected routes here (preserving
 * the original target via the `next` query string), and bounces already-
 * authenticated users away to their dashboard. Forgot-password flow still
 * lives under `/admin/auth/forgot-password`.
 */

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSession, signIn } from "next-auth/react"

import { notify } from "@/lib/notify"

// Roles that land in the patient portal. Everything else (DOCTOR, ADMIN,
// RMO, RECEPTION, INFUSION_SPECIALIST, REHAB_SPECIALIST,
// AESTHETICS_SPECIALIST) lands in the admin/staff portal. Keep this in
// sync with middleware.ts and lib/auth.ts.
const PATIENT_ROLES = new Set(["PATIENT"])

function landingForRole(role: string | null | undefined): string {
  if (role && PATIENT_ROLES.has(role)) return "/patient/dashboard"
  return "/admin/dashboard"
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEnabled || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        notify.error("Invalid email or password", {
          description: "Double-check your credentials and try again.",
        })
      } else {
        // Read the freshly issued session to learn the user's role, then
        // route to the right portal directly (one redirect instead of
        // letting the middleware bounce a wrong-lane URL).
        const session = await getSession()
        const role = (session?.user as { role?: string } | undefined)?.role ?? null
        const next = new URLSearchParams(window.location.search).get("next")
        const destination =
          next && (next.startsWith("/admin/") || next.startsWith("/patient/"))
            ? next
            : landingForRole(role)
        router.refresh()
        router.push(destination)
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
      notify.error("Something went wrong", {
        description: "We couldn't reach the server. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isEnabled = email.trim() !== "" && password.trim() !== ""

  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-white font-sans">
      {/* Main Container */}
      <div
        className="flex flex-col items-center gap-6 rounded-[24px] border border-[#EAECF0] bg-[#F9FAFB] pt-10 px-10 pb-8"
        style={{
          width: '556px',
          height: '580px',
          opacity: 1,
          boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)',
        }}
      >
        {/* Logo — matches the public site header logotype */}
        <div className="flex flex-col items-center">
          <span
            className="text-4xl md:text-5xl"
            style={{
              fontFamily: "var(--font-script)",
              color: "#C9A227",
              lineHeight: 1,
              letterSpacing: "0.02em",
            }}
          >
            Dr. Yuvraaj Singh M.D.
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1
            style={{
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '32px',
              color: '#141414'
            }}
          >
            Login
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#141414'
            }}
          >
            Please enter below details to access the dashboard.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="flex w-full flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#141414'
              }}
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[14px]">
                <Mail className="h-5 w-5 text-[#667085]" />
              </div>
              <input
                type="email"
                id="email"
                placeholder="Email Address"
                autoComplete="off"
                value={email ?? ""}
                onChange={(e) => setEmail(e.target.value)}
                className="flex border border-[#D0D5DD] bg-[#F9FAFB] text-base text-[#101828] transition-all focus:border-[#B3B5E2] focus:outline-none focus:ring-2 focus:ring-[#B3B5E2]/20"
                style={{
                  width: '476px',
                  height: '48px',
                  borderRadius: '8px',
                  paddingTop: '10px',
                  paddingRight: '14px',
                  paddingBottom: '10px',
                  paddingLeft: '44px', // 14px (icon) + 20px (icon size) + 10px (gap)
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#141414'
              }}
            >
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[14px]">
                <Lock className="h-5 w-5 text-[#667085]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                autoComplete="new-password"
                name="password"
                value={password || ""}
                onChange={(e) => setPassword(e.target.value)}
                className="flex border border-[#D0D5DD] bg-[#F9FAFB] text-base text-[#101828] transition-all focus:border-[#B3B5E2] focus:outline-none focus:ring-2 focus:ring-[#B3B5E2]/20"
                style={{
                  width: '476px',
                  height: '48px',
                  borderRadius: '8px',
                  paddingTop: '10px',
                  paddingRight: '14px',
                  paddingBottom: '10px',
                  paddingLeft: '44px', // 14px (icon) + 20px (icon size) + 10px (gap)
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-[14px] text-[#667085] hover:text-[#101828] transition-colors"
              >
                {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forget Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="h-5 w-5 cursor-pointer rounded border-[#D0D5DD] text-[#B3B5E2] focus:ring-[#B3B5E2]"
              />
              <label htmlFor="remember" className="cursor-pointer text-sm font-medium text-[#475467]">
                Remember Me
              </label>
            </div>
            <Link
              href="/admin/auth/forgot-password"
              className="text-sm font-semibold text-[#F04438] hover:text-[#D92D20] transition-colors"
            >
              Forget Password?
            </Link>
          </div>

          {/* Login Button */}
          <Button
            className="h-14 w-full text-lg font-bold text-white shadow-sm transition-all"
            style={{
              backgroundColor: isEnabled && !isLoading ? '#2E37A4' : '#B3B5E2',
              opacity: 1,
            }}
            variant="default"
            disabled={!isEnabled || isLoading}
            onClick={handleLogin}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>

          {/* Copyright Text */}
          <p
            style={{
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '100%',
              color: '#000000',
              textAlign: 'center',
              marginTop: '4px', // Adding a bit more space above
              marginBottom: '0px' // Reduced space below
            }}
          >
            Copyright © 2026 - Dr. Yuvraj Singh MD.
          </p>
        </form>

      </div>
    </div>
  )
}
