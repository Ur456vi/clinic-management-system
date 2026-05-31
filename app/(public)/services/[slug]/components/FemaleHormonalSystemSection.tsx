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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-6">
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
          {/* Mannequin Image (Fully visible, not cropped) */}
          <div className="absolute inset-y-[-20px] left-[-220px] lg:left-[-260px] flex items-center justify-start pointer-events-none z-10">
            <img 
              src="/images/landing/home-focus-female.png" 
              alt="Female biological systems"
              className="max-h-[110%] w-auto object-contain object-left"
            />
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
