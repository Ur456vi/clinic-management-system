"use client"

/**
 * NotificationProvider — subscribes to the notify emitter, manages the
 * toast stack, and renders <ToastList/>. Mount once in app/layout.tsx.
 *
 * Frontend devs DO NOT use this component directly — they import notify
 * from "@/lib/notify" and call notify.success(...) etc. from anywhere.
 * This provider is the rendering layer; the API is decoupled from it.
 */

import React, { useEffect, useState } from "react"

import { type Toast, notify, subscribeNotify } from "@/lib/notify"
import { ToastList } from "@/components/ui/ToastList"

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    const cancelTimer = (id: string) => {
      const t = timers.get(id)
      if (t) {
        clearTimeout(t)
        timers.delete(id)
      }
    }

    const unsubscribe = subscribeNotify((event) => {
      if (event.type === "show") {
        const toast = event.toast
        setToasts((prev) => {
          // De-dupe by id (very unlikely collision but cheap to guard).
          if (prev.some((t) => t.id === toast.id)) return prev
          return [...prev, toast]
        })
        if (toast.duration !== null) {
          timers.set(
            toast.id,
            setTimeout(() => {
              cancelTimer(toast.id)
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }, toast.duration),
          )
        }
      } else if (event.type === "dismiss") {
        cancelTimer(event.id)
        setToasts((prev) => prev.filter((t) => t.id !== event.id))
      } else if (event.type === "clear") {
        timers.forEach((t) => clearTimeout(t))
        timers.clear()
        setToasts([])
      }
    })

    return () => {
      unsubscribe()
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const handleDismiss = (id: string) => notify.dismiss(id)

  return (
    <>
      {children}
      <ToastList toasts={toasts} onDismiss={handleDismiss} />
    </>
  )
}

export default NotificationProvider
