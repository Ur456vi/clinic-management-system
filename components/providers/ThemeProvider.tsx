"use client"

/**
 * ThemeProvider — owns the user's theme preference and keeps the <html>
 * `dark` class in sync. The boot script in app/layout.tsx already
 * applied the initial theme before React mounted (no flash), so this
 * provider's only job at startup is to read the stored value, expose it
 * via context, and re-apply when the user toggles or the OS preference
 * changes.
 *
 * Usage:
 *   <ThemeProvider>{children}</ThemeProvider>      // in app/layout.tsx
 *   const { theme, resolvedTheme, setTheme } = useTheme()
 *
 * Pattern: theme is "light" | "dark" | "system" (the user's preference);
 * resolvedTheme is "light" | "dark" (what's actually painted).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  type ResolvedTheme,
  type Theme,
  applyTheme,
  prefersDark,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
} from "@/lib/theme"

type ThemeContextValue = {
  /** The user's stored preference. */
  theme: Theme
  /** What we're actually rendering — derived from theme + OS. */
  resolvedTheme: ResolvedTheme
  /** Set the preference (persists to localStorage). */
  setTheme: (theme: Theme) => void
  /** Cycle: light → dark → system → light. Used by the toggle button. */
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light")

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const stored = readStoredTheme()
    setThemeState(stored)
    const resolved = resolveTheme(stored)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  // Re-resolve when the user toggles or when the OS preference flips (only
  // matters when theme === "system").
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const next: ResolvedTheme = mq.matches ? "dark" : "light"
      setResolvedTheme(next)
      applyTheme(next)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    writeStoredTheme(next)
    const resolved = next === "system" ? (prefersDark() ? "dark" : "light") : next
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  const cycleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")
  }, [theme, setTheme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
    [theme, resolvedTheme, setTheme, cycleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Safe fallback for non-provider trees (Storybook, tests, prerender).
    return {
      theme: "system",
      resolvedTheme: "light",
      setTheme: () => {},
      cycleTheme: () => {},
    }
  }
  return ctx
}
