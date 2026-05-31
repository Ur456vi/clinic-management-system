import { EcgLine, SectionHeading } from "@/components/public/ui";
import { XCircleIcon } from "@/components/public/icons";
import { type ServiceContent } from "@/components/public/services-config";

export function ConventionalSection({ svc }: { svc: ServiceContent }) {
  const c = svc.conventionalSection!;

  if (svc.slug === "metabolic-health") {
    return null; // Integrated into the SymptomsSection
  }

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
