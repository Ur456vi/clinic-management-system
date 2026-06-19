"use client"

import Image from "next/image"

/**
 * UserAvatar — renders a profile picture if a URL is provided, otherwise
 * a colored circle with the user's initials. The background colour is
 * deterministic per name (same name → same colour) so it stays stable
 * between renders.
 */

const PALETTE = [
  "#6B2B26", // brand burgundy
  "#B53A8C",
  "#0E9384",
  "#B54708",
  "#6B2B26", // changed blue to burgundy
  "#6B2B26", // changed blue to burgundy
  "#6B2B26", // changed purple to burgundy
  "#079455",
]

function hashString(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function initialsFrom(name: string): string {
  const parts = name
    .trim()
    .replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|miss)\s+/i, "") // strip honorific
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export type UserAvatarProps = {
  /** Display name used for initials + colour. */
  name: string
  /** Optional image URL — when set, image is rendered instead of initials. */
  src?: string | null
  /** Pixel size of the avatar (square). Defaults to 36. */
  size?: number
  /** Optional className passed to the wrapper. */
  className?: string
}

export function UserAvatar({ name, src, size = 36, className = "" }: UserAvatarProps) {
  const dimension = { width: size, height: size }
  const initials = initialsFrom(name || "?")
  const bg = PALETTE[hashString(name || "?") % PALETTE.length]
  const fontSize = Math.max(11, Math.round(size * 0.4))

  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-full border border-[#EAECF0] ${className}`}
        style={dimension}
      >
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-semibold select-none ${className}`}
      style={{ ...dimension, backgroundColor: bg, fontSize }}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  )
}

export default UserAvatar
