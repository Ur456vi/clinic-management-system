import { SectionEyebrow, SectionHeading } from "@/components/public/ui";
import { ResolvedIcon } from "@/components/public/icon-resolver";
import { type ServiceContent } from "@/components/public/services-config";

export function ApproachSection({ svc }: { svc: ServiceContent }) {
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
