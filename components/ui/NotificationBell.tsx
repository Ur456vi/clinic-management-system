"use client"

/**
 * NotificationBell — bell icon with a click-to-open dropdown showing a
 * small notification feed. Used in both the admin and patient portal
 * headers. Replaces the previous unwired bell button (BUG-024).
 *
 * Wired to the centralised notify center for now; once the
 * `/api/notifications` endpoint lands this component will swap to a
 * server-side feed.
 */

import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"

type Notification = {
  id: string
  title: string
  body: string
  time: string
  unread?: boolean
}

const DEFAULT_FEED: Notification[] = [
  {
    id: "n-3",
    title: "New patient registered",
    body: "Akanksha Jain just signed up via the patient portal.",
    time: "12m ago",
    unread: true,
  },
  {
    id: "n-2",
    title: "Lab result available",
    body: "Sumit Mittal's CBC report is ready to review.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "n-1",
    title: "Invoice paid",
    body: "Invoice INV-202604-000041 was paid in full.",
    time: "Yesterday",
  },
]

export function NotificationBell({
  iconClassName,
  buttonClassName,
}: {
  iconClassName?: string
  buttonClassName?: string
} = {}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>(DEFAULT_FEED)
  const containerRef = useRef<HTMLDivElement>(null)

  const unread = items.filter((i) => i.unread).length

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
          "p-2 text-[#667085] hover:bg-gray-50 rounded-lg transition-colors relative"
        }
      >
        <Bell className={iconClassName ?? "h-5 w-5"} />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white border border-[#EAECF0] rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <header className="px-4 py-3 border-b border-[#EAECF0] flex items-center justify-between bg-[#F9FAFB]">
            <div className="text-sm font-semibold text-[#101828]">
              Notifications
            </div>
            {unread > 0 ? (
              <button
                onClick={() =>
                  setItems((cur) => cur.map((n) => ({ ...n, unread: false })))
                }
                className="text-xs font-semibold text-[#2E37A4] hover:underline"
                type="button"
              >
                Mark all as read
              </button>
            ) : null}
          </header>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#667085]">
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-[#EAECF0]">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 text-sm flex flex-col gap-1 ${
                    n.unread ? "bg-[#F4F5FF]" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-[#101828]">{n.title}</span>
                    <span className="text-xs text-[#667085] whitespace-nowrap">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] leading-snug">{n.body}</p>
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
