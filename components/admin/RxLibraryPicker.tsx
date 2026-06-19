"use client"

/**
 * "Add from library" picker — a searchable dropdown over a prescription
 * catalog (Category -> Subcategory -> item). Used in the Dr. Yuvraaj Final
 * Prescription (medications + supplements) and the Infusion section.
 *
 * Generic: pass any `RxCategory[]`; clicking an item calls `onPick(item)`.
 * The caller decides what to do with the picked string (append a line, add
 * a table row, expand an infusion protocol, …).
 *
 * `variant`:
 *   - "dropdown" (default): an absolutely-positioned panel under the button.
 *   - "modal": a centered overlay portalled into `document.body`, so it
 *     escapes any ancestor `overflow-hidden` clipping (used by the infusion
 *     picker, which lives inside a clipped table card — a higher z-index
 *     can't fix a clip, only leaving the overflow context can).
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Plus, Search, X } from "lucide-react"

import { rxItemLabel, type RxCategory } from "@/lib/rx-library"

export default function RxLibraryPicker({
  categories,
  onPick,
  label = "Add from library",
  searchPlaceholder = "Search…",
  variant = "dropdown",
}: {
  categories: RxCategory[]
  onPick: (item: string) => void
  label?: string
  searchPlaceholder?: string
  variant?: "dropdown" | "modal"
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [openCat, setOpenCat] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Outside-click close — dropdown only. The modal is portalled outside this
  // subtree, so a window listener would fire on every in-modal click; it
  // closes via its backdrop / Escape instead.
  useEffect(() => {
    if (!open || variant === "modal") return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open, variant])

  // Escape closes the modal.
  useEffect(() => {
    if (!open || variant !== "modal") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, variant])

  const q = search.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q) return null
    const out: { label: string; item: string }[] = []
    for (const c of categories)
      for (const g of c.groups)
        for (const it of g.items) {
          const itemLabel = rxItemLabel(it)
          if (itemLabel.toLowerCase().includes(q)) out.push({ label: g.name || c.name, item: itemLabel })
        }
    return out.slice(0, 50)
  }, [q, categories])

  const pick = (item: string) => {
    onPick(item)
    setOpen(false)
    setSearch("")
  }

  // Shared panel content (search box + results list). In the modal the list
  // grows to fill the dialog height; the dropdown caps it instead.
  const body = (
    <>
      <div className="p-2.5 border-b border-[#EAECF0] dark:border-[#374151]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 h-9 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"
          />
        </div>
      </div>

      <div className={`overflow-y-auto py-1 ${variant === "modal" ? "grow" : "max-h-[320px]"}`}>
        {matches ? (
          matches.length === 0 ? (
            <p className="px-3 py-3 text-sm text-[#98A2B3]">No matches.</p>
          ) : (
            matches.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(m.item)}
                className="w-full text-left px-3 py-2 hover:bg-[#F9FAFB] dark:hover:bg-[#111827]"
              >
                <span className="block text-sm text-[#101828] dark:text-[#F9FAFB]">{m.item}</span>
                <span className="block text-[11px] text-[#98A2B3]">{m.label}</span>
              </button>
            ))
          )
        ) : (
          categories.map((c) => {
            const expanded = openCat === c.id
            return (
              <div key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpenCat(expanded ? null : c.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]"
                >
                  <span>{c.name}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded
                  ? c.groups.map((g, gi) => (
                      <div key={gi} className="pb-1">
                        {g.name ? (
                          <p className="px-3 pt-1.5 pb-0.5 text-[11px] font-semibold text-[#6B2B26] dark:text-[#A5B4FC]">
                            {g.name}
                          </p>
                        ) : null}
                        {g.items.map((it, ii) => {
                          const itemLabel = rxItemLabel(it)
                          return (
                            <button
                              key={ii}
                              type="button"
                              onClick={() => pick(itemLabel)}
                              className="w-full text-left px-4 py-1.5 text-sm text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]"
                            >
                              {itemLabel}
                            </button>
                          )
                        })}
                      </div>
                    ))
                  : null}
              </div>
            )
          })
        )}
      </div>
    </>
  )

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> {label}
      </button>

      {open && variant === "dropdown" ? (
        <div className="absolute z-[999] mt-1.5 w-[min(92vw,420px)] rounded-xl border border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937] shadow-lg">
          {body}
        </div>
      ) : null}

      {open && variant === "modal" && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-start justify-center p-4 bg-black/40"
              style={{ paddingTop: "12vh" }}
              onMouseDown={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => e.stopPropagation()}
                className="w-[min(94vw,480px)] max-h-[76vh] flex flex-col rounded-2xl border border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937] shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAECF0] dark:border-[#374151]">
                  <span className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">{label}</span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="p-1.5 rounded-lg text-[#98A2B3] hover:bg-[#F2F4F7] dark:hover:bg-[#111827]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {body}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
