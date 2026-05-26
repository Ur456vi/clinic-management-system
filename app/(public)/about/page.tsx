/**
 * About / Founder Journey page.
 *
 * Mirrors the Figma "About Doctor" frame: hero with quote callout + four
 * achievement tiles, then a 5-chapter scroll-down "Founder Journey" narrative.
 * Each chapter alternates image-left / image-right.
 */
import type { Metadata } from "next";

import {
  CTAButton,
  EcgLine,
  HeroPattern,
  PortraitPlaceholder,
  QuoteCard,
  SectionEyebrow,
  SectionHeading,
  StatTile,
} from "@/components/public/ui";
import {
  AwardIcon,
  ClockIcon,
  MicroscopeIcon,
  TargetIcon,
} from "@/components/public/icons";

export const metadata: Metadata = {
  title: "About Dr. Yuvraaj Singh — A Journey Rooted in Experience",
  description:
    "Three decades of internal medicine, critical care, endocrinology, and metabolic restoration. From frontline ICU work to predictive, preventive precision medicine.",
};

const ABOUT_TILES = [
  { icon: <AwardIcon size={22} />, label: "Decades of Clinical Excellence" },
  { icon: <MicroscopeIcon size={22} />, label: "Advanced Training Across Disciplines" },
  { icon: <TargetIcon size={22} />, label: "From Internship to Predictive Care (3Ps)" },
  { icon: <ClockIcon size={22} />, label: "Built for Long-Term Health & Longevity" },
];

const CHAPTERS = [
  {
    no: "01",
    title: "A Different Beginning",
    eyebrow: "Years in Internal Medicine and Critical Care",
    body: "Managing the most complex, life-threatening conditions across multiple disciplines: Neurosciences (NIMHANS, Bangalore), Cardiology (Kokilaben Institute), Oncology (Kidwai Memorial Institute), Advanced Clinical Care (with Oncology Faculty, Gurgaon).",
    image: "Young Dr. Singh in the ICU — clinical scene",
    alignment: "left" as const,
  },
  {
    no: "02",
    title: "What Critical Care Teaches You",
    eyebrow: "By the time most diseases present, the biology has already been altered for years.",
    body: "Most patients begin years earlier. Metabolic dysfunction starts unnoticed. Hormonal shifts dismissed as 'normal'. Chronic inflammation that silently progressed. \"It's normal.\" \"It's age.\" \"It's stress.\" It rarely is.",
    image: "Anatomical heart illustration — cardiac decline reference",
    alignment: "right" as const,
  },
  {
    no: "03",
    title: "The Question That Changed Everything",
    eyebrow: "What if these conditions could be identified and corrected before they reached the ICU?",
    body: "From Intervention to Predictive, Preventive and Precision Medicine. A shift from treating breakdowns to optimizing physiology — addressing the root causes of disease and aging.",
    image: "Dr. Singh studying scans — analytical work",
    alignment: "left" as const,
  },
  {
    no: "04",
    title: "A Defining Phase",
    eyebrow: "During the COVID-19 pandemic, extensive frontline work and setting up comprehensive home-based ICU care for patients with limited access to hospital resources.",
    body: "A formative period that crystallised the institute's commitment to physician-led, systems-based precision care.",
    image: "Pandemic-era clinical work — protective gear",
    alignment: "right" as const,
  },
  {
    no: "05",
    title: "The Founding of the Institute",
    eyebrow: "A precision-medicine institute, structured around the principles refined across three decades of clinical practice.",
    body: "The Institute of Precision Metabolic & Hormonal Health operates at the intersection of Internal Medicine, Pre-Critical Care, Endocrinology, Metabolic Health and Regenerative Care.",
    image: "Modern clinical institute — reception/lobby",
    alignment: "left" as const,
  },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section
        className="relative w-full"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 pt-12 pb-16 md:grid-cols-12 md:gap-10 md:px-12 md:pt-16 md:pb-20">
          <div className="flex flex-col justify-center md:col-span-6">
            <SectionEyebrow>About the Institute</SectionEyebrow>
            <h1
              className="font-medium leading-[1.05]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "clamp(36px, 4.5vw, 60px)",
              }}
            >
              A Journey Rooted in{" "}
              <span style={{ color: "var(--brand-burgundy)" }}>Experience.</span>{" "}
              <span style={{ color: "var(--brand-burgundy)" }}>
                Driven by Prevention.
              </span>
            </h1>
            <p
              className="mt-6 text-base leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              From saving lives in critical care to preventing disease before it
              begins—this is a journey built on purpose, precision and a deep
              understanding of human physiology.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {ABOUT_TILES.map((t) => (
                <StatTile key={t.label} icon={t.icon} label={t.label} />
              ))}
            </div>
          </div>

          <div className="relative md:col-span-4">
            <div
              className="absolute inset-0 -z-0"
              style={{ color: "var(--brand-burgundy)" }}
            >
              <HeroPattern className="h-full w-full" opacity={0.15} />
            </div>
            <PortraitPlaceholder
              label="Dr. Yuvraaj Singh — arms-crossed portrait in clinical setting"
              aspect="portrait"
              className="relative z-10 mx-auto max-w-md"
            />
          </div>

          <div className="md:col-span-2 md:flex md:items-center">
            <QuoteCard
              text="Health does not deteriorate suddenly. It declines gradually—often unnoticed, often dismissed. Our purpose is to detect earlier, understand deeper, and restore precisely."
              cite="Dr. Yuvraaj Singh"
              variant="cream"
            />
          </div>
        </div>
      </section>

      {/* FOUNDER JOURNEY */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-24">
          <SectionHeading align="center">
            The Founder{" "}
            <span style={{ color: "var(--brand-burgundy)" }}>Journey</span>
          </SectionHeading>

          <div className="mt-16 space-y-16">
            {CHAPTERS.map((c) => (
              <article
                key={c.no}
                className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-12"
              >
                {c.alignment === "left" ? (
                  <>
                    <div className="relative md:col-span-5">
                      <PortraitPlaceholder
                        label={c.image}
                        aspect="landscape"
                        className="mx-auto"
                      />
                    </div>
                    <ChapterBody chapter={c} />
                  </>
                ) : (
                  <>
                    <ChapterBody chapter={c} />
                    <div className="relative md:col-span-5">
                      <PortraitPlaceholder
                        label={c.image}
                        aspect="landscape"
                        className="mx-auto"
                      />
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING BAND */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-20">
          <div
            className="rounded-xl p-8"
            style={{ background: "var(--brand-olive-soft)" }}
          >
            <SectionEyebrow>Final Positioning</SectionEyebrow>
            <p
              className="mt-2 text-sm italic leading-relaxed"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
              }}
            >
              &ldquo;The Institute operates with a serious clinical framework at
              the intersection of Internal Medicine, Pre-Critical Care,
              Endocrinology, Metabolic health and Regenerative care.&rdquo;
            </p>
            <div className="mt-6">
              <EcgLine />
            </div>
          </div>
          <div className="flex flex-col items-start justify-center">
            <SectionHeading>Begin With A Clinical Assessment</SectionHeading>
            <p className="mt-4 text-base" style={{ color: "var(--brand-ink-soft)" }}>
              Start your physician-led biological evaluation.
            </p>
            <div className="mt-6">
              <CTAButton href="/assessment" variant="burgundy" size="lg">
                Request A Consultation
              </CTAButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ChapterBody({
  chapter,
}: {
  chapter: { no: string; title: string; eyebrow: string; body: string };
}) {
  return (
    <div className="md:col-span-7">
      <div className="flex items-center gap-4">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-white"
          style={{
            background: "var(--brand-burgundy)",
            fontFamily: "var(--font-display)",
            fontSize: "20px",
          }}
        >
          {chapter.no}
        </span>
        <span
          className="text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--brand-burgundy)" }}
        >
          Chapter
        </span>
      </div>
      <h3
        className="mt-5 font-medium"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--brand-ink)",
          fontSize: "28px",
        }}
      >
        {chapter.title}
      </h3>
      <p
        className="mt-4 text-sm font-medium italic"
        style={{
          color: "var(--brand-burgundy)",
          fontFamily: "var(--font-display)",
        }}
      >
        {chapter.eyebrow}
      </p>
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "var(--brand-ink-soft)" }}
      >
        {chapter.body}
      </p>
    </div>
  );
}
