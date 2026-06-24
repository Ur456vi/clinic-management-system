import React from "react";
import { type ServiceContent } from "@/components/public/services-config";
import { EcgLine } from "@/components/public/ui";
import Link from "next/link";

export function FemaleClosingCTASection({ svc }: { svc: ServiceContent }) {
  if (svc.slug !== "female-hormonal") return null;

  return (
    <section className="w-full" style={{ background: "#F5F2EA" }}>
      <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-12 md:py-14">
        {/* Outer rounded card */}
        <div
          className="w-full rounded-2xl border grid grid-cols-1 md:grid-cols-2 overflow-hidden"
          style={{ borderColor: "#E2DDD2", background: "#F5F2EA" }}
        >
          {/* ── LEFT: Final Positioning Quote Card ── */}
          <div
            className="relative flex flex-col justify-between p-8 md:p-10 border-b md:border-b-0 md:border-r"
            style={{ borderColor: "#E2DDD2" }}
          >
            {/* Eyebrow */}
            <div>
              <p
                className="mb-5 text-[11px] font-semibold tracking-[0.18em] uppercase"
                style={{ color: "var(--brand-burgundy, #722F27)" }}
              >
                Final Positioning
              </p>

              {/* Quote */}
              <p
                className="text-[14px] md:text-[15px] leading-[1.75] font-medium"
                style={{ color: "#2C2C2C" }}
              >
                &ldquo;The Institute operates with a serious clinical
                framework at the intersection of Internal Medicine,
                Pre-Critical Care, Endocrinology, Metabolic health
                and Regenerative care through physician-led
                precision frameworks designed for long-term
                physiological restoration.&rdquo;
              </p>
            </div>

            {/* ECG Heartbeat line */}
            <div className="mt-6">
                          <EcgLine />
                        </div>
          </div>

          {/* ── RIGHT: CTA Area ── */}
          <div className="flex flex-col items-center justify-center gap-5 p-8 md:p-12 text-center">
            {/* Heading */}
            <h2
              className="leading-[1.2] font-medium whitespace-nowrap"
              style={{
                fontFamily: "var(--font-display)",
                color: "#8A9E76",
                fontSize: "clamp(16px, 2vw, 26px)",
              }}
            >
              Begin With A Clinical Assessment
            </h2>

            {/* Subtitle */}
            <p
              className="text-[14px] md:text-[15px] font-medium"
              style={{ color: "#6B6B6B" }}
            >
              Start your physician-led biological evaluation
            </p>

            {/* CTA Button */}
            {/* <button
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 md:px-8 md:py-3.5 text-[11px] md:text-[12px] font-semibold tracking-[0.16em] uppercase text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] w-full max-w-[240px] md:max-w-none md:w-auto whitespace-nowrap"
              style={{ background: "#722F27" }}
            >
              Request a Consultation
            </button> */}
            <Link
    href="/assessment"
    className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 md:px-8 md:py-3.5 text-[11px] md:text-[12px] font-semibold tracking-[0.16em] uppercase text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] w-full max-w-[240px] md:max-w-none md:w-auto whitespace-nowrap"
              style={{ background: "#722F27" }}
  >
    Request Consultation
    
  </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
