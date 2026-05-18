/**
 * Theme primitives shared between the boot script, the ThemeProvider, and
 * any non-React caller that wants to read or set the theme.
 *
 * Why this lives in lib/ and not in the provider:
 * - The boot script in app/layout.tsx <head> needs to apply the theme
 *   BEFORE React hydrates, otherwise users see a light-mode flash on
 *   load. That script reads the same localStorage key + applies the
 *   same `.dark` class to <html>, so the contract has to be in one
 *   place to stay in sync.
 * - Server-side rendering must not throw — guard every window/document
 *   reference.
 */

export type Theme = "light" | "dark" | "system"

export const THEME_STORAGE_KEY = "vyara-theme"

/** What we actually paint on screen — resolved from `Theme` + OS preference. */
export type ResolvedTheme = "light" | "dark"

/**
 * Read the persisted theme from localStorage. Falls back to "system" if
 * nothing is stored or storage is unavailable (private mode, SSR).
 */
export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw === "light" || raw === "dark" || raw === "system") return raw
  } catch {
    // localStorage blocked (e.g. Safari private mode) — fall through.
  }
  return "system"
}

export function writeStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage blocked — theme still applies for this session.
  }
}

export function prefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return prefersDark() ? "dark" : "light"
  return theme
}

/**
 * Apply the resolved theme to the root <html> element. Idempotent.
 * Safe to call from both the boot script and the provider.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
}

/**
 * The boot script body — runs synchronously in <head> before React mounts.
 * Kept as a string so app/layout.tsx can drop it via dangerouslySetInnerHTML
 * without bundling a separate file. Touch this carefully: any error here
 * blocks first paint.
 */
export const THEME_BOOT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`.trim()
