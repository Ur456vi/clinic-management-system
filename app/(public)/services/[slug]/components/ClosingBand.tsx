import { SectionEyebrow, CTAButton } from "@/components/public/ui";
import { CheckCircleIcon } from "@/components/public/icons";

export function ClosingBand() {
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
                <span style={{ color: "var(--brand-ink)" }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center">
          <h2
            className="font-medium leading-tight text-[#1F1F1F]"
            style={{ fontFamily: "var(--font-display)", fontSize: "28px" }}
          >
            Ready to Take the First Step?
          </h2>
          <p
            className="mt-4 max-w-md text-sm leading-relaxed"
            style={{ color: "var(--brand-ink-soft)" }}
          >
            Complete our initial clinical intake to begin your structured
            evaluation and see if you qualify for care.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <CTAButton href="/assessment" variant="olive">
              Start Assessment
            </CTAButton>
            <CTAButton href="/contact" variant="burgundy-outline">
              Contact Clinic
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
