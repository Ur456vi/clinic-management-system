import React from "react";
import { type ServiceContent } from "@/components/public/services-config";

export function PathwaysSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "female-hormonal") return null;

  const pathways = [
    { num: "01", label: "Detailed\nHormonal\nAssessment" },
    { num: "02", label: "Lifestyle &\nMetabolic\nCorrection" },
    { num: "03", label: "Evidence-Based\nBHRT (Hormonal\nOptimization)" },
    { num: "04", label: "Nutritional &\nMicronutrient\nOptimization" },
    { num: "05", label: "Body\nComposition\nRestoration" },
    { num: "06", label: "Sleep &\nRecovery\nSupport" },
    { num: "07", label: "Bone &\nCardiovascular\nProtection" },
    { num: "08", label: "Long-Term\nMonitoring &\nRefinement" },
    { num: "09", label: "Cancer\nPrevention\nStrategies" },
  ];

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16">
        <div 
          className="w-full rounded-2xl py-8 md:py-10" 
          style={{ background: "var(--brand-cream-2)" }}
        >
          <div className="flex flex-col items-center text-center mb-10">
            <h2 className="font-serif text-2xl md:text-[26px] mb-3 text-[var(--brand-ink)] leading-tight">
              Symptom Suppression Is Not How We Do It
            </h2>
            <p className="text-[13px] md:text-[15px] font-medium text-[var(--brand-ink-soft)]">
              It is system-based restoration. Care pathways are individualized and include:
            </p>
          </div>

        <div className="relative w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="min-w-[1100px] w-full px-8 relative mx-auto">
            
            {/* The continuous background line */}
            <div className="absolute top-[16px] left-0 right-0 h-[1px] bg-[var(--brand-burgundy)] opacity-30 z-0"></div>

            <div className="relative flex items-start w-full justify-between">
              {pathways.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center relative">
                  
                  {/* Connection from previous (places dot in middle) */}
                  {idx > 0 && (
                    <div className="absolute top-[14px] left-[-50%] right-[50%] flex justify-center z-10 pointer-events-none">
                       <div className="w-[5px] h-[5px] rotate-45 bg-[var(--brand-burgundy)] opacity-70"></div>
                    </div>
                  )}

                  {/* Node Circle */}
                  <div className="w-[34px] h-[34px] rounded-full bg-[var(--brand-burgundy)] text-white flex items-center justify-center text-[13px] font-bold z-20 shadow-[0_0_0_6px_var(--brand-cream-2)] relative tracking-wide">
                    {item.num}
                  </div>
                  
                  {/* Label */}
                  <p className="mt-6 text-[12px] md:text-[13px] font-medium leading-snug text-center text-[var(--brand-ink)] whitespace-pre-wrap px-2">
                    {item.label}
                  </p>
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
