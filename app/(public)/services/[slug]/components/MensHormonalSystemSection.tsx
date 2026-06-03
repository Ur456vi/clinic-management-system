import { type ServiceContent } from "@/components/public/services-config";
import { ResolvedIcon } from "@/components/public/icon-resolver";
import Image from "next/image";

export function MensHormonalSystemSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "mens-hormonal") return null;

  const rightItems = [
    { label: "Body composition", icon: "target" as const },
    { label: "Stress physiology", icon: "target" as const },
    { label: "Sexual health function", icon: "target" as const },
    { label: "Cognitive performance", icon: "target" as const },
  ];

  const leftItems = [
    { label: "Hormonal signaling", icon: "target" as const },
    { label: "Metabolic efficiency", icon: "target" as const },
    { label: "Vascular integrity", icon: "target" as const },
    { label: "Inflammatory burden", icon: "target" as const },
    { label: "Sleep & recovery quality", icon: "target" as const },
  ];

  return (
    <section className="w-full relative overflow-hidden" style={{ background: "#21211E" }}>
      <div className="mx-auto flex flex-col lg:flex-row items-center justify-between max-w-[1440px] px-6 py-0 md:px-12 relative z-10 gap-8 lg:gap-10">
        
        {/* Left Text Box */}
        <div className="lg:w-[25%] xl:w-[28%] flex flex-col justify-center shrink-0 z-20 py-8 lg:py-0">
          <h2
            className="text-[#FAF8F3] font-medium leading-[1.2] mb-6 whitespace-nowrap"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 32px)",
            }}
          >
            Hormonal decline in men is not<br />
            just abodt testostetrene.
          </h2>
          
          <div className="w-[45px] h-[2px] bg-[#C5A861] mb-8 opacity-80" />
          
          <p className="text-[#FAF8F3]/90 font-medium text-[12px] md:text-[13px] leading-[2.2] tracking-wide whitespace-nowrap">
            It affects your entire physiology—metabolism, vascular<br />
            health, inflammation, recovery, sleep, body composition,<br />
            mental clarity, and sexual function.
          </p>
        </div>

        {/* Center Anatomy Image */}
        <div className="lg:w-[30%] xl:w-[34%] flex justify-center items-center relative z-20 shrink-0">
          <div className="relative w-[280px] h-[320px] lg:w-[340px] lg:h-[380px] shrink-0 opacity-90 mix-blend-screen flex items-center justify-center -my-6">
             <Image 
               src="/images/landing/home-focus-metabolic-transparent.png"
               alt="Male physiology"
               fill
               className="object-contain"
               sizes="(max-width: 1024px) 280px, 340px"
             />
             
             {/* Detailed overlay reproducing the exact image wireframe */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-70">
               <svg viewBox="-200 -250 400 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                 
                 {/* Center at 0, -60 (Heart area relative to torso) */}
                 <g transform="translate(0, -70)">
                   {/* Concentric Circles */}
                   <circle cx="0" cy="0" r="50" stroke="#FAF8F3" strokeWidth="0.4" opacity="0.3" />
                   <circle cx="0" cy="0" r="90" stroke="#FAF8F3" strokeWidth="0.3" opacity="0.25" />
                   <circle cx="0" cy="0" r="130" stroke="#FAF8F3" strokeWidth="0.3" opacity="0.2" />
                   <circle cx="0" cy="0" r="170" stroke="#FAF8F3" strokeWidth="0.2" opacity="0.15" />
                   <circle cx="0" cy="0" r="210" stroke="#FAF8F3" strokeWidth="0.15" opacity="0.1" />

                   {/* Diagonal Lines (~45 degrees) */}
                   <line x1="-180" y1="-180" x2="180" y2="180" stroke="#FAF8F3" strokeWidth="0.4" opacity="0.25" />
                   <line x1="-180" y1="180" x2="180" y2="-180" stroke="#FAF8F3" strokeWidth="0.4" opacity="0.25" />

                   {/* Golden/Orange dots on diagonals at circle intersections */}
                   {/* Radius 90 */}
                   <circle cx="-63.6" cy="-63.6" r="2" fill="#D4AF37" opacity="0.7" />
                   <circle cx="63.6" cy="-63.6" r="2" fill="#D4AF37" opacity="0.7" />
                   
                   {/* Radius 130 */}
                   <circle cx="-91.9" cy="-91.9" r="2.5" fill="#D4AF37" opacity="0.9" />
                   <circle cx="91.9" cy="-91.9" r="2.5" fill="#D4AF37" opacity="0.9" />
                   <circle cx="-91.9" cy="91.9" r="2" fill="#D4AF37" opacity="0.7" />
                   <circle cx="91.9" cy="91.9" r="2" fill="#D4AF37" opacity="0.7" />

                   {/* Radius 170 */}
                   <circle cx="-120.2" cy="-120.2" r="2" fill="#D4AF37" opacity="0.6" />
                   <circle cx="120.2" cy="-120.2" r="2" fill="#D4AF37" opacity="0.6" />
                   <circle cx="-120.2" cy="120.2" r="1.5" fill="#D4AF37" opacity="0.5" />
                   <circle cx="120.2" cy="120.2" r="1.5" fill="#D4AF37" opacity="0.5" />

                   {/* Vertical Meridian Line */}
                   <line x1="0" y1="-100" x2="0" y2="280" stroke="#FAF8F3" strokeWidth="0.6" opacity="0.4" />

                   {/* Center Heart Dot */}
                   <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
                   <circle cx="0" cy="0" r="12" fill="#FFFFFF" opacity="0.15" style={{ filter: "blur(2px)" }} />

                   {/* Other vertical chakra/meridian dots */}
                   <circle cx="0" cy="-60" r="2" fill="#FFFFFF" opacity="0.9" />
                   <circle cx="0" cy="55" r="2.5" fill="#FFFFFF" opacity="0.9" />
                   <circle cx="0" cy="115" r="2.5" fill="#FFFFFF" opacity="0.9" />
                   <circle cx="0" cy="175" r="2" fill="#FFFFFF" opacity="0.8" />
                   <circle cx="0" cy="235" r="2" fill="#FFFFFF" opacity="0.8" />
                 </g>

                 {/* Arm lines and joint dots */}
                 <g transform="translate(0, -70)">
                   {/* Shoulders */}
                   <circle cx="-75" cy="-75" r="2" fill="#FFFFFF" opacity="0.7" />
                   <circle cx="75" cy="-75" r="2" fill="#FFFFFF" opacity="0.7" />
                   
                   {/* Elbows */}
                   <circle cx="-130" cy="20" r="2" fill="#FFFFFF" opacity="0.6" />
                   <circle cx="130" cy="20" r="2" fill="#FFFFFF" opacity="0.6" />
                   
                   {/* Wrists */}
                   <circle cx="-170" cy="130" r="1.5" fill="#FFFFFF" opacity="0.5" />
                   <circle cx="170" cy="130" r="1.5" fill="#FFFFFF" opacity="0.5" />

                   {/* Connecting Arm Lines */}
                   <line x1="-75" y1="-75" x2="-130" y2="20" stroke="#FAF8F3" strokeWidth="0.4" opacity="0.3" />
                   <line x1="-130" y1="20" x2="-170" y2="130" stroke="#FAF8F3" strokeWidth="0.4" opacity="0.3" />
                   
                   <line x1="75" y1="-75" x2="130" y2="20" stroke="#FAF8F3" strokeWidth="0.4" opacity="0.3" />
                   <line x1="130" y1="20" x2="170" y2="130" stroke="#FAF8F3" strokeWidth="0.4" opacity="0.3" />

                   {/* Chest/Pec connection lines */}
                   <path d="M 0 -50 Q -40 -60 -75 -75" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.25" />
                   <path d="M 0 -50 Q 40 -60 75 -75" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.25" />

                   <path d="M 0 10 Q -45 -10 -75 -75" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.25" />
                   <path d="M 0 10 Q 45 -10 75 -75" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.25" />

                   {/* Abs/Core connection lines */}
                   <path d="M 0 10 L -35 55 L 0 70" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.2" />
                   <path d="M 0 10 L 35 55 L 0 70" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.2" />
                   <path d="M 0 70 L -30 115 L 0 130" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.2" />
                   <path d="M 0 70 L 30 115 L 0 130" stroke="#FAF8F3" strokeWidth="0.4" fill="none" opacity="0.2" />
                 </g>

               </svg>
             </div>
          </div>
        </div>
          
        {/* Right Lists */}
        <div className="lg:w-[45%] xl:w-[38%] flex flex-col justify-center shrink-0 z-20">
           <h3 className="text-[#FAF8F3] text-[15px] font-medium leading-relaxed mb-8">
             These systems are deeply interconnected.
           </h3>
           
           <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 xl:gap-12">
             {/* Left List */}
             <div className="flex flex-col gap-5">
               {leftItems.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-3.5">
                   <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#C5A861]/70 bg-transparent shrink-0">
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C5A861" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                       <polyline points="20 6 9 17 4 12" />
                     </svg>
                   </div>
                   <span className="text-[#FAF8F3] text-[12px] md:text-[13px] font-medium leading-tight tracking-wide whitespace-nowrap">
                     {item.label}
                   </span>
                 </div>
               ))}
             </div>
             
             {/* Right List */}
             <div className="flex flex-col gap-5">
               {rightItems.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-3.5">
                   <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#C5A861]/70 bg-transparent shrink-0">
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C5A861" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                       <polyline points="20 6 9 17 4 12" />
                     </svg>
                   </div>
                   <span className="text-[#FAF8F3] text-[12px] md:text-[13px] font-medium leading-tight tracking-wide whitespace-nowrap">
                     {item.label}
                   </span>
                 </div>
               ))}
             </div>
           </div>
        </div>
        
      </div>
    </section>
  );
}
