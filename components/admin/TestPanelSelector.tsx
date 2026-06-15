"use client"

/**
 * Test-panel selector for the Dr. Yuvraaj consultation "Test" section.
 *
 * Collapsible categories -> panels (A, B, …) -> individual tests. Tick a
 * single test, a whole panel ("select all under it"), or a whole category.
 * Search filters tests + panels. The value is a JSON array of test keys
 * (see lib/test-catalog.ts) round-tripped through `onChange`.
 */

import { useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"

import {
  TEST_CATALOG,
  type TestCategory,
  type TestPanel,
  panelTestKeys,
  parseSelectedTests,
  testKey,
} from "@/lib/test-catalog"

const VISIBLE_PER_PANEL = 3

export default function TestPanelSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const selected = useMemo(() => new Set(parseSelectedTests(value)), [value])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    // First category open, the rest collapsed — mirrors the design.
    Object.fromEntries(TEST_CATALOG.map((c, i) => [c.id, i !== 0])),
  )
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const q = search.trim().toLowerCase()

  const commit = (next: Set<string>) => onChange(JSON.stringify([...next]))

  const toggleTest = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    commit(next)
  }

  const togglePanel = (panel: TestPanel) => {
    const keys = panelTestKeys(panel)
    const allOn = keys.length > 0 && keys.every((k) => selected.has(k))
    const next = new Set(selected)
    for (const k of keys) {
      if (allOn) next.delete(k)
      else next.add(k)
    }
    commit(next)
  }

  const toggleCategory = (cat: TestCategory) => {
    const keys = cat.panels.flatMap(panelTestKeys)
    const allOn = keys.length > 0 && keys.every((k) => selected.has(k))
    const next = new Set(selected)
    for (const k of keys) {
      if (allOn) next.delete(k)
      else next.add(k)
    }
    commit(next)
  }

  const matches = (panel: TestPanel): { panel: TestPanel; tests: string[] } | null => {
    if (!q) return { panel, tests: panel.tests }
    if (panel.name.toLowerCase().includes(q)) return { panel, tests: panel.tests }
    const tests = panel.tests.filter((t) => t.toLowerCase().includes(q))
    return tests.length ? { panel, tests } : null
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header + search */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB]">Select Test Panels</h3>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
            Choose a panel to automatically select all tests under it.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] dark:text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test or panel"
            className="w-full pl-9 pr-3 h-11 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          />
        </div>
      </div>

      {/* Categories */}
      {TEST_CATALOG.map((cat) => {
        const catKeys = cat.panels.flatMap(panelTestKeys)
        const catSelected = catKeys.filter((k) => selected.has(k)).length
        const catAllOn = catKeys.length > 0 && catSelected === catKeys.length
        const isCollapsed = collapsed[cat.id]
        const visiblePanels = cat.panels.map(matches).filter(Boolean) as { panel: TestPanel; tests: string[] }[]
        if (q && visiblePanels.length === 0) return null

        return (
          <div
            key={cat.id}
            className="rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden"
          >
            {/* Category header */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-[#1F2937]">
              <input
                type="checkbox"
                checked={catAllOn}
                disabled={catKeys.length === 0}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] focus:ring-[#2E37A4]/20 disabled:opacity-40"
                aria-label={`Select all ${cat.title}`}
              />
              <span className="text-sm font-bold uppercase tracking-wide text-[#101828] dark:text-[#F9FAFB] flex-1">
                {cat.title}
              </span>
              {catSelected > 0 ? (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] text-[#2E37A4] dark:text-[#A5B4FC]">
                  {catSelected} Test{catSelected === 1 ? "" : "s"} Selected
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setCollapsed((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                className="p-1 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828]"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
              >
                <ChevronDown className={`h-5 w-5 transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
              </button>
            </div>

            {/* Panels */}
            {!isCollapsed ? (
              <div className="border-t border-[#EAECF0] dark:border-[#374151] px-5 py-4">
                {cat.panels.length === 0 ? (
                  <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8] py-2">No panels configured yet.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
                    {visiblePanels.map(({ panel, tests }) => {
                      const keys = panelTestKeys(panel)
                      const panelAllOn = keys.length > 0 && keys.every((k) => selected.has(k))
                      const expanded = q ? true : expandedPanels.has(panel.id)
                      const shown = expanded ? tests : tests.slice(0, VISIBLE_PER_PANEL)
                      const hidden = tests.length - shown.length
                      return (
                        <div key={panel.id} className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => togglePanel(panel)}
                            className="flex items-center gap-1.5 text-left group"
                            title="Select all tests in this panel"
                          >
                            <span
                              className={`text-xs font-bold uppercase tracking-wide ${
                                panelAllOn
                                  ? "text-[#2E37A4] dark:text-[#A5B4FC]"
                                  : "text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#2E37A4]"
                              }`}
                            >
                              ({panel.code}) {panel.name}
                            </span>
                            <span className="text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC]">
                              ({panel.tests.length})
                            </span>
                          </button>

                          <ul className="flex flex-col gap-1.5">
                            {shown.map((t, i) => {
                              const key = testKey(panel.id, t)
                              return (
                                <li key={key}>
                                  <label className="flex items-start gap-2 cursor-pointer text-sm text-[#344054] dark:text-[#CBD5E1]">
                                    <input
                                      type="checkbox"
                                      checked={selected.has(key)}
                                      onChange={() => toggleTest(key)}
                                      className="mt-0.5 h-4 w-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] focus:ring-[#2E37A4]/20 flex-shrink-0"
                                    />
                                    <span>
                                      <span className="text-[#98A2B3] dark:text-[#94A3B8] mr-1">
                                        {(expanded ? i : i) + 1}.
                                      </span>
                                      {t}
                                    </span>
                                  </label>
                                </li>
                              )
                            })}
                          </ul>

                          {!q && hidden > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPanels((p) => {
                                  const n = new Set(p)
                                  if (n.has(panel.id)) n.delete(panel.id)
                                  else n.add(panel.id)
                                  return n
                                })
                              }
                              className="self-start text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
                            >
                              {expanded ? "Show less" : `+${hidden} more`}
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
