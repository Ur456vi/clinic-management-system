import Link from "next/link";
import { ResolvedIcon } from "@/components/public/icon-resolver";
import { MetabolicProgramIcon } from "@/components/public/icons";
import {
  CTAButton,
  HeroPattern,
  PortraitPlaceholder,
  QuoteCard,
  SectionEyebrow,
  StatTile,
} from "@/components/public/ui";
import { type ServiceContent } from "@/components/public/services-config";

export function ServiceHero({ svc }: { svc: ServiceContent }) {
  const isFemale = svc.slug === "female-hormonal";
  const isMetabolic = svc.slug === "metabolic-health";
  const isMensHormonal = svc.slug === "mens-hormonal";

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "var(--brand-cream)", minHeight: isMensHormonal ? "500px" : "700px" }}
    >
      {/* Background Decor & Right Side Assets */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[60%] pointer-events-none z-0">

         {/* Hex Pattern — only for non-female */}
         {!isFemale && (
           <div className="hidden md:block absolute inset-0 opacity-[0.25]" style={{ color: "var(--brand-burgundy)" }}>
             <HeroPattern className="h-full w-full" opacity={1} />
           </div>
         )}

         {/* Green blur circle — only for non-female */}
         {!isFemale && (
           <div className="absolute right-[-10%] top-[10%] w-[500px] h-[500px] lg:w-[650px] lg:h-[650px] bg-[#E8EBD9] rounded-full blur-[100px] opacity-100 hidden md:block" />
         )}

         {isFemale ? (
           <>
             {/* ── Realistic photograph ── */}
             <img
               src="/images/landing/service-female-hormonal-hero.jpg"
               alt="Women's hormonal health — physician care"
               className="absolute inset-0 w-full h-full object-cover object-[65%_20%] hidden md:block"
             />

             {/* Left cream-fade gradient — blends photo into text area */}
             <div
               className="absolute left-0 top-0 bottom-0 w-[45%] z-10 hidden md:block"
               style={{ background: "linear-gradient(to right, var(--brand-cream) 15%, transparent 100%)" }}
             />

             {/* Bottom fade */}
             <div
               className="absolute left-0 right-0 bottom-0 h-[8%] z-10 hidden md:block"
               style={{ background: "linear-gradient(to top, var(--brand-cream) 0%, transparent 100%)" }}
             />

             {/* ── Circular arc decorations (upper-right) ── */}
             <svg
               className="absolute right-[-8%] top-[5%] w-[420px] h-[420px] z-10 hidden lg:block"
               viewBox="0 0 400 400"
               fill="none"
             >
               {/* Large outer arc — partial circle */}
               <path
                 d="M 350 50 A 180 180 0 0 1 350 350"
                 stroke="#D6D2C8"
                 strokeWidth="0.8"
                 opacity="0.5"
               />
               {/* Medium arc */}
               <path
                 d="M 310 80 A 140 140 0 0 1 310 310"
                 stroke="#D6D2C8"
                 strokeWidth="0.7"
                 opacity="0.4"
               />
               {/* Small inner arc */}
               <path
                 d="M 280 120 A 90 90 0 0 1 280 260"
                 stroke="#D6D2C8"
                 strokeWidth="0.6"
                 opacity="0.35"
               />

               {/* Scattered dots */}
               <circle cx="310" cy="60" r="3.5" fill="#889A6A" opacity="0.55" />
               <circle cx="360" cy="190" r="2" fill="#B8C0A8" opacity="0.4" />
               <circle cx="270" cy="300" r="2.5" fill="#889A6A" opacity="0.35" />
             </svg>

             {/* ── Botanical leaf — left edge of photo ── */}
             <div className="absolute left-[2%] bottom-[8%] z-20 hidden lg:block" aria-hidden="true">
               <svg width="70" height="180" viewBox="0 0 70 180" fill="none">
                 {/* Main stem — curves gently upward-left */}
                 <path
                   d="M50 180 Q48 150 44 125 Q38 95 28 70 Q20 48 14 20"
                   stroke="#7A8C6A"
                   strokeWidth="1.2"
                   fill="none"
                   strokeLinecap="round"
                 />
                 {/* Leaf 1 — lower right */}
                 <path
                   d="M44 128 Q60 118 66 100 Q52 96 44 110 Q43 120 44 128 Z"
                   fill="#8A9E76"
                   stroke="#6E845A"
                   strokeWidth="0.7"
                   opacity="0.7"
                 />
                 <path d="M44 128 Q54 112 66 100" stroke="#6E845A" strokeWidth="0.35" fill="none" opacity="0.45" />
                 {/* Leaf 2 — mid left */}
                 <path
                   d="M32 88 Q14 80 8 62 Q22 58 32 72 Q33 80 32 88 Z"
                   fill="#8A9E76"
                   stroke="#6E845A"
                   strokeWidth="0.7"
                   opacity="0.7"
                 />
                 <path d="M32 88 Q20 74 8 62" stroke="#6E845A" strokeWidth="0.35" fill="none" opacity="0.45" />
                 {/* Leaf 3 — upper right */}
                 <path
                   d="M24 58 Q40 48 44 32 Q30 28 24 42 Q23 50 24 58 Z"
                   fill="#8A9E76"
                   stroke="#6E845A"
                   strokeWidth="0.7"
                   opacity="0.7"
                 />
                 <path d="M24 58 Q33 44 44 32" stroke="#6E845A" strokeWidth="0.35" fill="none" opacity="0.45" />
                 {/* Leaf 4 — top tip */}
                 <path
                   d="M14 20 Q8 6 14 0 Q22 8 18 18 Q16 20 14 20 Z"
                   fill="#9AAE82"
                   stroke="#6E845A"
                   strokeWidth="0.7"
                   opacity="0.65"
                 />
               </svg>
             </div>
           </>
         ) : isMensHormonal ? (
           <>
             {/* Doctor Image for Men's Hormonal */}
             <img
               src="/images/landing/dr-yuvraaj-singh.png"
               alt="Hero"
               className="absolute bottom-0 right-0 h-[90%] lg:h-[100%] object-contain object-bottom hidden md:block lg:right-[15%] xl:right-[15%]"
             />

             {/* Floating Quote */}
             <div className="absolute right-[8%] top-[25%] hidden xl:block z-10 w-[200px]">
               <span className="text-[#5C6B46] text-[60px] font-serif leading-none absolute -top-8 -left-4">&ldquo;</span>
               <p className="text-[#1F1F1F]/90 font-medium text-[17px] leading-[1.6] relative z-10">
                 Decline is not<br />inevitable.<br />It is a signal.<br />And every signal<br />has a cause.
               </p>
               <div className="w-6 h-[2px] bg-[#722F27] mt-6 opacity-60" />
             </div>
           </>
         ) : (
           <>
             {/* Doctor/Hero Image */}
             <img
               src="/images/landing/doctor-hero.png"
               alt="Hero"
               className="absolute bottom-0 right-0 h-[90%] lg:h-[100%] object-contain object-bottom hidden md:block lg:right-[20%] xl:right-[25%]"
             />

             {/* Floating Quote */}
             <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[220px] hidden xl:block z-10">
               <span className="text-[#722F27] text-[60px] font-serif leading-none absolute -top-8 -left-6">&ldquo;</span>
               <p className="text-[#1F1F1F]/90 font-medium text-[16px] leading-relaxed relative z-10">
                 Metabolism is<br/>not a willpower<br/>problem.<br/>It is a physiological<br/>system.
               </p>
             </div>
           </>
         )}
      </div>

      <div className={`mx-auto max-w-[1440px] px-6 pt-12 md:px-12 md:pt-16 relative z-10 ${isMensHormonal ? 'pb-8 md:pb-12' : 'pb-16 md:pb-20'}`}>
        <div className="w-full lg:w-[60%] xl:w-[55%]">
          
          {/* Eyebrow / Tag */}
          {isMetabolic ? (
            <div className="flex items-center gap-3 mb-4" style={{ color: "var(--brand-burgundy)" }}>
              <MetabolicProgramIcon size={24} className="shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                {svc.programTag}
              </span>
            </div>
          ) : isFemale ? (
            <div className="flex items-center gap-3 mb-6" style={{ color: "var(--brand-burgundy)" }}>
              {/* Lotus flower icon matching reference */}
              <div className="shrink-0">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Center petal — straight up */}
                  <path
                    d="M40 58 C34 48 34 30 40 18 C46 30 46 48 40 58 Z"
                    stroke="#B08A82"
                    strokeWidth="1.1"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {/* Petal — upper-right (~40°) */}
                  <path
                    d="M40 58 C42 46 52 32 62 26 C60 38 52 50 40 58 Z"
                    stroke="#B08A82"
                    strokeWidth="1.1"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {/* Petal — right (~80°) */}
                  <path
                    d="M40 58 C48 50 62 44 72 44 C66 54 52 58 40 58 Z"
                    stroke="#B08A82"
                    strokeWidth="1.1"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {/* Petal — lower-right (~120°) */}
                  <path
                    d="M40 58 C50 58 62 66 66 74 C56 72 46 66 40 58 Z"
                    stroke="#B08A82"
                    strokeWidth="1.1"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {/* Petal — lower-left (~240°) */}
                  <path
                    d="M40 58 C30 58 18 66 14 74 C24 72 34 66 40 58 Z"
                    stroke="#B08A82"
                    strokeWidth="1.1"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {/* Petal — left (~280°) */}
                  <path
                    d="M40 58 C32 50 18 44 8 44 C14 54 28 58 40 58 Z"
                    stroke="#B08A82"
                    strokeWidth="1.1"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {/* Petal — upper-left (~320°) */}
                  <path
                    d="M40 58 C38 46 28 32 18 26 C20 38 28 50 40 58 Z"
                    stroke="#B08A82"
                    strokeWidth="1.1"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {/* Center dot */}
                  <circle cx="40" cy="58" r="2" fill="#B08A82" opacity="0.7" />
                </svg>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#722F27]">
                {svc.programTag}
              </span>
            </div>
          ) : isMensHormonal ? (
            <div className="mb-4">
              <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#722F27]">
                {svc.programTag}
              </span>
            </div>
          ) : (
            <SectionEyebrow>{svc.programTag}</SectionEyebrow>
          )}
          
          <h1
            className="font-medium leading-[1.15]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--brand-ink)",
              fontSize: isFemale || isMensHormonal ? "clamp(36px, 4.5vw, 68px)" : "clamp(36px, 4.5vw, 64px)",
            }}
          >
            {isFemale ? (
              <>
                <span className="block">Perimenopause,</span>
                <span className="block">Menopause &amp;</span>
                <span className="block">
                  Post-Menopause{" "}
                  <span style={{ color: "var(--brand-burgundy)" }}>Care</span>
                </span>
              </>
            ) : isMensHormonal ? (
              <>
                <span className="block">Men's Hormonal &</span>
                <span className="block">
                  Andropause <span style={{ color: "var(--brand-burgundy)" }}>Care</span>
                </span>
              </>
            ) : (
              <>
                {svc.heroTitle}{" "}
                <span className="block mt-3" style={{ color: "var(--brand-burgundy)", fontSize: "0.65em" }}>
                  {svc.heroTitleAccent}
                </span>
              </>
            )}
          </h1>
          
          <p
            className={`mt-6 text-[15px] md:text-[17px] leading-relaxed font-medium ${isFemale || isMensHormonal ? 'max-w-[560px] text-[#333333]' : 'max-w-[500px] text-black'}`}
          >
            {isFemale ? (
              <>
                <span className="block">Hormonal changes do not just affect the body.</span>
                <span className="block">They alter energy, emotions, sleep, cognition, relationships,</span>
                <span className="block">confidence, and quality of life.</span>
              </>
            ) : isMensHormonal ? (
              <>
                <span className="block">We go beyond symptom suppression to restore your hormones,</span>
                <span className="block">energy, performance, and long-term vitality—at the root.</span>
              </>
            ) : svc.heroBody.split("\n").map((line, idx) => (
              <span key={idx} className="block mb-2 last:mb-0">
                {line}
              </span>
            ))}
          </p>

          <div className={`mt-10 flex flex-wrap gap-4`}>
            {isMensHormonal ? (
              <>
                <Link
                  href="/assessment"
                  className={`inline-flex items-center gap-2 rounded text-white transition-colors hover:opacity-95 font-medium px-8 py-4 text-[14px]`}
                  style={{ background: "#647153" }}
                >
                  Book Your Consultation <span>→</span>
                </Link>
                <Link
                  href="#approach"
                  className={`inline-flex items-center gap-2 rounded border transition-colors hover:bg-[#722F27]/5 font-medium px-8 py-4 text-[14px] bg-[#FAF8F5]`}
                  style={{ borderColor: "#E5DCDA", color: "#722F27" }}
                >
                  Take the Hormone Assessment <span>↗</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/assessment"
                  className={`inline-flex items-center gap-2 rounded text-white transition-colors hover:opacity-95 font-medium ${isFemale ? 'px-8 py-4 text-[14px]' : 'px-6 py-3.5 text-[13px]'}`}
                  style={{ background: "#889A6A" }}
                >
                  Book Consultation <span>→</span>
                </Link>
                <Link
                  href="#approach"
                  className={`inline-flex items-center gap-2 rounded border transition-colors hover:bg-[#722F27]/5 font-medium ${isFemale ? 'px-8 py-4 text-[14px]' : 'px-6 py-3.5 text-[13px]'}`}
                  style={{ borderColor: "var(--brand-burgundy)", color: "var(--brand-burgundy)" }}
                >
                  Explore Clinical Framework <span>→</span>
                </Link>
              </>
            )}
          </div>
          
          {/* Bottom Features Row */}
          {isFemale ? (
            <div className="mt-14 flex flex-wrap items-center gap-x-0 gap-y-4">
              {svc.heroTiles.map((t, i) => (
                <div key={t.label} className="flex items-center">
                  <div className="flex items-center gap-3 px-3">
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#5C6B46] text-white">
                      <ResolvedIcon name={t.icon} size={20} />
                    </div>
                    <span className="text-[#1F1F1F] text-[12px] font-bold leading-tight max-w-[90px]">
                      {t.label.split(" ").map((w, j) => <span key={j} className="block">{w}</span>)}
                    </span>
                  </div>
                  {i < svc.heroTiles.length - 1 && (
                    <div className="hidden sm:block h-10 w-px bg-[#D8D2C6]" />
                  )}
                </div>
              ))}
            </div>
          ) : isMetabolic || isMensHormonal ? (
            <div className={`mt-12 flex flex-wrap gap-y-6 ${isMensHormonal ? 'gap-x-4 xl:gap-x-6' : 'gap-x-8'}`}>
              {svc.heroTiles.map((t) => (
                <div key={t.label} className="flex items-center gap-2 xl:gap-3">
                  <div className="text-[#5C6B46] shrink-0">
                    <ResolvedIcon name={t.icon} size={30} />
                  </div>
                  <span className="text-[#1F1F1F] text-[11px] md:text-[12px] font-bold leading-[1.15] max-w-[100px]">
                    {t.label.split("\n").map((w, i) => <span key={i} className="block">{w}</span>)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="mt-10 grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  svc.heroTiles.length,
                  5
                )}, minmax(0, 1fr))`,
              }}
            >
              {svc.heroTiles.map((t) => (
                <StatTile
                  key={t.label}
                  icon={<ResolvedIcon name={t.icon} size={22} />}
                  label={t.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

