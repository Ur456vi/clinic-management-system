"use client"

/**
 * Forced first-login password reset.
 *
 * The proxy pins any account with `mustResetPassword = true` (i.e. created
 * with an emailed temporary password) to this page until they choose a real
 * password. On success we clear the flag server-side, refresh the NextAuth
 * JWT via `update()` so the proxy stops gating, and route to the dashboard.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Lock, Loader2, ShieldCheck } from "lucide-react"

import { notify } from "@/lib/notify"

function landingForRole(role: string | undefined): string {
  return role === "PATIENT" ? "/patient/dashboard" : "/admin/dashboard"
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    const local: Record<string, string> = {}
    if (next.length < 8) local.newPassword = "Password must be at least 8 characters"
    if (confirm !== next) local.confirm = "Passwords do not match"
    if (Object.keys(local).length) {
      setErrors(local)
      return
    }
    setSaving(true)
    setErrors({})
    try {
      const res = await fetch("/api/me/password/initial", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: next }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const issues = json?.error?.issues
        if (Array.isArray(issues)) {
          const map: Record<string, string> = {}
          for (const issue of issues) {
            const path = Array.isArray(issue.path) ? issue.path.join(".") : ""
            if (path) map[path] = issue.message
          }
          setErrors(map)
        }
        throw new Error(json?.error?.message ?? "Couldn't set your password")
      }
      notify.success("Password updated — welcome!")
      // Refresh the JWT so the proxy sees mustResetPassword = false.
      await update()
      router.refresh()
      router.replace(landingForRole(session?.user?.role))
    } catch (err) {
      notify.error("Couldn't set your password", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6">
      <div className="w-full max-w-[480px] bg-white border border-[#EAECF0] rounded-2xl shadow-sm p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-[#F4F5FF] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-[#2E37A4]" />
          </div>
          <h1 className="text-xl font-bold text-[#101828]">Set a new password</h1>
          <p className="text-sm text-[#667085] max-w-sm">
            You signed in with a temporary password. Choose a new password to
            secure your account before continuing.
          </p>
          {session?.user?.email ? (
            <p className="text-xs text-[#98A2B3]">{session.user.email}</p>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054]">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="At least 8 characters"
              className="h-11 rounded-lg border border-[#D0D5DD] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
            />
            {errors.newPassword ? (
              <span className="text-xs text-[#B42318]">{errors.newPassword}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054]">Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 rounded-lg border border-[#D0D5DD] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
            />
            {errors.confirm ? (
              <span className="text-xs text-[#B42318]">{errors.confirm}</span>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {saving ? "Saving…" : "Set password & continue"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="text-xs font-semibold text-[#667085] hover:text-[#101828] self-center"
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
