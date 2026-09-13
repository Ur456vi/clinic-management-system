"use client"

/**
 * Admin → Settings → Lab Integration → Map tests.
 *
 * Points each clinic test at the Mahajan product that fulfils it. None of our
 * ~93 test names matches any of theirs, so automatic name matching resolves
 * nothing and every prescribed test is unmapped — which blocks booking. These
 * curated mappings are the only bridge.
 *
 * MANY of our tests normally point at ONE partner product: their catalogue is
 * bundled panels, ours is individual tests. Hence the per-panel bulk setter —
 * mapping 93 rows one at a time would be unusable, and a whole panel usually
 * resolves to a single product anyway.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { TEST_CATALOG, testKey, TOTAL_TEST_COUNT } from "@/lib/test-catalog"

type Product = { labTestId: string; testName: string }
/** testKey → partner product id. Absent or "" means not sent to Mahajan. */
type MapState = Record<string, string>

const UNMAPPED = ""

export default function LabTestMappingsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [saved, setSaved] = useState<MapState>({})
  const [draft, setDraft] = useState<MapState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/lab/test-mappings", { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as {
        data: { products: Product[]; mappings: MapState }
      }
      setProducts(data.products)
      setSaved(data.mappings)
      setDraft(data.mappings)
    } catch (err) {
      notify.error("Couldn't load mappings", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  /** Only what changed is sent — a no-op save must write nothing. */
  const changed = useMemo(() => {
    const keys = new Set([...Object.keys(saved), ...Object.keys(draft)])
    const out: { testKey: string; labTestId: string }[] = []
    keys.forEach((k) => {
      const before = saved[k] ?? UNMAPPED
      const after = draft[k] ?? UNMAPPED
      if (before !== after) out.push({ testKey: k, labTestId: after })
    })
    return out
  }, [saved, draft])

  const mappedCount = useMemo(
    () => Object.values(draft).filter((v) => v && v !== UNMAPPED).length,
    [draft],
  )

  const setOne = (key: string, labTestId: string) =>
    setDraft((d) => ({ ...d, [key]: labTestId }))

  const setPanel = (keys: string[], labTestId: string) =>
    setDraft((d) => {
      const next = { ...d }
      keys.forEach((k) => {
        next[k] = labTestId
      })
      return next
    })

  const save = async () => {
    if (changed.length === 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/lab/test-mappings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: changed }),
      })
      const json = (await res.json()) as {
        data?: { saved: number; removed: number }
        error?: { message?: string }
      }
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
      notify.success("Mappings saved", {
        description: `${json.data?.saved ?? 0} mapped, ${json.data?.removed ?? 0} cleared.`,
      })
      setSaved(draft)
    } catch (err) {
      notify.error("Couldn't save mappings", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Loading test mappings…</p>
      </div>
    )
  }

  const noProducts = products.length === 0

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-5 pb-24">
      <div>
        <Link
          href="/admin/settings?tab=lab-integration"
          className="inline-flex items-center gap-1.5 text-sm text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F9FAFB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Lab Integration
        </Link>
        <h1 className="text-lg font-semibold text-[#101828] dark:text-[#F9FAFB] mt-2">
          Map tests to Mahajan codes
        </h1>
        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1 max-w-3xl">
          Mahajan can only act on their own product codes. Point each test the doctor can
          prescribe at the product that fulfils it — several of ours usually map to one of
          theirs. Anything left unmapped is not sent, and an order containing only unmapped
          tests cannot be booked.
        </p>
      </div>

      {noProducts ? (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium"
          style={{ background: "#FDECEC", color: "#B4322B" }}
        >
          No partner catalogue yet. Run <b>Sync tests</b> on the Lab Integration screen
          first — there is nothing to map to until it has been pulled.
        </div>
      ) : null}

      {TEST_CATALOG.map((category) => (
        <section
          key={category.id}
          className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827]">
            <h2 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
              {category.title}
            </h2>
          </div>

          {category.panels.map((panel) => {
            const keys = panel.tests.map((t) => testKey(panel.id, t))
            return (
              <div key={panel.id} className="border-b border-[#EAECF0] dark:border-[#374151] last:border-b-0">
                <div className="px-5 py-3 flex flex-wrap items-center gap-3 justify-between bg-[#FCFCFD] dark:bg-[#1A2232]">
                  <span className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">
                    {panel.code}. {panel.name}
                    <span className="ml-2 text-xs font-normal text-[#667085] dark:text-[#94A3B8]">
                      {panel.tests.length} test{panel.tests.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <label className="flex items-center gap-2 text-xs text-[#667085] dark:text-[#94A3B8]">
                    <Wand2 className="h-3.5 w-3.5" />
                    Set whole panel
                    <select
                      value=""
                      disabled={noProducts}
                      onChange={(e) => {
                        if (e.target.value === "") return
                        setPanel(keys, e.target.value === "__clear" ? UNMAPPED : e.target.value)
                        e.target.value = ""
                      }}
                      className={selectCls}
                    >
                      <option value="">Choose…</option>
                      {products.map((p) => (
                        <option key={p.labTestId} value={p.labTestId}>
                          {p.testName}
                        </option>
                      ))}
                      <option value="__clear">— Clear all —</option>
                    </select>
                  </label>
                </div>

                <ul>
                  {panel.tests.map((name) => {
                    const key = testKey(panel.id, name)
                    const value = draft[key] ?? UNMAPPED
                    const dirty = (saved[key] ?? UNMAPPED) !== value
                    return (
                      <li
                        key={key}
                        className="px-5 py-2.5 flex flex-wrap items-center gap-3 justify-between border-t border-[#F2F4F7] dark:border-[#2B3444]"
                      >
                        <span className="text-sm text-[#344054] dark:text-[#CBD5E1] flex-1 min-w-[220px]">
                          {name}
                          {dirty ? (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-[#B4651B]">
                              unsaved
                            </span>
                          ) : null}
                        </span>
                        <select
                          value={value}
                          disabled={noProducts}
                          onChange={(e) => setOne(key, e.target.value)}
                          className={selectCls}
                        >
                          <option value={UNMAPPED}>Not sent to Mahajan</option>
                          {products.map((p) => (
                            <option key={p.labTestId} value={p.labTestId}>
                              {p.testName}
                            </option>
                          ))}
                        </select>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </section>
      ))}

      {/* Sticky so Save is reachable without scrolling back up through 93 rows. */}
      <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-gradient-to-t from-[#F9FAFB] dark:from-[#111827] via-[#F9FAFB] dark:via-[#111827] to-transparent">
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl px-5 py-3 flex flex-wrap items-center gap-4 justify-between shadow-sm">
          <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
            <b className="text-[#101828] dark:text-[#F9FAFB] tabular-nums">{mappedCount}</b> of{" "}
            <span className="tabular-nums">{TOTAL_TEST_COUNT}</span> tests mapped
            {changed.length > 0 ? (
              <span className="ml-2 text-[#B4651B]">· {changed.length} unsaved</span>
            ) : null}
          </span>
          <Button onClick={save} disabled={saving || changed.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save mappings"}
          </Button>
        </div>
      </div>
    </div>
  )
}

const selectCls =
  "h-9 px-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26] disabled:opacity-50 max-w-[280px]"
