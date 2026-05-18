"use client"

/**
 * UserMenu — top-right header avatar with a click-to-open dropdown for
 * profile / settings navigation and sign-out. Drop-in for both the admin
 * (doctor) and patient portals. Reads the live session via `useSession`
 * and falls back to a "Loading…" label while the session resolves.
 *
 * Vanilla implementation (no Radix/shadcn dropdown dep) — handles:
 *   - click-outside close
 *   - Escape close
 *   - aria-expanded / aria-haspopup for screen readers
 *   - keyboard focus moves into the menu on open
 *
 * Sign-out posts to NextAuth and redirects to "/" (the auth/login page).
 *
 * Usage:
 *   <UserMenu items={[
 *     { label: "My profile", href: "/patient/profile", icon: User },
 *     { label: "Help & Support", href: "/patient/help", icon: HelpCircle },
 *   ]} />
 */

import Link from "next/link"
import React from "react"
import { useEffect, useRef, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { ChevronDown, LogOut, type LucideIcon } from "lucide-react"

import { UserAvatar } from "@/components/ui/UserAvatar"

export type UserMenuItem = {
  label: string
  href: string
  icon?: LucideIcon
}

type UserMenuProps = {
  /** Optional links above the Sign-out item. Defaults to []. */
  items?: UserMenuItem[]
  /** Avatar pixel size. Defaults to 36. */
  size?: number
  /** Where to send the user after sign-out. Defaults to "/". */
  signOutRedirect?: string
}

export function UserMenu({
  items = [],
  size = 36,
  signOutRedirect = "/",
}: UserMenuProps) {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = session?.user?.fullName ?? (status === "loading" ? "Loading…" : "Guest")
  const avatarUrl = session?.user?.avatarUrl ?? null
  const displayRole = session?.user?.role
    ? session.user.role.charAt(0) + session.user.role.slice(1).toLowerCase().replace(/_/g, " ")
    : ""

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on Escape; focus first menu item on open
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    // Move focus into the menu so keyboard users land somewhere useful
    requestAnimationFrame(() => {
      const first = menuRef.current?.querySelector<HTMLElement>("a, button")
      first?.focus()
    })
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut({ callbackUrl: signOutRedirect })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-lg transition-all group"
      >
        <UserAvatar name={displayName} src={avatarUrl} size={size} />
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-[#101828] leading-tight">{displayName}</span>
          {displayRole ? (
            <span className="text-xs text-[#667085]">{displayRole}</span>
          ) : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#667085] group-hover:text-[#101828] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-xl shadow-lg border border-[#EAECF0] z-50 overflow-hidden"
        >
          {/* Account header */}
          <div className="px-4 py-3 border-b border-[#EAECF0] bg-[#F9FAFB] flex items-center gap-3">
            <UserAvatar name={displayName} src={avatarUrl} size={40} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#101828] truncate">{displayName}</div>
              {session?.user?.email ? (
                <div className="text-xs text-[#667085] truncate">{session.user.email}</div>
              ) : null}
              {displayRole ? (
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#2E37A4] mt-0.5">
                  {displayRole}
                </div>
              ) : null}
            </div>
          </div>

          {/* Nav items */}
          {items.length > 0 ? (
            <div className="py-1">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#344054] hover:bg-[#F9FAFB] hover:text-[#101828] transition-colors"
                  >
                    {Icon ? <Icon className="h-4 w-4 text-[#667085]" /> : null}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ) : null}

          {/* Sign out */}
          <div className="border-t border-[#EAECF0] py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#B42318] hover:bg-[#FEF3F2] transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default UserMenu
