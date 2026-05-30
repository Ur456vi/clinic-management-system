import Image from "next/image";
import { CheckCircleIcon } from "@/components/public/icons";
import { type ServiceContent } from "@/components/public/services-config";

export function ProgramDesignedForSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "metabolic-health") return null;

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
            
            <div className="flex flex-nowrap justify-between items-start gap-x-1 lg:gap-x-2 mt-4 w-full">
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
