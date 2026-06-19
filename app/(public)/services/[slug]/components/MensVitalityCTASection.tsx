import { type ServiceContent } from "@/components/public/services-config";
import Link from "next/link";

export function MensVitalityCTASection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "mens-hormonal") return null;

  const CalendarClockIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FAF8F3" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
      {/* Clipboard / Calendar body */}
      <rect x="4" y="5" width="16" height="16" rx="2" ry="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="4" y1="11" x2="20" y2="11" />
      {/* Some abstract lines for text */}
      <line x1="8" y1="15" x2="12" y2="15" />
      
      {/* Clock badge on bottom right */}
      <circle cx="17" cy="17" r="5" fill="#4A1515" stroke="#FAF8F3" strokeWidth="1" />
      <polyline points="17 15 17 17 18.5 18.5" stroke="#FAF8F3" strokeWidth="1" />
    </svg>
  );

  return (
    <section className="w-full bg-[#FCFCFA] py-4 md:py-8">
      <div className="mx-auto max-w-[1440px] px-6">
        
        <div 
          className="w-full rounded-2xl flex flex-col lg:flex-row items-center justify-between p-8 lg:p-10 xl:p-12 shadow-md"
          style={{ 
            background: "linear-gradient(90deg, #421614 0%, #5E1F1C 50%, #4A1916 100%)" 
          }}
        >
          
          {/* Left: Icon & Text */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:gap-8 mb-8 lg:mb-0 text-center sm:text-left">
            <div className="shrink-0 mt-1">
              <CalendarClockIcon />
            </div>
            
            <div className="flex flex-col">
              <h2 
                className="text-[#FAF8F3] font-medium leading-tight mb-2"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(24px, 2.5vw, 32px)",
                }}
              >
                Disease Is A Late Event. Understanding Physiology Comes First
              </h2>
              <p className="text-[#FAF8F3]/90 text-[13px] md:text-[14px] font-medium tracking-wide">
                Take the first step toward renewed energy, performance, and confidence.
              </p>
            </div>
          </div>
          
          {/* Right: Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <Link 
              href="/consultation"
              className="flex items-center justify-center bg-[#657153] hover:bg-[#525B42] transition-colors text-[#FAF8F3] font-medium text-[13px] px-6 py-3.5 rounded-lg whitespace-nowrap group"
            >
              Book Your Consultation
              <svg className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            
            <Link 
              href="/assessment"
              className="flex items-center justify-center border border-[#FAF8F3]/40 hover:bg-[#FAF8F3]/10 transition-colors text-[#FAF8F3] font-medium text-[13px] px-6 py-3.5 rounded-lg whitespace-nowrap group"
            >
              Take the Hormone Assessment
              <svg className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
          
        </div>
        
      </div>
    </section>
  );
}
