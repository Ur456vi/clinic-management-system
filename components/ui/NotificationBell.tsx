"use client"

/**
 * NotificationBell — bell icon with a click-to-open dropdown showing the
 * user's in-app notification feed. Used in both the admin and patient
 * portal headers.
 *
 * Wired to the real BE-45 endpoints:
 *   GET  /api/notifications?limit=10        — feed (newest first)
 *   POST /api/notifications/:id/read        — mark one read
 *   POST /api/notifications/read-all        — mark every row read
 *
 * The unread badge polls every 45s so a freshly-emitted notification
 * (handoff, payment, plan signed, …) shows up without a manual refresh.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, Loader2 } from "lucide-react"

type ApiNotification = {
  id: string
  kind: string
  title: string
  body: string | null
  sourceType: string | null
  sourceRefId: string | null
  readAt: string | null
  createdAt: string
}

const POLL_MS = 45_000

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const diff = Date.now() - then
  const min = Math.round(diff / 60_000)
  if (min < 1) return "Just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day === 1) return "Yesterday"
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })
}

export function NotificationBell({
  iconClassName,
  buttonClassName,
}: {
  iconClassName?: string
  buttonClassName?: string
} = {}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unread = items.filter((i) => !i.readAt).length

  const fetchFeed = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=10", {
        credentials: "include",
      })
      if (!res.ok) return
      const json = await res.json()
      if (Array.isArray(json?.data)) setItems(json.data as ApiNotification[])
      setLoaded(true)
    } catch {
      /* network hiccup — keep prior state, poll will retry */
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  // Initial badge load + background poll.
  useEffect(() => {
    void fetchFeed(false)
    const t = setInterval(() => void fetchFeed(false), POLL_MS)
    return () => clearInterval(t)
  }, [fetchFeed])

  // Refresh with spinner when the panel is opened.
  useEffect(() => {
    if (open) void fetchFeed(true)
  }, [open, fetchFeed])

  // Close on outside click.
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

  const markOneRead = useCallback(async (id: string) => {
    setItems((cur) =>
      cur.map((n) =>
        n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    )
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
      /* optimistic; poll reconciles */
    }
  }, [])

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString()
    setItems((cur) => cur.map((n) => (n.readAt ? n : { ...n, readAt: now })))
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      })
    } catch {
      /* optimistic; poll reconciles */
    }
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ??
          "p-2 text-[#667085] hover:bg-gray-50 dark:text-[#94A3B8] dark:hover:bg-[#1F2937] rounded-lg transition-colors relative"
        }
      >
        <Bell className={iconClassName ?? "h-5 w-5"} />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white dark:border-[#0F172A]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <header className="px-4 py-3 border-b border-[#EAECF0] dark:border-[#374151] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#111827]">
            <div className="text-sm font-semibold text-[#101828] dark:text-white">
              Notifications
            </div>
            {unread > 0 ? (
              <button
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
                type="button"
              >
                Mark all as read
              </button>
            ) : null}
          </header>

          {loading && !loaded ? (
            <div className="px-4 py-8 flex items-center justify-center text-sm text-[#667085] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void markOneRead(n.id)}
                    className={`w-full text-left px-4 py-3 text-sm flex flex-col gap-1 transition-colors hover:bg-[#F9FAFB] dark:hover:bg-[#111827] ${
                      n.readAt
                        ? "bg-white dark:bg-[#1F2937]"
                        : "bg-[#F4F5FF] dark:bg-[#312E81]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-[#101828] dark:text-white flex items-center gap-2">
                        {!n.readAt ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2E37A4] dark:bg-[#A5B4FC] flex-shrink-0" />
                        ) : null}
                        {n.title}
                      </span>
                      <span className="text-xs text-[#667085] dark:text-[#94A3B8] whitespace-nowrap">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>
                    {n.body ? (
                      <p className="text-xs text-[#667085] dark:text-[#94A3B8] leading-snug">
                        {n.body}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default NotificationBell
