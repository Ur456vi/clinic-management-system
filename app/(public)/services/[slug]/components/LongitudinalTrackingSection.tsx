import { type ServiceContent } from "@/components/public/services-config";
import { ResolvedIcon } from "@/components/public/icon-resolver";

export function LongitudinalTrackingSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "metabolic-health" && svc.slug !== "aesthetic-external") return null;

  if (svc.slug === "aesthetic-external") {
    const philosophyItems = [
      { icon: "leaf", title: "Natural Outcomes" },
      { icon: "heart", title: "Tissue Quality" },
      { icon: "target", title: "Structural Harmony" },
      { icon: "sparkle", title: "Regenerative Support" },
      { icon: "clock", title: "Graceful Aging" }
    ];

    const individualizationItems = [
      { icon: "stethoscope", title: "Skin Quality" },
      { icon: "scale", title: "Hormonal & Metabolic Status" },
      { icon: "shield", title: "Inflammatory Burden" },
      { icon: "chart", title: "Age-Related Structural Changes" },
      { icon: "clock", title: "Lifestyle & Recovery Patterns" }
    ];

    return (
      <section className="w-full py-4 md:py-6 bg-[var(--brand-cream)] font-sans">
        <div className="mx-auto max-w-[1680px] px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* Burgundy Card: Philosophy */}
            <div className="bg-[#722F27] rounded-[24px] p-8 md:p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-lg border border-[#8B3A31]">
              {/* Gold botanical line-art on the right */}
              <div className="absolute right-[-2%] bottom-[2%] z-0 pointer-events-none opacity-15" aria-hidden="true">
                <svg width="150" height="250" viewBox="0 0 70 180" fill="none">
                  <path
                    d="M50 180 Q48 150 44 125 Q38 95 28 70 Q20 48 14 20"
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M44 128 Q60 118 66 100 Q52 96 44 110 Q43 120 44 128 Z"
                    fill="#D4AF37"
                    stroke="#C5A028"
                    strokeWidth="0.8"
                    fillOpacity="0.3"
                  />
                  <path d="M44 128 Q54 112 66 100" stroke="#C5A028" strokeWidth="0.4" fill="none" />
                  <path
                    d="M32 88 Q14 80 8 62 Q22 58 32 72 Q33 80 32 88 Z"
                    fill="#D4AF37"
                    stroke="#C5A028"
                    strokeWidth="0.8"
                    fillOpacity="0.3"
                  />
                  <path d="M32 88 Q20 74 8 62" stroke="#C5A028" strokeWidth="0.4" fill="none" />
                </svg>
              </div>
 
              <div className="relative z-10">
                <h3 className="font-serif text-2xl md:text-[28px] leading-snug font-normal">
                  The Philosophy Is Conservative, Regenerative, And Long-Term.
                </h3>
                <p className="mt-4 text-xs font-semibold text-white/70">
                  The emphasis is on:
                </p>
 
                {/* 5 Horizontal items */}
                <div className="mt-8 flex flex-wrap sm:flex-nowrap items-stretch justify-between w-full">
                  {philosophyItems.map((item) => (
                    <div 
                      key={item.title} 
                      className="flex flex-col items-center text-center flex-1 px-2 py-1 min-w-[80px] sm:min-w-0 max-w-none border-r border-transparent sm:border-white/30 sm:last:border-transparent"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 text-white border border-white/5 shadow-inner shrink-0">
                        <ResolvedIcon name={item.icon as any} size={20} />
                      </div>
                      <span className="text-[11px] font-medium leading-tight text-white/90">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
 
              <p className="relative z-10 mt-10 text-[12px] text-white/60 font-medium">
                Not excessive correction or trend-based aesthetic modification.
              </p>
            </div>
 
            {/* Cream Card: Individualization */}
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-[24px] p-8 md:p-10 flex flex-col justify-between text-neutral-950 relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <h3 className="font-serif text-2xl md:text-[28px] leading-snug font-normal text-neutral-950">
                  Every Program Is Individualized.
                </h3>
                <p className="mt-4 text-xs font-semibold text-neutral-600">
                  Interventions are selected only after understanding:
                </p>
 
                {/* 5 Horizontal items */}
                <div className="mt-8 flex flex-wrap sm:flex-nowrap items-stretch justify-between w-full">
                  {individualizationItems.map((item) => (
                    <div 
                      key={item.title} 
                      className="flex flex-col items-center text-center flex-1 px-2 py-1 min-w-[80px] sm:min-w-0 max-w-none border-r border-transparent sm:border-[#C4B299] sm:last:border-transparent"
                    >
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 text-[var(--brand-olive)] border border-[#EAE6DF] shadow-sm shrink-0">
                        <ResolvedIcon name={item.icon as any} size={20} />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight text-neutral-900">{item.title}</span>
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

  return (
    <section className="w-full py-8 md:py-10 bg-[#FAF8F3]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 items-center">
          
          {/* Left Text */}
          <div className="w-full lg:w-[20%] xl:w-[16%] shrink-0">
            <h2 
              className="text-[20px] md:text-[24px] font-medium mb-4 text-[#1F1F1F] leading-[1.2]" 
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
            >
              Every Individual<br />Is Tracked<br />Longitudinally.
            </h2>
            <p className="text-[#1F1F1F]/80 text-[14px] md:text-[15px] font-medium leading-relaxed">
              Progress is evaluated not<br/>only through weight, but<br/>through what truly matters.
            </p>
          </div>

          {/* Right Cards */}
          <div className="w-full lg:w-[80%] xl:w-[84%] pb-6 lg:pb-0">
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-between gap-y-6 gap-x-2 w-full">
              
              {/* Card 1: Body Composition */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="bg-transparent rounded-[16px] border border-[#E8DDD0] w-[140px] md:w-[150px] h-[130px] md:h-[140px] p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] md:text-[12px] font-medium text-[#1F1F1F] text-center mb-3">Body Composition</span>
                  <div className="relative flex items-center justify-center mt-auto mb-1">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="22" stroke="#EAECE3" strokeWidth="1" />
                      <path d="M24 24 L10 32 A 16 16 0 0 0 38 32 Z" fill="#5C6B46" stroke="#FAF8F3" strokeWidth="1" />
                      <path d="M24 24 L10 32 A 16 16 0 0 1 24 8 Z" fill="#EAECE3" stroke="#FAF8F3" strokeWidth="1" />
                      <path d="M24 24 L24 8 A 16 16 0 0 1 38 32 Z" fill="#C2CAB3" stroke="#FAF8F3" strokeWidth="1" />
                    </svg>
                  </div>
                </div>
                <div className="text-[#5C6B46]/40">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Metabolic Markers */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="bg-transparent rounded-[16px] border border-[#E8DDD0] w-[140px] md:w-[150px] h-[130px] md:h-[140px] p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] md:text-[12px] font-medium text-[#1F1F1F] text-center mb-3">Metabolic Markers</span>
                  <div className="relative flex items-center justify-center mt-auto mb-1">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="22" stroke="#EAECE3" strokeWidth="1" />
                      <line x1="8" y1="36" x2="40" y2="36" stroke="#C2CAB3" strokeWidth="1.5" />
                      <rect x="12" y="28" width="4" height="8" fill="#5C6B46" />
                      <rect x="18" y="22" width="4" height="14" fill="#5C6B46" />
                      <rect x="24" y="14" width="4" height="22" fill="#5C6B46" />
                      <rect x="30" y="20" width="4" height="16" fill="#5C6B46" />
                      <rect x="36" y="10" width="4" height="26" fill="#5C6B46" />
                    </svg>
                  </div>
                </div>
                <div className="text-[#5C6B46]/40">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Energy Levels */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="bg-transparent rounded-[16px] border border-[#E8DDD0] w-[150px] md:w-[170px] h-[130px] md:h-[140px] p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] md:text-[12px] font-medium text-[#1F1F1F] text-center mb-3">Energy Levels</span>
                  <div className="relative flex items-center justify-center mt-auto mb-1">
                    <svg width="70" height="48" viewBox="0 0 70 48" fill="none">
                      <circle cx="20" cy="24" r="18" stroke="#EAECE3" strokeWidth="1" />
                      <path d="M22 10 L12 24 H20 L18 38 L28 24 H20 Z" stroke="#5C6B46" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M30 36 L40 28 L46 32 L58 16 L64 10" stroke="#5C6B46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="40" cy="28" r="1.5" fill="#5C6B46" />
                      <circle cx="46" cy="32" r="1.5" fill="#5C6B46" />
                      <circle cx="58" cy="16" r="1.5" fill="#5C6B46" />
                      <path d="M58 10 H64 V16" stroke="#5C6B46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="text-[#5C6B46]/40">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Inflammatory Burden */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="bg-transparent rounded-[16px] border border-[#E8DDD0] w-[140px] md:w-[150px] h-[130px] md:h-[140px] p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] md:text-[12px] font-medium text-[#1F1F1F] text-center mb-3">Inflammatory Burden</span>
                  <div className="relative flex items-center justify-center mt-auto mb-1">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="22" stroke="#EAECE3" strokeWidth="1" />
                      <circle cx="24" cy="24" r="3" fill="#5C6B46" />
                      <circle cx="18" cy="20" r="2" fill="#889A6A" />
                      <circle cx="30" cy="18" r="2.5" fill="#C2CAB3" />
                      <circle cx="20" cy="30" r="1.5" fill="#5C6B46" />
                      <circle cx="30" cy="30" r="2" fill="#889A6A" />
                      <circle cx="26" cy="34" r="2.5" fill="#5C6B46" />
                      <circle cx="24" cy="16" r="1.5" fill="#889A6A" />
                      <circle cx="14" cy="26" r="2" fill="#C2CAB3" />
                      <circle cx="34" cy="24" r="1.5" fill="#5C6B46" />
                      <circle cx="16" cy="16" r="1.5" fill="#5C6B46" />
                      <path d="M22 24 Q 26 22 28 26" stroke="#5C6B46" strokeWidth="1" fill="none" />
                    </svg>
                  </div>
                </div>
                <div className="text-[#5C6B46]/40">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Card 5: Recovery Patterns */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="bg-transparent rounded-[16px] border border-[#E8DDD0] w-[140px] md:w-[150px] h-[130px] md:h-[140px] p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] md:text-[12px] font-medium text-[#1F1F1F] text-center mb-3">Recovery Patterns</span>
                  <div className="relative flex items-center justify-center mt-auto mb-1">
                    <svg width="56" height="48" viewBox="0 0 56 48" fill="none">
                      <circle cx="20" cy="20" r="18" stroke="#EAECE3" strokeWidth="1" />
                      <path d="M26 20 A 8 8 0 1 1 18 12 A 6 6 0 0 0 26 20 Z" stroke="#5C6B46" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M26 12 L28 14 M27 11 V13 M29 13 H27" stroke="#5C6B46" strokeWidth="1" strokeLinecap="round" />
                      
                      <rect x="22" y="38" width="4" height="4" fill="#5C6B46" opacity="0.8" />
                      <rect x="28" y="36" width="4" height="6" fill="#5C6B46" opacity="0.6" />
                      <rect x="34" y="32" width="4" height="10" fill="#5C6B46" opacity="0.4" />
                      <rect x="40" y="28" width="4" height="14" fill="#5C6B46" opacity="0.3" />
                      <rect x="46" y="24" width="4" height="18" fill="#5C6B46" opacity="0.2" />
                    </svg>
                  </div>
                </div>
                <div className="text-[#5C6B46]/40">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Card 6: Functional Improvement */}
              <div className="flex items-center">
                <div className="bg-transparent rounded-[16px] border border-[#E8DDD0] w-[140px] md:w-[150px] h-[130px] md:h-[140px] p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] md:text-[12px] font-medium text-[#1F1F1F] text-center mb-3 leading-tight">Functional<br/>Improvement</span>
                  <div className="relative flex items-center justify-center mt-auto mb-1">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="22" stroke="#EAECE3" strokeWidth="1" />
                      <path d="M12 38 H18 V32 H24 V26 H30 V20 H36 V14" stroke="#C2CAB3" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M30 14 H36 V20" stroke="#C2CAB3" strokeWidth="1.5" strokeLinejoin="round" />
                      
                      <circle cx="20" cy="20" r="2" stroke="#5C6B46" strokeWidth="1.5" />
                      <path d="M20 22 V30" stroke="#5C6B46" strokeWidth="1.5" />
                      <path d="M16 26 L20 24 L24 20" stroke="#5C6B46" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M16 36 L20 30 L24 34" stroke="#5C6B46" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
