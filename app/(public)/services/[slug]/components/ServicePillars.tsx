import { type ServiceContent } from "@/components/public/services-config";

// Custom wavy line-art icons replicating the image
const CustomPillarIcon1 = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-85">
    {/* Outer wavy shield */}
    <path d="M24 6 C29 7 34 10 36 15 C37 19 36 24 37 28 C38 32 33 36 24 40 C15 36 10 32 11 28 C12 24 11 19 12 15 C14 10 19 7 24 6 Z" />
    {/* Inner wavy shield */}
    <path d="M24 12 C27 13 30 15 31 19 C31.5 22 31 25 32 28 C32.5 31 29 33 24 35 C19 33 15.5 31 16 28 C17 25 16.5 22 17 19 C18 15 21 13 24 12 Z" />
    {/* Abstract center figure */}
    <path d="M24 18 C25.5 18 26 19.5 26 21 C26 22 25 24 24 25 C23 24 22 22 22 21 C22 19.5 22.5 18 24 18 Z" />
    <path d="M21 28 C21 26 23 25 24 25 C25 25 27 26 27 28" />
  </svg>
);

const CustomPillarIcon2 = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-85">
    {/* Outer wavy flower/seed */}
    <path d="M24 7 C31 8 38 14 36 22 C37 29 33 35 24 38 C15 35 11 29 12 22 C10 14 17 8 24 7 Z" />
    {/* Inner wavy layer */}
    <path d="M24 13 C28 14 31 17 30 23 C31 28 28 31 24 33 C20 31 17 28 18 23 C17 17 20 14 24 13 Z" />
    {/* Inner core */}
    <path d="M24 18 C26 20 26 24 24 27 C22 24 22 20 24 18 Z" />
    <circle cx="24" cy="22" r="1.5" fill="currentColor" />
  </svg>
);

export function ServicePillars({
  items,
}: {
  items: NonNullable<ServiceContent["pillars"]>;
}) {
  return (
    <section className="w-full relative z-20 border-t border-[#7A8768]" style={{ background: "#647153" }}>
      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-8">
          {items.map((p, i) => (
            <div key={p.title} className="flex items-start flex-1 gap-4 xl:gap-5 relative w-full">
              
              {/* Left Icon */}
              <div className="shrink-0 mt-1">
                {i === 0 ? <CustomPillarIcon1 /> : <CustomPillarIcon2 />}
              </div>
              
              {/* Right Text */}
              <div className="pr-4 xl:pr-10">
                <h3 className="font-medium text-[15px] xl:text-[16px] text-white tracking-wide">
                  {p.title}
                </h3>
                <p className="mt-3 text-[12px] xl:text-[13px] leading-[1.7] text-white/80">
                  {p.body}
                </p>
              </div>
              
              {/* Separator Dot for Desktop */}
              {i < items.length - 1 && (
                <div className="hidden lg:block absolute -right-4 xl:-right-4 top-1/2 -translate-y-1/2 w-[2px] h-[2px] rounded-full bg-white/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
