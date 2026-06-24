import React from "react";
import Image from "next/image";
import { type ServiceContent } from "@/components/public/services-config";
import Link from "next/link";

export function FemaleFinalPositioningSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "female-hormonal") return null;

  return (
    <section className="w-full bg-[#E1E5D1] relative overflow-hidden flex items-center min-h-[280px]">

      {/* ── LEFT: Ceramic vases botanical illustration ── */}
      

      {/* Subtle leaf graphics behind text */}
      

      <div className="mx-auto max-w-[1440px] px-6 md:px-12 w-full relative z-10 flex">
        
        {/* Left Content Area */}
        <div className="w-full md:w-[65%] lg:w-[60%] py-6 md:py-8 pl-6 pr-6 md:pl-[12%] lg:pl-[10%] flex flex-col justify-center">
          <h2 className="text-[24px] sm:text-[28px] md:text-[34px] lg:text-[40px] font-medium text-[#722F27] mb-4 md:whitespace-nowrap" style={{ fontFamily: "var(--font-display)" }}>
            Menopause Is Not The End Of Vitality
          </h2>
          <p className="text-[#333] text-[15px] md:text-[16px] lg:text-[17px] font-medium leading-[1.6] mb-10 max-w-xl">
            It is a biological transition that deserves precision,<br />
            understanding, and proper medical interpretation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
  {/* Primary Button */}
  <Link
    href="/assessment"
    className="bg-[#889A6A] hover:bg-[#7a8a5f] text-white transition-colors duration-200 py-3 px-6 rounded-[4px] text-[13px] font-medium flex items-center justify-center gap-2 w-fit"
  >
    Request Consultation
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </Link>

  {/* Secondary Button */}
  <Link
    href="/assessment"
    className="bg-transparent border border-[#722F27] hover:bg-[#722F27]/5 text-[#722F27] transition-colors duration-200 py-3 px-6 rounded-[4px] text-[13px] font-medium flex items-center justify-center gap-2 w-fit"
  >
    Begin Hormonal Assessment
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </Link>
</div>
        </div>

        {/* Right Area (Doctor Image + Stamp) */}
        <div className="w-full md:w-[35%] lg:w-[40%] relative flex justify-end items-end h-[300px] hidden md:flex">
          {/* Doctor Image Overlay */}
          <div className="absolute right-[15%] bottom-0 h-[115%] w-auto z-20 flex items-end">
             <Image 
                src="/images/landing/about-hero-doctor.png"
                alt="Doctor"
                width={500}
                height={600}
                className="object-contain object-bottom h-full w-auto"
             />
          </div>
          
          {/* Precision Health Stamp */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[160px] h-[160px] md:w-[220px] md:h-[220px] z-10 pointer-events-none opacity-[0.15]">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full rotate-[-15deg]">
               {/* Outer circle */}
               <circle cx="100" cy="100" r="95" stroke="#fff" strokeWidth="1" />
               {/* Inner circle */}
               <circle cx="100" cy="100" r="85" stroke="#fff" strokeWidth="1" />
               
               {/* Precision Health curved text path */}
               <path id="curvePath2" d="M 25 100 A 75 75 0 1 1 175 100 A 75 75 0 1 1 25 100" fill="transparent" />
               <text fontSize="13" fill="#fff" letterSpacing="0.25em" className="uppercase font-medium font-sans">
                 <textPath href="#curvePath2" startOffset="50%" textAnchor="middle">
                   Precision Health
                 </textPath>
               </text>

               {/* Center Lotus/Leaf Icon */}
               <g transform="translate(100, 100) scale(0.4)">
                 <path d="M0 -30 C30 -60, 60 0, 0 50 C-60 0, -30 -60, 0 -30 Z" stroke="#fff" strokeWidth="2" fill="none" />
                 <path d="M0 0 C40 -30, 80 20, 0 70 C-80 20, -40 -30, 0 0 Z" stroke="#fff" strokeWidth="2" fill="none" opacity="0.8" />
                 <path d="M0 -10 V70" stroke="#fff" strokeWidth="2" fill="none" />
               </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
