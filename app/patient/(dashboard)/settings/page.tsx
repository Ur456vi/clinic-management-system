"use client";

/**
 * Patient portal settings page. Created so the sidebar "Settings" link
 * (which currently points at /patient/profile via the layout's
 * `bottomItems` list) and the user-menu "Settings" item don't 404
 * (BUG-017). Minimal toggles for now — preferences API wiring follows.
 */

import { useState } from "react";
import { Bell, Lock, Mail, Save } from "lucide-react";
import { notify } from "@/lib/notify";

export default function PatientSettingsPage() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [shareForResearch, setShareForResearch] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#141414] dark:text-[#F9FAFB]">Settings</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          Manage how the Institute contacts you and how your data is used.
        </p>
      </div>

      <section className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm">
        <header className="px-6 py-4 border-b border-[#EAECF0] dark:border-[#374151] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#6B2B26]/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-[#6B2B26] dark:text-[#A5B4FC]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB]">
              Appointment reminders
            </h2>
            <p className="text-xs text-[#6C7688] dark:text-[#94A3B8]">
              Pick how you&apos;d like to be reminded about upcoming visits.
            </p>
          </div>
        </header>
        <div className="px-6 py-5 space-y-4">
          <Toggle
            icon={<Mail className="h-4 w-4 text-[#6C7688] dark:text-[#94A3B8]" />}
            title="Email reminders"
            description="Receive a reminder 24 hours before each appointment."
            checked={emailReminders}
            onChange={setEmailReminders}
          />
          <Toggle
            icon={<Bell className="h-4 w-4 text-[#6C7688] dark:text-[#94A3B8]" />}
            title="SMS reminders"
            description="Get an SMS reminder 2 hours before each appointment."
            checked={smsReminders}
            onChange={setSmsReminders}
          />
        </div>
      </section>

      <section className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm">
        <header className="px-6 py-4 border-b border-[#EAECF0] dark:border-[#374151] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#FEF3F2] flex items-center justify-center">
            <Lock className="h-4 w-4 text-[#B42318]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB]">
              Privacy
            </h2>
            <p className="text-xs text-[#6C7688] dark:text-[#94A3B8]">
              Control how your information is used outside of your care.
            </p>
          </div>
        </header>
        <div className="px-6 py-5 space-y-4">
          <Toggle
            icon={<Lock className="h-4 w-4 text-[#6C7688] dark:text-[#94A3B8]" />}
            title="Share de-identified data for research"
            description="We never share data that can identify you personally."
            checked={shareForResearch}
            onChange={setShareForResearch}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={() =>
            notify.success("Settings saved", {
              description: "Your preferences have been updated.",
            })
          }
          className="bg-[#6B2B26] hover:bg-[#54201D] text-white rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save changes
        </button>
      </div>
    </div>
  );
}

function Toggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#141414] dark:text-[#F9FAFB]">{title}</p>
          <p className="text-xs text-[#6C7688] dark:text-[#94A3B8]">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[#6B2B26]" : "bg-[#D0D0D0]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#1F2937] shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
