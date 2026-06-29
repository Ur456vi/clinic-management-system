/**
 * Public marketing home page.
 *
 * Mirrors the Figma "Home" frame: hero + standard-metrics failure section +
 * "A Different Standard of Care" + Clinical Framework + What Defines This
 * Institute + Core Focus Area + Measured Structured Process + Final
 * Positioning band. All copy is verbatim from the Figma.
 */
import Link from "next/link";
import Image from "next/image";
import {
  CTAButton,
  EcgLine,
  HeroPattern,
  PortraitPlaceholder,
  FigmaImage,
  QuoteCard,
  SectionEyebrow,
  SectionHeading,
  StatTile,
} from "@/components/public/ui";
import {
  CheckCircleIcon,
  HeartPulseIcon,
  ScaleIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
  StethoscopeIcon,
  TrustIcon,
  RadarIcon,
} from "@/components/public/icons";


const HERO_TILES = [
  { icon: "/images/landing/Radar.png", label: "Over two decades of experience across Internal Medicine, Critical Care and complex multidisciplinary medical environments, alongside advanced training in endocrinology, metabolic and regenerative medicine, forming a systems-based and precision-led clinical approach." },
  // { icon: "/images/landing/Neuron.png", label: "precision metabolic medicine" },
  // { icon: "/images/landing/Trust.png", label: "Hormonal & Longevity care" },
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
    icon: "/images/landing/Treatment.png",
    title: "Structured physician-led diagnostic and clinical frameworks",
  },
  {
    icon: "/images/landing/Microscope.png",
    title: "Multi-layered metabolic and hormonal and organ systems assessment",
  },
  {
    icon: "/images/landing/Customer.png",
    title: "Precision-calibrated therapeutic interventions",
  },
  {
    icon: "/images/landing/Increase.png",
    title: "Longitudinal monitoring and adaptive clinical oversight",
  },
];

const FRAMEWORK = [
  {
    no: "01",
    icon: "/images/landing/Framework_Neuron.png",
    body: "Hormonal systems do not function independently or in isolation.",
  },
  {
    no: "02",
    icon: "/images/landing/Framework_Cycle.png",
    body: "Metabolic health governs energy, weight, and inflammation.",
  },
  {
    no: "03",
    icon: "/images/landing/Framework_Heart.png",
    body: "Vascular integrity defines performance and longevity.",
  },
  {
    no: "04",
    icon: "/images/landing/Framework_Clock.png",
    body: "Imbalance begins years before it becomes clinically visible.",
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
    body: "Time, attention, and clinical depth are prioritized.",
  },
];

const FOCUS_AREAS = [
  {
    title: "Female Hormonal & Metabolic Medicine",
    image: "/images/landing/home-focus-female.png",
    bullets: [
      "Perimenopausal, Menopausal and Post-Menopausal care",
      "Hormonal recalibration and symptom-guided intervention",
      
      "Insulin resistance and ovarian-metabolic assessment (PCOS)",
      "Long-term protection of bone, metabolic, neurological and cardiovascular health",
    ],
    label: "Bio-identical Hormone Replacement Therapy(BHRT) — prescribed with clinical rigor, not trend.",
  },
  {
    title: "Male Hormonal, Metabolic & Performance Health",
    image: "/images/landing/home-focus-male.png",
    bullets: [
      "Androgen health and endocrine optimization",
      "Sexual performance and vascular-hormonal evaluation",
      "Recovery, cognition and physiological restoration",
      "Sexual performance evaluation",
      "Energy, strength, and recovery",
    ],
    label: "The goal is not temporary enhancement. It is consistent, reliable function.",
  },
  {
    title: "Metabolic Health & Body Composition",
    image: "/images/landing/home-focus-metabolic.png",
    bullets: [
      "Weight changes are rarely a matter of discipline alone",
      "Structured metabolic evaluation",
      "Targeted correction strategies",
      "Evidence-based use of advanced therapies, including GLP-1 (when clinically indicated)",
      "Lean mass preservation and recovery support",
    ],
    label: "The focus is complete metabolic restoration, not weight loss alone.",
  },
  {
    title: "Regenerative & Longevity Medicine",
    image: "/images/landing/home-focus-regenerative.png",
    bullets: [
      "Health is not defined only by absence of disease. It is defined by:",
      "Cellular resilience and recovery",
      "Predictive and preventive inflammation assessment",
      "Long-term cognitive and physiological preservation",
    ],
    label: "Proactive, future-driven medicine — designed for individuals who think in decades, not months.",
  },
];

const PROCESS_STEPS = [
  { no: "01", body: "Comprehensive physiological and diagnostic mapping." },
  { no: "02", body: "Thorough Physician-led systems interpretation and clinical synthesis" },
  { no: "03", body: "Precision intervention with longitudinal recalibration" },
  { no: "04", body: "Sustainable performance begins once biology regains stability" },
];

export default function HomeContent() {
  return (
    <>
      {/* ===================== HERO ============================== */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-stretch md:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col justify-center px-6 pt-14 pb-20 md:px-12 md:pt-20 md:pb-28">
            <h1
              className="font-medium leading-[1.05]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "clamp(30px, 4.5vw, 46px)",
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

            <div className="mt-8 flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-3 w-full md:w-auto">
              <CTAButton href="#framework" variant="olive">
                Explore The Clinical Framework
              </CTAButton>
              <CTAButton href="/about" variant="burgundy-outline" showArrow={false}>
                The Institute
              </CTAButton>
            </div>

            <div className="mt-12 flex flex-col md:flex-row flex-wrap gap-x-8 gap-y-6 max-w-2xl">
              {HERO_TILES.map((t) => (
                <div key={t.label} className="flex items-start md:items-center gap-4 text-left w-full">
                  <div className="relative w-10 h-10 shrink-0 mt-1 md:mt-0">
                    <Image
                      src={t.icon}
                      alt={t.label}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                  <span
                    className="flex-1 font-sans font-normal uppercase leading-[25px] tracking-[0.5px] text-[14px] md:h-[163px] flex items-center"
                    style={{
                      color: "var(--brand-ink-soft)",
                      maxWidth: t.icon.includes("Neuron") ? "195px" : "550px",
                    }}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — hero portrait */}
          <div className="relative min-h-[450px] md:min-h-0 w-full md:aspect-[945/868] pl-[40px]">
            <div
              className="absolute inset-0 -z-0"
              style={{ color: "var(--brand-burgundy)" }}
            >
              {/* <HeroPattern className="h-full w-full" opacity={0.15} /> */}
            </div>
            <Image
              src="/images/landing/home-hero-doctor1.png"
              alt="Dr. Yuvraaj Singh"
              fill
              priority
              className="object-cover object-left-top"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        </div>
      </section>

      {/* ============ STANDARD METRICS FAIL ====================== */}
      <section
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 pt-20 pb-10 md:px-12 md:pt-24 md:pb-12">
          <SectionHeading>
            When Standard Metrics Fail To Explain{" "}<br />
            <span style={{ color: "var(--brand-olive)", fontStyle: "italic" }}>
              What You Are Experiencing
            </span>
          </SectionHeading>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <p
                className="mb-5 font-semibold text-lg"
                style={{ color: "var(--brand-ink)" }}
              >
                You are functioning. But not at your best.
              </p>
              <ul className="space-y-4">
                {STANDARDS_LEFT.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-[16px] leading-[26px] font-normal" style={{ color: "var(--brand-ink-soft)" }}>
                    <span className="shrink-0 font-bold" style={{ color: "var(--brand-burgundy)" }}>•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ul className="space-y-4 mb-8">
                {STANDARDS_MIDDLE.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-[16px] leading-[26px] font-normal" style={{ color: "var(--brand-ink-soft)" }}>
                    <span className="shrink-0 font-bold" style={{ color: "var(--brand-burgundy)" }}>•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <p
                className="mb-4 text-sm font-medium"
                style={{ color: "var(--brand-ink)" }}
              >
                And yet, you&apos;ve been told:
              </p>
              <ul className="space-y-3">
                {TOLD.map((t) => (
                  <li
                    key={t}
                    className="font-sans font-normal uppercase leading-[25px] tracking-[0.5px] text-[16px] flex items-start gap-2.5"
                    style={{ color: "var(--brand-burgundy)" }}
                  >
                    <span className="shrink-0 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="relative rounded-xl p-8 md:p-9 flex flex-col justify-between md:min-h-[460px] border border-[#A3B18A]/20"
              style={{ background: "#A3B18A30" }}
            >
              <div>
                <h3
                  className="font-sans text-[20px] font-semibold leading-[28px] mb-6"
                  style={{ color: "var(--brand-ink)" }}
                >
                  The objective is not temporary symptom suppression
                </h3>
                <div className="text-[15px] leading-[24px]" style={{ color: "var(--brand-ink-soft)" }}>
                  <p>Biological decline often develops gradually, quietly and systemically</p>
                  <p>And when they are ignored, they progress.</p>
                  <p className="pt-2">Many high-functioning individuals experience measurable dysfunction despite &ldquo;normal&rdquo; reports</p>
                  <p className="font-semibold pt-4 text-black border-t border-[#A3B18A]/20 mt-4">
                    What can be measured can often be understood more precisely
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <EcgLine color="#6D7956" />
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center w-full md:w-auto">
            <CTAButton href="/assessment" variant="burgundy" size="lg" showArrow={false}>
              Request Consultation
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ================ A DIFFERENT STANDARD OF CARE ============ */}
      <section
        id="different-care"
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 py-10 md:grid-cols-2 md:gap-16 md:px-12 md:py-12 items-center">
          <div className="relative w-full">
            <div className="relative w-full aspect-[631/830] max-w-[631px] mx-auto overflow-hidden rounded-[20px]">
              <Image
                src="/images/landing/about-hero-doctor-new.png"
                alt="Dr. Yuvraaj Singh"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 631px"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <SectionHeading>A Clinical Model Built Around Biological Precision</SectionHeading>
            <p
              className="mt-5 leading-relaxed"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: "19px",
                lineHeight: "1.6",
                color: "var(--brand-ink)",
              }}
            >
              Care begins with protocol-driven deep clinical evaluation rather than generalization. It is based
              on systems, structure, and precision. Symptoms are interpreted within larger Endocrine, Metabolic and Physiological systems. We evaluate how your hormones, metabolism, and
              physiology interact as a whole.
            </p>

            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {DIFFERENT_CARE_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border p-3 flex flex-col justify-content h-[145px]"
                  style={{
                    borderColor: "#A3B18A",
                    background: "transparent",
                  }}
                >
                  <div className="relative w-8 h-8 shrink-0">
                    <Image
                      src={f.icon}
                      alt={f.title}
                      fill
                      className="object-contain"
                      sizes="32px"
                    />
                  </div>
                  <p
                    className="text-xs font-semibold leading-snug mt-5"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {f.title}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-1">
              <p className="text-[24px] font-bold tracking-tight" style={{ color: "#6E1F1F", lineHeight: "1.2" }}>
                No recycled protocols.
              </p>
              <p className="text-[24px] font-bold tracking-tight" style={{ color: "#6E1F1F", lineHeight: "1.2" }}>
                No algorithmic medicine.
              </p>
              <p className="text-[24px] font-bold tracking-tight" style={{ color: "#6E1F1F", lineHeight: "1.2" }}>
                No one-size-fits-all intervention pathways.
              </p>
              <p className="text-[24px] font-bold tracking-tight" style={{ color: "#6E1F1F", lineHeight: "1.2" }}>
                Only Precision-based medicine.
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
        <div className="mx-auto max-w-[1440px] px-6 pt-10 pb-20 md:px-12 md:pt-12 md:pb-24">
          <SectionHeading align="center">The Institute Methodology</SectionHeading>

          <div className="mt-12 flex flex-col lg:flex-row gap-8 items-center justify-between">
            {/* The 4 steps */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full relative">
              {FRAMEWORK.map((f) => (
                <div
                  key={f.no}
                  className="flex flex-col items-center md:items-start justify-start relative z-10 py-6"
                >
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <span
                      className="shrink-0 flex items-center"
                      style={{
                        fontFamily: "var(--font-adamina), serif",
                        fontSize: "36px",
                        fontWeight: 400,
                        color: "#7B1C1C",
                        letterSpacing: "0.5px",
                        lineHeight: "53.4px",
                      }}
                    >
                      {f.no}
                    </span>
                    <div className="relative w-[70px] h-[70px] md:w-[90px] md:h-[90px] shrink-0">
                      <Image
                        src={f.icon}
                        alt={f.body}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 70px, 90px"
                      />
                    </div>
                  </div>
                  <p
                    className="mt-6 text-xs leading-relaxed max-w-[220px] text-center md:text-left"
                    style={{ color: "var(--brand-ink-soft)" }}
                  >
                    {f.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Quote callout on the right */}
            <div
              className="rounded-[10px] p-8 flex flex-col justify-center shrink-0 w-full lg:w-[468px]"
              style={{
                height: "225px",
                backgroundColor: "rgba(163, 177, 138, 0.2)",
              }}
            >
              <p
                className="text-[16px] font-bold leading-normal text-[#1A1A1A]"
              >
                The objective is not temporary improvement.
              </p>
              <p
                className="text-[16px] mt-4 leading-normal text-[#1A1A1A]"
              >
                The objective is{" "}
                <span className="font-bold text-[#7B1C1C]">
                  restoration of function.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================ WHAT DEFINES THIS INSTITUTE =============== */}
      <section
        className="w-full flex flex-col justify-center"
        style={{
          background: "#FEF9EF",
        }}
      >
        <div className="mx-auto max-w-[1440px] px-6 pt-20 pb-10 md:px-12 md:pt-24 md:pb-12">
          <SectionHeading align="center">
            What Defines This{" "}
            <span style={{ color: "#7B1C1C" }}>Institute</span>
          </SectionHeading>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {INSTITUTE_DEFINITION.map((d, i) => (
              <div
                key={d.title}
                className={`flex flex-col justify-start px-8 py-10 ${
                  i % 3 !== 2 ? "lg:border-r" : ""
                } ${i < 3 ? "lg:border-b" : ""}`}
                style={{ borderColor: "#E5E0D8" }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display), Georgia, serif",
                    fontWeight: 400,
                    fontSize: "26px",
                    lineHeight: "34px",
                    color: "#1A1A1A",
                  }}
                >
                  {d.title}
                </h3>
                <p
                  className="mt-4 text-[15px] leading-relaxed"
                  style={{ color: "var(--brand-ink-soft)" }}
                >
                  {d.body}
                </p>
              </div>
            ))}

            {/* Bottom-right cell (Row 2, Column 3) containing the CTA button */}
            <div className="flex items-center justify-center px-8 py-10">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-3 rounded-[4px] px-8 py-4 text-xs font-semibold uppercase tracking-widest text-white transition-all hover:opacity-95 shadow-none"
                style={{
                  background: "#4A5E3A",
                  letterSpacing: "0.15em",
                }}
              >
                Request Consultation &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================ OUR CORE FOCUS AREA ====================== */}
      <section
        className="w-full flex flex-col justify-center"
        style={{
          background: "#FEF9EF",
          minHeight: "756px",
        }}
      >
        <div className="mx-auto max-w-[1920px] px-6 py-10 md:px-12 md:py-12 w-full">
          <div className="flex items-center justify-center gap-6 mb-16">
            <div className="hidden sm:block h-[1px] flex-1 max-w-[180px] border-t border-[#7B1C1C]/30 border-dashed"></div>
            <h2
              className="text-center font-sans font-semibold text-[32px] leading-tight text-[#1A1A1A] tracking-wide"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Our Core <span className="text-[#7B1C1C]">Focus Area</span>
            </h2>
            <div className="hidden sm:block h-[1px] flex-1 max-w-[180px] border-t border-[#7B1C1C]/30 border-dashed"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 justify-items-center justify-center items-stretch w-full py-4">
            {FOCUS_AREAS.map((area) => (
              <article
                key={area.title}
                className="relative flex flex-col justify-start overflow-hidden bg-[#efe8dc] rounded-[10px] border p-[36px] pt-[50px] pb-[27px] text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group w-full"
                style={{
                  maxWidth: "435px",
                  height: "417px",
                  borderColor: "rgba(210, 180, 140, 0.4)",
                  boxShadow: "none",
                }}
              >
                {/* Absolute transparent silhouette watermark */}
                <div 
                  className="absolute inset-0 pointer-events-none select-none z-0"
                  style={{ opacity: 1.0 }}
                >
                  <Image
                    src={area.image}
                    alt={area.title}
                    fill
                    className="object-cover rounded-[10px] transition-transform duration-500 group-hover:scale-102"
                    sizes="435px"
                  />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-between h-full flex-1 w-full">
                  <div>
                    {/* Title */}
                    <h3
                      className="font-sans font-semibold text-[18px] text-[#1A1A1A] leading-[32px] tracking-[0.5px]"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        height: "64px",
                        marginLeft: "10px",
                      }}
                    >
                      {area.title}
                    </h3>

                    {/* Bullet list */}
                    <ul
                      className="mt-[22px] font-sans font-normal text-[13px] text-[#2C2C2C] space-y-1.5"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        lineHeight: "22px",
                      }}
                    >
                      {area.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex gap-2.5 items-start">
                          <span className="shrink-0">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom summary line */}
                  <p
                    className="mt-auto font-sans italic font-normal text-[13px] text-[#4A4A4A]"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      lineHeight: "22px",
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
        className="w-full pt-5 pb-10 md:pt-5 md:pb-12 px-4 sm:px-6 md:px-12 flex justify-center"
        style={{ background: "#FEF9EF" }}
      >
        <div
          className="w-full max-w-[1556px] rounded-[54px] border border-[#A3B18A]/20 p-8 md:p-16 flex items-center justify-center "
          style={{
            background: "#EFE8DC",
            // minHeight: "735px",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 w-full items-center">
            {/* Left Column: A Measured, Structured Process */}
            <div className="flex flex-col justify-center text-left py-6 h-full">
              <h2
                className="font-medium text-[#7B1C1C] mb-10 text-[28px] md:text-[38px] leading-tight"
                style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                }}
              >
                A Measured, Structured Process
              </h2>

              <ol className="space-y-6">
                {PROCESS_STEPS.map((s) => (
                  <li
                    key={s.no}
                    className="flex items-center gap-5 text-left"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
                      style={{
                        background: "#7B1C1C",
                        fontFamily: "var(--font-display), Georgia, serif",
                        fontSize: "18px",
                      }}
                    >
                      {s.no}
                    </div>
                    <p
                      className="text-[16px] leading-[26px] font-normal"
                      style={{ color: "var(--brand-ink-soft)" }}
                    >
                      {s.body}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 text-center">
                <p
                  className="text-m italic leading-relaxed text-[#4A4A4A]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  This is not episodic care.
                </p>
                <p
                  className="text-m font-semibold leading-relaxed mt-0.5"
                  style={{
                    color: "#1A1A1A",
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  It is a <span className="font-bold">continuity-based clinical process.</span>
                </p>
              </div>
            </div>

            {/* Right Column: Testimonial & Rating */}
            <div className="flex flex-col justify-center items-center text-center py-6 px-4 md:px-8 h-full border-t md:border-t-0 md:border-l border-[#A3B18A]/20">
              {/* Stars rating */}
              <div className="flex gap-1 mb-6" style={{ color: "#A3B18A" }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon key={i} size={22} />
                ))}
              </div>

              {/* Quote */}
              <blockquote
                className="text-[18px] md:text-[22px] italic leading-relaxed max-w-[480px] text-[#1A1A1A]"
                style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                }}
              >
                &ldquo;This is the most comprehensive lab testing I have ever had. I am thrilled to know more about my health and how to improve it.&rdquo;
              </blockquote>

              {/* Dot Pager */}
              <div className="mt-8 flex gap-2 justify-center">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#7B1C1C" }}
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#A3B18A" }}
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#D9D9D9" }}
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#D9D9D9" }}
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#D9D9D9" }}
                />
              </div>
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

          <div className="flex flex-col items-end justify-center text-right">
  <SectionHeading>
    Begin With A Clinical Assessment
  </SectionHeading>

  <p
    className="mt-4 text-base"
    style={{ color: "var(--brand-ink-soft)" }}
  >
    Start your physician-led biological evaluation.
  </p>

  <div className="mt-6 w-full md:w-auto flex justify-center md:justify-start">
    <Link
      href="/assessment"
      className="inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 md:px-7 md:py-3.5 text-xs md:text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:opacity-95 w-full max-w-[240px] md:max-w-none md:w-auto whitespace-nowrap"
      style={{
        background: "var(--brand-burgundy)",
        letterSpacing: "0.1em",
      }}
    >
      Request Consultation
    </Link>
  </div>
</div>
        </div>
      </section>
    </>
  );
}
