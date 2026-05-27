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
  const pad = size === "lg" ? "px-7 py-3.5 text-sm" : "px-5 py-2.5 text-xs";
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
      className={`inline-flex items-center gap-2 rounded font-semibold uppercase tracking-widest shadow-sm transition-all hover:opacity-95 ${pad}`}
      style={{ ...style, letterSpacing: "0.1em" }}
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
        fontSize: "clamp(28px, 3.4vw, 44px)",
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
      viewBox="0 0 480 60"
      width="100%"
      height="60"
      aria-hidden="true"
    >
      <path
        d="M0 30 L80 30 L100 30 L110 10 L130 50 L150 5 L165 30 L260 30 L275 18 L290 42 L305 30 L480 30"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
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
    <div className="flex items-center gap-3.5 text-left">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center"
        style={{
          color: "var(--brand-burgundy)",
        }}
      >
        {icon}
      </div>
      <span
        className="text-[12px] font-semibold uppercase leading-snug tracking-wider"
        style={{ color: "var(--brand-ink-soft)" }}
      >
        {label}
      </span>
    </div>
  );
}
