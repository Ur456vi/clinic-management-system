"use client"

/**
 * ToastList — fixed top-right stack of toast cards. Internal to the
 * notification system; rendered by NotificationProvider. Frontend devs
 * never instantiate this directly.
 *
 * Visual:
 *   - Top-right of viewport, 16px gutter
 *   - Stacks newest-on-top, max 6 visible (older ones still in state)
 *   - 360px wide cards with kind-coded left border + icon
 *   - role="status" + aria-live="polite" so screen readers announce
 *   - Click anywhere on the card OR the × button to dismiss
 *   - Dark-mode aware via Tailwind dark: variants
 */

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react"

import type { Toast, ToastKind } from "@/lib/notify"

const KIND_STYLES: Record<
  ToastKind,
  { Icon: typeof Info; iconClass: string; barClass: string }
> = {
  success: {
    Icon: CheckCircle2,
    iconClass: "text-[#079455] dark:text-[#34D399]",
    barClass: "bg-[#079455] dark:bg-[#34D399]",
  },
  error: {
    Icon: AlertCircle,
    iconClass: "text-[#B42318] dark:text-[#F87171]",
    barClass: "bg-[#B42318] dark:bg-[#F87171]",
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: "text-[#B54708] dark:text-[#FBBF24]",
    barClass: "bg-[#B54708] dark:bg-[#FBBF24]",
  },
  info: {
    Icon: Info,
    iconClass: "text-[#2E37A4] dark:text-[#818CF8]",
    barClass: "bg-[#2E37A4] dark:bg-[#818CF8]",
  },
  loading: {
    Icon: Loader2,
    iconClass: "text-[#667085] dark:text-[#94A3B8] animate-spin",
    barClass: "bg-[#667085] dark:bg-[#94A3B8]",
  },
}

const MAX_VISIBLE = 6

type ToastListProps = {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastList({ toasts, onDismiss }: ToastListProps) {
  // Show newest at the top.
  const visible = toasts.slice(-MAX_VISIBLE).reverse()

  if (visible.length === 0) return null

  return (
    <div
      // Top-right placement per design choice; pointer-events-none on the
      // container so the page is interactive between toasts, with
      // pointer-events-auto on each card so click-to-dismiss works.
      className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]"
      role="region"
      aria-label="Notifications"
    >
      {visible.map((toast) => {
        const { Icon, iconClass, barClass } = KIND_STYLES[toast.kind]
        return (
          <div
            key={toast.id}
            role={toast.kind === "error" || toast.kind === "warning" ? "alert" : "status"}
            aria-live={toast.kind === "error" ? "assertive" : "polite"}
            className="pointer-events-auto group relative overflow-hidden bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-lg flex items-start gap-3 pl-4 pr-2 py-3 animate-in slide-in-from-right-2 fade-in duration-200"
          >
            {/* Kind-coded accent bar */}
            <span
              aria-hidden
              className={`absolute left-0 top-0 bottom-0 w-1 ${barClass}`}
            />
            <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconClass}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#101828] dark:text-white">
                {toast.title}
              </div>
              {toast.description ? (
                <div className="text-xs text-[#475467] dark:text-[#94A3B8] mt-0.5 break-words">
                  {toast.description}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-1 rounded-md text-[#667085] dark:text-[#94A3B8] hover:bg-[#F9FAFB] dark:hover:bg-[#374151] hover:text-[#101828] dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastList
