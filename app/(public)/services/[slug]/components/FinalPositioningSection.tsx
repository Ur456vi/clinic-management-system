import { type ServiceContent } from "@/components/public/services-config";
import Link from "next/link";
import { EcgLine } from "@/components/public/ui";

export function FinalPositioningSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "metabolic-health" && svc.slug !== "aesthetic-external") return null;

  if (svc.slug === "aesthetic-external") {
    return (
      <section className="w-full flex flex-col font-sans">
        
        {/* Section D: Deep Olive-Green consultation banner */}
        <div className="w-full bg-[#4E5C46] py-8 border-t border-[#5F7055]">
          <div className="mx-auto max-w-[1440px] px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Left: Lotus / Leaf Icon and Text */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
              <div className="text-white/80 shrink-0">
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M 24 44 V 34" strokeLinecap="round" />
                  <path d="M 24 34 V 14" strokeLinecap="round" />
                  <path d="M 24 34 C 16 22 20 8 24 4 C 28 8 32 22 24 34 Z" strokeLinejoin="round" />
                  <path d="M 24 34 C 14 30 6 20 10 12 C 16 12 22 22 24 34 Z" strokeLinejoin="round" />
                  <path d="M 24 34 C 34 30 42 20 38 12 C 32 12 26 22 24 34 Z" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[#FAF8F5]/90 text-[14px] md:text-[15px] font-medium leading-relaxed tracking-wide">
                Precision Medicine. Regenerative Science. Natural Outcomes.<br className="hidden md:block" />
                Restoring Physiology. Preserving Tissue Health. Supporting Longevity.
              </p>
            </div>

            {/* Right: Two buttons side by side */}
            <div className="flex flex-wrap items-center justify-center gap-4 shrink-0 w-full lg:w-auto">
              <Link 
                href="/assessment" 
                className="bg-[#FAF8F5] hover:bg-[#FAF8F5]/90 text-[#4E5C46] border border-[#FAF8F5] transition-all py-3 px-6 rounded-full text-[12px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
              >
                Request Consultation &rarr;
              </Link>
              <Link 
                href="/services" 
                className="bg-transparent hover:bg-white/5 text-[#FAF8F5] border border-[#FAF8F5]/80 transition-all py-3 px-6 rounded-full text-[12px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
              >
                Explore Our Programs &rarr;
              </Link>
            </div>

          </div>
        </div>

        {/* Section E: Final Positioning Clinical Framework */}
        <div className="w-full pt-4 pb-12 md:pt-6 md:pb-16 bg-[var(--brand-cream)]">
          <div className="mx-auto max-w-[1440px] px-6 md:px-12">
            <div className="w-full flex flex-col md:flex-row rounded-[24px] overflow-hidden border border-[#EAE6DF] shadow-sm bg-[#FAF8F5]">
              
              {/* Left Column: Final Positioning text */}
              <div className="w-full md:w-[48%] bg-[#EAECE3] pt-8 pb-8 md:pb-28 px-8 md:pt-12 relative flex flex-col justify-between overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-[var(--brand-burgundy)] font-semibold uppercase mb-8 font-serif text-[24px] md:text-[32px] leading-[1.3] md:leading-[55px] tracking-[0.5px]">
                    FINAL POSITIONING
                  </h3>
                  <p className="text-neutral-950 font-sans font-medium text-[14px] md:text-[16px] lg:text-[17px] xl:text-[18px] leading-relaxed lg:leading-[30px] tracking-normal">
                    &ldquo;Aesthetic medicine in this Institute exists within a larger framework of Internal Medicine, Endocrinology, Metabolic Health, Regenerative Medicine, and Longevity Science.
Because the quality of aging is influenced not only by procedures, but by the physiology that supports the tissue itself.
&rdquo;
                  </p>
                </div>
                
                {/* ECG Waveform Image at the bottom */}
                <div className="mt-6">
                  <EcgLine />
                </div>
              </div>

              {/* Right Column: Begin assessment call to action */}
              <div className="w-full md:w-[52%] bg-[#FAF8F5] p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center md:items-end text-center md:text-right">
                <h2 className="text-[#889A6A] font-serif text-2xl md:text-[28px] lg:text-[32px] leading-[1.2] mb-3">
                  Begin With A Clinical Assessment
                </h2>
                <p className="text-neutral-900 text-[15px] md:text-[16px] mb-8 font-medium">
                  Start your physician-led biological evaluation
                </p>
                <Link 
                  href="/assessment"
                  className="bg-[#722F27] hover:bg-[#5E241E] text-white transition-colors py-3.5 px-8 md:px-10 rounded-full text-[12px] md:text-[13px] font-semibold tracking-widest uppercase"
                >
                  Request A Consultation
                </Link>
              </div>

            </div>
          </div>
        </div>

      </section>
    );
  }

  return (
    <section className="w-full pt-8 md:pt-10 pb-16 md:pb-24 bg-[#FAF8F3]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="w-full flex flex-col md:flex-row rounded-[16px] overflow-hidden border border-[#E8DDD0] shadow-sm">
          
          {/* Left Column */}
          <div className="w-full md:w-[45%] bg-[#EAECE3] pt-10 pb-10 md:pb-28 px-8 md:px-12 relative flex flex-col overflow-hidden">
            <div className="relative z-10">
              <h3 
                className="text-[#722F27] font-semibold uppercase mb-8 font-serif text-[24px] md:text-[32px] leading-[1.3] md:leading-[55px] tracking-[0.5px]"
              >
                FINAL POSITIONING
              </h3>
              <p className="text-[#1F1F1F]/90 font-sans font-medium text-[14px] md:text-[16px] lg:text-[17px] xl:text-[18px] leading-relaxed lg:leading-[30px] tracking-normal">
                &ldquo;The Institute operates with a serious clinical framework at the intersection of Internal Medicine, Pre-Critical Care, Endocrinology, Metabolic health and Regenerative care through physician-led precision frameworks designed for long-term physiological restoration.&rdquo;
              </p>
            </div>
            
            {/* ECG Waveform Image at the bottom */}
            <div className="mt-6">
              <EcgLine />
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-[55%] bg-[#FAF8F3] p-10 md:p-12 lg:p-16 flex flex-col justify-center items-center md:items-end text-center md:text-right">
            <h2 
              className="text-[#889A6A] text-[22px] md:text-[28px] lg:text-[32px] xl:text-[36px] leading-[1.2] mb-2 lg:mb-3"
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
