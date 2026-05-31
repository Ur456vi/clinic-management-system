import React from "react";
import { type ServiceContent } from "@/components/public/services-config";

export function FemaleLongitudinalTrackingSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "female-hormonal") return null;

  const steps = [
    { title: "Evaluate", desc: ["Comprehensive", "assessment &", "advanced testing"] },
    { title: "Interpret", desc: ["In-depth physician", "analysis of your", "unique physiology"] },
    { title: "Personalize", desc: ["Individualized care", "plan built around", "your biology"] },
    { title: "Monitor", desc: ["Track progress", "with continuous", "refinement"] },
    { title: "Optimize", desc: ["Achieve long-term", "health, vitality &", "quality of life"] }
  ];

  return (
    <section className="w-full bg-[#FCF8F2] relative overflow-hidden py-10 md:py-16">
      {/* Optional faint background graphic for left side (leaves) */}
      <div className="absolute left-0 bottom-0 pointer-events-none opacity-20">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
           <path d="M0 200 C50 150, 80 100, 100 0 C70 50, 30 100, 0 150 Z" stroke="#889A6A" strokeWidth="1"/>
           <path d="M0 200 C40 180, 60 140, 80 100 C50 130, 20 160, 0 180 Z" stroke="#889A6A" strokeWidth="1"/>
        </svg>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 md:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 items-center">
          
          {/* Left Text */}
          <div className="w-full lg:w-[32%] shrink-0 pr-4">
            <h2 className="text-[22px] md:text-[26px] font-medium mb-5 text-[#1F1F1F] leading-[1.2]" style={{ fontFamily: "var(--font-display)" }}>
              This Is Longitudinal Care—<br />
              Not A One-Time Consultation.
            </h2>
            <p className="text-[#333] text-[12px] md:text-[13px] font-medium leading-[1.7] max-w-[320px]">
              Every patient is evaluated, monitored, tracked,<br />
              and guided through a structured clinical framework<br />
              designed for measurable, long-term outcomes.
            </p>
          </div>

          {/* Right Process Flow */}
          <div className="w-full lg:w-[68%]">
            <div className="flex justify-between items-start w-full relative">
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center flex-1 z-10 px-1">
                    {/* Icon Circle */}
                    <div className="w-20 h-20 md:w-[90px] md:h-[90px] rounded-full border border-[#889A6A]/40 bg-white flex items-center justify-center mb-5 shadow-sm">
                      {/* Using placeholder SVGs for the icons inside the circle */}
                      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#889A6A" strokeWidth="1.5">
                        {i === 0 && (
                          <g>
                            <path d="M16 10H12a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2h-4" />
                            <rect x="16" y="6" width="16" height="8" rx="2" />
                            <path d="M18 22h12M18 28h8" />
                            <path d="M34 32h6a2 2 0 0 1 2 2v6l-4-4h-4a2 2 0 0 1-2-2v-2z" fill="white" />
                          </g>
                        )}
                        {i === 1 && (
                          <g>
                            <path d="M24 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
                            <path d="M14 36c0-6 4-12 10-12s10 6 10 12v4H14v-4z" />
                            <circle cx="24" cy="28" r="4" />
                            <path d="M27 31l5 5" strokeWidth="2" />
                          </g>
                        )}
                        {i === 2 && (
                          <g>
                            <path d="M24 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
                            <path d="M12 36c0-7 5-14 12-14s12 7 12 14v4H12v-4z" />
                            <path d="M24 24l-3-2v5h6v-5l-3 2z" />
                            <rect x="20" y="24" width="8" height="10" rx="1" />
                            <path d="M22 28l2 2 3-3" strokeWidth="2" />
                          </g>
                        )}
                        {i === 3 && (
                          <g>
                            <circle cx="24" cy="26" r="14" />
                            <path d="M24 12V8" />
                            <path d="M20 8h8" />
                            <path d="M24 26v-6M24 26l4 3" />
                            <path d="M10 16l-3-3M38 16l3-3" />
                            <path d="M14 40l4-4M34 40l-4-4" />
                          </g>
                        )}
                        {i === 4 && (
                          <g>
                            <path d="M24 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
                            <path d="M12 38c0-8 6-16 12-16s12 8 12 16H12z" />
                            <path d="M24 38v-8M20 34c0-4 8-4 8 0" />
                            <path d="M18 38v-3c0-3 12-3 12 0v3" />
                          </g>
                        )}
                      </svg>
                    </div>
                    
                    {/* Text block */}
                    <div className="text-center w-full">
                      <h4 className="text-[#1F1F1F] font-bold text-[13px] md:text-[14px] mb-2">{step.title}</h4>
                      <p className="text-[#333] text-[10px] md:text-[11px] font-medium leading-[1.4] mx-auto whitespace-nowrap">
                        {step.desc.map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line}
                            {idx < step.desc.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Arrow Connector */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex flex-col items-center justify-start pt-10 px-2 w-full">
                      <svg width="100%" height="24" viewBox="0 0 48 24" fill="none" stroke="#889A6A" strokeWidth="1" className="opacity-60 max-w-[48px]">
                        <path d="M0 12h46 M41 7l5 5-5 5"/>
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
