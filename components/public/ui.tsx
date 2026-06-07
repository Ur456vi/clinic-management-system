/**
 * Reusable atoms for the public site. Pure presentational components — no
 * data dependencies. Aliased into pages via @/components/public/ui.
 */
import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, QuoteIcon } from "./icons";

/* ----- Buttons ---------------------------------------------------------- */

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "olive" | "burgundy" | "burgundy-outline" | "olive-outline";
  size?: "md" | "lg";
  showArrow?: boolean;
};

export function CTAButton({
  href,
  children,
  variant = "burgundy",
  size = "md",
  showArrow = true,
}: ButtonProps) {
  const pad = size === "lg" ? "px-7 py-3.5 text-base" : "px-6 py-3 text-sm";
  const style: React.CSSProperties =
    variant === "olive"
      ? { background: "var(--brand-olive)", color: "white" }
      : variant === "burgundy"
        ? { background: "var(--brand-burgundy)", color: "white" }
        : variant === "olive-outline"
          ? {
              background: "transparent",
              color: "var(--brand-olive)",
              border: "1.5px solid var(--brand-olive)",
            }
          : {
              background: "transparent",
              color: "var(--brand-burgundy)",
              border: "1.5px solid var(--brand-burgundy)",
            };

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-all hover:opacity-95 min-w-[240px] ${pad}`}
      style={{ ...style }}
    >
      {children}
      {showArrow && <ArrowRightIcon size={14} />}
    </Link>
  );
}

/* ----- Section heading -------------------------------------------------- */

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 text-xs font-semibold uppercase tracking-[0.22em]"
      style={{ color: "var(--brand-burgundy)" }}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  children,
  align = "left",
  accent,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  accent?: React.ReactNode;
}) {
  return (
    <h2
      className={`font-medium leading-tight ${align === "center" ? "text-center" : ""}`}
      style={{
        fontFamily: "var(--font-display)",
        color: "var(--brand-ink)",
        fontSize: "clamp(28px, 3.4vw, 36px)",
      }}
    >
      {children}
      {accent ? (
        <span style={{ color: "var(--brand-burgundy)" }}> {accent}</span>
      ) : null}
    </h2>
  );
}

/* ----- Quote card (the olive/sage callout used throughout) -------------- */

export function QuoteCard({
  text,
  cite,
  variant = "olive",
}: {
  text: string;
  cite?: string;
  variant?: "olive" | "cream";
}) {
  const bg =
    variant === "olive" ? "var(--brand-olive-soft)" : "var(--brand-cream-2)";
  return (
    <aside
      className="relative rounded-lg p-6"
      style={{ background: bg }}
    >
      <QuoteIcon
        size={22}
        style={{ color: "var(--brand-burgundy)", opacity: 0.8 }}
      />
      <p
        className="mt-3 text-base italic leading-relaxed"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--brand-ink)",
          fontStyle: "italic",
        }}
      >
        {text}
      </p>
      {cite ? (
        <p
          className="mt-4 text-sm font-medium"
          style={{ color: "var(--brand-burgundy)" }}
        >
          – {cite}
        </p>
      ) : null}
    </aside>
  );
}

/* ----- Honeycomb / botanical hero backdrop ------------------------------ */

export function HeroPattern({
  className,
  opacity = 0.18,
}: {
  className?: string;
  opacity?: number;
}) {
  // Tessellated hexagon pattern in a faint burgundy tint, applied behind the
  // doctor portrait. Pure SVG so it scales crisply.
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="hex" width="40" height="46" patternUnits="userSpaceOnUse">
          <polygon
            points="20,2 38,12 38,34 20,44 2,34 2,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

/* ----- ECG / heart-rhythm line ------------------------------------------ */

export function EcgLine({
  className,
  color = "var(--brand-olive)",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 120"
      width="100%"
      height="120"
      aria-hidden="true"
    >
      <path
        d="
          M0 60
          L80 60

          C90 60, 100 40, 115 40
          C125 40, 135 60, 145 60

          L190 60

          L205 75
          L215 90

          L240 10
          L265 95
          L280 60

          L340 60

          C360 60, 380 20, 420 20
          C450 20, 470 60, 495 60

          C510 60, 525 50, 540 50
          C555 50, 565 60, 575 60

          L600 60
        "
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ----- Image components ------------------------------------------------- */

/**
 * Render a real photo extracted from the Figma file.
 *
 * `src` is the absolute path inside /public (e.g. "/images/landing/home-hero-doctor.jpg").
 * `aspect` controls the wrapper's aspectRatio so the image area reserves
 * space before the photo loads — important for layout-shift prevention.
 */
export function FigmaImage({
  src,
  alt,
  aspect = "portrait",
  className,
  priority,
  fit = "cover",
  position = "center",
}: {
  src: string;
  alt: string;
  aspect?: "portrait" | "landscape" | "square" | "tall" | "wide";
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  position?: string;
}) {
  const ratio =
    aspect === "portrait"
      ? "3 / 4"
      : aspect === "square"
        ? "1 / 1"
        : aspect === "tall"
          ? "2 / 3"
          : aspect === "wide"
            ? "21 / 9"
            : "16 / 9";
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className ?? ""}`}
      style={{ aspectRatio: ratio, background: "var(--brand-cream-2)" }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        style={{ objectFit: fit, objectPosition: position }}
      />
    </div>
  );
}

/**
 * Sepia-toned placeholder. Kept as a fallback for any image slot that
 * doesn't yet have a Figma export.
 */
export function PortraitPlaceholder({
  label,
  aspect = "portrait",
  className,
}: {
  label: string;
  aspect?: "portrait" | "landscape" | "square";
  className?: string;
}) {
  const ratio =
    aspect === "portrait" ? "3 / 4" : aspect === "square" ? "1 / 1" : "16 / 9";
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className ?? ""}`}
      style={{
        aspectRatio: ratio,
        background:
          "linear-gradient(135deg, #C9B89D 0%, #B59D7E 35%, #8E7757 70%, #6B563B 100%)",
      }}
    >
      <HeroPattern
        className="absolute inset-0 h-full w-full"
        opacity={0.22}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span
          className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90"
        >
          Image
        </span>
        <span className="mt-2 max-w-[80%] text-xs font-medium text-white/90">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ----- Stat tile (small icon + label below hero) ------------------------ */

export function StatTile({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-2">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: "var(--brand-cream-2)",
          color: "var(--brand-burgundy)",
        }}
      >
        {icon}
      </div>

      <p
        className="text-sm leading-snug font-medium"
        style={{ color: "var(--brand-ink-soft)" }}
      >
        {label}
      </p>
    </div>
  );
}
