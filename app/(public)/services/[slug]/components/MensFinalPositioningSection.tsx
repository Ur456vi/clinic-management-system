import { type ServiceContent } from "@/components/public/services-config";
import Link from "next/link";
import { EcgLine } from "@/components/public/ui";

export function MensFinalPositioningSection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "mens-hormonal") return null;

  return (
    <section className="w-full bg-[#FCFCFA] py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-6">
        
        <div className="flex flex-col lg:flex-row items-stretch border border-[#E8E4DA] rounded-[24px] overflow-hidden">
          
          {/* Left Panel */}
          <div className="lg:w-[45%] bg-[#EBE9DF] p-8 lg:p-12 xl:p-16 relative overflow-hidden flex flex-col">
            <h4 
              className="font-bold text-[13px] tracking-wide mb-8"
              style={{
                fontFamily: "var(--font-display)",
                color: "#6B2B26" // Burgundy
              }}
            >
              FINAL POSITIONING
            </h4>
            
            <p className="text-[#1F1F1F] font-semibold text-[14px] md:text-[15px] xl:text-[16px] leading-relaxed relative z-10">
              “The Institute operates with a serious clinical framework at the intersection of Internal Medicine, Pre-Critical Care, Endocrinology, Metabolic health and Regenerative care through physician-led precision frameworks designed for long-term physiological restoration.”
            </p>
            
            {/* ECG Line Graphic */}
            <div className="mt-6">
              <EcgLine />
            </div>
          </div>
          
          {/* Right Panel */}
          <div className="lg:w-[55%] bg-[#FCFCFA] p-8 lg:p-12 xl:p-16 flex flex-col justify-center items-center text-center">
            
            <h2 
              className="text-[#98A886] font-medium leading-[1.2] mb-6"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3.5vw, 42px)",
              }}
            >
              Begin With A Clinical Assessment
            </h2>
            
            <p className="text-[#1F1F1F] font-medium text-[16px] md:text-[18px] mb-12">
              Start your physician-led biological evaluation
            </p>
            
            <Link 
              href="/assessment"
              className="inline-flex items-center justify-center bg-[#5E1F1A] hover:bg-[#4A1814] transition-colors text-[#FAF8F3] font-bold text-[11px] md:text-[12px] tracking-wider px-4 py-2.5 md:px-8 md:py-4 rounded-[12px] w-full max-w-[240px] md:max-w-none md:w-auto whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              REQUEST A CONSULTATION
            </Link>
            
          </div>
          
        </div>
        
      </div>
    </section>
  );
}
