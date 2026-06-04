import { type ServiceContent } from "@/components/public/services-config";

export function MensComprehensiveApproachSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "mens-hormonal") return null;

  const cards = [
    {
      title: "Advanced Hormonal\nAssessment",
      desc: "In-depth evaluation of\nhormones, metabolism,\nand key bbiomarkers.",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <circle cx="11" cy="14" r="3" />
          <line x1="13.12" y1="16.12" x2="16" y2="19" />
        </svg>
      )
    },
    {
      title: "Root Cause\nIdentification",
      desc: "We uncover the underlying\nfactors—not just treat\nthe symptoms.",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M12 22v-8" />
          <path d="M12 14c-2.5-2.5-6-1.5-6-1.5s1 3.5 6 1.5z" />
          <path d="M12 14c2.5-2.5 6-1.5 6-1.5s-1 3.5-6 1.5z" />
          <line x1="12" y1="22" x2="9" y2="19" />
          <line x1="12" y1="22" x2="15" y2="19" />
          <circle cx="12" cy="7" r="3" />
        </svg>
      )
    },
    {
      title: "Personalized\nCare Plan",
      desc: "Targeted interventions\nbased on your unique\nphysiology.",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <polyline points="9 14 11 16 15 11" />
        </svg>
      )
    },
    {
      title: "Optimize & Restore",
      desc: "Hormones, energy,\nstrength, sexual health,\nmetabolism & recovery.",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M7.5 12h9" />
          <path d="M12 7.5v9" />
          <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
        </svg>
      )
    },
    {
      title: "Continuous\nMonitoring",
      desc: "Ongoing tracking,\nrefinement, and support\nfor lasting results.",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M17 10c.7-1.5 1-3.1 1-4.7 0-3-2-5.3-5-5.3s-5 2.3-5 5.3c0 1.6.3 3.2 1 4.7" />
          <path d="M12 10a7.5 7.5 0 0 0-7.5 7.5A4.5 4.5 0 0 0 9 22h6a4.5 4.5 0 0 0 4.5-4.5A7.5 7.5 0 0 0 12 10Z" />
          <path d="M10 16l1.5 1.5 3-3" />
        </svg>
      )
    }
  ];

  return (
    <section className="w-full bg-[#FCFCFA] pt-10 pb-16 md:pt-12 md:pb-20 border-t border-[#F0EBE1]">
      <div className="mx-auto max-w-[1440px] px-6">
        
        {/* Header */}
        <div className="text-center mb-8 lg:mb-10">
          <h2 
            className="text-[#1F1F1F] font-medium leading-[1.2] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 4vw, 40px)",
            }}
          >
            Our Comprehensive Approach
          </h2>
          <p className="text-[#6B6A68] font-medium text-[14px] md:text-[15px] tracking-wide">
            Structured. Personalized. Evidence-Based.
          </p>
        </div>

        {/* 5 Cards Row */}
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-6">
          {cards.map((c, i) => (
            <div 
              key={i}
              className="flex-1 bg-white border border-[#E5E0D8] rounded-xl p-6 lg:p-8 flex flex-col items-center justify-start text-center hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-[60px] h-[60px] flex items-center justify-center mb-6 opacity-80">
                {c.icon}
              </div>
              
              <h3 className="text-[#1F1F1F] font-bold text-[13px] xl:text-[14px] leading-snug mb-4 whitespace-pre-line">
                {c.title}
              </h3>
              
              <p className="text-[#6B6A68] text-[11px] xl:text-[12px] leading-relaxed whitespace-pre-line font-medium">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
