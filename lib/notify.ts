/**
 * notify — centralized toast notification API.
 *
 * Design goals (so frontend devs can use this without thinking):
 *  1. ONE import. `import { notify } from "@/lib/notify"` — no hooks, no
 *     prop drilling, no provider lookups. Works inside React components,
 *     event handlers, async functions, route handlers (client-side),
 *     services — anywhere on the client.
 *  2. Type-safe variants. `notify.success`, `notify.error`, `notify.info`,
 *     `notify.warning`, `notify.loading` — all return a stable id so you
 *     can dismiss programmatically.
 *  3. notify.promise(p, msgs) — common case: show loading toast, swap to
 *     success/error when the promise settles. One call wraps the whole
 *     async lifecycle.
 *  4. SSR-safe. Module loads on the server without side effects; the
 *     internal emitter only fires when a NotificationProvider is mounted.
 *
 * Wiring: a single <NotificationProvider> in app/layout.tsx subscribes to
 * the emitter and renders the toast stack. Frontend devs never touch the
 * provider — they only call notify.* from anywhere.
 *
 * Examples:
 *
 *   notify.success("Patient saved")
 *   notify.error("Couldn't reach the server", { description: "Retry in a moment." })
 *
 *   const id = notify.loading("Uploading lab result…")
 *   try {
 *     await uploadFile(file)
 *     notify.dismiss(id)
 *     notify.success("Lab result uploaded")
 *   } catch (e) {
 *     notify.dismiss(id)
 *     notify.error("Upload failed")
 *   }
 *
 *   // Or use the promise helper — does the loading/dismiss/swap for you:
 *   await notify.promise(uploadFile(file), {
 *     loading: "Uploading lab result…",
 *     success: "Lab result uploaded",
 *     error: (err) => `Upload failed: ${(err as Error).message}`,
 *   })
 */

export type ToastKind = "success" | "error" | "info" | "warning" | "loading"

export type ToastInput = {
  title: string
  description?: string
  /** ms before auto-dismiss. 0 or undefined = sticky (default for loading + error). */
  duration?: number
}

export type Toast = {
  id: string
  kind: ToastKind
  title: string
  description?: string
  /** ms; null = sticky */
  duration: number | null
  createdAt: number
}

type Event =
  | { type: "show"; toast: Toast }
  | { type: "dismiss"; id: string }
  | { type: "clear" }

type Listener = (event: Event) => void

const listeners = new Set<Listener>()

/**
 * Subscribe to toast events. NotificationProvider is the only intended
 * caller — exported because the provider lives in a different file.
 * Returns an unsubscribe function.
 */
export function subscribeNotify(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit(event: Event): void {
  for (const l of listeners) {
    try {
      l(event)
    } catch (err) {
      // Listener errors must never break the caller's flow.
      // eslint-disable-next-line no-console
      console.error("[notify] listener error", err)
    }
  }
}

// Defaults per kind. Loading + error stick until dismissed; the rest
// auto-dismiss after 4s. Override per-call with `duration`.
function defaultDuration(kind: ToastKind): number | null {
  switch (kind) {
    case "loading":
    case "error":
      return null
    case "success":
      return 3500
    case "warning":
      return 5000
    case "info":
    default:
      return 4000
  }
}

let counter = 0
function nextId(): string {
  counter += 1
  return `t_${Date.now()}_${counter}`
}

function show(
  kind: ToastKind,
  title: string,
  opts: Omit<ToastInput, "title"> = {},
): string {
  const toast: Toast = {
    id: nextId(),
    kind,
    title,
    description: opts.description,
    duration:
      opts.duration === undefined
        ? defaultDuration(kind)
        : opts.duration === 0
          ? null
          : opts.duration,
    createdAt: Date.now(),
  }
  emit({ type: "show", toast })
  return toast.id
}

type PromiseMessages<T> = {
  loading: string
  success: string | ((value: T) => string)
  error: string | ((error: unknown) => string)
  /** Optional description shown under the success/error title. */
  description?: string | ((arg: T | unknown) => string)
}

async function promise<T>(
  input: Promise<T> | (() => Promise<T>),
  messages: PromiseMessages<T>,
): Promise<T> {
  const loadingId = show("loading", messages.loading)
  const p = typeof input === "function" ? input() : input
  try {
    const value = await p
    emit({ type: "dismiss", id: loadingId })
    const successTitle =
      typeof messages.success === "function" ? messages.success(value) : messages.success
    show("success", successTitle, {
      description:
        typeof messages.description === "function"
          ? messages.description(value)
          : messages.description,
    })
    return value
  } catch (err) {
    emit({ type: "dismiss", id: loadingId })
    const errorTitle =
      typeof messages.error === "function" ? messages.error(err) : messages.error
    show("error", errorTitle, {
      description:
        typeof messages.description === "function"
          ? messages.description(err)
          : messages.description,
    })
    throw err
  }
}

export const notify = {
  success: (title: string, opts?: Omit<ToastInput, "title">) =>
    show("success", title, opts),
  error: (title: string, opts?: Omit<ToastInput, "title">) =>
    show("error", title, opts),
  info: (title: string, opts?: Omit<ToastInput, "title">) =>
    show("info", title, opts),
  warning: (title: string, opts?: Omit<ToastInput, "title">) =>
    show("warning", title, opts),
  loading: (title: string, opts?: Omit<ToastInput, "title">) =>
    show("loading", title, opts),
  dismiss: (id: string) => emit({ type: "dismiss", id }),
  clear: () => emit({ type: "clear" }),
  promise,
}

export default notify
