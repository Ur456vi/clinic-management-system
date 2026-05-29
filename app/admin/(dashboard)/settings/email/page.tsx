"use client"

/**
 * Admin → Settings → Email (SMTP). Configure the Brevo SMTP credentials used
 * by the transactional mailer (nodemailer). The password is write-only — it's
 * stored encrypted server-side and never returned, so the field shows a
 * "saved" placeholder and is only sent when the admin types a new one.
 */

import { useCallback, useEffect, useState } from "react"
import { Loader2, Mail, Save, Send, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

interface EmailSettings {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  hasPassword: boolean
  fromName: string
  fromEmail: string
}

const emptyForm = {
  enabled: false,
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromName: "Dr. Yuvraaj Singh M.D.",
  fromEmail: "",
}

export default function EmailSettingsPage() {
  const [form, setForm] = useState(emptyForm)
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testTo, setTestTo] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/email", { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as { data: EmailSettings }
      setForm({
        enabled: data.enabled,
        host: data.host || emptyForm.host,
        port: data.port || 587,
        secure: data.secure,
        user: data.user,
        password: "",
        fromName: data.fromName || emptyForm.fromName,
        fromEmail: data.fromEmail,
      })
      setHasPassword(data.hasPassword)
    } catch (err) {
      notify.error("Couldn't load email settings", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Only send password if the admin typed a new one.
          ...(form.password ? {} : { password: undefined }),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as { data: EmailSettings }
      setHasPassword(data.hasPassword)
      setForm((f) => ({ ...f, password: "" }))
      notify.success("Email settings saved")
    } catch (err) {
      notify.error("Couldn't save email settings", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    if (!testTo.trim()) {
      notify.error("Enter a recipient email for the test")
      return
    }
    setTesting(true)
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
      const r = json?.data?.result
      if (r?.ok && r.provider === "smtp") {
        notify.success(`Test email sent via SMTP to ${testTo.trim()}`)
      } else if (r?.ok) {
        notify.warning(`Sent via "${r.provider}" — SMTP isn't active yet`, {
          description: "Save and enable the SMTP settings above, then test again.",
        })
      } else {
        notify.error("Test failed", { description: r?.error ?? "Unknown error" })
      }
    } catch (err) {
      notify.error("Couldn't send test email", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085]">
        <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] mb-3" />
        <p className="text-sm font-medium">Loading email settings…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[720px]">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-[#F4F5FF] flex items-center justify-center">
          <Mail className="h-5 w-5 text-[#2E37A4]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Email (SMTP)</h1>
          <p className="text-sm text-[#667085]">
            Transactional email is sent via Brevo SMTP using these credentials.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-6 space-y-5">
        {/* Enable toggle */}
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>
            <span className="block text-sm font-semibold text-[#101828]">Enable SMTP sending</span>
            <span className="block text-xs text-[#667085]">
              When off, emails fall back to the configured API provider or the dev console.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="h-5 w-9 appearance-none rounded-full bg-[#D0D5DD] checked:bg-[#2E37A4] relative cursor-pointer transition-colors before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="SMTP host" className="sm:col-span-2">
            <input
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              placeholder="smtp-relay.brevo.com"
              className={inputCls}
            />
          </Field>
          <Field label="Port">
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-[#344054]">
          <input
            type="checkbox"
            checked={form.secure}
            onChange={(e) => setForm({ ...form, secure: e.target.checked })}
            className="h-4 w-4 rounded border-[#D0D5DD] text-[#2E37A4]"
          />
          Use TLS (secure) — typically on for port 465, off for 587
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SMTP username (Brevo login)">
            <input
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="SMTP password / key">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={hasPassword ? "•••••••• (saved — leave blank to keep)" : "Brevo SMTP key"}
              className={inputCls}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="From name">
            <input
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="From email">
            <input
              type="email"
              value={form.fromEmail}
              onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
              placeholder="no-reply@yourdomain.com"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#667085] pt-1">
          <ShieldCheck className="h-4 w-4 text-[#027A48]" />
          The password is stored encrypted and never shown again.
        </div>

        <div className="pt-2">
          <Button
            onClick={() => void save()}
            disabled={saving}
            className="bg-[#2E37A4] hover:bg-[#1d246b] text-white flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </div>
      </div>

      {/* Test */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#101828] mb-1">Send a test email</h2>
        <p className="text-xs text-[#667085] mb-4">
          Uses the saved settings. Save &amp; enable SMTP first for a true SMTP test.
        </p>
        <Field label="Recipient">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="recipient@example.com"
            className={inputCls}
          />
        </Field>
        <Button
          onClick={() => void sendTest()}
          disabled={testing}
          className="mt-4 bg-[#2E37A4] hover:bg-[#1d246b] text-white flex items-center gap-2"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send test email
        </Button>
      </div>
    </div>
  )
}

const inputCls =
  "w-full h-11 px-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-[#344054]">{label}</span>
      {children}
    </label>
  )
}
