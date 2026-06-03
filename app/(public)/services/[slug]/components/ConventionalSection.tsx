import React from "react";
import { EcgLine, SectionHeading } from "@/components/public/ui";
import { XCircleIcon, ArrowRightIcon, CheckCircleIcon } from "@/components/public/icons";
import { type ServiceContent } from "@/components/public/services-config";
import { ResolvedIcon } from "@/components/public/icon-resolver";

export function ConventionalSection({ svc }: { svc: ServiceContent }) {
  const c = svc.conventionalSection!;

  if (svc.slug === "metabolic-health") {
    return null; // Integrated into the SymptomsSection
  }

  if (svc.slug === "aesthetic-external") {
    const a = svc.approachSection!;
    const bodyParts = c.callout.body.split(". ");
    const firstParagraph = bodyParts[0] + (bodyParts[0].endsWith(".") ? "" : ".");
    const secondParagraph = bodyParts.slice(1).join(". ");
    return (
      <section className="w-full bg-[var(--brand-cream)] font-sans">
        <div className="mx-auto max-w-[1440px] px-6 pt-4 pb-4 md:px-12 md:pt-6 md:pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Side: Highlights Container (col-span-7) */}
            <div className="lg:col-span-7 border border-[#B3D6E6] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              
              {/* Left Sub-section: Highlighted light blue container */}
              <div className="w-full md:w-[60%] bg-[#F0F6F9] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
                {/* Subtle Leaf SVG at bottom-left */}
                <div className="absolute left-[4%] bottom-[4%] z-0 pointer-events-none opacity-20" aria-hidden="true">
                  <svg width="60" height="150" viewBox="0 0 70 180" fill="none">
                    <path
                      d="M50 180 Q48 150 44 125 Q38 95 28 70 Q20 48 14 20"
                      stroke="#7A8C6A"
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M44 128 Q60 118 66 100 Q52 96 44 110 Q43 120 44 128 Z"
                      fill="#8A9E76"
                      stroke="#6E845A"
                      strokeWidth="0.7"
                      fillOpacity="0.3"
                    />
                    <path d="M44 128 Q54 112 66 100" stroke="#6E845A" strokeWidth="0.35" fill="none" opacity="0.45" />
                    <path
                      d="M32 88 Q14 80 8 62 Q22 58 32 72 Q33 80 32 88 Z"
                      fill="#8A9E76"
                      stroke="#6E845A"
                      strokeWidth="0.7"
                      fillOpacity="0.3"
                    />
                    <path d="M32 88 Q20 74 8 62" stroke="#6E845A" strokeWidth="0.35" fill="none" opacity="0.45" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <h2 className="font-serif text-2xl md:text-[28px] leading-snug text-neutral-950 font-normal">
                      {c.title}
                    </h2>
                    {/* Paragraph spans full width */}
                    <p className="mt-4 text-[14px] leading-relaxed text-neutral-950">
                      {c.body}
                    </p>
                  </div>
                  
                  {/* Key points below paragraph text, aligned to the right side */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left spacer */}
                    <div className="hidden md:block md:col-span-6" />
                    
                    {/* Right: 6 Key points list */}
                    <div className="md:col-span-6 flex flex-col gap-3">
                      {c.failures.map((f) => (
                        <div key={f.label} className="flex items-center gap-3">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E1EDF2] text-[#4E5C46]">
                            <CheckCircleIcon size={14} className="text-[#687C59]" />
                          </div>
                          <span className="text-[14px] font-semibold text-neutral-900">
                            {f.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Sub-section: White container */}
              <div className="w-full md:w-[40%] bg-white p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#B3D6E6] relative overflow-hidden">
                {/* Leaf SVG at bottom-right */}
                <div className="absolute right-[4%] bottom-[4%] z-0 pointer-events-none opacity-25" aria-hidden="true">
                  <svg width="70" height="180" viewBox="0 0 70 180" fill="none" className="rotate-12">
                    <path
                      d="M50 180 Q48 150 44 125 Q38 95 28 70 Q20 48 14 20"
                      stroke="#7A8C6A"
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M44 128 Q60 118 66 100 Q52 96 44 110 Q43 120 44 128 Z"
                      fill="#8A9E76"
                      stroke="#6E845A"
                      strokeWidth="0.7"
                      fillOpacity="0.3"
                    />
                    <path d="M44 128 Q54 112 66 100" stroke="#6E845A" strokeWidth="0.35" fill="none" opacity="0.45" />
                    <path
                      d="M32 88 Q14 80 8 62 Q22 58 32 72 Q33 80 32 88 Z"
                      fill="#8A9E76"
                      stroke="#6E845A"
                      strokeWidth="0.7"
                      fillOpacity="0.3"
                    />
                    <path d="M32 88 Q20 74 8 62" stroke="#6E845A" strokeWidth="0.35" fill="none" opacity="0.45" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="font-serif text-2xl md:text-[28px] leading-snug text-[var(--brand-burgundy)] font-normal">
                      {c.callout.title}
                    </h3>
                    
                    {/* First paragraph immediately below the title */}
                    <p className="mt-6 text-[14px] leading-relaxed text-neutral-950 font-semibold">
                      {firstParagraph}
                    </p>
                    
                    {/* Centered or left-aligned pink horizontal line separator */}
                    <hr className="my-6 w-12 border-t-[1.5px] border-[var(--brand-burgundy)] opacity-30" />
                    
                    {/* Second paragraph below the line */}
                    <p className="text-[14px] leading-relaxed text-neutral-950">
                      {secondParagraph}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: Plain White/Cream list (col-span-5) */}
            <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl p-8 md:p-10 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div>
                <h3 className="font-serif text-xl md:text-[22px] leading-snug text-neutral-950 font-normal mb-8">
                  {a.title}
                </h3>
                <div className="flex flex-col gap-4">
                  {a.steps.map((step) => (
                    <div key={step.title} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EBF0E6] text-[#4E5C46] mt-0.5">
                        <CheckCircleIcon size={14} className="text-[#687C59]" />
                      </div>
                      <span className="text-[14px] font-semibold leading-tight text-neutral-900 lg:whitespace-nowrap">
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    );
  }

  if (svc.slug === "female-hormonal") {
    return (
      <section className="relative flex w-full flex-col overflow-hidden md:flex-row">
        {/* Background halves */}
        <div className="absolute inset-y-0 left-0 w-full bg-[var(--brand-cream)] md:w-1/2" />
        <div className="absolute inset-y-0 right-0 w-full bg-[var(--brand-olive)] md:w-1/2" />
        
        {/* Center bridge arrow (desktop only) */}
        <div
          className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-[var(--brand-cream)] md:flex"
          style={{ width: "40px", height: "40px", borderColor: "var(--brand-olive)", color: "var(--brand-olive)" }}
        >
          <ArrowRightIcon size={18} />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 md:grid-cols-2">
          {/* Left Side */}
          <div className="flex flex-col items-center px-6 pb-10 pt-16 text-center md:px-12 md:pb-12 md:pt-16">
            <h2 className="font-serif text-3xl text-[var(--brand-ink)] md:text-[34px] md:leading-[1.1]">
              {c.title}
            </h2>
            <p className="mt-3 text-sm text-[var(--brand-ink-soft)]">
              {c.body}
            </p>

            <div className="mt-12 flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8 md:flex-nowrap md:gap-x-6">
              {c.failures.map((f, i) => (
                <React.Fragment key={f.label}>
                  <div className="flex w-24 flex-col items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-white to-gray-100 shadow-[inset_0_0_10px_rgba(0,0,0,0.03),0_4px_10px_rgba(0,0,0,0.04)] text-[var(--brand-ink-soft)] border border-black/5">
                      <ResolvedIcon name={f.icon} size={32} />
                    </div>
                    <span className="mt-5 whitespace-pre-wrap text-xs font-medium leading-relaxed text-[var(--brand-ink)]">
                      {f.label}
                    </span>
                  </div>
                  {i < c.failures.length - 1 && (
                    <div className="mt-8 hidden text-black/10 md:block">
                      <ArrowRightIcon size={16} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {c.footer && (
              <p className="mt-14 text-sm font-medium text-[var(--brand-ink)]">
                {c.footer}
              </p>
            )}
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-center px-6 pb-10 pt-16 text-center text-white md:px-12 md:pb-12 md:pt-16">
            <h2 className="whitespace-pre-wrap font-serif text-3xl text-white md:text-[34px] md:leading-[1.1]">
              {c.callout.title}
            </h2>
            {c.callout.subtitle && (
              <p className="mt-3 text-sm text-white/90">
                {c.callout.subtitle}
              </p>
            )}

            <div className="mt-12 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-6 md:flex-nowrap md:gap-x-4">
              {c.callout.items?.map((item, i) => (
                <React.Fragment key={i}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 text-white">
                    <ResolvedIcon name={item.icon} size={28} />
                  </div>
                  {i < (c.callout.items?.length ?? 0) - 1 && (
                    <div className="hidden text-white/50 md:block">
                      <ArrowRightIcon size={16} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="mt-14 whitespace-pre-wrap text-sm text-white/90">
              {c.callout.body}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Fallback for other services
  return (
    <section className="w-full" style={{ background: "var(--brand-cream)" }}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-20 md:grid-cols-12 md:px-12 md:py-24">
        <div className="md:col-span-7">
          <SectionHeading>{c.title}</SectionHeading>
          <p
            className="mt-4 text-sm leading-relaxed"
            style={{ color: "var(--brand-ink-soft)" }}
          >
            {c.body}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {c.failures.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-3"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <XCircleIcon
                  size={18}
                  style={{ color: "var(--brand-burgundy)", flexShrink: 0 }}
                />
                <span
                  className="text-xs font-medium leading-tight"
                  style={{ color: "var(--brand-ink)" }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-5">
          <div
            className="h-full rounded-xl p-7"
            style={{ background: "var(--brand-olive)" }}
          >
            <h3
              className="font-medium text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: "22px" }}
            >
              {c.callout.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/90">
              {c.callout.body}
            </p>
            <div className="mt-6 text-white/85">
              <EcgLine color="currentColor" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
