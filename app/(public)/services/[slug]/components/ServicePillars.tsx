import { ResolvedIcon } from "@/components/public/icon-resolver";
import { type ServiceContent } from "@/components/public/services-config";

export function ServicePillars({
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
