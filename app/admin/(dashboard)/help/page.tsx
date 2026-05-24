"use client"

/**
 * Admin portal Help & Support page. Created so the sidebar / user-menu
 * "Help & Support" link doesn't 404 — it landed on this empty route
 * previously. Real KB integration is a follow-up.
 */

import React from "react"
import Link from "next/link"
import { LifeBuoy, Mail, Phone, BookOpen } from "lucide-react"

const channels = [
  {
    icon: Mail,
    title: "Email support",
    description: "Reach the team at support@vyara.health — typical reply within 1 business day.",
    href: "mailto:support@vyara.health",
    cta: "Email us",
  },
  {
    icon: Phone,
    title: "Phone support",
    description: "Urgent? Call the clinic operations line, Mon–Sat, 9am–6pm IST.",
    href: "tel:+911234567890",
    cta: "Call",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Browse role-specific guides for doctors, RMOs, and front-desk staff.",
    href: "/swagger",
    cta: "Open docs",
  },
]

export default function AdminHelpPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Help & Support</h1>
        <p className="text-sm text-[#667085] mt-1">
          We&apos;re here to help — pick the channel that suits you best.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((c) => (
          <div
            key={c.title}
            className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-6 flex flex-col gap-3"
          >
            <div className="h-10 w-10 rounded-lg bg-[#F4F5FF] flex items-center justify-center">
              <c.icon className="h-5 w-5 text-[#2E37A4]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#101828]">{c.title}</h2>
              <p className="text-sm text-[#667085] mt-1">{c.description}</p>
            </div>
            <Link
              href={c.href}
              className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b]"
            >
              <LifeBuoy className="h-4 w-4" />
              {c.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
