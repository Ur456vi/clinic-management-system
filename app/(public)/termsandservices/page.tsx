import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   FILL THIS IN BEFORE PUBLISHING.

   Any value left as an empty string renders on the page as a loud amber
   "NEEDS INPUT" chip, so an unfilled legal placeholder can't quietly ship.
   Email and phone values become mailto: and tel: links automatically.

   Cross-links: set TERMS_URL to "/terms" in
   app/patient-data-protection-policy/page.tsx.
   ═══════════════════════════════════════════════════════════════════════════ */

const config = {
  EFFECTIVE_DATE: "1 August 2026", // e.g. "1 August 2026"
  LAST_UPDATED: "31 July 2026", // e.g. "31 July 2026"
  PORTAL_NAME: "Dr. Yuvraaj Singh", // patient portal / app name — clause 1.1
  PRIVACY_URL: "/privacypolicy",
  PDPP_URL: "/dataprotection",
  REFUND_CANCELLATION_TERMS: "", // clause 8.2 — the full cancellation/refund policy text
  CONTACT_EMAIL: "dryuvraajsingh@iphmh.com", // clauses 5.2, 18
  CONTACT_PHONE: "+91 9266843439", // clause 18
  GRIEVANCE_OFFICER_NAME: "dryuvraajsingh@iphmh.com", // clause 18
  GRIEVANCE_OFFICER_EMAIL: "+91 9266843439",
} as const;

export const metadata: Metadata = {
  title: "Terms of Service | Institute of Precision Hormonal & Metabolic Health",
  description:
    "The terms governing use of our website, patient portal, telemedicine and clinical services — including eligibility, prescriptions, fees, liability and dispute resolution.",
  alternates: { canonical: "https://www.dryuvraajsingh.com/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Service | Institute of Precision Hormonal & Metabolic Health",
    description:
      "Terms governing use of our website, patient portal, telemedicine and clinical services.",
    url: "https://www.dryuvraajsingh.com/terms",
    type: "article",
  },
};

const DISPLAY = "var(--font-display), Georgia, serif";
const SANS = "Inter, sans-serif";

/* ── content ───────────────────────────────────────────────────────────────
   Inline token syntax:
     {{KEY}}              → config.KEY
     [[label|KEY]]        → link to config.KEY
     [[label|mailto:KEY]] → mailto:  ·  [[label|tel:KEY]] → tel:
   ─────────────────────────────────────────────────────────────────────── */

type Block =
  | { kind: "p"; text: string }
  | { kind: "clause"; num: string; text: string; items?: { num: string; text: string }[] }
  | { kind: "alert"; heading: string; text: string }
  | { kind: "contact"; rows: { label: string; text: string }[] };

type Section = {
  num: string;
  id: string;
  title: string;
  /** Clause 15 names these as surviving termination. */
  survives?: boolean;
  blocks: Block[];
};

const sections: Section[] = [
  {
    num: "01",
    id: "about",
    title: "About these Terms",
    blocks: [
      {
        kind: "clause",
        num: "1.1",
        text:
          "These Terms of Service (\u201cTerms\u201d) govern your use of the website at www.dryuvraajsingh.com, the patient portal and/or application {{PORTAL_NAME}} (the \u201cPortal\u201d), telemedicine consultations, and the clinical services provided by Vyara Wellness Pvt. Ltd., a company incorporated under the Companies Act, 2013 having its place of business at 811, Harnoor House, 1st Floor, Sector-42, Gurgaon-122002, Haryana, operating under the name \u2018Institute of Precision Hormonal and Metabolic Health\u2019 (\u201cthe Institute\u201d, \u201cwe\u201d, \u201cus\u201d, \u201cour\u201d).",
      },
      {
        kind: "clause",
        num: "1.2",
        text:
          "By accessing the website or Portal, booking or attending a consultation, or otherwise using our services, you agree to these Terms, our [[Privacy Policy|PRIVACY_URL]] and our [[Patient Data Protection Policy|PDPP_URL]]. If you do not agree, please do not use our services.",
      },
    ],
  },
  {
    num: "02",
    id: "definitions",
    title: "Definitions",
    blocks: [
      {
        kind: "clause",
        num: "2.1",
        text:
          "Services means the website, the Portal, telemedicine and in-person consultations, diagnostic coordination, prescriptions, and related services we provide.",
      },
      { kind: "clause", num: "2.2", text: "Patient or you means any person who uses the Services." },
      {
        kind: "clause",
        num: "2.3",
        text:
          "Practitioner means a duly licensed and registered medical practitioner providing clinical services through the Institute.",
      },
    ],
  },
  {
    num: "03",
    id: "eligibility",
    title: "Eligibility",
    blocks: [
      {
        kind: "p",
        text:
          "You must be 18 years of age or older and legally capable of entering into a binding contract to use the Services on your own behalf. A parent or lawful guardian may use the Services on behalf of a minor or a person lacking capacity, and is responsible for that use and for the information provided.",
      },
    ],
  },
  {
    num: "04",
    id: "nature-of-services",
    title: "Nature of our Services and important medical notice",
    blocks: [
      {
        kind: "clause",
        num: "4.1",
        text:
          "The Institute provides clinical services in the field of Internal Medicine, Hormonal, Metabolic and Regenerative Medicine, including consultations, diagnosis, prescriptions and treatment plans, delivered in person and, where appropriate, by telemedicine.",
      },
      {
        kind: "clause",
        num: "4.2",
        text:
          "Telemedicine. Telemedicine consultations are provided in accordance with the Telemedicine Practice Guidelines, 2020. The Practitioner has sole discretion to decide whether a condition can be managed by telemedicine or requires an in-person examination, further investigation, or referral, and may decline or discontinue a telemedicine consultation on professional judgment.",
      },
      {
        kind: "alert",
        heading: "4.3 \u00b7 No emergency service",
        text:
          "The Services are not intended for medical emergencies. If you are experiencing a medical emergency, call your local emergency number or go to the nearest hospital immediately. Do not use the website, Portal or telemedicine for emergency needs.",
      },
      {
        kind: "clause",
        num: "4.4",
        text:
          "No guarantee of outcome. Medicine is not an exact science. We do not warrant or guarantee any particular clinical result or outcome. Information provided on the website or Portal is for general information only and does not constitute medical advice or create a practitioner-patient relationship until you are formally accepted as a patient and a consultation takes place.",
      },
    ],
  },
  {
    num: "05",
    id: "accounts",
    title: "Patient accounts and the Portal",
    blocks: [
      {
        kind: "clause",
        num: "5.1",
        text:
          "To use certain Services you must register for an account on the Portal and provide accurate, current and complete information.",
      },
      {
        kind: "clause",
        num: "5.2",
        text:
          "You are responsible for keeping your login credentials confidential and for all activity under your account. Notify us promptly at [[{{CONTACT_EMAIL}}|mailto:CONTACT_EMAIL]] of any unauthorised use.",
      },
      {
        kind: "clause",
        num: "5.3",
        text:
          "You must not share your account, impersonate another person, or provide false information. We may suspend or terminate accounts that breach these Terms.",
      },
    ],
  },
  {
    num: "06",
    id: "responsibilities",
    title: "Your responsibilities as a patient",
    blocks: [
      {
        kind: "clause",
        num: "6.1",
        text: "You agree to:",
        items: [
          {
            num: "6.1.1",
            text:
              "provide accurate, complete and truthful information about your identity, medical history and condition;",
          },
          {
            num: "6.1.2",
            text:
              "follow the advice, dosage instructions and treatment plans given by the Practitioner, and raise any concerns with the Institute;",
          },
          {
            num: "6.1.3",
            text:
              "not tamper with, alter or misuse any prescribed or supplied formulation, and not transfer prescribed formulations to any other person; and",
          },
          {
            num: "6.1.4",
            text:
              "use the Services lawfully and not for any purpose that is unlawful, harmful or prohibited by these Terms.",
          },
        ],
      },
      {
        kind: "clause",
        num: "6.2",
        text:
          "You acknowledge that the accuracy of any diagnosis, prescription or treatment depends on the accuracy and completeness of the information you provide.",
      },
    ],
  },
  {
    num: "07",
    id: "prescriptions",
    title: "Prescriptions and compounded formulations",
    blocks: [
      {
        kind: "clause",
        num: "7.1",
        text:
          "Prescriptions are issued solely on the clinical judgment of the Practitioner. Where treatment involves compounded formulations, these are prepared by our compounding pharmacy partner Zenovira Health LLP strictly in accordance with the Practitioner\u2019s prescription.",
      },
      {
        kind: "clause",
        num: "7.2",
        text:
          "Compounded formulations are individualised preparations prepared for a specific patient and prescription. They must be used strictly in accordance with the directions given, stored as instructed, and not used beyond any stated period of use.",
      },
      {
        kind: "clause",
        num: "7.3",
        text:
          "You must inform the Practitioner of any adverse reaction or concern promptly. Clinical responsibility for diagnosis and prescribing rests with the Practitioner; responsibility for the compounding of formulations rests with the compounding pharmacy in accordance with its arrangements with the Institute.",
      },
    ],
  },
  {
    num: "08",
    id: "fees",
    title: "Fees, payment, cancellation and refunds",
    blocks: [
      {
        kind: "clause",
        num: "8.1",
        text:
          "Fees for consultations and Services will be notified to you before they are incurred. Payment is due as indicated at the time of booking or consultation.",
      },
      {
        kind: "clause",
        num: "8.2",
        text:
          "Cancellations, rescheduling and refunds are governed by the following policy: {{REFUND_CANCELLATION_TERMS}}",
      },
      {
        kind: "clause",
        num: "8.3",
        text:
          "All fees are exclusive of, and you are responsible for, any applicable taxes unless stated otherwise.",
      },
    ],
  },
  {
    num: "09",
    id: "intellectual-property",
    title: "Intellectual property",
    survives: true,
    blocks: [
      {
        kind: "p",
        text:
          "All content on the website and Portal, including text, graphics, logos, treatment materials, and the design and arrangement of the Portal, is owned by or licensed to the Institute and is protected by law. You may use it only for your personal, non-commercial use in connection with the Services. You may not copy, reproduce, distribute, modify or create derivative works without our prior written consent.",
      },
    ],
  },
  {
    num: "10",
    id: "acceptable-use",
    title: "Acceptable use",
    blocks: [
      {
        kind: "clause",
        num: "10.1",
        text: "You must not:",
        items: [
          {
            num: "10.1.1",
            text: "use the Services in any way that breaches applicable law or these Terms;",
          },
          {
            num: "10.1.2",
            text:
              "attempt to gain unauthorised access to the Portal, our systems, or another user\u2019s account;",
          },
          {
            num: "10.1.3",
            text:
              "introduce any malware or interfere with the operation or security of the Services;",
          },
          {
            num: "10.1.4",
            text: "copy, scrape, or extract data from the Services other than your own data; or",
          },
          { num: "10.1.5", text: "use the Services to harass, abuse or harm any person." },
        ],
      },
    ],
  },
  {
    num: "11",
    id: "third-party",
    title: "Third-party services",
    blocks: [
      {
        kind: "p",
        text:
          "The Services may rely on or link to third-party services (such as hosting, payment, communication and diagnostic providers). We are not responsible for the content, policies or practices of third parties, and your use of any third-party service may be subject to that party\u2019s own terms.",
      },
    ],
  },
  {
    num: "12",
    id: "privacy",
    title: "Privacy and data protection",
    blocks: [
      {
        kind: "p",
        text:
          "Your use of the Services is also governed by our [[Privacy Policy|PRIVACY_URL]], which explains how the Website handles your data, and our [[Patient Data Protection Policy|PDPP_URL]], which explains how we collect, use and protect your personal data, including your medical and health data, under the Digital Personal Data Protection Act, 2023. By using the Services you acknowledge that you have read both documents.",
      },
    ],
  },
  {
    num: "13",
    id: "liability",
    title: "Disclaimers and limitation of liability",
    survives: true,
    blocks: [
      {
        kind: "clause",
        num: "13.1",
        text:
          "Except as expressly stated in these Terms and to the fullest extent permitted by law, the website and Portal are provided on an \u201cas is\u201d and \u201cas available\u201d basis, and we do not warrant that they will be uninterrupted, error-free or secure.",
      },
      {
        kind: "clause",
        num: "13.2",
        text:
          "Nothing in these Terms limits or excludes any liability that cannot lawfully be limited or excluded, including liability for death or personal injury caused by proven negligence.",
      },
      {
        kind: "clause",
        num: "13.3",
        text:
          "Subject to Clause 13.2, and to the fullest extent permitted by law, we shall not be liable for any indirect, incidental, consequential, special or punitive loss, or for loss of profits, data or goodwill, arising out of or in connection with the Services or these Terms. Subject to Clause 13.2, our total aggregate liability arising out of or in connection with the Services shall not exceed the fees paid by you to the Institute for the specific Service giving rise to the claim.",
      },
      {
        kind: "clause",
        num: "13.4",
        text:
          "We are not liable for any consequence arising from inaccurate or incomplete information provided by you, from your failure to follow the Practitioner\u2019s advice, or from misuse, tampering or unauthorised modification of any prescribed formulation.",
      },
    ],
  },
  {
    num: "14",
    id: "indemnity",
    title: "Indemnity",
    survives: true,
    blocks: [
      {
        kind: "p",
        text:
          "You agree to indemnify and hold harmless the Institute and its personnel from any claims, losses, liabilities and expenses arising out of your breach of these Terms, your misuse of the Services, or your provision of false or incomplete information.",
      },
    ],
  },
  {
    num: "15",
    id: "termination",
    title: "Suspension and termination",
    blocks: [
      {
        kind: "p",
        text:
          "We may suspend or terminate your access to the Services, in whole or in part, where you breach these Terms, where required by law, or where necessary to protect the Services or other users. You may stop using the Services at any time. Clauses which by their nature should survive termination (including Clauses 9, 13, 14, 16 and 17) shall survive.",
      },
    ],
  },
  {
    num: "16",
    id: "governing-law",
    title: "Governing law, jurisdiction and disputes",
    survives: true,
    blocks: [
      {
        kind: "clause",
        num: "16.1",
        text:
          "These Terms are governed by and construed in accordance with the laws of India.",
      },
      {
        kind: "clause",
        num: "16.2",
        text:
          "Subject to Clause 16.3, the courts at Gurugram, Haryana shall have exclusive jurisdiction over any dispute arising out of or in connection with these Terms or the Services.",
      },
      {
        kind: "clause",
        num: "16.3",
        text:
          "The parties shall first attempt to resolve any dispute amicably through good-faith discussion. Any dispute not so resolved may be referred to arbitration by a sole arbitrator under the Arbitration and Conciliation Act, 1996, with the seat and venue at Gurugram, Haryana and the language of arbitration being English. The award shall be final and binding.",
      },
    ],
  },
  {
    num: "17",
    id: "general",
    title: "General",
    survives: true,
    blocks: [
      {
        kind: "clause",
        num: "17.1",
        text:
          "If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions continue in full force.",
      },
      {
        kind: "clause",
        num: "17.2",
        text: "Our failure to enforce any right or provision is not a waiver of that right or provision.",
      },
      {
        kind: "clause",
        num: "17.3",
        text:
          "These Terms, together with the [[Privacy Policy|PRIVACY_URL]], constitute the entire agreement between you and the Institute regarding the use of the Services.",
      },
      {
        kind: "clause",
        num: "17.4",
        text:
          "We may update these Terms from time to time. The current version will be available at www.dryuvraajsingh.com with the \u201cLast updated\u201d date shown above. Your continued use of the Services after changes take effect constitutes acceptance of the revised Terms.",
      },
    ],
  },
  {
    num: "18",
    id: "contact",
    title: "Contact",
    blocks: [
      {
        kind: "contact",
        rows: [
          {
            label: "Entity",
            text:
              "Vyara Wellness Pvt. Ltd. (Institute of Precision Hormonal and Metabolic Health)",
          },
          {
            label: "Address",
            text: "811, Harnoor House, 1st Floor, Sector-42, Gurgaon-122002, Haryana",
          },
          { label: "Email", text: "[[{{CONTACT_EMAIL}}|mailto:CONTACT_EMAIL]]" },
          { label: "Phone", text: "[[{{CONTACT_PHONE}}|tel:CONTACT_PHONE]]" },
          {
            label: "Grievance Officer",
            text:
              "{{GRIEVANCE_OFFICER_NAME}} \u00b7 [[{{GRIEVANCE_OFFICER_EMAIL}}|mailto:GRIEVANCE_OFFICER_EMAIL]]",
          },
        ],
      },
    ],
  },
];

/* ── inline token renderer ─────────────────────────────────────────────── */

function readConfig(key: string): string {
  return (config as Record<string, string>)[key] ?? "";
}

function Pending({ label }: { label: string }) {
  return (
    <span
      title="Not set yet — fill this in at the top of this file"
      className="mx-[2px] inline-flex items-center rounded-[3px] px-[6px] py-[1px] align-baseline text-[0.78em] font-semibold uppercase tracking-[0.08em]"
      style={{
        color: "var(--brand-warning)",
        background: "color-mix(in srgb, var(--brand-warning) 12%, transparent)",
        border: "1px dashed color-mix(in srgb, var(--brand-warning) 45%, transparent)",
        fontFamily: SANS,
      }}
    >
      {label}
    </span>
  );
}

const LINK_STYLE = {
  color: "var(--brand-burgundy)",
  textDecorationColor: "color-mix(in srgb, var(--brand-burgundy) 35%, transparent)",
  textUnderlineOffset: "3px",
} as const;

function substitute(text: string, k: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\{\{([A-Z0-9_]+)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const value = readConfig(m[1]);
    out.push(value || <Pending key={`${k}-v${i}`} label={m[1].replace(/_/g, " ")} />);
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function RichText({ text, k = "t" }: { text: string; k?: string }) {
  const nodes: ReactNode[] = [];
  const re = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(...substitute(text.slice(last, m.index), `${k}-${i}p`));

    const label = substitute(m[1], `${k}-${i}l`);
    const target = m[2];
    const scheme = target.startsWith("mailto:")
      ? "mailto:"
      : target.startsWith("tel:")
        ? "tel:"
        : "";
    const bareKey = scheme ? target.slice(scheme.length) : target;
    const value = readConfig(bareKey);

    if (!value) {
      // No destination yet — show the label plus a chip rather than a dead link.
      nodes.push(
        <span key={`${k}-${i}x`}>
          {label}
          <Pending label={bareKey.replace(/_/g, " ")} />
        </span>,
      );
    } else if (scheme) {
      nodes.push(
        <a
          key={`${k}-${i}a`}
          href={`${scheme}${scheme === "tel:" ? value.replace(/[^\d+]/g, "") : value}`}
          className="underline transition-opacity hover:opacity-70"
          style={LINK_STYLE}
        >
          {label}
        </a>,
      );
    } else if (/^https?:\/\//.test(value)) {
      nodes.push(
        <a
          key={`${k}-${i}a`}
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-opacity hover:opacity-70"
          style={LINK_STYLE}
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(
        <Link
          key={`${k}-${i}a`}
          href={value}
          className="underline transition-opacity hover:opacity-70"
          style={LINK_STYLE}
        >
          {label}
        </Link>,
      );
    }

    last = m.index + m[0].length;
    i += 1;
  }

  if (last < text.length) nodes.push(...substitute(text.slice(last), `${k}-${i}z`));
  return <>{nodes}</>;
}

/* ── block components ──────────────────────────────────────────────────── */

function Body({ text, k }: { text: string; k: string }) {
  return (
    <p
      className="text-[16px] leading-[1.75] md:text-[17px]"
      style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
    >
      <RichText text={text} k={k} />
    </p>
  );
}

function Clause({
  num,
  text,
  items,
}: {
  num: string;
  text: string;
  items?: { num: string; text: string }[];
}) {
  return (
    <div className="grid grid-cols-[58px_1fr] gap-x-1 md:grid-cols-[70px_1fr]">
      <span
        className="tabular-nums pt-[3px] text-[13px]"
        style={{ fontFamily: SANS, color: "var(--brand-burgundy)", letterSpacing: "0.04em" }}
      >
        {num}
      </span>
      <div className="space-y-4">
        <Body text={text} k={`c${num}`} />
        {items && items.length > 0 && (
          <div className="space-y-[10px] pt-1">
            {items.map((sub) => (
              <div
                key={sub.num}
                className="grid grid-cols-[62px_1fr] gap-x-1 md:grid-cols-[72px_1fr]"
              >
                <span
                  className="tabular-nums pt-[4px] text-[12px]"
                  style={{
                    fontFamily: SANS,
                    color: "var(--brand-mute)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {sub.num}
                </span>
                <p
                  className="text-[15px] leading-[1.7] md:text-[16px]"
                  style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
                >
                  <RichText text={sub.text} k={`s${sub.num}`} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reserved for clause 4.3. It is the one instruction on this page a patient may
 * need to act on in seconds, so it is the only element allowed to raise its voice.
 */
function Alert({ heading, text, k }: { heading: string; text: string; k: string }) {
  return (
    <aside
      role="note"
      className="rounded-[2px] px-5 py-5 md:px-7 md:py-6"
      style={{
        background: "var(--brand-burgundy-soft)",
        borderLeft: "3px solid var(--brand-burgundy)",
      }}
    >
      <p
        className="mb-2 uppercase"
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          letterSpacing: "0.16em",
          color: "var(--brand-burgundy)",
        }}
      >
        {heading}
      </p>
      <p
        className="text-[16px] leading-[1.7] md:text-[17px]"
        style={{ fontFamily: SANS, color: "var(--brand-burgundy-dark)" }}
      >
        <RichText text={text} k={k} />
      </p>
    </aside>
  );
}

function ContactCard({ rows }: { rows: { label: string; text: string }[] }) {
  return (
    <dl
      className="rounded-[2px] px-6 py-6 md:px-8 md:py-7"
      style={{ background: "var(--brand-cream-2)", border: "1px solid var(--brand-rule)" }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className="grid gap-1 py-[10px] sm:grid-cols-[168px_1fr] sm:gap-4"
          style={{ borderTop: i === 0 ? "none" : "1px solid var(--brand-rule-soft)" }}
        >
          <dt
            className="uppercase"
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              letterSpacing: "0.14em",
              color: "var(--brand-mute)",
              paddingTop: "4px",
            }}
          >
            {row.label}
          </dt>
          <dd
            className="text-[15px] leading-[1.65] md:text-[16px]"
            style={{ fontFamily: SANS, color: "var(--brand-ink)" }}
          >
            <RichText text={row.text} k={`k${row.label}`} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function renderBlock(block: Block, key: string) {
  switch (block.kind) {
    case "clause":
      return <Clause key={key} num={block.num} text={block.text} items={block.items} />;
    case "alert":
      return <Alert key={key} heading={block.heading} text={block.text} k={key} />;
    case "contact":
      return <ContactCard key={key} rows={block.rows} />;
    default:
      return <Body key={key} text={block.text} k={key} />;
  }
}

/* ── contents rail: styles + progressive-enhancement script ────────────── */

const TOC_CSS = `
.pp-toc a{display:flex;gap:12px;padding:7px 8px 7px 12px;border-radius:3px;
  border-left:2px solid var(--brand-rule-soft);color:var(--brand-ink-soft);
  transition:color .18s ease,background-color .18s ease,border-color .18s ease}
.pp-toc a:hover{color:var(--brand-burgundy)}
.pp-toc a:focus-visible{outline:2px solid var(--brand-burgundy);outline-offset:2px}
.pp-toc a[data-active="true"]{border-left-color:var(--brand-burgundy);
  color:var(--brand-burgundy);
  background:color-mix(in srgb,var(--brand-burgundy) 5%,transparent)}
.pp-toc a[data-active="true"] .pp-n{color:var(--brand-burgundy)}
.pp-toc a[data-survives="true"] .pp-n::after{content:"";display:inline-block;
  width:4px;height:4px;border-radius:50%;background:var(--brand-olive);
  margin-left:5px;vertical-align:middle}
`;

const TOC_JS = `(function(){
  var links=[].slice.call(document.querySelectorAll('.pp-toc a[href^="#"]'));
  if(!links.length)return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var heads=[];
  links.forEach(function(a){
    var id=a.getAttribute('href').slice(1);
    var el=document.getElementById(id);
    if(el)heads.push(el);
    a.addEventListener('click',function(e){
      var t=document.getElementById(id);
      if(!t)return;
      e.preventDefault();
      t.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});
      history.replaceState(null,'','#'+id);
      t.focus({preventScroll:true});
    });
  });
  function setActive(id){
    links.forEach(function(a){
      a.setAttribute('data-active',a.getAttribute('href')==='#'+id?'true':'false');
    });
  }
  if(heads[0])setActive(heads[0].id);
  if(!('IntersectionObserver' in window))return;
  var io=new IntersectionObserver(function(entries){
    var vis=entries.filter(function(e){return e.isIntersecting}).sort(function(a,b){
      return a.boundingClientRect.top-b.boundingClientRect.top});
    if(vis[0])setActive(vis[0].target.id);
  },{rootMargin:'-96px 0px -66% 0px',threshold:0});
  heads.forEach(function(el){io.observe(el)});
})();`;

/* ── page ──────────────────────────────────────────────────────────────── */

export default function TermsPage() {
  return (
    <main style={{ background: "var(--background)" }}>
      <style dangerouslySetInnerHTML={{ __html: TOC_CSS }} />

      {/* Masthead */}
      <header
        className="w-full"
        style={{ background: "var(--brand-cream)", borderBottom: "1px solid var(--brand-rule)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-12 md:px-12 md:pb-20 md:pt-16">
          <nav aria-label="Breadcrumb" className="mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 uppercase transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                letterSpacing: "0.12em",
                color: "var(--brand-ink-soft)",
                outlineColor: "var(--brand-burgundy)",
              }}
            >
              <span aria-hidden="true">&larr;</span> Back to the Institute
            </Link>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-16">
            <div>
              <p style={{ marginBottom: "18px" }}>
                <span
                  style={{
                    color: "var(--brand-burgundy)",
                    fontStyle: "italic",
                    fontFamily: DISPLAY,
                    fontSize: "17px",
                  }}
                >
                  Policies
                </span>
              </p>
              <h1
                className="font-medium leading-[1.05]"
                style={{
                  fontFamily: DISPLAY,
                  color: "var(--brand-ink)",
                  fontSize: "clamp(38px, 5.2vw, 62px)",
                }}
              >
                Terms of Service
              </h1>
              <p
                className="mt-6 max-w-[660px] text-[16px] leading-[1.7] md:text-[17px]"
                style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
              >
                These Terms govern your use of our website, the patient portal, telemedicine
                consultations and the clinical services provided by the Institute. They should
                be read with our{" "}
                <RichText text="[[Privacy Policy|PRIVACY_URL]]" k="hero-pp" /> and{" "}
                <RichText text="[[Patient Data Protection Policy|PDPP_URL]]" k="hero-pdpp" />.
              </p>
            </div>

            <dl
              className="grid grid-cols-2 gap-px lg:max-w-[360px]"
              style={{ background: "var(--brand-rule)" }}
            >
              {[
                { label: "Effective date", token: "{{EFFECTIVE_DATE}}" },
                { label: "Last updated", token: "{{LAST_UPDATED}}" },
              ].map((d) => (
                <div key={d.label} className="px-5 py-5" style={{ background: "var(--brand-cream)" }}>
                  <dt
                    className="uppercase"
                    style={{
                      fontFamily: SANS,
                      fontSize: "10px",
                      letterSpacing: "0.16em",
                      color: "var(--brand-mute)",
                    }}
                  >
                    {d.label}
                  </dt>
                  <dd
                    className="mt-2 text-[16px]"
                    style={{ fontFamily: DISPLAY, color: "var(--brand-ink)" }}
                  >
                    <RichText text={d.token} k={`d${d.label}`} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[276px_minmax(0,1fr)] lg:gap-20">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="Sections of these Terms" className="pp-toc text-[13px]">
              <p
                className="mb-4 uppercase"
                style={{
                  fontFamily: SANS,
                  letterSpacing: "0.16em",
                  fontSize: "11px",
                  color: "var(--brand-mute)",
                }}
              >
                Contents
              </p>
              <ol className="space-y-[2px]">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      data-survives={s.survives ? "true" : undefined}
                      style={{ fontFamily: SANS }}
                    >
                      <span
                        className="pp-n tabular-nums whitespace-nowrap"
                        style={{
                          fontSize: "11px",
                          letterSpacing: "0.06em",
                          paddingTop: "2px",
                          color: "var(--brand-mute)",
                        }}
                      >
                        {s.num}
                      </span>
                      <span className="leading-snug">{s.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
              <p
                className="mt-5 flex items-start gap-2 pl-3 leading-snug"
                style={{ fontFamily: SANS, fontSize: "11px", color: "var(--brand-mute)" }}
              >
                <span
                  aria-hidden="true"
                  className="mt-[5px] inline-block h-[5px] w-[5px] shrink-0 rounded-full"
                  style={{ background: "var(--brand-olive)" }}
                />
                Clauses that survive termination (Clause 15)
              </p>
            </nav>
          </aside>

          <div>
            {sections.map((section, index) => (
              <section
                key={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="pb-12 pt-12 first:pt-0 md:pb-14 md:pt-14"
                style={{ borderTop: index === 0 ? "none" : "1px solid var(--brand-rule-soft)" }}
              >
                <div id={section.id} tabIndex={-1} className="mb-7 scroll-mt-28 focus:outline-none">
                  <span
                    className="inline-flex items-center gap-[6px] tabular-nums"
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      color: "var(--brand-burgundy)",
                    }}
                  >
                    {section.num}
                    {section.survives && (
                      <span
                        aria-hidden="true"
                        className="inline-block h-[5px] w-[5px] rounded-full"
                        style={{ background: "var(--brand-olive)" }}
                      />
                    )}
                  </span>
                  <h2
                    id={`${section.id}-heading`}
                    className="mt-2 font-medium leading-tight"
                    style={{
                      fontFamily: DISPLAY,
                      color: "var(--brand-ink)",
                      fontSize: "clamp(24px, 2.6vw, 32px)",
                    }}
                  >
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-6">
                  {section.blocks.map((block, i) => renderBlock(block, `${section.id}-${i}`))}
                </div>
              </section>
            ))}

            <p
              className="pt-10 text-[13px] leading-[1.7]"
              style={{
                fontFamily: SANS,
                color: "var(--brand-mute)",
                borderTop: "1px solid var(--brand-rule-soft)",
              }}
            >
              Vyara Wellness Pvt. Ltd., operating as the Institute of Precision Hormonal and
              Metabolic Health. 811, Harnoor House, 1st Floor, Sector-42, Gurgaon-122002,
              Haryana. Governed by the laws of India.
            </p>
          </div>
        </div>
      </div>

      {/* Closing invitation */}
      <section
        style={{ background: "var(--brand-cream-3)", borderTop: "1px solid var(--brand-rule)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-16 text-center md:px-12 md:py-20">
          <h2
            className="font-medium leading-tight"
            style={{
              fontFamily: DISPLAY,
              color: "var(--brand-ink)",
              fontSize: "clamp(26px, 3vw, 34px)",
            }}
          >
            Questions before you book
          </h2>
          <p
            className="mx-auto mt-4 max-w-[580px] text-[16px] leading-[1.7]"
            style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
          >
            If anything here is unclear, write to us before your first consultation and we
            will talk it through.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#contact"
              className="inline-flex items-center px-8 py-[14px] uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{
                background: "var(--brand-burgundy)",
                color: "var(--brand-cream-2)",
                fontFamily: SANS,
                fontSize: "13px",
                letterSpacing: "0.1em",
                outlineColor: "var(--brand-burgundy)",
              }}
            >
              Contact the Institute
            </a>
            <Link
              href={config.PDPP_URL}
              className="inline-flex items-center px-8 py-[14px] uppercase transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{
                border: "1px solid var(--brand-burgundy)",
                color: "var(--brand-burgundy)",
                fontFamily: SANS,
                fontSize: "13px",
                letterSpacing: "0.1em",
                outlineColor: "var(--brand-burgundy)",
              }}
            >
              Patient Data Protection Policy
            </Link>
          </div>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: TOC_JS }} />
    </main>
  );
}