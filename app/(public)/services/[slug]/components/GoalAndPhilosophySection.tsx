import Image from "next/image";
import { type ServiceContent } from "@/components/public/services-config";

export function GoalAndPhilosophySection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "metabolic-health" && svc.slug !== "aesthetic-external") return null;

  if (svc.slug === "aesthetic-external") {
    return (
      <section className="w-full py-4 md:py-6 bg-[var(--brand-cream)] font-sans">
        <div className="mx-auto max-w-[1680px] px-6 md:px-12">
          
          {/* Single Unified Container */}
          <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-[24px] py-8 px-8 md:py-10 md:px-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-stretch">
              
              {/* Left Column */}
              <div className="flex flex-row items-start gap-6 md:gap-8 border-b border-[#EAE6DF] lg:border-b-0 lg:border-r lg:border-[#EAE6DF] pb-8 lg:pb-0 lg:pr-16">
                {/* Space for Left Image */}
                <div className="w-[60px] md:w-[70px] shrink-0" />
                
                {/* Left Text */}
                <div className="flex-1">
                  <h3 className="font-serif text-[16px] md:text-[18px] lg:text-[19px] xl:text-[20px] leading-snug text-[var(--brand-burgundy)] font-normal">
                    Because external appearance cannot be separated from internal physiology.
                  </h3>
                  <p className="mt-4 text-[13px] md:text-[14px] leading-relaxed text-neutral-950 font-medium">
                    When the body functions better internally, the effects are often visible externally—through skin quality, vitality, recovery, facial integrity, and the way an individual carries themselves over time.
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-row items-start gap-6 md:gap-8 pt-8 lg:pt-0 lg:pl-16">
                {/* Space for Right Image */}
                <div className="w-[60px] md:w-[70px] shrink-0" />
                
                {/* Right Text */}
                <div className="flex-1">
                  <p className="font-serif text-[18px] md:text-[20px] lg:text-[21px] xl:text-[23px] leading-snug text-[var(--brand-burgundy)] font-normal">
                    True aesthetic medicine should not create a different face.
                  </p>
                  <p className="mt-4 font-serif text-[16px] md:text-[18px] lg:text-[19px] xl:text-[20px] leading-snug text-neutral-950 font-normal">
                    It should help preserve the health, integrity, and vitality of the one already there.
                  </p>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col">
      {/* Top Banner (Cream/Olive) */}
      <div className="w-full bg-[#EAECE3] relative overflow-hidden flex items-center">
        
        {/* Left Background Image */}
        <div className="absolute left-0 top-0 bottom-0 w-[40%] lg:w-[35%] hidden md:block">
          <img 
            src="/images/landing/metabolic-salad-tape.png" 
            alt="Healthy Salad Bowl with Measuring Tape" 
            className="w-full h-full object-cover"
          />
          {/* Gradient fade to blend edge into the cream background */}
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#EAECE3] to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-[1440px] w-full px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center justify-end py-8 md:py-10">
          
          {/* We allocate the right 60-65% for content to avoid overlapping the image on desktop */}
          <div className="w-full md:w-[60%] lg:w-[65%] flex flex-col xl:flex-row gap-6 lg:gap-8 xl:gap-12 items-center justify-between ml-auto">
            
            {/* Middle Text */}
            <div className="w-full xl:w-[65%] flex flex-col gap-4">
              <h2 
                className="text-[20px] md:text-[24px] xl:text-[26px] font-medium text-[#1F1F1F] leading-[1.3]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
              >
                The Goal Is Not Just To Make You Lighter.<br />
                It Is To Make You <span className="text-[#5C6B46]">Metabolically Stronger.</span>
              </h2>
              <p className="text-[#1F1F1F]/80 text-[13px] md:text-[14px] font-medium leading-relaxed">
                Because sustainable health is not built through restriction and short-term intensity.<br className="hidden md:block" />
                It is built through physiological restoration, structured monitoring,<br className="hidden md:block" />
                and long-term metabolic stability.
              </p>
            </div>

            {/* Right Buttons */}
            <div className="w-full xl:w-[35%] flex flex-col gap-3">
              <button className="w-full bg-[#889A6A] hover:bg-[#7A8A5F] text-white transition-colors duration-200 py-3.5 px-4 rounded-[8px] flex items-center justify-center gap-2 text-[13px] md:text-[14px] font-medium shadow-sm whitespace-nowrap">
                Book Consultation 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </button>
              <button className="w-full bg-transparent border border-[#722F27] text-[#722F27] hover:bg-[#722F27]/5 transition-colors duration-200 py-3.5 px-4 rounded-[8px] flex items-center justify-center gap-2 text-[13px] md:text-[14px] font-medium whitespace-nowrap">
                Start Your Metabolic Assessment
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Bottom Band (Burgundy) */}
      <div className="w-full bg-[#722F27] py-2 md:py-2.5 border-t border-[#8B3A31]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          
          {/* Lotus/Leaf Icon */}
          <div className="text-white/80 shrink-0">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Veins */}
              <path d="M 24 44 V 34" strokeLinecap="round" />
              <path d="M 24 34 V 14" strokeLinecap="round" />
              <path d="M 24 34 Q 18 26 13 18" strokeLinecap="round" />
              <path d="M 24 34 Q 30 26 35 18" strokeLinecap="round" />
              <path d="M 24 34 Q 16 34 10 30" strokeLinecap="round" />
              <path d="M 24 34 Q 32 34 38 30" strokeLinecap="round" />

              {/* Leaf Outlines */}
              {/* Center Leaf */}
              <path d="M 24 34 C 16 22 20 8 24 4 C 28 8 32 22 24 34 Z" strokeLinejoin="round" />
              {/* Upper Left Leaf */}
              <path d="M 24 34 C 14 30 6 20 10 12 C 16 12 22 22 24 34 Z" strokeLinejoin="round" />
              {/* Upper Right Leaf */}
              <path d="M 24 34 C 34 30 42 20 38 12 C 32 12 26 22 24 34 Z" strokeLinejoin="round" />
              {/* Lower Left Leaf */}
              <path d="M 24 34 C 16 42 2 34 6 28 C 10 24 20 28 24 34 Z" strokeLinejoin="round" />
              {/* Lower Right Leaf */}
              <path d="M 24 34 C 32 42 46 34 42 28 C 38 24 28 28 24 34 Z" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Text */}
          <p className="text-white/90 text-[15px] md:text-[17px] font-normal leading-relaxed text-center md:text-left">
            The body does not change meaningfully through punishment.<br className="hidden md:block" />
            It changes when <strong className="font-semibold text-white">physiology</strong> begins functioning the way it was designed to.
          </p>

        </div>
      </div>
    </section>
  );
}
