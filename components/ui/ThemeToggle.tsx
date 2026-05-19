"use client"

/**
 * ThemeToggle — circular icon button that cycles light → dark → system.
 * Drop-in replacement for the dead Moon icons in the admin + patient
 * headers.
 *
 * - Renders Sun in light mode, Moon in dark mode, Monitor in system mode
 * - aria-label changes to describe the next action ("Switch to dark mode")
 * - Title tooltip shows the current state
 * - Size + className props let consumers match their header chrome
 */

import { Monitor, Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/providers/ThemeProvider"

type ThemeToggleProps = {
  className?: string
  /** Icon size in px. Defaults to 20. */
  iconSize?: number
}

export function ThemeToggle({
  className,
  iconSize = 20,
}: ThemeToggleProps) {
  const { theme, cycleTheme } = useTheme()

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor
  const nextLabel =
    theme === "light"
      ? "Switch to dark mode"
      : theme === "dark"
        ? "Switch to system theme"
        : "Switch to light mode"
  const stateLabel =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"

  const baseClasses =
    "inline-flex items-center justify-center rounded-full text-[#6C7688] hover:bg-[#F9FAFB] hover:text-[#101828] dark:text-[#94A3B8] dark:hover:bg-[#1F2937] dark:hover:text-white transition-colors cursor-pointer"

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={nextLabel}
      title={`${stateLabel} theme — click to ${nextLabel.toLowerCase()}`}
      className={className ?? `${baseClasses} w-10 h-10`}
    >
      <Icon style={{ width: iconSize, height: iconSize }} />
    </button>
  )
}

export default ThemeToggle
