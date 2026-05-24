"use client"

/**
 * Doctor / admin portal settings page. Created to fix BUG-010 — the
 * sidebar "Settings" link and the user-menu "Settings" item both
 * pointed at `/admin/settings` but no page existed, so users hit a 404.
 *
 * This is intentionally a thin shell with the most common toggles and
 * a clean section layout — real backend wiring will follow once the
 * preferences API lands.
 */

import React, { useState } from "react"
import { Bell, Lock, Palette, Mail, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

export default function AdminSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [smsNotifs, setSmsNotifs] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system")

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Settings</h1>
        <p className="text-sm text-[#667085] mt-1">
          Manage your account preferences and notification rules.
        </p>
      </div>

      {/* Notifications */}
      <section className="bg-white border border-[#EAECF0] rounded-xl shadow-sm">
        <header className="px-6 py-4 border-b border-[#EAECF0] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#F4F5FF] flex items-center justify-center">
            <Bell className="h-4 w-4 text-[#2E37A4]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#101828]">Notifications</h2>
            <p className="text-xs text-[#667085]">Choose which alerts you want to receive.</p>
          </div>
        </header>
        <div className="px-6 py-5 space-y-4">
          <ToggleRow
            icon={<Mail className="h-4 w-4 text-[#667085]" />}
            title="Email notifications"
            description="Receive appointment, invoice and patient updates by email."
            checked={emailNotifs}
            onChange={setEmailNotifs}
          />
          <ToggleRow
            icon={<Bell className="h-4 w-4 text-[#667085]" />}
            title="SMS notifications"
            description="Get critical alerts (no-shows, emergencies) via SMS."
            checked={smsNotifs}
            onChange={setSmsNotifs}
          />
        </div>
      </section>

      {/* Security */}
      <section className="bg-white border border-[#EAECF0] rounded-xl shadow-sm">
        <header className="px-6 py-4 border-b border-[#EAECF0] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#FEF3F2] flex items-center justify-center">
            <Lock className="h-4 w-4 text-[#B42318]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#101828]">Security</h2>
            <p className="text-xs text-[#667085]">
              Manage password and two-factor authentication.
            </p>
          </div>
        </header>
        <div className="px-6 py-5 space-y-4">
          <ToggleRow
            icon={<Lock className="h-4 w-4 text-[#667085]" />}
            title="Two-factor authentication"
            description="Require a one-time code at sign-in."
            checked={twoFactor}
            onChange={setTwoFactor}
          />
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white border border-[#EAECF0] rounded-xl shadow-sm">
        <header className="px-6 py-4 border-b border-[#EAECF0] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#ECFDF3] flex items-center justify-center">
            <Palette className="h-4 w-4 text-[#027A48]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#101828]">Appearance</h2>
            <p className="text-xs text-[#667085]">Choose how the portal looks.</p>
          </div>
        </header>
        <div className="px-6 py-5 grid grid-cols-3 gap-3 max-w-md">
          {(["system", "light", "dark"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                theme === value
                  ? "border-[#2E37A4] bg-[#F4F5FF] text-[#2E37A4]"
                  : "border-[#D0D5DD] text-[#344054] hover:bg-gray-50"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            notify.success("Settings saved", {
              description: "Your preferences have been updated.",
            })
          }
          className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold"
        >
          <Save className="h-4 w-4" />
          <span>Save changes</span>
        </Button>
      </div>
    </div>
  )
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#101828]">{title}</p>
          <p className="text-xs text-[#667085]">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[#2E37A4]" : "bg-[#D0D5DD]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}
