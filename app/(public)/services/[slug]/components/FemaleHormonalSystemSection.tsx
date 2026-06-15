import { ResolvedIcon } from "@/components/public/icon-resolver";
import { type ServiceContent } from "@/components/public/services-config";

export function FemaleHormonalSystemSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "female-hormonal") return null;

  const items = [
    { label: "Hormonal\nSignaling", icon: "leaf" as const },
    { label: "Metabolic\nFunction", icon: "chart" as const },
    { label: "Brain\nChemistry", icon: "brain" as const },
    { label: "Vascular\nHealth", icon: "heart" as const },
    { label: "Inflammatory\nPathways", icon: "shield" as const },
    { label: "Bone\nIntegrity", icon: "scale" as const },
    { label: "Sleep\nArchitecture", icon: "clock" as const },
    { label: "Cognitive\nPerformance", icon: "target" as const },
  ];

  return (
    <section className="w-full relative overflow-hidden border-t border-[#E8EBD9]" style={{ background: "linear-gradient(to right, #FFFFFF, #FAF8F1)" }}>
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row items-center gap-10 px-6 py-6 md:px-12 md:py-10 relative z-10">
        
        {/* Left Column (Text) */}
        <div className="lg:w-[25%] flex flex-col justify-center shrink-0 pr-4 z-20">
          <h2
            className="text-[#1F1F1F] font-medium leading-[1.1] mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 40px)",
            }}
          >
            Menopause Is<br />Not Just Hormonal
          </h2>
          <p className="text-[#333333] font-medium text-[13px] md:text-[14px] leading-[1.6] max-w-[280px]">
            Perimenopause and menopause<br />
            are profound biological transitions<br />
            involving multiple systems.
          </p>
        </div>

        {/* Center Column (Grid of 8 Icons) */}
        <div className="lg:w-[45%] shrink-0 z-20">
          <div className="grid grid-cols-4 gap-x-2 gap-y-6">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-[56px] h-[56px] rounded-full border border-[#889A6A]/60 mb-2 bg-white/30 shadow-[0_2px_10px_rgba(136,154,106,0.05)]">
                   <ResolvedIcon name={item.icon} size={32} className="text-[#889A6A]" />
                </div>
                <span className="text-[#1F1F1F] text-[11px] font-bold leading-tight whitespace-pre-line px-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Image & Text) */}
        <div className="lg:w-[35%] flex-1 relative min-h-[350px] flex items-center justify-end z-10">
          {/* Translucent silhouette figure — no border, blends into background */}
          <div className="absolute inset-y-0 left-[-220px] lg:left-[-240px] flex items-center justify-start pointer-events-none z-10">
            <img 
              src="/images/landing/home-focus-female.png" 
              alt="Female biological systems"
              className="max-h-[100%] w-auto object-contain object-left"
              style={{
                opacity: 0.25,
                filter: "sepia(0.4) hue-rotate(40deg) saturate(0.6) brightness(1.1)",
              }}
            />
            {/* Anatomical network overlay — connected dots showing body systems */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 300 500"
              fill="none"
              style={{ opacity: 0.55 }}
            >
              {/* Brain node */}
              <circle cx="142" cy="52" r="4" fill="#889A6A" opacity="0.7" />
              <circle cx="142" cy="52" r="12" stroke="#889A6A" strokeWidth="0.6" opacity="0.3" />

              {/* Neck/thyroid */}
              <circle cx="146" cy="95" r="3" fill="#889A6A" opacity="0.5" />
              <line x1="142" y1="56" x2="146" y2="92" stroke="#889A6A" strokeWidth="0.6" opacity="0.4" />

              {/* Heart node */}
              <circle cx="156" cy="155" r="4.5" fill="#889A6A" opacity="0.65" />
              <circle cx="156" cy="155" r="14" stroke="#889A6A" strokeWidth="0.5" opacity="0.25" />
              <line x1="146" y1="98" x2="156" y2="151" stroke="#889A6A" strokeWidth="0.5" opacity="0.35" />

              {/* Left lung cluster */}
              <circle cx="130" cy="140" r="2.5" fill="#A8B89A" opacity="0.5" />
              <circle cx="122" cy="155" r="2" fill="#A8B89A" opacity="0.4" />
              <line x1="130" y1="140" x2="156" y2="155" stroke="#889A6A" strokeWidth="0.4" opacity="0.3" />
              <line x1="122" y1="155" x2="130" y2="140" stroke="#889A6A" strokeWidth="0.4" opacity="0.3" />

              {/* Right lung cluster */}
              <circle cx="178" cy="138" r="2.5" fill="#A8B89A" opacity="0.5" />
              <circle cx="185" cy="152" r="2" fill="#A8B89A" opacity="0.4" />
              <line x1="178" y1="138" x2="156" y2="155" stroke="#889A6A" strokeWidth="0.4" opacity="0.3" />
              <line x1="185" y1="152" x2="178" y2="138" stroke="#889A6A" strokeWidth="0.4" opacity="0.3" />

              {/* Stomach / core */}
              <circle cx="152" cy="200" r="3" fill="#889A6A" opacity="0.5" />
              <line x1="156" y1="159" x2="152" y2="197" stroke="#889A6A" strokeWidth="0.5" opacity="0.35" />

              {/* Spine line */}
              <circle cx="150" cy="240" r="2.5" fill="#A8B89A" opacity="0.45" />
              <circle cx="148" cy="280" r="2.5" fill="#A8B89A" opacity="0.4" />
              <line x1="152" y1="203" x2="150" y2="237" stroke="#889A6A" strokeWidth="0.4" opacity="0.3" />
              <line x1="150" y1="243" x2="148" y2="277" stroke="#889A6A" strokeWidth="0.4" opacity="0.3" />

              {/* Pelvis / reproductive */}
              <circle cx="148" cy="310" r="3.5" fill="#889A6A" opacity="0.5" />
              <circle cx="148" cy="310" r="10" stroke="#889A6A" strokeWidth="0.5" opacity="0.2" />
              <line x1="148" y1="283" x2="148" y2="306" stroke="#889A6A" strokeWidth="0.4" opacity="0.3" />

              {/* Hip nodes */}
              <circle cx="125" cy="320" r="2" fill="#A8B89A" opacity="0.35" />
              <circle cx="172" cy="318" r="2" fill="#A8B89A" opacity="0.35" />
              <line x1="125" y1="320" x2="148" y2="310" stroke="#889A6A" strokeWidth="0.3" opacity="0.25" />
              <line x1="172" y1="318" x2="148" y2="310" stroke="#889A6A" strokeWidth="0.3" opacity="0.25" />

              {/* Shoulder nodes */}
              <circle cx="110" cy="115" r="2" fill="#A8B89A" opacity="0.4" />
              <circle cx="190" cy="112" r="2" fill="#A8B89A" opacity="0.4" />
              <line x1="110" y1="115" x2="146" y2="95" stroke="#889A6A" strokeWidth="0.3" opacity="0.25" />
              <line x1="190" y1="112" x2="146" y2="95" stroke="#889A6A" strokeWidth="0.3" opacity="0.25" />
            </svg>
          </div>
          
          {/* Right Text (Exact line wrapping) */}
          <div className="relative z-20 pl-[160px] lg:pl-[200px] pt-4 flex flex-col justify-center">
            <p className="text-[#1F1F1F] text-[12px] md:text-[13px] font-semibold leading-relaxed mb-6 whitespace-nowrap">
              These systems are<br />deeply interconnected.
            </p>
            <p className="text-[#333333] text-[12px] md:text-[13px] font-medium leading-[1.8] whitespace-nowrap">
              When hormones shift,<br />
              every major physiological<br />
              system begins responding<br />
              to that change.
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}
