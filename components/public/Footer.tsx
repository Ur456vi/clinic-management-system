/**
 * Public-site Footer. Mirrors the Figma footer:
 *   - Cursive monogram banner
 *   - 4-column link grid (Company / Our Services / Policies / Final Positioning)
 *   - Social row
 *   - Centered copyright divider
 */
import Link from "next/link";

import { InstagramIcon, LinkedInIcon, TwitterIcon } from "./icons";
import { SERVICES } from "./services-config";

const COMPANY_LINKS = [
  { href: "/about", label: "ABOUT US" },
  { href: "/services/female-hormonal", label: "SERVICES" },
  { href: "/faq", label: "FAQ'S" },
  { href: "/contact", label: "CONTACT US" },
];

const POLICY_LINKS = [
  { href: "/privacy", label: "PRIVACY POLICY" },
  { href: "/terms", label: "TERMS OF SERVICE" },
  { href: "/consumer-health-privacy", label: "CONSUMER HEALTH DATA PRIVACY POLICY" },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]"
      style={{ color: "var(--brand-burgundy)" }}
    >
      {children}
    </h3>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full py-16 md:py-24 px-4 sm:px-6 md:px-12 flex justify-center"
      style={{ background: "#FEF9EF" }}
    >
      <div
        className="w-full max-w-[1556px] rounded-[54px] border border-[#A3B18A]/20 p-8 md:p-16 flex flex-col items-stretch transition-all duration-300 hover:shadow-lg"
        style={{
          background: "#EFE8DC",
        }}
      >
        {/* Luxury Title Banner */}
        <div className="mb-16 flex items-center justify-center">
          <span
            className="text-2xl md:text-4xl uppercase tracking-[0.2em] font-medium text-center"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              color: "var(--brand-burgundy)",
            }}
          >
            Dr. Yuvraaj Singh, M.D.
          </span>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <ColumnHeading>COMPANY</ColumnHeading>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-xs transition-colors hover:opacity-85 font-sans font-medium tracking-[0.05em]"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <ColumnHeading>OUR SERVICES</ColumnHeading>
            <ul className="space-y-3">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-xs uppercase tracking-wider transition-colors hover:opacity-85 font-sans font-medium"
                    style={{
                      color: "var(--brand-ink)",
                      letterSpacing: "0.05em",
                      fontSize: "11px",
                    }}
                  >
                    {`${s.heroTitle} ${s.heroTitleAccent}`.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnHeading>POLICIES</ColumnHeading>
            <ul className="space-y-3">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-xs transition-colors hover:opacity-85 font-sans font-medium tracking-[0.05em]"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnHeading>FINAL POSITIONING</ColumnHeading>
            <p
              className="mb-5 text-sm leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Precision medicine for individuals who expect clarity, structure, and measurable outcomes from their health.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm transition-colors hover:opacity-95"
              style={{
                background: "var(--brand-burgundy)",
                letterSpacing: "0.15em",
              }}
            >
              BOOK APPOINTMENT
            </Link>
          </div>
        </div>

        {/* Social row */}
        <div className="mt-16 flex items-center justify-center gap-6">
          {[
            { Icon: InstagramIcon, href: "#", label: "Instagram" },
            { Icon: LinkedInIcon, href: "#", label: "LinkedIn" },
            { Icon: TwitterIcon, href: "#", label: "Twitter" },
          ].map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="text-[#1A1A1A] transition-opacity hover:opacity-75"
            >
              <Icon size={24} />
            </a>
          ))}
        </div>

        {/* Divider + copyright */}
        <div
          className="mt-10 border-t pt-6 text-center text-xs"
          style={{
            borderColor: "rgba(163, 177, 138, 0.2)",
            color: "var(--brand-mute)",
          }}
        >
          Copyright 2026, All Rights Reserved by Dr. Yuvraaj Singh MD
        </div>
      </div>
    </footer>
  );
}
