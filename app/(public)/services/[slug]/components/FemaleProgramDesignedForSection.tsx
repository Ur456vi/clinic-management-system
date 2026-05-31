import React from "react";
import { CheckCircleIcon } from "@/components/public/icons";
import { type ServiceContent } from "@/components/public/services-config";

export function FemaleProgramDesignedForSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "female-hormonal") return null;

  return (
    <section className="w-full bg-white pb-8">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          
          {/* Left Card */}
          <div className="w-full bg-[#FAF8F3] rounded-l-[12px] rounded-r-none px-8 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12 flex flex-col justify-center">
            <h2 className="text-[26px] md:text-[32px] font-medium mb-3 text-[#1F1F1F]" style={{ fontFamily: "var(--font-display)" }}>
              Who This Program Is Designed For
            </h2>
            <p className="text-[#333] text-[14px] md:text-[15px] font-medium mb-6">
              Women experiencing:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                {[
                  "Irregular cycles & hormonal fluctuations",
                  "Hot flashes & night sweats",
                  "Fatigue & burnout",
                  "Stubborn weight gain",
                  "Poor sleep & non-restorative sleep",
                  "Emotional instability or anxiety"
                ].map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircleIcon size={18} className="shrink-0 mt-0.5 text-[#889A6A]" />
                    <span className="text-[#333] text-[13px] md:text-[14px] font-medium leading-snug">{text}</span>
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4">
                {[
                  "Reduced focus, memory, or clarity",
                  "Low libido & sexual health concerns",
                  "Post-menopausal physiological decline",
                  "Early osteopenia or osteoporosis risk",
                  "PCOS transitioning into\nmetabolic dysfunction"
                ].map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircleIcon size={18} className="shrink-0 mt-0.5 text-[#889A6A]" />
                    <span className="text-[#333] text-[13px] md:text-[14px] font-medium leading-snug whitespace-pre-wrap">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Card */}
          <div className="w-full bg-[var(--brand-burgundy)] rounded-r-[12px] rounded-l-none px-8 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12 flex flex-col justify-center text-center relative overflow-hidden">
            <h3 className="text-[24px] md:text-[28px] text-white font-medium mb-8 leading-tight mx-auto max-w-sm" style={{ fontFamily: "var(--font-display)" }}>
              These Changes Affect Far More<br />Than Hormones Alone
            </h3>
            
            <div className="flex justify-between items-start w-full relative z-10 px-2 lg:px-6 mb-8">
              {[
                { label: "Marriages &\nRelationships", icon: "path1" },
                { label: "Confidence &\nSelf-Esteem", icon: "path2" },
                { label: "Work\nPerformance", icon: "path3" },
                { label: "Emotional\nResilience", icon: "path4" },
                { label: "Identity\nItself", icon: "path5" }
              ].map((item, i, arr) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-white/20 bg-black/10 flex items-center justify-center mb-4">
                      {/* Temporary placeholder icons - can replace with exact SVGs later */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white opacity-80">
                         {i === 0 && <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM6 20v-2a6 6 0 1 1 12 0v2"></path>}
                         {i === 1 && <circle cx="12" cy="12" r="10"></circle>}
                         {i === 2 && <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>}
                         {i === 3 && <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>}
                         {i === 4 && <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>}
                      </svg>
                    </div>
                    <span className="text-white text-[12px] md:text-[13px] font-medium leading-tight whitespace-pre-wrap">{item.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="text-white/40 text-sm mt-5 mx-1">+</div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex flex-col items-center">
              <p className="text-white/90 text-[13px] md:text-[14px] font-medium mb-3">
                Because these changes impact every dimension of a woman's life.
              </p>
              <div className="h-px w-24 bg-white/20"></div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
