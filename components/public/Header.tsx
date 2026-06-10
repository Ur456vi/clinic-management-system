/**
 * Public-site Header — replicates the two-row header from the Figma:
 *   row 1 (cream): cursive logotype "Dr. Yuvraaj Singh M.D." | social icons | BOOK APPOINTMENT button + phone
 *   row 2 (burgundy): primary nav links centered
 *
 * Mobile collapses to a single row with a hamburger; we ship a JS-free
 * scrollable nav for the burgundy bar on small screens (the design itself
 * doesn't ship a mobile breakpoint so we just gracefully degrade).
 */
import Link from "next/link";
import Image from "next/image"

import { FacebookIcon, InstagramIcon, TwitterIcon, PhoneIcon } from "./icons";

const PHONE_DISPLAY = "+91 9266843439";
const PHONE_HREF = "tel:++919266843439";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "About" },
  { href: "/services/mens-hormonal", label: "Men's Health" },
  { href: "/services/female-hormonal", label: "Female Health" },
  { href: "/services/metabolic-health", label: "Metabolic Health" },
  { href: "/services/brain-mitochondrial", label: "Regenerative Health" },
  // { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
];

function SocialBubble({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:opacity-90"
      style={{ background: "var(--brand-burgundy)" }}
    >
      {children}
    </a>
  );
}

export default function Header() {
  return (
    <header className="top-0 z-40 w-full">
      {/* Row 1 — utility bar */}
      <div
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 md:px-12 relative">
          {/* Cursive logotype */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0" aria-label="Home">
            <Image
              src="/dr-yuvraaj-logo.png"
              alt="Dr. Yuvraaj Singh"
              width={449}
              height={50}
              priority
              style={{ width: "auto" }}
              className="h-5 sm:h-6 md:h-8 lg:h-10 xl:h-[50px] shrink-0"
            />
          </Link>

          {/* Center socials */}
          <div className="hidden items-center gap-3 md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 z-10">
            <SocialBubble href="#" label="Facebook">
              <FacebookIcon size={16} />
            </SocialBubble>
            <SocialBubble href="#" label="Instagram">
              <InstagramIcon size={16} />
            </SocialBubble>
            <SocialBubble href="#" label="Twitter">
              <TwitterIcon size={16} />
            </SocialBubble>
          </div>

          {/* Right side CTA + phone */}
          <div className="flex items-center gap-2 md:gap-4 z-20">
            <Link
              href="/assessment"
              className="rounded px-3 py-1.5 md:px-5 md:py-2.5 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:opacity-95 shrink-0"
              style={{
                background: "var(--brand-burgundy)",
                letterSpacing: "0.08em",
              }}
            >
              Request Consultation
            </Link>
            <a
              href={PHONE_HREF}
              className="hidden items-center gap-2 rounded border px-4 py-2 text-sm font-medium transition-colors lg:flex shrink-0"
              style={{
                borderColor: "var(--brand-rule)",
                color: "var(--brand-ink-soft)",
              }}
            >
              <PhoneIcon size={16} />
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      {/* Row 2 — burgundy primary nav */}
      <nav
        className="w-full"
        style={{ background: "var(--brand-burgundy)" }}
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-y-2 gap-x-4 px-6 py-3 md:gap-x-10 md:gap-y-0 md:px-12">
          {NAV_LINKS.map((l) => (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                className="text-xs font-medium uppercase tracking-widest text-white/95 transition-colors hover:text-white"
                style={{ letterSpacing: "0.12em" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
