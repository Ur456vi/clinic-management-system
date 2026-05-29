/**
 * Service detail page — one template renders all 6 services from
 * `services-config.ts`. Each slug provides:
 *   - hero (program tag, title + accent, body, quote callout)
 *   - 4–5 hero tiles
 *   - optional burgundy pillars strip
 *   - symptoms grid
 *   - conventional-failure grid + olive callout
 *   - structured approach grid
 */
import { notFound } from "next/navigation";
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
import { ResolvedIcon } from "@/components/public/icon-resolver";
import { XCircleIcon, CheckCircleIcon, MetabolicProgramIcon } from "@/components/public/icons";
import {
  SERVICES,
  getServiceBySlug,
  type ServiceContent,
} from "@/components/public/services-config";

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const svc = getServiceBySlug(slug);
  if (!svc) return { title: "Service Not Found" };
  return {
    title: `${svc.heroTitle} ${svc.heroTitleAccent} — Dr. Yuvraaj Singh M.D.`,
    description: svc.heroBody,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const svc = getServiceBySlug(slug);
  if (!svc) notFound();

  return (
    <>
      <ServiceHero svc={svc} />
      {svc.pillars ? <ServicePillars items={svc.pillars} /> : null}
      {svc.symptomsSection ? <SymptomsSection svc={svc} /> : null}
      {svc.conventionalSection ? <ConventionalSection svc={svc} /> : null}
      {svc.approachSection ? <ApproachSection svc={svc} /> : null}
      <ClosingBand />
    </>
  );
}

/* -------- Hero -------- */

function ServiceHero({ svc }: { svc: ServiceContent }) {
  return (
    <section
      className="relative w-full"
      style={{ background: "var(--brand-cream)" }}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 pt-12 pb-16 md:grid-cols-12 md:gap-10 md:px-12 md:pt-16 md:pb-20">
        <div className="md:col-span-6">
          {svc.slug === "metabolic-health" ? (
            <div className="flex items-center gap-3 mb-3" style={{ color: "var(--brand-burgundy)" }}>
              <MetabolicProgramIcon size={28} className="shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ letterSpacing: "0.22em" }}>
                {svc.programTag}
              </span>
            </div>
          ) : (
            <SectionEyebrow>{svc.programTag}</SectionEyebrow>
          )}
          <h1
            className="font-medium leading-[1.05]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--brand-ink)",
              fontSize: "clamp(36px, 4.5vw, 60px)",
            }}
          >
            {svc.heroTitle}{" "}
            <span className="block mt-2" style={{ color: "var(--brand-burgundy)", fontSize: "0.65em" }}>
              {svc.heroTitleAccent}
            </span>
          </h1>
          <p
            className="mt-5 max-w-xl text-sm leading-relaxed"
            style={{ color: "black" }}
          >
            {svc.heroBody.split("\n").map((line, idx) => (
              <span key={idx} className="block mb-2 last:mb-0">
                {line}
              </span>
            ))}
          </p>

          <div className="mt-7 flex flex-wrap gap-5">
            <CTAButton href="/assessment" variant="olive">
              Book Consultation
            </CTAButton>
            <CTAButton href="#approach" variant="burgundy-outline">
              Explore Our Approach
            </CTAButton>
          </div>
          {svc.slug === "metabolic-health" ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E8DDD0] w-full border-y border-[#E8DDD0] py-4 sm:border-y-0 sm:py-0">
              {svc.heroTiles.map((t) => (
                <StatTile
                  key={t.label}
                  icon={<ResolvedIcon name={t.icon} size={40} />}
                  label={t.label}
                  layout="horizontal"
                />
              ))}
            </div>
          ) : (
            <div
              className="mt-10 grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  svc.heroTiles.length,
                  5
                )}, minmax(0, 1fr))`,
              }}
            >
              {svc.heroTiles.map((t) => (
                <StatTile
                  key={t.label}
                  icon={<ResolvedIcon name={t.icon} size={22} />}
                  label={t.label}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative md:col-span-4">
          <div
            className="absolute inset-0 -z-0"
            style={{ color: "var(--brand-burgundy)" }}
          >
            <HeroPattern className="h-full w-full" opacity={0.15} />
          </div>
          <PortraitPlaceholder
            label={`${svc.heroTitle} — subject portrait`}
            aspect="portrait"
            className="relative z-10 mx-auto max-w-md"
          />
        </div>

        <div className="md:col-span-2 md:flex md:items-center">
          <QuoteCard text={svc.heroQuote.text} cite={svc.heroQuote.cite} variant="cream" />
        </div>
      </div>
    </section>
  );
}

/* -------- Burgundy pillars strip (Men's page) -------- */

function ServicePillars({
  items,
}: {
  items: NonNullable<ServiceContent["pillars"]>;
}) {
  return (
    <section className="w-full" style={{ background: "var(--brand-burgundy)" }}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-12 md:grid-cols-3 md:px-12">
        {items.map((p) => (
          <div key={p.title} className="text-white/95">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <ResolvedIcon name={p.icon} size={20} className="text-white" />
            </div>
            <h3
              className="font-medium"
              style={{ fontFamily: "var(--font-display)", fontSize: "20px" }}
            >
              {p.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------- Symptoms grid -------- */

function SymptomsSection({ svc }: { svc: ServiceContent }) {
  const s = svc.symptomsSection!;
  return (
    <section className="w-full" style={{ background: "var(--brand-cream-2)" }}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-12 md:px-12 md:py-24">
        <div className="md:col-span-4">
          {s.eyebrow ? (
            <p
              className="mb-4 text-xl italic"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-burgundy)",
              }}
            >
              &ldquo;{s.eyebrow}&rdquo;
            </p>
          ) : null}
          <SectionHeading>{s.title}</SectionHeading>
          {s.body ? (
            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              {s.body}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {s.items.map((it) => (
              <div
                key={it.label}
                className="rounded-lg border bg-white p-4 text-center"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <div
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: "var(--brand-cream)",
                    color: "var(--brand-burgundy)",
                  }}
                >
                  <ResolvedIcon name={it.icon} size={20} />
                </div>
                <p
                  className="text-xs font-medium leading-snug"
                  style={{ color: "var(--brand-ink)" }}
                >
                  {it.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------- Conventional approaches fail -------- */

function ConventionalSection({ svc }: { svc: ServiceContent }) {
  const c = svc.conventionalSection!;
  return (
    <section className="w-full" style={{ background: "var(--brand-cream)" }}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-20 md:grid-cols-12 md:px-12 md:py-24">
        <div className="md:col-span-7">
          <SectionHeading>{c.title}</SectionHeading>
          <p
            className="mt-4 text-sm leading-relaxed"
            style={{ color: "var(--brand-ink-soft)" }}
          >
            {c.body}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {c.failures.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-3"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <XCircleIcon
                  size={18}
                  style={{ color: "var(--brand-burgundy)", flexShrink: 0 }}
                />
                <span
                  className="text-xs font-medium leading-tight"
                  style={{ color: "var(--brand-ink)" }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-5">
          <div
            className="h-full rounded-xl p-7"
            style={{ background: "var(--brand-olive)" }}
          >
            <h3
              className="font-medium text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: "22px" }}
            >
              {c.callout.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/90">
              {c.callout.body}
            </p>
            <div className="mt-6 text-white/85">
              <EcgLine color="currentColor" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------- Structured approach -------- */

function ApproachSection({ svc }: { svc: ServiceContent }) {
  const a = svc.approachSection!;
  return (
    <section
      id="approach"
      className="w-full"
      style={{ background: "var(--brand-cream-2)" }}
    >
      <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-24">
        <SectionEyebrow>Our Approach</SectionEyebrow>
        <SectionHeading align="center">{a.title}</SectionHeading>
        <p
          className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed"
          style={{ color: "var(--brand-ink-soft)" }}
        >
          {a.subtitle}
        </p>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {a.steps.map((step, idx) => (
            <div
              key={step.title}
              className="relative overflow-hidden rounded-xl border bg-white p-5"
              style={{ borderColor: "var(--brand-rule)" }}
            >
              <span
                className="absolute right-3 top-3 text-xs font-medium"
                style={{ color: "var(--brand-mute)" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: "var(--brand-cream)",
                  color: "var(--brand-burgundy)",
                }}
              >
                <ResolvedIcon name={step.icon} size={20} />
              </div>
              <h4
                className="text-sm font-semibold leading-snug"
                style={{ color: "var(--brand-ink)" }}
              >
                {step.title}
              </h4>
              {step.body ? (
                <p
                  className="mt-2 text-xs leading-relaxed"
                  style={{ color: "var(--brand-ink-soft)" }}
                >
                  {step.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------- Closing CTA band -------- */

function ClosingBand() {
  return (
    <section className="w-full" style={{ background: "var(--brand-cream)" }}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-20">
        <div
          className="rounded-xl p-8"
          style={{ background: "var(--brand-olive-soft)" }}
        >
          <SectionEyebrow>Begin With Confidence</SectionEyebrow>
          <p
            className="mt-2 text-sm italic leading-relaxed"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--brand-ink)",
            }}
          >
            &ldquo;Every program is built on measurable diagnostics, biological
            precision, and long-term physician-guided care.&rdquo;
          </p>
          <ul className="mt-6 space-y-2">
            {[
              "Comprehensive biological assessment",
              "Physician-led interpretation",
              "Structured therapeutic program",
              "Ongoing monitoring & refinement",
            ].map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm">
                <CheckCircleIcon
                  size={16}
                  style={{ color: "var(--brand-burgundy)" }}
                />
                <span style={{ color: "var(--brand-ink-soft)" }}>{p}</span>
              </li>
            ))}
          </ul>
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
            <CTAButton href="/assessment" variant="burgundy" size="lg">
              Request A Consultation
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
