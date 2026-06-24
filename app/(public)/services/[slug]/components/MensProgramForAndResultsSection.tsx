import { type ServiceContent } from "@/components/public/services-config";

export function MensProgramForAndResultsSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "mens-hormonal") return null;

  const leftItemsColumn1 = [
    "Men experiencing fatigue and low energy",
    "Reduced libido or sexual performance",
    "Erectile dysfunction",
    "Loss of muscle and strength",
    "Poor recovery after exercise",
    "Stubborn fat, especially around the abdomen"
  ];

  const leftItemsColumn2 = [
    "Brain fog and poor focus",
    "Sleep distubrances",
    "Low motivetion or drive",
    "Age-related hormonal decline",
    "Metabolic dysfunction or insulin resistance"
  ];

  const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#657153" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2.5 2.5 5-5" />
    </svg>
  );

  const stats = [
    { value: "87%", label: "Energy\n& Stamina" },
    { value: "82%", label: "Libido\n& Performance" },
    { value: "79%", label: "Sleep\n& Recovery" },
    { value: "89%", label: "Strength\n& Lean Muscle" },
  ];

  return (
    <section className="w-full bg-[#FCFCFA] pb-6 md:pb-10">
      <div className="mx-auto max-w-[1440px] px-6">
        
        <div className="flex flex-col xl:flex-row items-stretch gap-0 border border-[#F0EBE1] rounded-2xl overflow-hidden">
          
          {/* Left Block: Who This Program Is For */}
          <div className="flex-1 bg-[#FCFBF8] p-8 lg:p-12">
            <h2 
              className="text-[#1F1F1F] font-medium leading-[1.2] mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 2.5vw, 28px)",
              }}
            >
              Who This Program Is For
            </h2>
            <p className="text-[#1F1F1F] font-semibold text-[13px] md:text-[14px] mb-8">
              Men who are ready to take control of their health and performance.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-0">
              {/* Column 1 */}
              <div className="flex flex-col gap-4 flex-1 md:pr-6 xl:pr-8 md:border-r border-[#E5E0D8]">
                {leftItemsColumn1.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-[#1F1F1F] text-[11px] xl:text-[12px] font-normal leading-snug whitespace-nowrap">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Column 2 */}
              <div className="flex flex-col gap-4 flex-1 pt-4 md:pt-0 md:pl-6 xl:pl-8">
                {leftItemsColumn2.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-[#1F1F1F] text-[11px] xl:text-[12px] font-normal leading-snug whitespace-nowrap">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Block: Real Results */}
          <div className="flex-1 bg-[#F2F0E9] p-8 lg:p-12 flex flex-col justify-between">
            <div>
              <h2 
                className="text-[#1F1F1F] font-medium leading-[1.2] mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(24px, 2.5vw, 28px)",
                }}
              >
                Real Results. Real Transformations.
              </h2>
              <p className="text-[#1F1F1F] font-medium text-[13px] md:text-[14px] mb-12">
                Our patients report life-changing improvements in quality of life with regards to :
              </p>
              
              {/* Stats Row */}
              <div className="flex flex-row items-center md:justify-between w-full overflow-x-auto pb-4 md:pb-0 gap-4 md:gap-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center shrink-0 snap-center md:contents gap-4 md:gap-0">
                    <div className="flex flex-col items-center text-center md:flex-1 min-w-[120px] md:min-w-0">
                      <div 
                        className="text-[#657153] font-medium leading-none mb-3 text-[32px] md:text-[clamp(32px,3.5vw,42px)]"
                        style={{
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-[#1F1F1F] font-bold text-[11px] leading-snug whitespace-pre-line">
                        {stat.label}
                      </div>
                    </div>
                    
                    {/* Divider */}
                    {idx < stats.length - 1 && (
                      <div className="w-[1px] h-[40px] md:h-[50px] bg-[#D6D3C9] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-[#8F8D88] text-[10px] mt-12 font-medium">
              Results based on internal patient-reported outcomes
            </p>
          </div>
          
        </div>
        
      </div>
    </section>
  );
}
