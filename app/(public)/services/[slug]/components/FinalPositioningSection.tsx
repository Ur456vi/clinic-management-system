import { type ServiceContent } from "@/components/public/services-config";

export function FinalPositioningSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "metabolic-health") return null;

  return (
    <section className="w-full pt-8 md:pt-10 pb-16 md:pb-24 bg-[#FAF8F3]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="w-full flex flex-col md:flex-row rounded-[16px] overflow-hidden border border-[#E8DDD0] shadow-sm">
          
          {/* Left Column */}
          <div className="w-full md:w-[45%] bg-[#EAECE3] pt-10 pb-20 px-8 md:px-12 relative flex flex-col">
            <h3 
              className="text-[#722F27] font-semibold tracking-wider text-[14px] md:text-[16px] uppercase mb-8"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Final Positioning
            </h3>
            <p className="text-[#1F1F1F]/90 text-[14px] md:text-[15px] lg:text-[16px] font-medium leading-[2.2]">
              "The Institute operates with a serious clinical<br className="hidden xl:block" />
              framework at the intersection of Internal Medicine,<br className="hidden xl:block" />
              Pre-Critical Care, Endocrinology, Metabolic health<br className="hidden xl:block" />
              and Regenerative care through physician-led<br className="hidden xl:block" />
              precision frameworks designed for long-term<br className="hidden xl:block" />
              physiological restoration."
            </p>
            
            {/* ECG Waveform SVG at the bottom */}
            <div className="absolute bottom-6 left-0 right-0 w-full overflow-hidden">
              <svg viewBox="0 0 500 80" className="w-full h-[60px]" preserveAspectRatio="none">
                <path 
                  d="M0 40 H 150 L 160 25 L 170 55 L 185 15 L 205 70 L 220 20 L 235 60 L 245 35 L 255 40 H 500" 
                  fill="none" 
                  stroke="#889A6A" 
                  strokeWidth="2.5"
                  strokeLinejoin="miter"
                />
              </svg>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-[55%] bg-[#FAF8F3] p-10 md:p-12 lg:p-16 flex flex-col justify-center items-center md:items-end text-center md:text-right">
            <h2 
              className="text-[#889A6A] text-[22px] md:text-[28px] lg:text-[32px] xl:text-[36px] leading-[1.2] mb-2 lg:mb-3 lg:whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Begin With A Clinical Assessment
            </h2>
            <p className="text-[#1F1F1F]/90 text-[16px] md:text-[18px] lg:text-[20px] mb-10 lg:mb-12 font-normal">
              Start your physician-led biological evaluation
            </p>
            <button className="bg-[#56221E] hover:bg-[#421A17] text-white transition-colors duration-200 py-3.5 px-8 lg:px-10 rounded-full text-[12px] md:text-[13px] font-medium tracking-[0.1em] uppercase">
              Request Consultation
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
