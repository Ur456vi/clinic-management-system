import Image from "next/image";
import { SectionHeading } from "@/components/public/ui";
import { ResolvedIcon } from "@/components/public/icon-resolver";
import { XCircleIcon, CheckCircleIcon, FailedSearchIcon } from "@/components/public/icons";
import { type ServiceContent } from "@/components/public/services-config";

export function SymptomsSection({ svc }: { svc: ServiceContent }) {
  const s = svc.symptomsSection!;

  if (svc.slug === "metabolic-health") {
    return (
      <section className="w-full bg-[#FAF8F3]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-10 lg:gap-8 lg:px-12 lg:py-24 items-center">
          
          {/* Column 1: Conventional challenges / Exhausted from */}
          <div className="lg:col-span-3 flex flex-col justify-center">
            <div>
              <h2
                className="font-medium leading-[1.2] text-[#1F1F1F] lg:whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(20px, 2.2vw, 26px)",
                }}
              >
                You are not lacking discipline.<br/>
                You are exhausted from:
              </h2>
              <ul className="mt-8 space-y-4">
                {s.items.slice(0, 5).map((it) => (
                  <li key={it.label} className="flex items-start gap-4">
                    <XCircleIcon
                      size={22}
                      className="mt-0.5 shrink-0"
                      style={{ color: "var(--brand-burgundy)" }}
                    />
                    <span className="text-[14px] lg:text-[15px] leading-relaxed whitespace-pre-line text-[#1F1F1F] font-medium">
                      {it.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 2: "And yet, they are often told:" container */}
          <div className="lg:col-span-3 flex flex-col justify-center">
            <div className="rounded-[16px] p-8 md:p-10 bg-[#FCFAF5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8DDD0] flex flex-col justify-center relative">
              <h3
                className="font-medium leading-tight text-[18px] md:text-[20px] mb-8"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--brand-burgundy)",
                }}
              >
                And yet, they are often told:
              </h3>
              <div className="space-y-3">
                {svc.conventionalSection?.failures.map((f) => {
                  // Format text to remove periods and capitalize first letters
                  const formattedText = f.label.replace(/\./g, "").replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div
                      key={f.label}
                      className="flex items-center gap-4 rounded-[8px] border border-[#E8DDD0] bg-white px-4 py-3.5 shadow-sm"
                    >
                      {/* Diagnostic X Icon */}
                      <div className="text-[#722F27] shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="9" y1="9" x2="13" y2="13"></line>
                          <line x1="13" y1="9" x2="9" y2="13"></line>
                        </svg>
                      </div>
                      {/* Right Text */}
                      <span className="text-[14px] md:text-[15px] font-bold text-[#1F1F1F]">
                        {formattedText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: The objective is not rapid weight loss. */}
          <div className="lg:col-span-4 flex items-center justify-between relative pl-0 lg:pl-8 mt-12 lg:mt-0">
             <div className="relative z-10 w-[55%] flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAECE3] text-[#5C6B46]">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                       <path d="M12 8v4" />
                       <path d="M12 16h.01" />
                     </svg>
                  </div>
                  <p className="font-bold text-[13px] leading-tight text-[#1F1F1F]">
                    The objective is not<br />rapid weight loss.
                  </p>
                </div>

                <h3
                  className="font-medium text-[18px] md:text-[22px] mb-4 lg:whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--brand-olive)",
                    lineHeight: "1.2",
                  }}
                >
                  It is metabolic correction<br />and restoration.
                </h3>
                
                <p className="text-[13px] md:text-[14px] font-medium leading-relaxed text-[#1F1F1F]/80">
                  This is why temporary<br />
                  weight-loss approaches fail.<br />
                  The body is not simply trying<br />
                  to lose weight. It is responding<br />
                  to multiple physiological<br />
                  factors.
                </p>
             </div>

             {/* Background Rings & Silhouette */}
             <div className="absolute right-[-5%] md:right-[5%] lg:right-[-5%] xl:right-[5%] top-1/2 -translate-y-1/2 w-[220px] h-[350px] md:w-[280px] md:h-[450px] lg:w-[300px] lg:h-[400px] xl:w-[350px] xl:h-[450px] z-0 flex items-center justify-center pointer-events-none">
               
               {/* Silhouette */}
               <div className="relative w-[120px] h-[300px] md:w-[160px] md:h-[400px] lg:w-[180px] lg:h-[350px] xl:w-[200px] xl:h-[400px]">
                 <Image
                   src="/images/landing/home-focus-metabolic-transparent.png"
                   alt="Metabolic restoration silhouette"
                   fill
                   className="object-contain"
                   sizes="(max-width: 768px) 160px, (max-width: 1024px) 180px, 200px"
                 />
               </div>
             </div>
          </div>
        </div>
        {/* Horizontal divider */}
        <hr className="w-full" style={{ borderColor: "var(--brand-rule)", borderTopWidth: "1px" }} />

        {/* Body Responds To More Than Calories sub-section */}
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-8 lg:flex-row lg:items-center lg:gap-12 lg:px-12">
          {/* Left: heading + subtext */}
          <div className="shrink-0 lg:w-[220px] xl:w-[260px]">
            <h3
              className="font-semibold leading-tight text-[#1F1F1F]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(17px, 1.5vw, 22px)",
              }}
            >
              {s.title}
            </h3>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              {s.body}
            </p>
          </div>

          {/* Divider between left text and right icons */}
          <div
            className="hidden lg:block h-16 w-px shrink-0"
            style={{ background: "var(--brand-rule)" }}
          />

          {/* Right: 7 circular icon items */}
          <div className="flex flex-wrap gap-6 lg:flex-nowrap lg:items-center lg:justify-between lg:flex-1">
            {[
              { icon: "chart" as const, label: "Insulin\nSignaling" },
              { icon: "target" as const, label: "Cortisol\nPatterns" },
              { icon: "brain" as const, label: "Mitochondrial\nEfficiency" },
              { icon: "heart" as const, label: "Inflammatory\nBurden" },
              { icon: "scale" as const, label: "Hormonal\nRegulation" },
              { icon: "dumbbell" as const, label: "Muscle Mass\nPreservation" },
              { icon: "clock" as const, label: "Sleep & Recovery\nQuality" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                {/* Circular icon */}
                <div
                  className="flex h-[64px] w-[64px] items-center justify-center rounded-full border"
                  style={{
                    borderColor: "var(--brand-rule)",
                    background: "var(--brand-cream)",
                  }}
                >
                  <ResolvedIcon
                    name={item.icon}
                    size={26}
                    className="opacity-70"
                  />
                </div>
                <span
                  className="whitespace-pre-line text-[12px] font-medium leading-tight"
                  style={{ color: "var(--brand-ink)" }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Second horizontal divider */}
        <hr className="w-full" style={{ borderColor: "var(--brand-rule)", borderTopWidth: "1px" }} />

        {/* Metabolic dashboard image row */}
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-12 lg:items-stretch lg:gap-10 lg:px-12">
          {/* Left: dashboard image — 4/12 cols, stretches to full row height */}
          <div className="relative lg:col-span-4 overflow-hidden rounded-2xl min-h-[260px]">
            <Image
              src="/images/landing/metabolic-dashboard.png"
              alt="Metabolic health dashboard showing metabolic score, insulin sensitivity and inflammation index"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          </div>

          {/* Right: structured evaluation content — 8/12 cols */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            {/* Title */}
            <h3
              className="font-medium leading-tight text-[#1F1F1F] mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(17px, 1.6vw, 22px)",
              }}
            >
              {svc.approachSection?.title}{" "}
              <span style={{ color: "var(--brand-ink)" }}>{svc.approachSection?.subtitle}</span>
            </h3>

            {/* Body */}
            <p className="text-[13px] font-medium leading-relaxed mb-6" style={{ color: "#1F1F1F" }}>
              At the Institute of Precision Hormonal and Metabolic Health, every individual undergoes a
              structured metabolic evaluation designed to identify:
            </p>

            {/* 8-item 2-column list with vertical divider */}
            <div className="flex gap-0 sm:gap-2">
              {/* Left column: items 1–4 */}
              <div className="flex flex-1 flex-col gap-4">
                {svc.approachSection?.steps.slice(0, 4).map((step) => (
                  <div key={step.title} className="flex items-center gap-3">
                    <div
                      className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: "var(--brand-rule)", background: "var(--brand-cream)" }}
                    >
                      <ResolvedIcon name={step.icon} size={17} className="opacity-60" />
                    </div>
                    <span className="text-[13px] leading-snug" style={{ color: "var(--brand-ink)" }}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Vertical divider */}
              <div
                className="hidden sm:block w-px mx-6 self-stretch"
                style={{ background: "var(--brand-rule)" }}
              />

              {/* Right column: items 5–8 */}
              <div className="flex flex-1 flex-col gap-4 sm:pl-4">
                {svc.approachSection?.steps.slice(4).map((step) => (
                  <div key={step.title} className="flex items-center gap-3">
                    <div
                      className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: "var(--brand-rule)", background: "var(--brand-cream)" }}
                    >
                      <ResolvedIcon name={step.icon} size={17} className="opacity-60" />
                    </div>
                    <span className="text-[13px] leading-snug" style={{ color: "var(--brand-ink)" }}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Third horizontal divider */}
        <hr className="w-full" style={{ borderColor: "var(--brand-rule)", borderTopWidth: "1px" }} />

        {/* "This Is Not A Generic Weight-Loss Program" row */}
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-12 lg:items-start lg:gap-10 lg:px-12">
          {/* Left: heading + body + botanical leaf */}
          <div className="lg:col-span-3 relative flex flex-col justify-between min-h-[220px]">
            <div>
              <h3
                className="font-semibold leading-tight text-[#1F1F1F] mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(18px, 1.6vw, 24px)",
                  lineHeight: "1.2",
                }}
              >
                This Is Not A Generic<br />Weight-Loss Program.
              </h3>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--brand-ink-soft)", maxWidth: "340px" }}
              >
                This is a structured clinical<br />
                approach focused on restoring<br />
                metabolic efficiency and long-term<br />
                physiological stability.
              </p>
            </div>

            {/* Decorative botanical leaf */}
            <div className="mt-6 opacity-50" aria-hidden="true">
              <svg
                width="120"
                height="73"
                viewBox="0 0 180 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Main curved stem */}
                <path d="M30 100 Q55 80 80 60 Q105 42 140 20" stroke="var(--brand-olive)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>

                {/* Branch 1 — lower left */}
                <path d="M55 80 Q38 68 22 72" stroke="var(--brand-olive)" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
                {/* Leaf 1a — lower left outer */}
                <path d="M22 72 Q10 62 16 50 Q28 54 30 66 Q26 70 22 72Z" stroke="var(--brand-olive)" strokeWidth="0.85" fill="none" strokeLinejoin="round"/>
                <path d="M22 72 Q19 61 16 50" stroke="var(--brand-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                {/* Leaf 1b — lower left inner */}
                <path d="M36 76 Q24 62 30 50 Q42 56 42 68 Q40 73 36 76Z" stroke="var(--brand-olive)" strokeWidth="0.85" fill="none" strokeLinejoin="round"/>
                <path d="M36 76 Q33 63 30 50" stroke="var(--brand-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.6"/>

                {/* Branch 2 — middle */}
                <path d="M80 60 Q74 44 62 38" stroke="var(--brand-olive)" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
                {/* Leaf 2a — middle left */}
                <path d="M62 38 Q46 30 46 16 Q60 18 64 32 Q64 36 62 38Z" stroke="var(--brand-olive)" strokeWidth="0.85" fill="none" strokeLinejoin="round"/>
                <path d="M62 38 Q54 27 46 16" stroke="var(--brand-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                {/* Leaf 2b — middle right */}
                <path d="M80 60 Q90 44 102 46" stroke="var(--brand-olive)" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
                <path d="M102 46 Q118 38 120 24 Q106 22 100 36 Q100 42 102 46Z" stroke="var(--brand-olive)" strokeWidth="0.85" fill="none" strokeLinejoin="round"/>
                <path d="M102 46 Q110 35 120 24" stroke="var(--brand-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.6"/>

                {/* Branch 3 — upper right */}
                <path d="M120 36 Q126 24 118 14" stroke="var(--brand-olive)" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
                {/* Leaf 3a — upper right outer */}
                <path d="M118 14 Q108 4 96 8 Q98 20 110 22 Q115 18 118 14Z" stroke="var(--brand-olive)" strokeWidth="0.85" fill="none" strokeLinejoin="round"/>
                <path d="M118 14 Q107 11 96 8" stroke="var(--brand-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                {/* Leaf 3b — upper far right */}
                <path d="M140 20 Q152 10 162 14 Q158 26 146 26 Q142 24 140 20Z" stroke="var(--brand-olive)" strokeWidth="0.85" fill="none" strokeLinejoin="round"/>
                <path d="M140 20 Q151 17 162 14" stroke="var(--brand-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </div>
          </div>

          {/* Right: care pathways card */}
          <div className="lg:col-span-9 flex items-start">
            <div
              className="w-full rounded-2xl border p-6 lg:p-8"
              style={{ borderColor: "var(--brand-rule)", background: "transparent" }}
            >
              {/* Heading */}
              <p
                className="mb-6 text-[15px] font-medium leading-snug text-[#1F1F1F]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Depending on the individual, care pathways include:
              </p>

              {/* All 11 items in a 6-column grid — row 1 fills 6, row 2 fills 5 */}
              <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-x-4">
                {[
                  { icon: "microscope" as const,        label: "Advanced\nmetabolic\nevaluation" },
                  { icon: "body-composition" as const,  label: "Body\ncomposition\nanalysis" },
                  { icon: "leaf" as const,              label: "Nutrition\nrestructuring" },
                  { icon: "dumbbell" as const,          label: "Exercise &\nrecovery\noptimization" },
                  { icon: "hormonal-balance" as const,  label: "Hormonal\ncorrection\nwhere indicated" },
                  { icon: "sparkle" as const,           label: "Targeted\nsupplementation" },
                  { icon: "shield" as const,            label: "Inflammatory\nburden\nreduction" },
                  { icon: "brain" as const,             label: "Mitochondrial\nand energy\nsupport" },
                  { icon: "chart" as const,             label: "Non-GLP-1\nmetabolic\nstrategies" },
                  { icon: "stethoscope" as const,       label: "GLP-1 based\ninterventions\n(when appropriate)" },
                  { icon: "clock" as const,             label: "Continuous\ntracking &\nrefinement" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-left">
                    <div
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: "var(--brand-rule)", background: "transparent" }}
                    >
                      <ResolvedIcon name={item.icon} size={22} className="opacity-60" />
                    </div>
                    <span
                      className="whitespace-pre-line text-[11px] leading-tight font-medium"
                      style={{ color: "var(--brand-ink)" }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fourth horizontal divider */}
        <hr className="w-full" style={{ borderColor: "var(--brand-rule)", borderTopWidth: "1px" }} />

        {/* GLP-1 Medications and Metabolic Health Row */}
        <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* Left Card: GLP-1 Medications */}
          <div
            className="w-full rounded-2xl border p-6 lg:p-8 flex flex-col justify-between"
            style={{ borderColor: "var(--brand-rule)", background: "var(--brand-cream)" }}
          >
            <div>
              {/* Title */}
              <h3
                className="font-medium mb-8"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--brand-burgundy)",
                  fontSize: "clamp(20px, 2.2vw, 28px)",
                  lineHeight: "1.2",
                }}
              >
                GLP-1 Medications Are Powerful Tools—<br className="hidden sm:inline" />But They Are Not The Entire Strategy.
              </h3>

              {/* Content grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                {/* Left Column */}
                <div className="sm:pr-6 sm:border-r sm:border-dashed" style={{ borderColor: "var(--brand-rule)" }}>
                  <h4 className="font-semibold text-[13px] leading-snug mb-5 text-[#1F1F1F]">
                    Used appropriately, GLP-1 based therapies can significantly improve:
                  </h4>
                  <ul className="space-y-4">
                    {[
                      "Insulin Resistance",
                      "Appetite regulation",
                      "Metabolic burden",
                      "Body composition"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <CheckCircleIcon size={20} className="shrink-0" style={{ color: "var(--brand-olive)" }} />
                        <span className="text-[13px] font-medium" style={{ color: "var(--brand-ink)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Column */}
                <div>
                  <h4 className="font-semibold text-[13px] leading-snug mb-5 text-[#1F1F1F]">
                    But medication without proper metabolic understanding often leads to:
                  </h4>
                  <ul className="space-y-4">
                    {[
                      "Muscle loss",
                      "Nutritional compromise",
                      "Dependency without restoration",
                      "Rebound weight gain",
                      "Incomplete physiological correction",
                      "Osteoporosis"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <XCircleIcon size={20} className="shrink-0" style={{ color: "var(--brand-burgundy)" }} />
                        <span className="text-[13px] font-medium" style={{ color: "var(--brand-ink)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom banner strip */}
            <div
              className="rounded-xl px-5 py-4 flex items-center justify-center gap-4 mt-8"
              style={{ background: "#C4C9BA" }}
            >
              <svg width="34" height="38" viewBox="0 0 24 24" fill="none" stroke="#4E5C46" strokeWidth="1.2" className="shrink-0 opacity-80">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[13px] font-medium leading-normal text-[#2A3822] text-left">
                Our approach focuses on preserving function—<br />not just reducing weight.
              </p>
            </div>
          </div>

          {/* Right Card: Emphasis on Long-Term Metabolic Health */}
          <div
            className="w-full rounded-2xl border p-6 lg:p-8 flex flex-col justify-between"
            style={{ borderColor: "var(--brand-rule)", background: "var(--brand-cream)" }}
          >
            <div>
              {/* Title */}
              <h3
                className="font-medium mb-8 text-center"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "black",
                  fontSize: "clamp(14px, 1.5vw, 21px)",
                  lineHeight: "1.2",
                }}
              >
                The Emphasis Is On Long-Term Metabolic Health.
              </h3>

              {/* Infographic Container */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto pt-12 pb-4">
                {/* Left List (Right-aligned on wide screens) */}
                <div className="flex-1 flex flex-col gap-10 sm:text-right text-center w-full sm:w-auto justify-center">
                  <div>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">Metabolic</span>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">resilience</span>
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">Muscle</span>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">preservation</span>
                  </div>
                  <div className="mt-8">
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">Hormonal</span>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">balance</span>
                  </div>
                </div>

                {/* Circle Infographic (Center) */}
                <div className="relative shrink-0 w-[260px] h-[260px] lg:w-[280px] lg:h-[280px]">
                  <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer Segmented Ring */}
                    <circle cx="100" cy="100" r="75" stroke="#B8C0B4" strokeWidth="30" fill="none" />
                    
                    {/* Radial Cutout Lines */}
                    <line x1="100" y1="10" x2="100" y2="40" stroke="var(--brand-cream)" strokeWidth="2.5" />
                    <line x1="178" y1="55" x2="152" y2="70" stroke="var(--brand-cream)" strokeWidth="2.5" />
                    <line x1="178" y1="145" x2="152" y2="130" stroke="var(--brand-cream)" strokeWidth="2.5" />
                    <line x1="100" y1="190" x2="100" y2="160" stroke="var(--brand-cream)" strokeWidth="2.5" />
                    <line x1="22" y1="145" x2="48" y2="130" stroke="var(--brand-cream)" strokeWidth="2.5" />
                    <line x1="22" y1="55" x2="48" y2="70" stroke="var(--brand-cream)" strokeWidth="2.5" />

                    {/* Inner White Circle */}
                    <circle cx="100" cy="100" r="60" fill="white" />

                    {/* Center botanical leaf */}
                    <g transform="translate(100, 100) scale(0.95)">
                      {/* Stem */}
                      <path d="M0 25 Q0 0 0 -15" stroke="#7E8A72" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                      {/* Top leaf */}
                      <path d="M0 -15 Q-7 -25 0 -35 Q7 -25 0 -15 Z" stroke="#7E8A72" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                      <path d="M0 -15 L0 -35" stroke="#7E8A72" strokeWidth="0.6" fill="none" opacity="0.6" />
                      {/* Left leaf */}
                      <path d="M-3 5 Q-17 2 -22 -10 Q-10 -17 -3 5 Z" stroke="#7E8A72" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                      <path d="M-3 5 L-22 -10" stroke="#7E8A72" strokeWidth="0.6" fill="none" opacity="0.6" />
                      {/* Right leaf */}
                      <path d="M3 5 Q17 2 22 -10 Q10 -17 3 5 Z" stroke="#7E8A72" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                      <path d="M3 5 L22 -10" stroke="#7E8A72" strokeWidth="0.6" fill="none" opacity="0.6" />
                    </g>

                    {/* 6 Icons inside ring segments */}
                    {/* Top-Right Sparkle */}
                    <g transform="translate(137.5, 35.1) translate(-8, -8)">
                      <path d="M8 2 C8 2 8 8 2 8 C8 8 8 14 8 14 C8 14 8 8 14 8 C8 8 8 2 8 2 Z" stroke="white" strokeWidth="1" fill="none"/>
                    </g>
                    {/* Middle-Right Chart */}
                    <g transform="translate(170, 100) translate(-8, -8)">
                      <path d="M2 14 V8 H4 V14 H2 Z M6 14 V4 H8 V14 H6 Z M10 14 V10 H12 V14 H10 Z" stroke="white" strokeWidth="1" fill="none"/>
                    </g>
                    {/* Bottom-Right Shield */}
                    <g transform="translate(137.5, 164.9) translate(-8, -8)">
                      <path d="M8 2 L2 3.5 V8 C2 11.5 8 13.5 8 13.5 C8 13.5 14 11.5 14 8 V3.5 L8 2 Z" stroke="white" strokeWidth="1" fill="none"/>
                    </g>
                    {/* Bottom-Left Dumbbell */}
                    <g transform="translate(62.5, 164.9) translate(-8, -8)">
                      <rect x="1" y="4" width="2" height="8" rx="0.5" stroke="white" strokeWidth="0.8" fill="none"/>
                      <rect x="13" y="4" width="2" height="8" rx="0.5" stroke="white" strokeWidth="0.8" fill="none"/>
                      <line x1="3" y1="8" x2="13" y2="8" stroke="white" strokeWidth="1.2"/>
                    </g>
                    {/* Middle-Left Heart */}
                    <g transform="translate(30, 100) translate(-8, -8)">
                      <path d="M8 13.5 L7 12.5 C3 8.5 1 6.5 1 4 C1 2 2.5 0.5 4.5 0.5 C5.6 0.5 6.7 1 7.4 2 L8 2.7 L8.6 2 L9.3 0.5 C11.3 0.5 13 2 13 4 C13 6.5 11 8.5 7 12.5 Z" stroke="white" strokeWidth="1" fill="none" transform="scale(0.9) translate(0.5, 0.5)"/>
                    </g>
                    {/* Top-Left Brain/Clock */}
                    <g transform="translate(62.5, 35.1) translate(-8, -8)">
                      <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1" fill="none"/>
                      <path d="M8 4 V8 L11 9.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                    </g>
                  </svg>
                </div>

                {/* Right List (Left-aligned on wide screens) */}
                <div className="flex-1 flex flex-col gap-10 sm:text-left text-center w-full sm:w-auto justify-center">
                  <div>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">Sustainable body</span>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">composition change</span>
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">Improved energy</span>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">and cognition</span>
                  </div>
                  <div className="mt-8">
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">Long-term cardiovascular</span>
                    <span className="text-[13px] font-semibold block leading-tight text-[#1F1F1F]">protection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full" style={{ background: "var(--brand-cream-2)" }}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-12 md:px-12 md:py-24">
        <div className="md:col-span-4">
          {s.eyebrow ? (
            <p
              className="mb-4 text-xl italic"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-burgundy)",
              }}
            >
              &ldquo;{s.eyebrow}&rdquo;
            </p>
          ) : null}
          <SectionHeading>{s.title}</SectionHeading>
          {s.body ? (
            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              {s.body}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {s.items.map((it) => (
              <div
                key={it.label}
                className="rounded-lg border bg-white p-4 text-center"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <div
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: "var(--brand-cream)",
                    color: "var(--brand-burgundy)",
                  }}
                >
                  <ResolvedIcon name={it.icon} size={20} />
                </div>
                <p
                  className="text-xs font-medium leading-snug"
                  style={{ color: "var(--brand-ink)" }}
                >
                  {it.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
