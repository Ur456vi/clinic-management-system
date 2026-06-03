import { type ServiceContent } from "@/components/public/services-config";

export function MensFeaturesBand({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "mens-hormonal") return null;

  const features = [
    {
      title: "Physician-Led",
      desc: "Expert care from\nexperienced specialists.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#657153" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 shrink-0">
          {/* Abstract leaf/shield */}
          <path d="M12 3L8 7v4c0 4.4 4 8 4 8s4-3.6 4-8V7l-4-4z" />
          <path d="M12 3v18" />
          <path d="M9 13l6-2" />
          <path d="M9 11l6 2" />
        </svg>
      )
    },
    {
      title: "Evidence-Based",
      desc: "Science-driven protocols\nand treatment plans.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#657153" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 shrink-0">
          {/* Abstract microscope / DNA */}
          <path d="M7 19v-6a4 4 0 0 1 4-4h2" />
          <path d="M15 13l-4-4 4-4 4 4-4 4z" />
          <path d="M5 21h14" />
          <path d="M13 15v6" />
        </svg>
      )
    },
    {
      title: "Confidential",
      desc: "Your privacy and results\nare always protected.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#657153" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 shrink-0">
          {/* Shield with keyhole */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="2.5" />
          <path d="M12 13.5v2.5" />
        </svg>
      )
    },
    {
      title: "Long-Term Focus",
      desc: "Sustainable results,\nnot quick fixes.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#657153" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 shrink-0">
          {/* Clock with target */}
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l2.5 2.5" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
        </svg>
      )
    },
    {
      title: "Holistic & Integrated",
      desc: "We treat the whole you,\nnot just one number.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#657153" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 shrink-0">
          {/* Hands holding figure */}
          <path d="M12 21.5c-3-2-7-5.5-7-10a5.5 5.5 0 0 1 11 0c0 4.5-4 8-7 10z" />
          <circle cx="12" cy="9" r="2" />
          <path d="M7 21h10" />
        </svg>
      )
    }
  ];

  return (
    <section className="w-full bg-[#FCFBF8] border-b border-[#F0EBE1] py-8 md:py-12">
      <div className="mx-auto max-w-[1440px] px-6">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-4">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4 flex-1">
              {/* Icon Container */}
              <div className="mt-0.5 shrink-0">
                {feature.icon}
              </div>
              
              {/* Text */}
              <div className="flex flex-col">
                <h3 className="text-[#1F1F1F] font-bold text-[12px] xl:text-[13px] leading-tight mb-1">
                  {feature.title}
                </h3>
                <p className="text-[#4A4947] font-medium text-[11px] xl:text-[12px] leading-relaxed whitespace-pre-line">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
