/**
 * Public-site Footer. Mirrors the Figma footer:
 *   - Stylized monogram banner
 *   - 4-column link grid (Company / Our Services / Policies / Final Positioning)
 *   - Social row with circular backgrounds
 *   - Centered copyright divider
 */
import Link from "next/link";
import Image from "next/image"

import { InstagramIcon, LinkedInIcon, TwitterIcon } from "./icons";
import { SERVICES } from "./services-config";

const COMPANY_LINKS = [
  { href: "/about", label: "ABOUT US" },
  // { href: "/services/female-hormonal", label: "SERVICES" },
  { href: "/faq", label: "FAQ'S" },
  { href: "/contact", label: "CONTACT US" },
];

const POLICY_LINKS = [
  { href: "/privacy", label: "PRIVACY POLICY" },
  // { href: "/terms", label: "TERMS OF SERVICE" },
  // { href: "/consumer-health-privacy", label: "CONSUMER HEALTH DATA PRIVACY POLICY" },
];

function ColumnHeading({ children, isSerif = false }: { children: React.ReactNode; isSerif?: boolean }) {
  return (
    <h3
      className={`mb-6 text-[14px] ${isSerif ? 'font-serif text-[#1F1F1F] font-medium tracking-normal text-[18px]' : 'font-bold uppercase tracking-wider text-[#1F1F1F]'}`}
    >
      {children}
    </h3>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full py-12 md:py-20 px-4 sm:px-6 md:px-12 flex justify-center bg-[#EBE9E0]"
    >
      <div
        className="w-full max-w-[1440px] rounded-[48px] p-10 md:p-16 flex flex-col items-stretch bg-[#FAF8F3] shadow-sm"
      >
        {/* Luxury Title Banner */}
        <div className="mb-20 flex items-center justify-start md:justify-start">
          {/* We use a thin, ultra-wide sans font styling to approximate the custom brand mark */}
          <Image
              src="/dr-yuvraaj-logo.png"
              alt="Dr. Yuvraaj Singh"
              width={539}
              height={60}
              priority
            />
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          
          {/* COMPANY */}
          <div className="md:col-span-2">
            <ColumnHeading>COMPANY</ColumnHeading>
            <ul className="space-y-4">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[13px] transition-colors hover:opacity-75 font-medium tracking-wide text-[#333333]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* OUR SERVICES */}
          <div className="md:col-span-4 lg:col-span-4">
            <ColumnHeading>OUR SERVICES</ColumnHeading>
            <ul className="space-y-4">
  {SERVICES.map((s) => (
    <li key={s.slug} className="flex items-center gap-2">
      <span className="text-[#333333]">•</span>

      <Link
        href={`/services/${s.slug}`}
        className="text-[12px] md:text-[13px] uppercase tracking-wide transition-colors hover:opacity-75 font-medium text-[#333333] leading-snug"
      >
        {`${s.heroTitle} ${s.heroTitleAccent}`.toUpperCase()}
      </Link>
    </li>
  ))}
</ul>
          </div>

          {/* POLICIES */}
          <div className="md:col-span-3">
            <ColumnHeading>POLICIES</ColumnHeading>
            <ul className="space-y-4">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[13px] transition-colors hover:opacity-75 font-medium tracking-wide text-[#333333] leading-snug block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* FINAL POSITIONING */}
          <div className="md:col-span-3">
            <ColumnHeading isSerif>FINAL POSITIONING</ColumnHeading>
            <p
              className="mb-8 text-[13px] leading-relaxed font-medium text-[#333333]"
            >
              Precision medicine for individuals who expect clarity, structure, and measurable outcomes from their health.
            </p>
            <Link
              href="/assessment"
              className="inline-block rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#421A17] bg-[#722F27]"
            >
              Request Consultation
            </Link>
          </div>
        </div>

        {/* Social row */}
        <div className="mt-20 flex items-center justify-center gap-4">
          {[
            { Icon: InstagramIcon, href: "#", label: "Instagram" },
            { Icon: LinkedInIcon, href: "#", label: "LinkedIn" },
            { Icon: TwitterIcon, href: "#", label: "Twitter" },
          ].map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5E2D9] text-[#1A1A1A] transition-opacity hover:opacity-75"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>

        {/* Divider + copyright */}
        <div className="mt-8 flex flex-col items-center">
          <hr className="w-full max-w-[90%] border-t border-[#D9D5C8] mb-6" />
          <p className="text-[11px] font-medium text-[#666666]">
            Copyright 2026, All Right Reserved by Dr. Yuvraaj Singh MD
          </p>
        </div>
      </div>
    </footer>
  );
}
