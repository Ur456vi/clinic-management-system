"use client";

/**
 * Public-site Header — replicates the two-row header from the Figma:
 *   row 1 (cream): cursive logotype "Dr. Yuvraaj Singh M.D." | social icons | BOOK APPOINTMENT button + phone
 *   row 2 (burgundy): primary nav links centered
 *
 * Mobile collapses to a single row with a hamburger; we ship a JS-free
 * scrollable nav for the burgundy bar on small screens (the design itself
 * doesn't ship a mobile breakpoint so we just gracefully degrade).
 */
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image"

import { FacebookIcon, InstagramIcon, TwitterIcon, PhoneIcon } from "./icons";

const PHONE_DISPLAY = "+91 9266843439";
const PHONE_HREF = "tel:++919266843439";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "About" },
  { href: "/services/female-hormonal", label: "Female Health" },
  { href: "/services/mens-hormonal", label: "Men's Health" },
  { href: "/services/metabolic-health", label: "Metabolic Health" },
  { href: "/services/brain-mitochondrial", label: "Regenerative Health" },
  { href: "/services/physical-restoration", label: "PHYSICAL RESTORATION" },
  { href: "/services/aesthetic-external", label: "AESTHETIC MEDICINE" },
  // { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
  { href: "/login", label: "Login" },
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
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Find the active nav link to display as current mobile header text
  const activeLink = NAV_LINKS.find((l) => l.href === pathname);
  const currentLabel = activeLink ? activeLink.label : "Menu";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header className="top-0 z-40 w-full">
      {/* Row 1 — utility bar */}
      <div
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-1 py-3 md:px-12 relative">
          {/* Cursive logotype */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0" aria-label="Home">
            <Image
              src="/iphmh-logos.jpeg"
              alt="Dr. Yuvraaj Singh"
              width={50}
              height={50}
              priority
              style={{ width: "auto" }}
              className="h-5 sm:h-4 md:h-6 lg:h-7 xl:h-[40px] shrink-0"
            />
            <Image
              src="/dr-yuvraaj-logo.png"
              alt="Dr. Yuvraaj Singh"
              width={400}
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
        className="w-full relative"
        style={{ background: "var(--brand-burgundy)" }}
        aria-label="Primary"
      >
        {/* Desktop Nav */}
        <div className="hidden md:block">
          <ul className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-center gap-y-2 gap-x-2 px-4 py-3 md:gap-x-10 md:gap-y-0 md:px-12">
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
        </div>

        {/* Mobile Nav Header */}
        <div className="flex md:hidden items-center justify-end px-6 py-2.5">
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="text-white hover:text-white/80 p-1 cursor-pointer focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {isOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Nav Links Dropdown (Overlay - Algoborne style with white bg) */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto md:hidden"
          >
            {/* Overlay Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 shrink-0">
                <Image
                  src="/dr-yuvraaj-logo.png"
                  alt="Dr. Yuvraaj Singh"
                  width={449}
                  height={50}
                  priority
                  style={{ width: "auto" }}
                  className="h-6 shrink-0"
                />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--brand-ink)] hover:text-[var(--brand-burgundy)] p-1 cursor-pointer focus:outline-none"
                aria-label="Close Navigation"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links List */}
            <ul className="flex flex-col px-6 py-8 gap-2.5">
              {NAV_LINKS.map((l) => {
                const isActive = l.href === pathname;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setIsOpen(false)}
                      className={`block py-3 px-4 text-xs font-semibold uppercase tracking-widest transition-all duration-200 rounded-lg ${
                        isActive
                          ? "bg-[var(--brand-burgundy)]/10 text-[var(--brand-burgundy)]"
                          : "text-[var(--brand-ink)] hover:bg-black/5 hover:text-[var(--brand-burgundy)]"
                      }`}
                      style={{ letterSpacing: "0.12em" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Overlay Footer */}
            <div className="mt-auto border-t border-gray-100 px-6 pt-6 pb-10 flex flex-col gap-4 bg-white shrink-0">
              <Link
                href="/assessment"
                onClick={() => setIsOpen(false)}
                className="w-full text-center rounded py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:opacity-90 flex items-center justify-center"
                style={{
                  background: "var(--brand-burgundy)",
                  letterSpacing: "0.08em",
                }}
              >
                Request Consultation
              </Link>
              
              <a
                href={PHONE_HREF}
                className="w-full flex items-center justify-center gap-2 rounded border py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:bg-black/5"
                style={{
                  borderColor: "var(--brand-rule)",
                  color: "var(--brand-ink-soft)",
                  letterSpacing: "0.08em",
                }}
              >
                <PhoneIcon size={16} />
                {PHONE_DISPLAY}
              </a>

              {/* Social icons */}
              <div className="flex items-center justify-center gap-4 mt-2">
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
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
