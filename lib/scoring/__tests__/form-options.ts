import { readFileSync } from "node:fs"
import { join } from "node:path"

const FORM_PATH = join(
  process.cwd(),
  "app/admin/(dashboard)/appointments/[id]/consultation/page.tsx",
)

/**
 * Read the real option values out of the RMO consultation form.
 *
 * This is the whole point of the config-integrity suite: a rule whose `map` key
 * does not match a value the form can actually store scores that answer zero
 * forever, silently. Defects B-1 and B-2 were exactly this shape, and both
 * would have been caught here.
 */
export function formOptionValues(): Map<string, Set<string>> {
  const src = readFileSync(FORM_PATH, "utf8")
  const byField = new Map<string, Set<string>>()
  const add = (field: string, value: string) => {
    if (value === "") return
    const set = byField.get(field) ?? new Set<string>()
    set.add(value.trim().replace(/\s+/g, " ").toLowerCase())
    byField.set(field, set)
  }

  for (const m of src.matchAll(/<select name="([^"]+)"[\s\S]*?<\/select>/g)) {
    for (const o of m[0].matchAll(/<option value="([^"]*)"/g)) add(m[1], o[1])
  }
  // Radio and checkbox groups share a name; each input carries one value.
  for (const m of src.matchAll(/<input\b[^>]*?>/g)) {
    const name = m[0].match(/name="([^"]+)"/)?.[1]
    const value = m[0].match(/\bvalue="([^"]*)"/)?.[1]
    if (name && value !== undefined) add(name, value)
  }
  return byField
}

/**
 * Controls whose `name` or option values are built at render time, so a static
 * read of the file cannot enumerate them. Rules against these fields skip the
 * option-value check; the values are asserted separately in `config.test.ts`.
 */
export const DYNAMIC_NAME_FIELDS = new Set(
  Array.from({ length: 10 }, (_, i) => `personal_history__pss10_q${i + 1}`),
)

/** Checkbox groups whose values come from a mapped array literal. */
export const DYNAMIC_OPTION_FIELDS = new Set([
  "personal_history__mood",
  "personal_history__parasomnias_select_all_that_apply",
  "personal_history__bowel_early_satiety",
  "personal_history__bowel_burning_sensation",
  "personal_history__bowel_bloating",
  "personal_history__bowel_others",
  "personal_history__bladder_others",
])
