/**
 * Contact page. Hero + multi-field form + contact info + map.
 *
 * The form is currently a static markup (no submission handler). When you're
 * ready to wire it up, route `POST /api/contact` to a real handler — the
 * shape here mirrors the Figma fields exactly: name, email, phone, date,
 * time, service.
 */
import type { Metadata } from "next";

import {
  CTAButton,
  FigmaImage,
  HeroPattern,
  QuoteCard,
  SectionEyebrow,
  SectionHeading,
  StatTile,
} from "@/components/public/ui";
import {
  AwardIcon,
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
  StethoscopeIcon,
  UserIcon,
} from "@/components/public/icons";
import { SERVICES } from "@/components/public/services-config";

export const metadata: Metadata = {
  title: "Contact — Dr. Yuvraaj Singh M.D.",
  description:
    "Send us a message or book a consultation at the Institute of Precision Metabolic & Hormonal Health. Located in Sector 45, Gurugram, Haryana.",
};

const HERO_TILES = [
  { icon: <StethoscopeIcon size={22} />, label: "Expert Guidance" },
  { icon: <UserIcon size={22} />, label: "Personalized Care" },
  { icon: <ShieldIcon size={22} />, label: "Privacy Assured" },
  { icon: <ClockIcon size={22} />, label: "Timely Response" },
];

const CONTACT_INFO = [
  {
    icon: <MapPinIcon size={20} />,
    title: "Location",
    body: "Institute of Precision Metabolic & Hormonal Health, 123 Wellness Avenue, Sector 45, Gurugram, Haryana 122003, India",
  },
  {
    icon: <PhoneIcon size={20} />,
    title: "Phone",
    body: "+91 99765 40310",
  },
  {
    icon: <MailIcon size={20} />,
    title: "Email",
    body: "care@precisionhealth.in",
  },
  {
    icon: <ClockIcon size={20} />,
    title: "Hours",
    body: "Monday – Saturday: 9:00 AM – 7:00 PM. Sunday: By Appointment Only.",
  },
];

function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium"
        style={{ color: "var(--brand-ink-soft)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid var(--brand-rule)",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "var(--brand-ink)",
  width: "100%",
};

export default function ContactPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative w-full" style={{ background: "var(--brand-cream)" }}>
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 pt-12 pb-16 md:grid-cols-2 md:gap-12 md:px-12 md:pt-16 md:pb-20">
          <div className="flex flex-col justify-center">
            <SectionEyebrow>Contact Us</SectionEyebrow>
            <h1
              className="font-medium leading-[1.05]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "clamp(36px, 4.5vw, 64px)",
              }}
            >
              We&apos;re Here{" "}
              <span style={{ color: "var(--brand-burgundy)" }}>For Your Health</span>
            </h1>
            <p
              className="mt-5 max-w-xl text-base leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Have a question or ready to take the next step toward better
              health? Our team is here to help you with compassion, expertise,
              and personalized care.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {HERO_TILES.map((t) => (
                <StatTile key={t.label} icon={t.icon} label={t.label} />
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
            <FigmaImage
              src="/images/landing/contact-clinic-reception.jpg"
              alt="Institute of Precision Metabolic & Hormonal Health reception area"
              aspect="landscape"
              priority
              className="relative z-10 mx-auto max-w-xl"
            />
          </div>
        </div>
      </section>

      {/* FORM + QUOTE */}
      <section className="w-full" style={{ background: "var(--brand-cream-2)" }}>
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-20 md:grid-cols-2 md:gap-14 md:px-12 md:py-24">
          {/* Form column */}
          <div
            className="rounded-xl border bg-white p-7 md:p-9"
            style={{ borderColor: "var(--brand-rule)" }}
          >
            <SectionEyebrow>Send Us a Message</SectionEyebrow>
            <h2
              className="font-medium"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "28px",
              }}
            >
              Send Us a Message
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Fill out the form below and our team will get back to you promptly.
            </p>

            <form className="mt-7 flex flex-col gap-5">
              <Field label="1. Name" htmlFor="cn-name">
                <input
                  id="cn-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  style={inputStyle}
                />
              </Field>
              <Field label="2. Email" htmlFor="cn-email">
                <input
                  id="cn-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  style={inputStyle}
                />
              </Field>
              <Field label="3. Phone Number" htmlFor="cn-phone">
                <input
                  id="cn-phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  style={inputStyle}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="4. Date" htmlFor="cn-date">
                  <input
                    id="cn-date"
                    name="date"
                    type="date"
                    style={inputStyle}
                  />
                </Field>
                <Field label="5. Time" htmlFor="cn-time">
                  <input
                    id="cn-time"
                    name="time"
                    type="time"
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="6. Service" htmlFor="cn-service">
                <select id="cn-service" name="service" style={inputStyle}>
                  <option value="">Select a service</option>
                  {SERVICES.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.heroTitle} {s.heroTitleAccent}
                    </option>
                  ))}
                </select>
              </Field>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:opacity-95"
                style={{
                  background: "var(--brand-olive)",
                  letterSpacing: "0.1em",
                }}
              >
                Request for Consultation
              </button>
            </form>
          </div>

          {/* Quote + portrait column */}
          <div className="flex flex-col gap-6">
            <FigmaImage
              src="/images/landing/contact-doctor-chart.jpg"
              alt="Dr. Singh reviewing patient chart"
              aspect="landscape"
              className="w-full"
            />
            <QuoteCard
              text="Your health journey begins with a conversation. We are here to listen, understand, and guide you with precision."
              variant="cream"
            />
          </div>
        </div>
      </section>

      {/* CONTACT INFO + MAP */}
      <section className="w-full" style={{ background: "var(--brand-cream)" }}>
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-20">
          <div>
            <SectionHeading>Contact Information</SectionHeading>
            <div className="mt-8 space-y-5">
              {CONTACT_INFO.map((c) => (
                <div
                  key={c.title}
                  className="flex gap-4 rounded-lg border bg-white p-5"
                  style={{ borderColor: "var(--brand-rule)" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: "var(--brand-olive-soft)",
                      color: "var(--brand-olive)",
                    }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--brand-burgundy)" }}
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
            className="overflow-hidden rounded-xl border bg-white"
            style={{ borderColor: "var(--brand-rule)", minHeight: 420 }}
          >
            <iframe
              title="Institute location map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.0566%2C28.4452%2C77.0966%2C28.4652&layer=mapnik&marker=28.4552%2C77.0766"
              className="h-full min-h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div
              className="border-t p-4 text-xs"
              style={{ borderColor: "var(--brand-rule)", color: "var(--brand-mute)" }}
            >
              <strong style={{ color: "var(--brand-ink)" }}>
                Institute of Precision Metabolic &amp; Hormonal Health
              </strong>{" "}
              · Sector 45, Gurugram, Haryana 122003
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="w-full" style={{ background: "var(--brand-cream-2)" }}>
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-6 py-16 text-center md:px-12 md:py-20">
          <AwardIcon size={32} style={{ color: "var(--brand-burgundy)" }} />
          <SectionHeading align="center">
            Begin With A Clinical Assessment
          </SectionHeading>
          <p
            className="max-w-xl text-base"
            style={{ color: "var(--brand-ink-soft)" }}
          >
            Calendar a time that suits you. Our admissions team will confirm
            availability within 24 hours.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <CTAButton href="#cn-name" variant="burgundy" size="lg">
              <CalendarIcon size={16} /> Request A Consultation
            </CTAButton>
            <CTAButton href="tel:+919976540310" variant="olive-outline" size="lg">
              <PhoneIcon size={16} /> Call +91 99765 40310
            </CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}
