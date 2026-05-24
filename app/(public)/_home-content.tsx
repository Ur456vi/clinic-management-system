/**
 * Public marketing home page.
 *
 * Mirrors the Figma "Home" frame: hero + standard-metrics failure section +
 * "A Different Standard of Care" + Clinical Framework + What Defines This
 * Institute + Core Focus Area + Measured Structured Process + Final
 * Positioning band. All copy is verbatim from the Figma.
 */
import Link from "next/link";

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
  CheckCircleIcon,
  HeartPulseIcon,
  MicroscopeIcon,
  ScaleIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
  ChartIcon,
  ClockIcon,
} from "@/components/public/icons";

const HERO_TILES = [
  { icon: <AwardIcon size={22} />, label: "30+ Years of Clinical Experience" },
  { icon: <MicroscopeIcon size={22} />, label: "Precision Metabolic Medicine" },
  { icon: <HeartPulseIcon size={22} />, label: "Hormonal & Longevity Care" },
];

const STANDARDS_LEFT = [
  "Non-Restorative sleep. Sleep disruption is frequently a downstream signal, not the primary issue.",
  "Your energy is inconsistent.",
  "Intimacy, confidence, or clarity began to fade.",
  "Your body is changing—despite doing everything right.",
];

const STANDARDS_MIDDLE = [
  "Metabolic resistance (weight gain) rarely develops without deeper physiological drivers.",
  "Cognitive clarity is often one of the earliest indicators of systemic imbalance.",
];

const TOLD = ['"Everything looks normal."', '"It\'s just stress."', '"It\'s part of aging."'];

const DIFFERENT_CARE_FEATURES = [
  {
    icon: <ShieldIcon size={22} />,
    title: "Structured Clinical Protocols",
  },
  {
    icon: <MicroscopeIcon size={22} />,
    title: "Advanced Diagnostic Evaluation",
  },
  {
    icon: <TargetIcon size={22} />,
    title: "Individualized Therapeutic Strategies",
  },
  {
    icon: <ChartIcon size={22} />,
    title: "Continuous Monitoring & Refinement",
  },
];

const FRAMEWORK = [
  {
    no: "01",
    icon: <ScaleIcon size={24} />,
    body: "Hormonal systems do not function independently or in isolation.",
  },
  {
    no: "02",
    icon: <HeartPulseIcon size={24} />,
    body: "Metabolic health governs energy, weight, and inflammation.",
  },
  {
    no: "03",
    icon: <ChartIcon size={24} />,
    body: "Vascular integrity defines performance and longevity.",
  },
  {
    no: "04",
    icon: <ClockIcon size={24} />,
    body: "Inflammation begins years before it becomes clinically visible.",
  },
];

const INSTITUTE_DEFINITION = [
  {
    title: "Structured, Protocol-Driven Care",
    body: "Every decision follows a defined clinical pathway.",
  },
  {
    title: "Data-Led Medicine",
    body: "Interventions are measurable, trackable, and continuously refined.",
  },
  {
    title: "Integrated Physiology Approach",
    body: "Hormones, metabolism, vascular health, and lifestyle are treated together—not separately.",
  },
  {
    title: "Long-Term Monitoring",
    body: "Progress is evaluated over time—not assumed after consultation.",
  },
  {
    title: "Focused Clinical Environment",
    body: "Time, attention, and clinical depth are prioritized. Who This Is Designed For.",
  },
];

const FOCUS_AREAS = [
  {
    title: "Female Hormonal & Metabolic Medicine",
    image: "/images/landing/home-focus-female.jpg",
    bullets: [
      "Perimenopause, Menopause and Post-Menopause Care",
      "Hormonal optimization with structured precision",
      "Mood & cognitive balance",
      "Bone health and vitality",
      "Long-term physician-led care, beyond the routine.",
    ],
    label: "Bio-Identical Hormone Therapy — prescribed with clinical rigor, not trends.",
  },
  {
    title: "Male Hormonal, Metabolic & Performance Health",
    image: "/images/landing/home-focus-male.jpg",
    bullets: [
      "Testosterone and hormone balance",
      "Sexual health restoration",
      "Body composition and muscle performance",
      "Energy, strength, and recovery",
    ],
    label: "The goal is not temporary enhancement. It is consistent, reliable function.",
  },
  {
    title: "Metabolic Health & Body Composition",
    image: "/images/landing/home-focus-metabolic.jpg",
    bullets: [
      "Structured metabolic evaluation",
      "Targeted prevention of metabolic disease, including GLP-1 (where clinically indicated)",
      "Long-term metabolic care",
    ],
    label: "The focus is complete metabolic restoration, not weight loss.",
  },
  {
    title: "Regenerative & Longevity Medicine",
    image: "/images/landing/home-focus-regenerative.jpg",
    bullets: [
      "Cellular resilience and decline prevention",
      "Predictive and preventive interventions",
      "Long-term integrative and longitudinal protocols",
    ],
    label: "Proactive, future-aligned medicine — designed for individuals who think in decades, not months.",
  },
];

const PROCESS_STEPS = [
  { no: "01", body: "Comprehensive biological and clinical assessment." },
  { no: "02", body: "Detailed physician-led evaluation and interpretation." },
  { no: "03", body: "Structured therapeutic program with ongoing monitoring." },
];

export default function HomeContent() {
  return (
    <>
      {/* ===================== HERO ============================== */}
      <section
        className="relative w-full"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 pt-14 pb-20 md:grid-cols-2 md:gap-16 md:px-12 md:pt-20 md:pb-28">
          {/* Left column */}
          <div className="flex flex-col justify-center">
            <h1
              className="font-medium leading-[1.05]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "clamp(36px, 4.5vw, 60px)",
              }}
            >
              Physician-Led Precision Health for Individuals Who{" "}
              <span style={{ color: "var(--brand-burgundy)" }}>
                Refuse to Normalize Decline
              </span>
            </h1>
            <p
              className="mt-6 max-w-xl text-base leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              An advanced systems-based clinical institute focused on hormonal,
              metabolic and regenerative health through measurable diagnostics,
              biological precision and long-term physician-guided care.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <CTAButton href="#framework" variant="olive-outline">
                Explore Our Clinical Framework
              </CTAButton>
              <CTAButton href="/about" variant="burgundy-outline">
                Meet The Institute
              </CTAButton>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {HERO_TILES.map((t) => (
                <StatTile key={t.label} icon={t.icon} label={t.label} />
              ))}
            </div>
          </div>

          {/* Right column — hero portrait */}
          <div className="relative">
            <div
              className="absolute inset-0 -z-0"
              style={{ color: "var(--brand-burgundy)" }}
            >
              <HeroPattern className="h-full w-full" opacity={0.15} />
            </div>
            <PortraitPlaceholder
              label="Dr. Yuvraaj Singh — lab-coat hero portrait (sepia, against honeycomb backdrop)"
              aspect="portrait"
              className="relative z-10 mx-auto max-w-md"
            />
          </div>
        </div>
      </section>

      {/* ============ STANDARD METRICS FAIL ====================== */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-24">
          <SectionHeading>
            When Standard Metrics Fail To Explain{" "}
            <span style={{ color: "var(--brand-burgundy)" }}>
              What You Are Experiencing
            </span>
          </SectionHeading>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <p
                className="mb-5 font-medium"
                style={{ color: "var(--brand-ink)" }}
              >
                You are functioning. But not at your peak.
              </p>
              <ul className="space-y-3">
                {STANDARDS_LEFT.map((s) => (
                  <li key={s} className="flex gap-2 text-sm leading-relaxed">
                    <span style={{ color: "var(--brand-burgundy)" }}>•</span>
                    <span style={{ color: "var(--brand-ink-soft)" }}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ul className="space-y-3">
                {STANDARDS_MIDDLE.map((s) => (
                  <li key={s} className="flex gap-2 text-sm leading-relaxed">
                    <span style={{ color: "var(--brand-burgundy)" }}>•</span>
                    <span style={{ color: "var(--brand-ink-soft)" }}>{s}</span>
                  </li>
                ))}
              </ul>
              <p
                className="mt-6 mb-3 text-sm font-medium"
                style={{ color: "var(--brand-ink)" }}
              >
                And yet, you&apos;ve been told:
              </p>
              <ul className="space-y-2">
                {TOLD.map((t) => (
                  <li
                    key={t}
                    className="text-sm italic"
                    style={{ color: "var(--brand-burgundy)" }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <QuoteCard
                text="The objective is not temporary symptomatic suppression. The objective is restoration of function."
              />
              <div className="mt-6">
                <EcgLine />
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <CTAButton href="/contact" variant="burgundy" size="lg">
              Book An Appointment
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ================ A DIFFERENT STANDARD OF CARE ============ */}
      <section
        id="different-care"
        className="w-full"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-2 md:gap-16 md:px-12 md:py-24">
          <div className="relative">
            <div
              className="absolute inset-0 -z-0"
              style={{ color: "var(--brand-olive)" }}
            >
              <HeroPattern className="h-full w-full" opacity={0.12} />
            </div>
            <PortraitPlaceholder
              label="Dr. Yuvraaj Singh — seated portrait against honeycomb backdrop"
              aspect="portrait"
              className="relative z-10 mx-auto max-w-md"
            />
          </div>
          <div className="flex flex-col justify-center">
            <SectionHeading>A Different Standard of Care</SectionHeading>
            <p
              className="mt-5 text-base leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              At this institute, care is not based on assumptions. It is based
              on systems, structure, and precision. We do not treat isolated
              symptoms. We evaluate how your hormones, metabolism, and
              physiology interact as a whole.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {DIFFERENT_CARE_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border bg-white p-4"
                  style={{ borderColor: "var(--brand-rule)" }}
                >
                  <div style={{ color: "var(--brand-burgundy)" }}>{f.icon}</div>
                  <p
                    className="mt-2 text-sm font-semibold leading-snug"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {f.title}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="mt-6 rounded-lg border-l-4 px-5 py-4"
              style={{
                borderColor: "var(--brand-burgundy)",
                background: "var(--brand-burgundy-soft)",
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: "var(--brand-burgundy)" }}
              >
                No generic plans. No unnecessary interventions. Only
                precision-based medicine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================== OUR CLINICAL FRAMEWORK ================= */}
      <section
        id="framework"
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-24">
          <SectionEyebrow>Our</SectionEyebrow>
          <SectionHeading align="center">Clinical Framework</SectionHeading>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
            {FRAMEWORK.map((f) => (
              <div
                key={f.no}
                className="rounded-xl border bg-white p-6"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <span
                  className="font-medium"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--brand-burgundy)",
                    fontSize: "32px",
                  }}
                >
                  {f.no}
                </span>
                <div className="mt-3" style={{ color: "var(--brand-burgundy)" }}>
                  {f.icon}
                </div>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--brand-ink-soft)" }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-10 rounded-lg p-6"
            style={{ background: "var(--brand-olive-soft)" }}
          >
            <p
              className="font-medium italic"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
            >
              The objective is not temporary improvement. The objective is the
              restoration of function.
            </p>
          </div>
        </div>
      </section>

      {/* ================ WHAT DEFINES THIS INSTITUTE =============== */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-24">
          <SectionHeading align="center">
            What Defines This{" "}
            <span style={{ color: "var(--brand-burgundy)" }}>Institute</span>
          </SectionHeading>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {INSTITUTE_DEFINITION.map((d) => (
              <div
                key={d.title}
                className="rounded-xl border bg-white p-6"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <h3
                  className="font-medium"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--brand-burgundy)",
                    fontSize: "20px",
                  }}
                >
                  {d.title}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--brand-ink-soft)" }}
                >
                  {d.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <CTAButton href="/contact" variant="olive">
              Book Your Appointment Now
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ================ OUR CORE FOCUS AREA ====================== */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-24">
          <SectionEyebrow>Our Core</SectionEyebrow>
          <SectionHeading align="center">Focus Area</SectionHeading>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {FOCUS_AREAS.map((area) => (
              <article
                key={area.title}
                className="overflow-hidden rounded-xl border bg-white"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <PortraitPlaceholder
                  label={`${area.title} — illustration`}
                  aspect="landscape"
                  className="rounded-none rounded-t-xl"
                />
                <div className="p-5">
                  <h3
                    className="font-medium leading-snug"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--brand-burgundy)",
                      fontSize: "18px",
                    }}
                  >
                    {area.title}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {area.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex gap-2 text-xs leading-relaxed"
                      >
                        <CheckCircleIcon
                          size={14}
                          style={{ color: "var(--brand-burgundy)", flexShrink: 0, marginTop: 2 }}
                        />
                        <span style={{ color: "var(--brand-ink-soft)" }}>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <p
                    className="mt-4 border-t pt-3 text-xs italic"
                    style={{
                      color: "var(--brand-burgundy)",
                      borderColor: "var(--brand-rule)",
                    }}
                  >
                    {area.label}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================ A MEASURED, STRUCTURED PROCESS =========== */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-2 md:px-12 md:py-24">
          <div>
            <SectionEyebrow>A Measured,</SectionEyebrow>
            <SectionHeading>Structured Process</SectionHeading>
            <ol className="mt-10 space-y-6">
              {PROCESS_STEPS.map((s) => (
                <li
                  key={s.no}
                  className="flex items-start gap-4 rounded-lg border bg-white p-5"
                  style={{ borderColor: "var(--brand-rule)" }}
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
                    style={{
                      background: "var(--brand-burgundy)",
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                    }}
                  >
                    {s.no}
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--brand-ink-soft)" }}
                  >
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
            <p
              className="mt-6 text-xs italic"
              style={{ color: "var(--brand-mute)" }}
            >
              This is not optimistic care. It is continuity-based clinical
              process.
            </p>
          </div>

          {/* Testimonial */}
          <div
            className="flex flex-col justify-center rounded-xl p-8"
            style={{ background: "var(--brand-cream-2)", border: "1px solid var(--brand-rule)" }}
          >
            <div className="flex gap-1" style={{ color: "var(--brand-burgundy)" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon key={i} size={20} />
              ))}
            </div>
            <p
              className="mt-5 text-lg italic leading-relaxed"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
              }}
            >
              &ldquo;This is the most comprehensive lab testing I have ever had.
              I&apos;m thrilled to know more about my health and how to improve
              it.&rdquo;
            </p>
            <div
              className="mt-6 flex gap-1.5"
              aria-hidden
            >
              <span
                className="h-1.5 w-6 rounded-full"
                style={{ background: "var(--brand-burgundy)" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--brand-rule)" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--brand-rule)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================ FINAL POSITIONING BAND =================== */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-20">
          <div
            className="rounded-xl p-8"
            style={{ background: "var(--brand-olive-soft)" }}
          >
            <SectionEyebrow>Final Positioning</SectionEyebrow>
            <p
              className="mt-2 text-sm leading-relaxed italic"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
              }}
            >
              &ldquo;The Institute operates with a serious clinical framework at
              the intersection of Internal Medicine, Pre-Critical Care,
              Endocrinology, Metabolic health and Regenerative care through
              physician-led precision frameworks designed for long-term
              physiological restoration.&rdquo;
            </p>
            <div className="mt-6">
              <EcgLine />
            </div>
          </div>

          <div className="flex flex-col items-start justify-center">
            <SectionHeading>Begin With A Clinical Assessment</SectionHeading>
            <p
              className="mt-4 text-base"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Start your physician-led biological evaluation.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:opacity-95"
                style={{
                  background: "var(--brand-burgundy)",
                  letterSpacing: "0.1em",
                }}
              >
                Request A Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
