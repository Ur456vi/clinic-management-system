"use client"

/**
 * "Add from library" picker — a searchable dropdown over a prescription
 * catalog (Category -> Subcategory -> item). Used in the Dr. Yuvraaj Final
 * Prescription (medications + supplements) and the Infusion section.
 *
 * Generic: pass any `RxCategory[]`; clicking an item calls `onPick(item)`.
 * The caller decides what to do with the picked string (append a line, add
 * a table row, expand an infusion protocol, …).
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Plus, Search } from "lucide-react"

import { rxItemLabel, type RxCategory } from "@/lib/rx-library"

export default function RxLibraryPicker({
  categories,
  onPick,
  label = "Add from library",
  searchPlaceholder = "Search…",
}: {
  categories: RxCategory[]
  onPick: (item: string) => void
  label?: string
  searchPlaceholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [openCat, setOpenCat] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open])

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

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> {label}
      </button>

      {open ? (
        <div className="absolute z-50 mt-1.5 w-[min(92vw,420px)] rounded-xl border border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937] shadow-lg">
          <div className="p-2.5 border-b border-[#EAECF0] dark:border-[#374151]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 h-9 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
              />
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto py-1">
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
                              <p className="px-3 pt-1.5 pb-0.5 text-[11px] font-semibold text-[#2E37A4] dark:text-[#A5B4FC]">
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
        </div>
      ) : null}
    </div>
  )
}
