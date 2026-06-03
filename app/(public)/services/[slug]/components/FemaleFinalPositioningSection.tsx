import React from "react";
import Image from "next/image";
import { type ServiceContent } from "@/components/public/services-config";

export function FemaleFinalPositioningSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "female-hormonal") return null;

  return (
    <section className="w-full bg-[#E1E5D1] relative overflow-hidden flex items-center min-h-[280px]">

      {/* ── LEFT: Ceramic vases botanical illustration ── */}
      <div className="absolute left-0 bottom-0 h-full w-[22%] md:w-[18%] lg:w-[22%] pointer-events-none select-none flex items-end">
        <svg
          viewBox="0 0 220 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* ── BACKGROUND panel (soft sage) ── */}
          <rect x="0" y="0" width="220" height="340" fill="#C8CCBA" />

          {/* ── SURFACE LINE ── */}
          <line x1="0" y1="288" x2="220" y2="288" stroke="#B0B5A0" strokeWidth="1" />

          {/* ══════════════════════════════════════
              LARGE VASE (left, taller)
          ══════════════════════════════════════ */}

          {/* Vase body – warm linen/cream */}
          <path
            d="M62 288
               Q54 270 52 248
               Q48 218 50 195
               Q50 178 56 170
               Q58 165 70 163
               L80 161
               Q92 160 102 161
               L110 163
               Q118 166 120 174
               Q124 185 122 210
               Q120 238 116 260
               Q112 278 106 288
               Z"
            fill="#D9D0C0"
            stroke="#C4BAA8"
            strokeWidth="0.8"
          />
          {/* Vase highlight (left sheen) */}
          <path
            d="M66 200 Q64 225 65 255 Q66 270 70 282"
            stroke="#E8E2D4"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Vase neck ridge */}
          <ellipse cx="84" cy="163" rx="16" ry="4" fill="#C9C0AF" stroke="#B8AE9C" strokeWidth="0.6" />
          {/* Vase rim */}
          <path
            d="M71 161 Q84 156 96 161"
            stroke="#C0B8A4"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* ── STEMS in large vase ── */}

          {/* Stem A – tall curving left */}
          <path
            d="M80 162 Q72 135 60 110 Q50 88 44 62 Q40 44 48 22"
            stroke="#7A8C6A"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Leaf A1 – left upper */}
          <path
            d="M55 80 Q38 70 32 54 Q44 48 56 62 Q58 70 55 80 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.9"
          />
          <path d="M55 80 Q43 64 32 54" stroke="#6E845A" strokeWidth="0.4" fill="none" opacity="0.6" />
          {/* Leaf A2 – mid right */}
          <path
            d="M66 108 Q82 98 86 82 Q72 80 66 94 Q64 102 66 108 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.9"
          />
          <path d="M66 108 Q76 94 86 82" stroke="#6E845A" strokeWidth="0.4" fill="none" opacity="0.6" />
          {/* Leaf A3 – top tiny */}
          <path
            d="M48 22 Q42 8 50 2 Q58 10 54 24 Q52 26 48 22 Z"
            fill="#9AAE82"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.85"
          />

          {/* Stem B – arching right */}
          <path
            d="M86 161 Q92 130 100 104 Q108 78 118 52 Q126 32 130 14"
            stroke="#7A8C6A"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Leaf B1 – right spread */}
          <path
            d="M110 68 Q128 56 136 40 Q120 36 112 52 Q110 60 110 68 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.9"
          />
          <path d="M110 68 Q122 52 136 40" stroke="#6E845A" strokeWidth="0.4" fill="none" opacity="0.6" />
          {/* Leaf B2 – left mid */}
          <path
            d="M98 100 Q82 94 76 78 Q90 72 98 86 Q100 94 98 100 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.9"
          />
          <path d="M98 100 Q87 86 76 78" stroke="#6E845A" strokeWidth="0.4" fill="none" opacity="0.6" />
          {/* Leaf B3 – top */}
          <path
            d="M130 14 Q136 2 144 6 Q142 18 132 18 Q130 16 130 14 Z"
            fill="#9AAE82"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.85"
          />

          {/* Stem C – gentle upright */}
          <path
            d="M83 161 Q85 138 84 114 Q84 92 86 72 Q88 54 90 36"
            stroke="#7A8C6A"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
          {/* Leaf C1 */}
          <path
            d="M85 94 Q70 86 66 70 Q78 66 86 80 Q86 88 85 94 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.85"
          />
          {/* Leaf C2 – opposite */}
          <path
            d="M85 76 Q100 68 104 52 Q92 50 86 64 Q85 70 85 76 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.85"
          />
          {/* Berry cluster – tip of C */}
          <circle cx="90" cy="36" r="3.5" fill="#8A9E76" stroke="#6E845A" strokeWidth="0.6" opacity="0.8" />
          <circle cx="84" cy="30" r="2.8" fill="#8A9E76" stroke="#6E845A" strokeWidth="0.6" opacity="0.8" />
          <circle cx="96" cy="29" r="2.5" fill="#9AAE82" stroke="#6E845A" strokeWidth="0.5" opacity="0.8" />

          {/* ══════════════════════════════════════
              SMALL VASE (right, shorter, rounder)
          ══════════════════════════════════════ */}

          {/* Vase body */}
          <path
            d="M134 288
               Q128 276 126 260
               Q122 240 124 222
               Q124 208 130 202
               Q134 198 144 197
               L152 196
               Q162 196 166 202
               Q170 210 168 228
               Q166 248 162 266
               Q158 278 154 288
               Z"
            fill="#D2C9B8"
            stroke="#BFB5A2"
            strokeWidth="0.8"
          />
          {/* Small vase highlight */}
          <path
            d="M132 230 Q131 248 133 264"
            stroke="#E2DAC9"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.65"
          />
          {/* Small vase neck */}
          <ellipse cx="146" cy="197" rx="12" ry="3.5" fill="#C3BAA8" stroke="#B2A895" strokeWidth="0.6" />
          {/* Small vase rim */}
          <path
            d="M136 196 Q146 192 156 196"
            stroke="#B8AE9C"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />

          {/* ── STEMS in small vase ── */}

          {/* Stem D – tall right lean */}
          <path
            d="M148 196 Q154 175 162 154 Q168 136 172 116 Q176 98 172 80"
            stroke="#7A8C6A"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
          {/* Leaf D1 */}
          <path
            d="M165 130 Q180 120 184 104 Q170 102 164 116 Q163 124 165 130 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.9"
          />
          <path d="M165 130 Q174 116 184 104" stroke="#6E845A" strokeWidth="0.4" fill="none" opacity="0.6" />
          {/* Leaf D2 */}
          <path
            d="M160 152 Q148 144 144 128 Q156 124 162 138 Q162 146 160 152 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.85"
          />
          {/* Berry at tip D */}
          <circle cx="172" cy="80" r="3" fill="#8A9E76" stroke="#6E845A" strokeWidth="0.6" opacity="0.8" />
          <circle cx="166" cy="74" r="2.5" fill="#9AAE82" stroke="#6E845A" strokeWidth="0.5" opacity="0.8" />

          {/* Stem E – leaning left */}
          <path
            d="M143 196 Q136 174 128 152 Q122 132 120 110"
            stroke="#7A8C6A"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          {/* Leaf E1 */}
          <path
            d="M126 136 Q112 130 108 114 Q120 110 126 124 Q127 130 126 136 Z"
            fill="#8A9E76"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.85"
          />
          {/* Leaf E2 – tip */}
          <path
            d="M120 110 Q114 96 118 86 Q128 90 126 104 Q124 108 120 110 Z"
            fill="#9AAE82"
            stroke="#6E845A"
            strokeWidth="0.7"
            opacity="0.85"
          />

          {/* ── SURFACE SHADOW under both vases ── */}
          <ellipse cx="84" cy="289" rx="28" ry="3.5" fill="#B0B5A0" opacity="0.35" />
          <ellipse cx="146" cy="289" rx="20" ry="3" fill="#B0B5A0" opacity="0.3" />
        </svg>
      </div>

      {/* Subtle leaf graphics behind text */}
      <div className="absolute left-[45%] top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.25]">
        <svg width="250" height="300" viewBox="0 0 150 200" fill="none">
          <path d="M10 200 C30 150, 100 150, 130 50" stroke="#5C6B46" strokeWidth="1" />
          <path d="M50 160 C100 130, 120 90, 90 70" stroke="#5C6B46" strokeWidth="1" />
          <path d="M80 100 C120 70, 140 30, 110 10" stroke="#5C6B46" strokeWidth="1" />
        </svg>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 md:px-12 w-full relative z-10 flex">
        
        {/* Left Content Area */}
        <div className="w-full md:w-[65%] lg:w-[60%] py-6 md:py-8 pl-[15%] md:pl-[12%] lg:pl-[10%] flex flex-col justify-center">
          <h2 className="text-[28px] md:text-[34px] lg:text-[40px] font-medium text-[#722F27] mb-4 whitespace-nowrap" style={{ fontFamily: "var(--font-display)" }}>
            Menopause Is Not The End Of Vitality
          </h2>
          <p className="text-[#333] text-[15px] md:text-[16px] lg:text-[17px] font-medium leading-[1.6] mb-10 max-w-xl">
            It is a biological transition that deserves precision,<br />
            understanding, and proper medical interpretation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Primary Button */}
            <button className="bg-[#889A6A] hover:bg-[#7a8a5f] text-white transition-colors duration-200 py-3 px-6 rounded-[4px] text-[13px] font-medium flex items-center justify-center gap-2 w-fit">
              Request Consultation
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Secondary Button */}
            <button className="bg-transparent border border-[#722F27] hover:bg-[#722F27]/5 text-[#722F27] transition-colors duration-200 py-3 px-6 rounded-[4px] text-[13px] font-medium flex items-center justify-center gap-2 w-fit">
              Begin Hormonal Assessment
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
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
