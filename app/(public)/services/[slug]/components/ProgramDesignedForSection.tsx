import React from "react";
import Image from "next/image";
import { CheckCircleIcon } from "@/components/public/icons";
import { type ServiceContent } from "@/components/public/services-config";

export function ProgramDesignedForSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "metabolic-health" && svc.slug !== "aesthetic-external") return null;

  if (svc.slug === "aesthetic-external") {
    const flatSymptoms = [
      "Accelerated facial aging",
      "Skin dullness & loss of elasticity",
      "Collagen loss",
      "Pigmenting changes",
      "Stress-related skin deterioration",
      "Hair thinning & scalp concerns",
      "Volume loss & tissue laxity",
      "Post-menopausal skin changes",
      "Inflammatory or metabolically driven skin decline"
    ];

    const gridRows = [
      [
        "Accelerated facial aging",
        "Hair thinning & scalp concerns",
        "Inflammatory or metabolically driven skin decline"
      ],
      [
        "Skin dullness & loss of elasticity",
        "Volume loss & tissue laxity",
        null
      ],
      [
        "Collagen loss",
        "Post-menopausal skin changes",
        null
      ],
      [
        "Pigmenting changes",
        null,
        null
      ],
      [
        "Stress-related skin deterioration",
        null,
        null
      ]
    ];

    return (
      <section className="w-full pt-4 pb-4 md:pt-6 md:pb-6 bg-[var(--brand-cream)] font-sans">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12">
          
          {/* Unified Rounded Light-Beige Container */}
          <div className="w-full bg-[#FAF8F5] border border-[#E4DFD5] rounded-[24px] p-8 md:p-12 lg:p-14 flex flex-col lg:flex-row gap-10 lg:gap-0 items-stretch shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            
            {/* Left Block: Heading, Paragraph, and Centered Circular Diagram (52% width) */}
            <div className="w-full lg:w-[52%] flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between lg:border-r lg:border-[#E4DFD5] lg:pr-10">
              
              {/* Text Area */}
              <div className="w-full md:w-[56%] flex flex-col justify-center">
                <h2 className="font-serif text-[18px] md:text-[22px] lg:text-[20px] xl:text-[25px] leading-[1.3] text-neutral-950 font-normal">
                  The Goal Is Not To Change<br />
                  How Someone Looks.<br />
                  <span className="text-[#A3B18A]">
                    It Is To Restore How Well<br />
                    The Tissue Ages.
                  </span>
                </h2>
                
                {/* Horizontal Separator Line (Figma Style) */}
                <div className="w-12 h-[1.5px] bg-[#D2B48C] mt-5 mb-5" />
                
                <p className="text-[13px] md:text-[14px] leading-relaxed text-neutral-700 font-medium max-w-[320px]">
                  Which is why aesthetic care in this Institute is integrated into a broader framework of internal restoration and long-term health optimization.
                </p>
              </div>

              {/* Centered Circular Diagram (SVG Built-In Labels for No Overflow/Clipping) */}
              <div className="w-full md:w-[44%] flex justify-center items-center shrink-0">
                <svg viewBox="0 0 420 280" className="w-full max-w-[320px] h-auto overflow-visible select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Concentric Circles */}
                  <circle cx="210" cy="140" r="80" stroke="#D8D3C9" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="210" cy="140" r="54" stroke="#D8D3C9" strokeWidth="1" />
                  <circle cx="210" cy="140" r="30" stroke="#D8D3C9" strokeWidth="1.5" />
                  <circle cx="210" cy="140" r="15" stroke="#889A6A" strokeWidth="1" opacity="0.3" fill="#FAF8F5" />
                  
                  {/* Spokes */}
                  {/* Vertical spoke (12 o'clock / 6 o'clock) */}
                  <line x1="210" y1="60" x2="210" y2="220" stroke="#D8D3C9" strokeWidth="1" />
                  {/* Diagonal spoke 1 (2 o'clock / 8 o'clock) */}
                  <line x1="141" y1="100" x2="279" y2="180" stroke="#D8D3C9" strokeWidth="1" />
                  {/* Diagonal spoke 2 (4 o'clock / 10 o'clock) */}
                  <line x1="141" y1="180" x2="279" y2="100" stroke="#D8D3C9" strokeWidth="1" />

                  {/* Central Leaves Outline Graphic */}
                  <g transform="translate(210, 140) scale(0.9) translate(-12, -12)">
                    <path d="M12 22A7 7 0 0 1 5 15c0-4 3-7 9-9 .6 5-1 9-3 11" fill="none" stroke="#687C59" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 23c3-3 6-4 9-4" fill="none" stroke="#687C59" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>

                  {/* Evenly Distributed Labels (Bold & Clear Charcoal Color) */}
                  {/* Collagen Dynamics (Top-Left) */}
                  <text x="155" y="45" fill="#222222" fontSize="9.5" fontWeight="700" letterSpacing="0.12em" textAnchor="middle" fontFamily="var(--font-sans), sans-serif">COLLAGEN DYNAMICS</text>
                  
                  {/* Vascular Supply (Top-Right) */}
                  <text x="265" y="45" fill="#222222" fontSize="9.5" fontWeight="700" letterSpacing="0.12em" textAnchor="middle" fontFamily="var(--font-sans), sans-serif">VASCULAR SUPPLY</text>
                  
                  {/* Hormonal Environment (Bottom-Right) */}
                  <text x="285" y="190" fill="#222222" fontSize="9.5" fontWeight="700" letterSpacing="0.12em" textAnchor="start" fontFamily="var(--font-sans), sans-serif">HORMONAL ENVIRONMENT</text>
                  
                  {/* Metabolic Health (Bottom) */}
                  <text x="210" y="250" fill="#222222" fontSize="9.5" fontWeight="700" letterSpacing="0.12em" textAnchor="middle" fontFamily="var(--font-sans), sans-serif">METABOLIC HEALTH</text>
                  
                  {/* Oxidative Stress (Bottom-Left) */}
                  <text x="135" y="190" fill="#222222" fontSize="9.5" fontWeight="700" letterSpacing="0.12em" textAnchor="end" fontFamily="var(--font-sans), sans-serif">OXIDATIVE STRESS</text>
                  
                  {/* Inflammation (Middle-Left) */}
                  <text x="120" y="143" fill="#222222" fontSize="9.5" fontWeight="700" letterSpacing="0.12em" textAnchor="end" fontFamily="var(--font-sans), sans-serif">INFLAMMATION</text>
                </svg>
              </div>

            </div>

            {/* Right Block: Heading and Multi-Column Checklist (48% width, Clean/Open spacing) */}
            <div className="w-full lg:w-[48%] flex flex-col justify-center pl-0 lg:pl-10 mt-8 lg:mt-0">
              <div>
                <h2 className="font-serif text-[18px] md:text-[20px] lg:text-[18px] xl:text-[22px] leading-[1.3] text-neutral-950 font-normal mb-2">
                  Who Are These Programs Designed For ?
                </h2>
                <p className="text-neutral-500 text-[13px] md:text-[14px] font-medium mb-6">
                  Individuals experiencing:
                </p>
                
                {/* Desktop 3-Column Structured Checklist (Exact Row Alignment) */}
                <div className="hidden lg:grid grid-cols-3 gap-x-6 gap-y-5">
                  {gridRows.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      {row.map((item, colIndex) => {
                        if (!item) {
                          return <div key={colIndex} className="hidden lg:block" />;
                        }
                        return (
                          <div key={item} className="flex items-start gap-2.5">
                            <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#EBF0E6] text-[#4E5C46] mt-0.5">
                              <CheckCircleIcon size={12} className="text-[#687C59]" />
                            </div>
                            <span className="text-neutral-800 text-[11px] xl:text-[11.5px] font-medium leading-tight">
                              {item}
                            </span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                {/* Mobile / Tablet Responsive 2-Column/1-Column Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-x-6 gap-y-4">
                  {flatSymptoms.map(text => (
                    <div key={text} className="flex items-start gap-2.5">
                      <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#EBF0E6] text-[#4E5C46] mt-0.5">
                        <CheckCircleIcon size={12} className="text-[#687C59]" />
                      </div>
                      <span className="text-neutral-800 text-[12px] font-medium leading-tight">
                        {text}
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


  return (
    <section className="w-full py-16 md:py-20" style={{ background: "var(--brand-cream)" }}>
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Card: Who Is This Program Designed For */}
          <div className="w-full lg:col-span-5 xl:col-span-6 bg-[#FAF8F3] rounded-[24px] p-6 md:p-8 border-[0.5px] border-[#E8DDD0] relative overflow-hidden flex flex-col justify-center">
            
            <div className="relative z-10 w-full lg:w-[85%]">
              <h2 
                className="text-[22px] md:text-[26px] xl:text-[28px] font-medium mb-2 text-[#1F1F1F]" 
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
              >
                Who Is This Program Designed For
              </h2>
              <p className="text-[#1F1F1F] text-[15px] font-medium mb-6">
                Individuals experiencing:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {/* Left Column */}
                <div className="flex flex-col gap-5">
                  {[
                    "Unexplained weight gain",
                    "Abdominal obesity",
                    "Insulin resistance",
                    "Prediabetes or Type 2 Diabetes",
                    "Fatty liver disease",
                    "Fatigue and reduced stamina",
                    "Poor exercise recovery"
                  ].map(text => (
                    <div key={text} className="flex items-start gap-2.5">
                      <CheckCircleIcon size={20} className="shrink-0 mt-0.5" style={{ color: "var(--brand-olive)" }} />
                      <span className="text-[#1F1F1F] text-[13px] font-medium leading-snug">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-5">
                  {[
                    "Stubborn weight despite diet and exercise",
                    "Metabolic slowdown after menopause or andropause",
                    "Cravings and appetite dysregulation",
                    "Body composition decline",
                    "Recurrent weight regain after previous programs"
                  ].map(text => (
                    <div key={text} className="flex items-start gap-2.5">
                      <CheckCircleIcon size={20} className="shrink-0 mt-0.5" style={{ color: "var(--brand-olive)" }} />
                      <span className="text-[#1F1F1F] text-[13px] font-medium leading-snug">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Silhouette Image */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-80 z-0 hidden lg:block w-[180px] xl:w-[200px]">
              <Image 
                src="/images/landing/home-focus-metabolic-transparent.png" 
                alt="Human body silhouette" 
                width={200} 
                height={500} 
                className="object-contain object-right"
              />
            </div>
          </div>
          
          {/* Right Card: This Is About More Than Appearance */}
          <div className="w-full lg:col-span-7 xl:col-span-6 bg-[#56221E] rounded-[24px] p-6 md:p-8 flex flex-col justify-center shadow-xl border-[0.5px] border-[#4a1c18]/50">
            <div className="text-center mb-6">
              <h3 
                className="text-[22px] md:text-3xl text-[#F9F6F0] font-medium mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                This Is About More Than Appearance.
              </h3>
              <p className="text-[#F9F6F0]/90 text-[14px] md:text-[15px] font-medium">
                Poor metabolic health affects every dimension of your life.
              </p>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-between items-start gap-y-6 gap-x-2 md:gap-x-1 lg:gap-x-2 mt-4 w-full">
              {/* Cognition */}
              <div className="flex flex-col items-center flex-1 min-w-0 max-w-[85px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M12 2a8 8 0 0 0-8 8c0 2.5 1.5 5 2 7l1 3h10l1-3c.5-2 2-4.5 2-7a8 8 0 0 0-8-8z"></path>
                    <path d="M9 16v-2a3 3 0 0 1 6 0v2"></path>
                    <path d="M12 12v.01"></path>
                  </svg>
                </div>
                <span className="text-white text-[11px] md:text-[12px] font-medium text-center leading-tight">Cognition</span>
              </div>
              
              <div className="hidden md:flex text-white/30 text-xs mt-4">•</div>
              
              {/* Energy */}
              <div className="flex flex-col items-center flex-1 min-w-0 max-w-[85px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                  </svg>
                </div>
                <span className="text-white text-[11px] md:text-[12px] font-medium text-center leading-tight">Energy</span>
              </div>
              
              <div className="hidden md:flex text-white/30 text-xs mt-4">•</div>

              {/* Hormones */}
              <div className="flex flex-col items-center flex-1 min-w-0 max-w-[85px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="6" r="3"></circle>
                    <path d="m9 15 6-6"></path>
                  </svg>
                </div>
                <span className="text-white text-[11px] md:text-[12px] font-medium text-center leading-tight">Hormones</span>
              </div>
              
              <div className="hidden md:flex text-white/30 text-xs mt-4">•</div>

              {/* Sleep */}
              <div className="flex flex-col items-center flex-1 min-w-0 max-w-[85px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
                <span className="text-white text-[11px] md:text-[12px] font-medium text-center leading-tight">Sleep</span>
              </div>
              
              <div className="hidden md:flex text-white/30 text-xs mt-4">•</div>

              {/* Vascular Health */}
              <div className="flex flex-col items-center flex-1 min-w-0 max-w-[85px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                </div>
                <span className="text-white text-[11px] md:text-[12px] font-medium text-center leading-tight">Vascular<br/>Health</span>
              </div>
              
              <div className="hidden md:flex text-white/30 text-xs mt-4">•</div>

              {/* Inflammation */}
              <div className="flex flex-col items-center flex-1 min-w-0 max-w-[85px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                  </svg>
                </div>
                <span className="text-white text-[11px] md:text-[12px] font-medium text-center leading-tight">Inflammation</span>
              </div>
              
              <div className="hidden md:flex text-white/30 text-xs mt-4">•</div>

              {/* Long-Term Disease Risk */}
              <div className="flex flex-col items-center flex-1 min-w-0 max-w-[85px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <span className="text-white text-[11px] md:text-[12px] font-medium text-center leading-tight">Long-Term<br/>Disease&nbsp;Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
