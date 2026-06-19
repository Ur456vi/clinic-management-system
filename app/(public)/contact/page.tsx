/**
 * Contact page. Hero + multi-field form + contact info + map.
 *
 * The form is currently a static markup (no submission handler). When you're
 * ready to wire it up, route `POST /api/contact` to a real handler — the
 * shape here mirrors the Figma fields exactly: name, email, phone, date,
 * time, service.
 *
 * Icons use the in-house SVG set; photos use PortraitPlaceholder until the
 * real Figma exports drop in.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import {
  HeroPattern,
  PortraitPlaceholder,
  SectionEyebrow,
  EcgLine,
  SectionHeading,
} from "@/components/public/ui";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  FileTextIcon,
  LeafIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  QuoteIcon,
  ShieldIcon,
  StethoscopeIcon,
  UserIcon,
} from "@/components/public/icons";
import { SERVICES } from "@/components/public/services-config";

export const metadata: Metadata = {
  title: "Contact — Dr. Yuvraaj Singh M.D.",
  description:
    "Send us a message or request consultation at the Institute of Precision Metabolic & Hormonal Health. Located in Sector 45, Gurugram, Haryana.",
};

/* Muted gold accent — used for quote marks and hairline rules. Not in the
   brand-token set, so kept local. */
const GOLD = "#B0894E";

const HERO_TILES = [
  { icon: <StethoscopeIcon size={24} />, label: "Expert Guidance" },
  { icon: <UserIcon size={24} />, label: "Personalized Care" },
  { icon: <ShieldIcon size={24} />, label: "Privacy Assured" },
  { icon: <ClockIcon size={24} />, label: "Timely Response" },
];

const CONTACT_INFO = [
  {
    icon: <MapPinIcon size={18} />,
    title: "Location",
    body: "811, Harnoor House, 1st Floor, Sector-42, Gurugram, Haryana 122002, India",
  },
  {
    icon: <PhoneIcon size={18} />,
    title: "Phone",
    body: "+91 9266843439",
  },
  {
    icon: <MailIcon size={18} />,
    title: "Email",
    body: "dryuvraaj@iphmh.com",
  },
  {
    icon: <ClockIcon size={18} />,
    title: "Hours",
    body: "Monday – Saturday: 10:00 AM – 6:00 PM.",
  },
];

const inputStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid var(--brand-rule)",
  borderRadius: "8px",
  padding: "13px 14px 13px 44px",
  fontSize: "14px",
  color: "var(--brand-ink)",
  width: "100%",
};

function IconField({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium"
        style={{ color: "var(--brand-ink-soft)" }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: "var(--brand-olive)" }}
        >
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      {/* HERO */}
      <section
        className="relative w-full"
        style={{ background: "var(--brand-cream)" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 pt-12 pb-16 md:grid-cols-2 md:gap-12 md:px-12 md:pt-16 md:pb-20">
          <div className="flex flex-col justify-center">
            <SectionEyebrow>Contact Us</SectionEyebrow>
            <h2
              className="font-medium leading-[1.05]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "clamp(36px, 4.5vw, 36px)",
              }}
            >
              You Know Something Has Changed.
              <br />
              <span style={{ color: "var(--brand-olive)" }}>
                Let’s Understand Why.
              </span>
            </h2>
            <p
              className="mt-5 max-w-xl text-base leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              When symptoms persist despite “normal” reports, a deeper understanding of physiology often reveals what conventional evaluations miss.
              We help decode with expertise, compassion and personalised attention.
            </p>

            {/* Trust tiles — icon over label, separated by hairline rules */}
            <div className="mt-9 flex flex-wrap">
              {HERO_TILES.map((t, i) => (
                <div
                  key={t.label}
                  className={`flex flex-col items-center gap-2 px-5 py-1 ${
                    i !== 0 ? "border-l" : ""
                  }`}
                  style={{ borderColor: "var(--brand-rule)" }}
                >
                  <span style={{ color: "var(--brand-olive)" }}>{t.icon}</span>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--brand-ink-soft)" }}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
  <div
    className="absolute inset-0 -z-0"
    style={{ color: "var(--brand-burgundy)" }}
  >
    <HeroPattern className="h-full w-full" opacity={0.12} />
  </div>

  <div className="relative z-10 mx-auto max-w-xl overflow-hidden rounded-xl">
    <Image
      src="/images/landing/dr-yuvraj-banner-img.png"
      alt="Clinic Reception"
      width={1200}
      height={800}
      className="h-full w-full object-cover"
      priority
    />
  </div>
</div>
        </div>
      </section>

      {/* FORM + QUOTE — one white panel wrapping form (left) + image (right) */}
      <section className="w-full" style={{ background: "var(--brand-cream-2)" }}>
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-20">
          <div
            className="rounded-2xl border bg-white p-6 md:p-10"
            style={{ borderColor: "var(--brand-rule)" }}
          >
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              {/* Form column */}
              <div>
                <h2
                  className="font-medium"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--brand-ink)",
                    fontSize: "32px",
                  }}
                >
                  Send Us a Message
                </h2>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--brand-ink-soft)" }}
                >
                  Fill out the form below and our team will get back to you
                  promptly.
                </p>
                <div
                  className="mt-4 h-[3px] w-12 rounded-full"
                  style={{ background: "var(--brand-olive)" }}
                />

                <form className="mt-7 flex flex-col gap-5">
                  <IconField
                    label="1. Name"
                    htmlFor="cn-name"
                    icon={<UserIcon size={16} />}
                  >
                    <input
                      id="cn-name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      style={inputStyle}
                    />
                  </IconField>

                  <IconField
                    label="2. Email"
                    htmlFor="cn-email"
                    icon={<MailIcon size={16} />}
                  >
                    <input
                      id="cn-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      style={inputStyle}
                    />
                  </IconField>

                  <IconField
                    label="3. Phone Number"
                    htmlFor="cn-phone"
                    icon={<PhoneIcon size={16} />}
                  >
                    <input
                      id="cn-phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      style={inputStyle}
                    />
                  </IconField>
                  <div>
  <label
    htmlFor="cn-message"
    className="mb-2 block text-sm font-medium"
    style={{ color: "var(--brand-ink)" }}
  >
    7. Message
  </label>

  <textarea
    id="cn-message"
    name="message"
    rows={5}
    placeholder="Tell us about your concerns or how we can help you..."
    style={{
      ...inputStyle,
      minHeight: "140px",
      resize: "vertical",
      width: "100%",
      paddingLeft: "16px", // normal padding since no icon
    }}
  />
</div>

                  {/* <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <IconField
                      label="4. Date"
                      htmlFor="cn-date"
                      icon={<CalendarIcon size={16} />}
                    >
                      <input
                        id="cn-date"
                        name="date"
                        type="date"
                        style={inputStyle}
                      />
                    </IconField>
                    <IconField
                      label="5. Time"
                      htmlFor="cn-time"
                      icon={<ClockIcon size={16} />}
                    >
                      <input
                        id="cn-time"
                        name="time"
                        type="time"
                        style={inputStyle}
                      />
                    </IconField>
                  </div> */}

                  {/* <IconField
                    label="6. Service"
                    htmlFor="cn-service"
                    icon={<FileTextIcon size={16} />}
                  >
                    <select
                      id="cn-service"
                      name="service"
                      style={{
                        ...inputStyle,
                        paddingRight: "40px",
                        appearance: "none",
                      }}
                    >
                      <option value="">Select a service</option>
                      {SERVICES.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.heroTitle} {s.heroTitleAccent}
                        </option>
                      ))}
                    </select>
                    <span
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--brand-ink-soft)" }}
                    >
                      <ChevronDownIcon size={16} />
                    </span>
                  </IconField> */}

                  <button
                    type="submit"
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:opacity-95"
                    style={{
                      background: "var(--brand-olive)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Request Consultation
                    <ArrowRightIcon size={16} />
                  </button>
                </form>
              </div>

              {/* Image column with floating quote card */}
              <div className="relative min-h-[420px]">
                <Image
      src="/images/landing/dr-yuvraj-contact-us-img.jpg"
      alt="Clinic Reception"
      width={1200}
      height={800}
      className="h-full w-full object-cover"
      priority
    />

                {/* Leaf watermark, bottom-right */}
                <span
                  className="pointer-events-none absolute bottom-4 right-4 z-10"
                  style={{ color: GOLD, opacity: 0.45 }}
                >
                  <LeafIcon size={64} />
                </span>

                {/* Floating quote card */}
                <div className="absolute bottom-6 right-0 z-20 w-[72%] max-w-[300px] rounded-lg bg-white p-6 shadow-xl sm:right-6">
                  <span style={{ color: GOLD }}>
                    <QuoteIcon size={26} />
                  </span>
                  <p
                    className="mt-3 text-[24px] font-medium leading-[1.25]"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--brand-ink)",
                    }}
                  >
                    Your health journey begins with a conversation.
                  </p>
                  <div
                    className="my-4 h-[2px] w-8 rounded-full"
                    style={{ background: GOLD }}
                  />
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--brand-ink-soft)" }}
                  >
                    We are here to listen, understand, and guide you with
                    precision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT INFO + MAP */}
      <section className="w-full" style={{ background: "var(--brand-cream)" }}>
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-20">
          {/* Info card — divided rows, not separate boxes */}
          <div
            className="rounded-xl border bg-white p-7 md:p-9"
            style={{ borderColor: "var(--brand-rule)" }}
          >
            <h2
              className="font-medium"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "28px",
              }}
            >
              Contact Information
            </h2>
            <div
              className="mt-3 h-[3px] w-12 rounded-full"
              style={{ background: GOLD }}
            />

            <div className="mt-6 flex flex-col">
              {CONTACT_INFO.map((c, i) => (
                <div
                  key={c.title}
                  className={`flex gap-4 py-5 ${
                    i !== 0 ? "border-t" : ""
                  }`}
                  style={{ borderColor: "var(--brand-rule)" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: "var(--brand-olive)" }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--brand-ink)" }}
                    >
                      {c.title}
                    </p>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "var(--brand-ink-soft)" }}
                    >
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div
  className="relative overflow-hidden rounded-xl border bg-white"
  style={{ borderColor: "var(--brand-rule)", minHeight: 420 }}
>
  <Image
    src="/images/landing/contact-map.png"
    alt="Institute of Precision Metabolic & Hormonal Health Location"
    fill
    className="object-cover"
  />

  {/* Floating location label */}
  <div className="pointer-events-none absolute left-1/2 top-10 z-10 -translate-x-1/2 rounded-md bg-white px-4 py-3 text-center text-sm font-medium shadow-lg">
    <span style={{ color: "var(--brand-ink)" }}>
      Institute of Precision
      <br />
      Hormonal &amp; Metabolic Health
    </span>
  </div>
</div>
        </div>
      </section>

      {/* CLOSING BAND */}
      <section style={{ background: "var(--brand-olive-dark)" }}>
        <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-4 px-6 py-7 md:px-12">
          <span
            className="hidden h-px max-w-[160px] flex-1 sm:block"
            style={{
              borderTop: "1px dashed rgba(255,255,255,0.35)",
            }}
          />
          <span style={{ color: GOLD }}>
            <LeafIcon size={20} />
          </span>
          <p
            className="text-center text-lg italic"
            style={{
              fontFamily: "var(--font-display)",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            We look forward to being a part of your health journey.
          </p>
          <span style={{ color: GOLD }}>
            <LeafIcon size={20} />
          </span>
          <span
            className="hidden h-px max-w-[160px] flex-1 sm:block"
            style={{
              borderTop: "1px dashed rgba(255,255,255,0.35)",
            }}
          />
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
