import { SectionEyebrow, SectionHeading } from "@/components/public/ui";
import { ResolvedIcon } from "@/components/public/icon-resolver";
import { type ServiceContent } from "@/components/public/services-config";

export function ApproachSection({ svc }: { svc: ServiceContent }) {
  const a = svc.approachSection!;

  if (svc.slug === "female-hormonal") {
    return (
      <section
        id="approach"
        className="w-full"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="h-px flex-grow bg-[var(--brand-burgundy)] opacity-20"></div>
            <h2 className="text-center font-serif text-lg md:text-[22px] text-[var(--brand-burgundy)]">
              {a.title}: {a.subtitle}
            </h2>
            <div className="h-px flex-grow bg-[var(--brand-burgundy)] opacity-20"></div>
          </div>

          <div className="mt-16 flex snap-x snap-mandatory overflow-x-auto pb-8 md:justify-center gap-4 md:gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {a.steps.map((step, idx) => (
              <div
                key={step.title}
                className="flex w-36 shrink-0 snap-start flex-col items-center justify-start rounded-xl border bg-white px-3 pb-4 pt-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)] md:w-[150px]"
                style={{ borderColor: "var(--brand-rule)" }}
              >
                <div
                  className="mb-4 flex items-center justify-center text-[var(--brand-olive)]"
                >
                  <ResolvedIcon name={step.icon} size={42} />
                </div>
                <span
                  className="mb-2 text-[14px] font-bold tracking-wider"
                  style={{ color: "var(--brand-burgundy)" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h4
                  className="whitespace-pre-wrap text-[13px] font-semibold leading-tight text-[var(--brand-ink)]"
                >
                  {step.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Fallback for other services
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
