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
  SERVICES,
  getServiceBySlug,
} from "@/components/public/services-config";

import { ServiceHero } from "./components/ServiceHero";
import { ServicePillars } from "./components/ServicePillars";
import { SymptomsSection } from "./components/SymptomsSection";
import { FemaleHormonalSystemSection } from "./components/FemaleHormonalSystemSection";
import { ProgramDesignedForSection } from "./components/ProgramDesignedForSection";
import { LongitudinalTrackingSection } from "./components/LongitudinalTrackingSection";
import { GoalAndPhilosophySection } from "./components/GoalAndPhilosophySection";
import { FinalPositioningSection } from "./components/FinalPositioningSection";
import { ConventionalSection } from "./components/ConventionalSection";
import { ApproachSection } from "./components/ApproachSection";
import { ClosingBand } from "./components/ClosingBand";

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
      <FemaleHormonalSystemSection svc={svc} />
      <ProgramDesignedForSection svc={svc} />
      <LongitudinalTrackingSection svc={svc} />
      <GoalAndPhilosophySection svc={svc} />
      <FinalPositioningSection svc={svc} />
      {svc.conventionalSection ? <ConventionalSection svc={svc} /> : null}
      {/* {svc.approachSection ? <ApproachSection svc={svc} /> : null} */}
      {/* <ClosingBand /> */}
    </>
  );
}
