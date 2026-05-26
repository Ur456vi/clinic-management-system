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
  { href: "/about", label: "About Us" },
  { href: "/services/female-hormonal", label: "Services" },
  { href: "/faq", label: "FAQ's" },
  { href: "/contact", label: "Contact Us" },
];

const POLICY_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/consumer-health-privacy", label: "Consumer Health Data Privacy Policy" },
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
      className="w-full"
      style={{ background: "var(--brand-cream)" }}
    >
      <div
        className="mx-auto max-w-[1440px] px-6 pb-10 pt-16 md:px-12"
      >
        {/* Monogram banner */}
        <div
          className="mb-12 flex items-center justify-center border-b pb-10"
          style={{ borderColor: "var(--brand-rule)" }}
        >
          <span
            className="text-3xl md:text-5xl"
            style={{
              fontFamily: "var(--font-script)",
              color: "var(--brand-rule)",
              letterSpacing: "0.05em",
            }}
          >
            Dr. Yuvraaj Singh, M.D.
          </span>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <ColumnHeading>Company</ColumnHeading>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <ColumnHeading>Our Services</ColumnHeading>
            <ul className="space-y-3">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-sm uppercase tracking-wider transition-colors hover:underline"
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
            <ColumnHeading>Policies</ColumnHeading>
            <ul className="space-y-3">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnHeading>Final Positioning</ColumnHeading>
            <p
              className="mb-5 text-sm leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Precision medicine for individuals who expect clarity, structure, and measurable outcomes from their health.
            </p>
            <Link
              href="/assessment"
              className="inline-block rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition-colors hover:opacity-95"
              style={{
                background: "var(--brand-burgundy)",
                letterSpacing: "0.12em",
              }}
            >
              Book Appointment
            </Link>
          </div>
        </div>

        {/* Social row */}
        <div className="mt-12 flex items-center justify-center gap-5">
          {[
            { Icon: InstagramIcon, href: "#", label: "Instagram" },
            { Icon: LinkedInIcon, href: "#", label: "LinkedIn" },
            { Icon: TwitterIcon, href: "#", label: "Twitter" },
          ].map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="transition-colors hover:opacity-70"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              <Icon size={18} />
            </a>
          ))}
        </div>

        {/* Divider + copyright */}
        <div
          className="mt-8 border-t pt-6 text-center text-xs"
          style={{
            borderColor: "var(--brand-rule)",
            color: "var(--brand-mute)",
          }}
        >
          Copyright {new Date().getFullYear()}, All Rights Reserved by Dr. Yuvraaj Singh MD
        </div>
      </div>
    </footer>
  );
}
