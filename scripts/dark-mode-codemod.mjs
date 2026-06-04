/**
 * One-shot dark-mode codemod for the admin + patient dashboards.
 *
 * The portals were authored with hardcoded light-palette hex utilities
 * (`text-[#101828]`, `bg-white`, `border-[#EAECF0]`, …) and no `dark:`
 * variants, so toggling the theme only repainted <body>. This appends a
 * `dark:` sibling to each *non-variant-prefixed* neutral/brand utility so
 * surfaces, text, and borders flip with the theme.
 *
 * Deliberately conservative:
 *   - Only neutrals, structural borders, and brand-as-text/border flip.
 *   - Saturated accents (status pills, success/danger, brand BUTTON bg)
 *     are left alone — they read fine on dark and flipping them is risky.
 *   - Tokens already carrying a variant prefix (hover:, md:, dark:) are
 *     skipped to avoid clobbering the variant.
 *   - Idempotent: a token already followed by its dark sibling is skipped.
 *
 * Run:  node scripts/dark-mode-codemod.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// hex (lowercased, no #) -> dark hex, grouped by utility family.
const TEXT = {
  "101828": "F9FAFB", "141414": "F9FAFB", "0f172a": "F9FAFB", "0c111d": "F9FAFB",
  "1a1a1a": "F9FAFB", "1d2939": "E5E7EB", "101727": "F9FAFB",
  "344054": "CBD5E1", "475467": "CBD5E1", "3f3f46": "CBD5E1", "182230": "E5E7EB",
  "667085": "94A3B8", "6c7688": "94A3B8", "98a2b3": "94A3B8", "85888e": "94A3B8",
  "717680": "94A3B8", "535862": "94A3B8",
  "2e37a4": "A5B4FC", "1d246b": "A5B4FC", "1e2570": "A5B4FC",
}
const BG = {
  "ffffff": "1F2937", "fff": "1F2937",
  "f9fafb": "111827", "f2f4f7": "111827", "fafafa": "111827", "fcfcfd": "111827",
  "f5f5f5": "111827",
  "f4f5ff": "312E81", "eff8ff": "1E3A5F", "f8f9ff": "312E81",
}
const BORDER = {
  "eaecf0": "374151", "d0d5dd": "374151", "e4e7ec": "374151", "f2f4f7": "374151",
  "eef0f3": "374151", "eff1f4": "374151", "d9d9d9": "374151", "e5e7eb": "374151",
  "dcdfea": "374151", "ced2da": "374151",
}

// utility family -> hex map. ring/divide/placeholder reuse border/text maps.
const FAMILIES = [
  { prefix: "text", map: TEXT },
  { prefix: "placeholder", map: TEXT },
  { prefix: "bg", map: BG },
  { prefix: "border", map: BORDER },
  { prefix: "divide", map: BORDER },
  { prefix: "ring", map: BORDER },
]

// Named (non-hex) utilities worth flipping.
const NAMED = [
  { from: "bg-white", to: "dark:bg-[#1F2937]" },
  { from: "bg-gray-50", to: "dark:bg-[#111827]" },
  { from: "bg-gray-100", to: "dark:bg-[#111827]" },
]

function transform(src) {
  let out = src
  let count = 0

  for (const { prefix, map } of FAMILIES) {
    // Match a non-variant-prefixed arbitrary-hex utility, optional /opacity.
    // (?<![\w:-]) ensures it's not part of a variant chain (hover:, dark:, md:).
    const re = new RegExp(
      `(?<![\\w:-])${prefix}-\\[#([0-9a-fA-F]{3,8})\\](/\\d{1,3})?`,
      "g",
    )
    out = out.replace(re, (full, hex, op = "") => {
      const dark = map[hex.toLowerCase()]
      if (!dark) return full
      const darkTok = `dark:${prefix}-[#${dark}]${op}`
      // Idempotency: skip if the dark sibling is already right after.
      // (handled globally below via a second guard)
      return `${full} ${darkTok}`
    })
  }

  for (const { from, to } of NAMED) {
    const re = new RegExp(`(?<![\\w:-])${from}(?![\\w-])`, "g")
    out = out.replace(re, (full) => `${full} ${to}`)
  }

  // Collapse accidental duplicate dark siblings (idempotent re-runs).
  out = out.replace(
    /(dark:(?:text|bg|border|divide|ring|placeholder)-\[#[0-9a-fA-F]{3,8}\](?:\/\d{1,3})?)(?:\s+\1)+/g,
    "$1",
  )

  count = (out.match(/dark:/g) || []).length - (src.match(/dark:/g) || []).length
  return { out, count }
}

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, acc)
    else if (name.endsWith(".tsx")) acc.push(p)
  }
}

const ROOT = process.cwd()
const files = []
for (const d of ["app/admin/(dashboard)", "app/patient/(dashboard)"]) {
  const abs = join(ROOT, d)
  if (existsSync(abs)) walk(abs, files)
}
for (const f of [
  "components/layout/UnifiedDashboardLayout.tsx",
  "components/patient/Header.tsx",
  "components/profile/ProfileSettings.tsx",
]) {
  const abs = join(ROOT, f)
  if (existsSync(abs)) files.push(abs)
}

let total = 0
let touched = 0
for (const f of files) {
  const src = readFileSync(f, "utf8")
  const { out, count } = transform(src)
  if (out !== src) {
    writeFileSync(f, out, "utf8")
    touched++
    total += count
    console.log(`  +${count}  ${f.replace(ROOT + "/", "")}`)
  }
}
console.log(`\nDone. ${touched}/${files.length} files updated, ~${total} dark: variants added.`)
