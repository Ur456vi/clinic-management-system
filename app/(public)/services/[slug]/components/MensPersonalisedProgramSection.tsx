import { type ServiceContent } from "@/components/public/services-config";

export function MensPersonalisedProgramSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "mens-hormonal") return null;

  const items = [
    {
      title: "Testosterone\nOptimization",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
          <path d="M12 8v8M8 12h8" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      )
    },
    {
      title: "Metabolic\nCorrection",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
        </svg>
      )
    },
    {
      title: "Sexual Health\nSupport",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <circle cx="10" cy="14" r="6" />
          <path d="M14.24 9.76L19 5" />
          <path d="M15 5h4v4" />
        </svg>
      )
    },
    {
      title: "Sleep & Recovery\nOptimization",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          <path d="M16 4h.01M18 6h.01" />
        </svg>
      )
    },
    {
      title: "Body Composition\nRestoration",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <rect x="4" y="5" width="16" height="14" rx="2" ry="2" />
          <path d="M12 9a2 2 0 1 0 0 4 2 2 0 1 0 0-4z" />
          <path d="M12 13v6" />
        </svg>
      )
    },
    {
      title: "Stress & Inflammation\nManagement",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M12 22c4-4 8-6 8-12a8 8 0 0 0-16 0c0 6 4 8 8 12z" />
          <path d="M12 22V10" />
          <path d="M12 16c-2-2-4-2-4-2" />
          <path d="M12 14c2-2 4-2 4-2" />
        </svg>
      )
    },
    {
      title: "Targeted\nSupplements",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <rect x="7" y="7" width="10" height="14" rx="2" ry="2" />
          <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
          <path d="M10 14h4" />
          <path d="M12 12v4" />
        </svg>
      )
    },
    {
      title: "Lifestyle & Performance\nIntervention",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <circle cx="16" cy="6" r="2" />
          <path d="M14 10l-4 3-2-2" />
          <path d="M10 13l2 3v5" />
          <path d="M14 10l3-2 3 2" />
          <path d="M12 20h8" />
        </svg>
      )
    }
  ];

  return (
    <section className="w-full bg-[#FCFCFA] pt-6 pb-16 md:pt-10 md:pb-24">
      <div className="mx-auto max-w-[1440px] px-6">
        
        {/* Title with Lines */}
        <div className="flex items-center justify-center mb-16 opacity-90">
          <div className="h-[1px] flex-1 bg-[#E5E0D8] max-w-[300px]" />
          <h2 
            className="text-[#1F1F1F] font-medium leading-[1.2] px-6 text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 32px)",
            }}
          >
            Your Personalised Program May Include
          </h2>
          <div className="h-[1px] flex-1 bg-[#E5E0D8] max-w-[300px]" />
        </div>

        {/* 8 Items Row */}
        <div className="flex flex-nowrap overflow-x-auto lg:overflow-visible scrollbar-hide items-center justify-start lg:justify-center w-full pb-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center shrink-0">
              {/* Item Column */}
              <div className="flex flex-col items-center justify-start w-[140px] lg:w-[150px]">
                
                {/* Circle Icon */}
                <div className="w-[75px] h-[75px] rounded-full border border-[#E5E0D8] bg-white flex items-center justify-center mb-5 shadow-sm transition-transform hover:scale-105 duration-300">
                  {item.icon}
                </div>
                
                {/* Text Label */}
                <h3 className="text-[#1F1F1F] font-bold text-[11px] xl:text-[12px] leading-snug whitespace-pre-line text-center">
                  {item.title}
                </h3>
                
              </div>

              {/* Divider (except last) */}
              {idx < items.length - 1 && (
                <div className="w-[1px] h-[60px] bg-[#E5E0D8] mx-2 lg:mx-4 shrink-0 opacity-60" />
              )}
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
