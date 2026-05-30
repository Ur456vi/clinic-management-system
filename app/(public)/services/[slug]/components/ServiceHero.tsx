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

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "var(--brand-cream)", minHeight: "700px" }}
    >
      {/* Background Decor & Right Side Assets */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[60%] pointer-events-none z-0">
         {/* Hex Pattern */}
         <div className="absolute inset-0 opacity-[0.25]" style={{ color: "var(--brand-burgundy)" }}>
           <HeroPattern className="h-full w-full" opacity={1} />
         </div>
         
         {/* Green blur circle */}
         <div className="absolute right-[-10%] top-[10%] w-[500px] h-[500px] lg:w-[650px] lg:h-[650px] bg-[#E8EBD9] rounded-full blur-[100px] opacity-100 hidden md:block" />
         
         {/* Concentric rings on the far right edge for Female Hormonal */}
         {isFemale && (
           <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[300px] h-[400px] opacity-30 z-0">
             <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" stroke="#889A6A" strokeWidth="0.5">
               <circle cx="150" cy="100" r="40" />
               <circle cx="150" cy="100" r="80" />
               <circle cx="150" cy="100" r="120" />
               <circle cx="150" cy="40" r="2" fill="#889A6A" />
               <circle cx="90" cy="140" r="2" fill="#889A6A" />
             </svg>
           </div>
         )}

         {/* Doctor/Hero Image */}
         <img 
           src={isFemale ? "/images/landing/home-focus-female.png" : "/images/landing/doctor-hero.png"} 
           alt="Hero"
           className={`absolute bottom-0 right-0 h-[90%] lg:h-[100%] object-contain object-bottom hidden md:block ${isFemale ? 'lg:right-[5%]' : 'lg:right-[20%] xl:right-[25%]'}`}
         />
         
         {/* Floating Quote (Only for non-female services right now) */}
         {!isFemale && (
           <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[220px] hidden xl:block z-10">
             <span className="text-[#722F27] text-[60px] font-serif leading-none absolute -top-8 -left-6">“</span>
             <p className="text-[#1F1F1F]/90 font-medium text-[16px] leading-relaxed relative z-10">
               Metabolism is<br/>not a willpower<br/>problem.<br/>It is a physiological<br/>system.
             </p>
           </div>
         )}
      </div>

      <div className="mx-auto max-w-[1440px] px-6 pt-12 pb-16 md:px-12 md:pt-16 md:pb-20 relative z-10">
        <div className="w-full lg:w-[55%]">
          
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
              <div className="text-[#8B7D6B]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c4-4 8-10 8-14a4 4 0 0 0-8 0 4 4 0 0 0-8 0c0 4 4 10 8 14z" />
                  <path d="M12 22V8" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#722F27]">
                {svc.programTag}
              </span>
            </div>
          ) : (
            <SectionEyebrow>{svc.programTag}</SectionEyebrow>
          )}
          
          <h1
            className="font-medium leading-[1.05]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--brand-ink)",
              fontSize: "clamp(36px, 4.5vw, 64px)",
            }}
          >
            {svc.heroTitle}{" "}
            {isFemale ? (
              <span style={{ color: "var(--brand-burgundy)" }}>{svc.heroTitleAccent}</span>
            ) : (
              <span className="block mt-3" style={{ color: "var(--brand-burgundy)", fontSize: "0.65em" }}>
                {svc.heroTitleAccent}
              </span>
            )}
          </h1>
          
          <p
            className={`mt-6 text-[15px] md:text-[16px] leading-relaxed font-medium ${isFemale ? 'max-w-[550px] text-[#333333]' : 'max-w-[500px] text-black'}`}
          >
            {isFemale ? svc.heroBody : svc.heroBody.split("\n").map((line, idx) => (
              <span key={idx} className="block mb-2 last:mb-0">
                {line}
              </span>
            ))}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded px-6 py-3.5 text-[13px] font-medium text-white transition-colors hover:opacity-95"
              style={{ background: "#889A6A" }}
            >
              Book Consultation <span>→</span>
            </Link>
            <Link
              href="#approach"
              className="inline-flex items-center gap-2 rounded border px-6 py-3.5 text-[13px] font-medium transition-colors hover:bg-[#722F27]/5"
              style={{ borderColor: "var(--brand-burgundy)", color: "var(--brand-burgundy)" }}
            >
              Explore Clinical Framework <span>→</span>
            </Link>
          </div>
          
          {/* Bottom Features Row */}
          {isFemale ? (
            <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-4">
              {svc.heroTiles.map((t, i) => (
                <div key={t.label} className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-[#889A6A] shrink-0">
                      <ResolvedIcon name={t.icon} size={28} />
                    </div>
                    <span className="text-[#1F1F1F] text-[12px] font-bold leading-tight max-w-[90px]">
                      {t.label.split(" ").map((w, j) => <span key={j} className="block">{w}</span>)}
                    </span>
                  </div>
                  {i < svc.heroTiles.length - 1 && (
                    <div className="hidden sm:block h-8 w-px bg-[#E8DDD0] ml-2" />
                  )}
                </div>
              ))}
            </div>
          ) : isMetabolic ? (
            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-6">
              {svc.heroTiles.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <div className="text-[#5C6B46] shrink-0">
                    <ResolvedIcon name={t.icon} size={32} />
                  </div>
                  <span className="text-[#1F1F1F] text-[12px] md:text-[13px] font-bold leading-[1.1] max-w-[80px]">
                    {t.label.split(" ").map((w, i) => <span key={i} className="block">{w}</span>)}
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
