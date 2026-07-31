import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   FILL THIS IN BEFORE PUBLISHING.

   Any value left as an empty string renders on the page as a loud amber
   "NEEDS INPUT" chip, so an unfilled legal placeholder can't quietly ship.
   Email and phone values become mailto: and tel: links automatically.

   Set PDPP_URL in app/privacy/page.tsx to "/patient-data-protection-policy"
   so the two policies cross-link.
   ═══════════════════════════════════════════════════════════════════════════ */

const config = {
  EFFECTIVE_DATE: "1 August 2026", // e.g. "1 August 2026"
  LAST_UPDATED: "31 July 2026", // e.g. "31 July 2026"
  PORTAL_NAME: "Dr. Yuvraaj Singh", // patient portal / app name — clause 2.1.3
  PRIVACY_URL: "/privacypolicy", // website Privacy Policy
  TERMS_URL: "/termsandservices", // Terms of Service — referenced in the opening line
  PAYMENT_PROCESSOR: "Razorpay", // clauses 4.5, 9.1.5
  HOSTING_PROVIDER: "Amazon Web Server", // clause 9.1.4
  EMR_PMS_PROVIDER: "", // clause 9.1.4
  COMMUNICATION_PROVIDERS: "Dr. Yuvraaj Singh", // clause 9.1.5
  GRIEVANCE_OFFICER_NAME: "Dr. Yuvraaj Singh", // clause 16
  GRIEVANCE_OFFICER_EMAIL: "dryuvraajsingh@iphmh.com",
  GRIEVANCE_OFFICER_PHONE: "+91 9266843439",
  CONTACT_EMAIL: "dryuvraajsingh@iphmh.com",
  CONTACT_PHONE: "+91 9266843439",
} as const;

export const metadata: Metadata = {
  title: "Patient Data Protection Policy | Institute of Precision Hormonal & Metabolic Health",
  description:
    "How the Institute collects, protects and shares your medical and health data under India's Digital Personal Data Protection Act, 2023 — including consent, research use, retention and your rights as a Data Principal.",
  alternates: {
    canonical: "https://www.dryuvraajsingh.com/patient-data-protection-policy",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Patient Data Protection Policy | Institute of Precision Hormonal & Metabolic Health",
    description:
      "How we protect your medical and health data under the DPDP Act, 2023.",
    url: "https://www.dryuvraajsingh.com/patient-data-protection-policy",
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
  | { kind: "note"; text: string }
  | { kind: "contact"; rows: { label: string; text: string }[] };

type Section = {
  num: string;
  id: string;
  title: string;
  /** Marks the clauses that carry heightened protection for health data. */
  emphasis?: boolean;
  blocks: Block[];
};

const sections: Section[] = [
  {
    num: "01",
    id: "purpose",
    title: "Purpose and status of this Policy",
    blocks: [
      {
        kind: "clause",
        num: "1.1",
        text:
          "This Patient Data Protection Policy explains how Vyara Wellness Pvt. Ltd., a company incorporated under the Companies Act, 2013 having its place of business at 811, Harnoor House, 1st Floor, Sector-42, Gurgaon-122002, Haryana, operating under the name \u2018Institute of Precision Hormonal and Metabolic Health\u2019 (\u201cthe Institute\u201d, \u201cwe\u201d, \u201cus\u201d, \u201cour\u201d), collects, processes, protects and shares your personal data, with particular care for your medical and health data, in the course of providing healthcare services.",
      },
      {
        kind: "clause",
        num: "1.2",
        text:
          "This Policy is framed in accordance with the Digital Personal Data Protection Act, 2023 (the \u201cDPDP Act\u201d) and the rules made under it. For the purposes of the DPDP Act, the Institute is the Data Fiduciary and you, the individual whose data we process, are the Data Principal.",
      },
    ],
  },
  {
    num: "02",
    id: "scope",
    title: "Scope",
    blocks: [
      {
        kind: "clause",
        num: "2.1",
        text:
          "This Policy applies to all personal data we process when providing healthcare services, including:",
        items: [
          { num: "2.1.1", text: "in-person consultations and treatment at the Institute;" },
          {
            num: "2.1.2",
            text:
              "telemedicine consultations conducted in accordance with the Telemedicine Practice Guidelines, 2020; and",
          },
          {
            num: "2.1.3",
            text:
              "the patient portal / application {{PORTAL_NAME}} through which clinical information is accessed and managed.",
          },
        ],
      },
      {
        kind: "clause",
        num: "2.2",
        text:
          "General data collected through our public website is covered by the separate [[website Privacy Policy|PRIVACY_URL]].",
      },
    ],
  },
  {
    num: "03",
    id: "definitions",
    title: "Definitions",
    blocks: [
      {
        kind: "clause",
        num: "3.1",
        text:
          "Personal data means any data about an individual who is identifiable by or in relation to such data.",
      },
      {
        kind: "clause",
        num: "3.2",
        text:
          "Health data means data relating to your physical or mental health, including medical and family history, symptoms, diagnoses, hormonal and metabolic test results, prescriptions, treatment plans, and lifestyle information relevant to your care. We treat health data as a particularly sensitive category requiring heightened protection.",
      },
      {
        kind: "clause",
        num: "3.3",
        text:
          "Processing means any operation performed on personal data, including collection, recording, storage, use, sharing, disclosure or erasure.",
      },
      {
        kind: "clause",
        num: "3.4",
        text:
          "Data Processor means any person who processes personal data on our behalf and on our documented instructions.",
      },
    ],
  },
  {
    num: "04",
    id: "data-we-collect",
    title: "The data we collect",
    blocks: [
      {
        kind: "clause",
        num: "4.1",
        text:
          "Identity and contact data: name, age, date of birth, gender, address, email address, telephone number, and government-issued identification where required to verify identity for telemedicine or treatment.",
      },
      {
        kind: "clause",
        num: "4.2",
        text:
          "Health data: medical and family history, presenting symptoms, clinical findings, diagnoses, hormonal and metabolic assessments, laboratory and diagnostic test results, prescriptions, compounded-formulation details, treatment plans, progress notes, and lifestyle, diet and wellness information you share with us.",
      },
      {
        kind: "clause",
        num: "4.3",
        text:
          "Consultation records: notes and records and, where applicable and with prior notice to you, recordings of telemedicine consultations, and correspondence relating to your care.",
      },
      { kind: "clause", num: "4.4", text: "Account data: your patient portal profile and activity." },
      {
        kind: "clause",
        num: "4.5",
        text:
          "Payment data: details necessary to process payment for services. Where payment is taken online, card and banking details are handled by {{PAYMENT_PROCESSOR}} and are not stored by us except for transaction records.",
      },
      {
        kind: "clause",
        num: "4.6",
        text:
          "We collect this data directly from you, from diagnostic laboratories Mahajan Labs that perform tests ordered for you, and from our compounding pharmacy partner Zenovira Health LLP in relation to formulations prescribed for you.",
      },
    ],
  },
  {
    num: "05",
    id: "lawful-basis",
    title: "Lawful basis and notice",
    blocks: [
      {
        kind: "clause",
        num: "5.1",
        text:
          "We process your personal data, including health data, on the basis of your consent, obtained at or before the point of collection through a clear notice describing the data sought, the purposes, and how to withdraw consent and exercise your rights.",
      },
      {
        kind: "clause",
        num: "5.2",
        text:
          "Where the DPDP Act permits processing for certain legitimate uses without separate consent (for example, to comply with a legal obligation, or to respond to a medical emergency threatening life or health), we may rely on those grounds to the extent permitted.",
      },
    ],
  },
  {
    num: "06",
    id: "purposes",
    title: "Purposes of processing",
    blocks: [
      {
        kind: "clause",
        num: "6.1",
        text: "We process your personal data to:",
        items: [
          { num: "6.1.1", text: "verify your identity and register you as a patient;" },
          {
            num: "6.1.2",
            text:
              "provide clinical services, including diagnosis, treatment, prescriptions and follow-up care, in person or by telemedicine;",
          },
          {
            num: "6.1.3",
            text:
              "arrange diagnostic testing and the compounding and supply of prescribed formulations;",
          },
          {
            num: "6.1.4",
            text: "maintain medical records as required by law and good medical practice;",
          },
          {
            num: "6.1.5",
            text: "communicate with you about appointments, results, reminders and care;",
          },
          { num: "6.1.6", text: "process payments and maintain financial records;" },
          { num: "6.1.7", text: "comply with legal and regulatory obligations; and" },
          { num: "6.1.8", text: "establish, exercise or defend legal claims." },
        ],
      },
    ],
  },
  {
    num: "07",
    id: "health-data-protection",
    title: "Special protection for medical and health data",
    emphasis: true,
    blocks: [
      {
        kind: "clause",
        num: "7.1",
        text: "Because your health data is highly sensitive:",
        items: [
          {
            num: "7.1.1",
            text:
              "we collect and process it only to the extent necessary for your care and the purposes in this Policy (data minimisation);",
          },
          {
            num: "7.1.2",
            text:
              "we obtain your specific consent before processing it and before sharing it with the third parties in Clause 9;",
          },
          {
            num: "7.1.3",
            text:
              "access within the Institute is restricted to the treating practitioner and authorised personnel on a strict need-to-know basis;",
          },
          { num: "7.1.4", text: "we apply enhanced security safeguards (Clause 11); and" },
          {
            num: "7.1.5",
            text:
              "we do not sell your health data and do not use it for advertising or for any profiling unrelated to your care.",
          },
        ],
      },
    ],
  },
  {
    num: "08",
    id: "research",
    title: "Use of data for research, teaching and publication",
    emphasis: true,
    blocks: [
      {
        kind: "clause",
        num: "8.1",
        text:
          "We may use your personal data, including health data, for clinical research, teaching, clinical audit and the improvement of treatment protocols. Wherever the purpose can be achieved without identifying you, we use de-identified or anonymised data.",
      },
      {
        kind: "clause",
        num: "8.2",
        text:
          "We will not publish any case report, photograph, image, video, pedigree or clinical description that identifies you, or from which you could be identified, whether directly or indirectly, and whether by combination of distinctive physical, clinical, demographic or locational features that may be recognisable to your family, friends, community or locality, except with your separate, specific and written consent for that publication. Removing your name or other direct identifiers alone is not treated by us as making you unidentifiable.",
      },
      {
        kind: "clause",
        num: "8.3",
        text:
          "Before seeking such consent we will, so far as practicable, show you the material proposed to be published. You may decline, or withdraw your consent before publication, without any effect on your care.",
      },
      {
        kind: "clause",
        num: "8.4",
        text:
          "Any processing for research, archiving or statistical purposes is carried out in accordance with the Digital Personal Data Protection Act, 2023 and applicable medical-research ethics guidelines (including the ICMR National Ethical Guidelines), with safeguards so that your identity cannot be inferred and so that no decision specific to you is made on the basis of that processing.",
      },
    ],
  },
  {
    num: "09",
    id: "sharing",
    title: "Sharing and Data Processors",
    blocks: [
      {
        kind: "clause",
        num: "9.1",
        text:
          "We share personal data only as necessary for your care and the lawful operation of the Institute, with:",
        items: [
          {
            num: "9.1.1",
            text: "treating practitioners and authorised Institute personnel involved in your care;",
          },
          {
            num: "9.1.2",
            text:
              "Zenovira Health LLP, our compounding pharmacy partner, which prepares prescribed formulations and acts as a Data Processor: it processes patient data only on our documented instructions, only as needed to fulfil prescriptions, and may not use that data for its own purposes;",
          },
          {
            num: "9.1.3",
            text: "Mahajan Labs, for diagnostic testing ordered as part of your care;",
          },
          {
            num: "9.1.4",
            text:
              "{{HOSTING_PROVIDER}} and {{EMR_PMS_PROVIDER}}, which host and maintain our records and systems;",
          },
          {
            num: "9.1.5",
            text:
              "{{PAYMENT_PROCESSOR}} and {{COMMUNICATION_PROVIDERS}}, to process payments and to communicate with you;",
          },
          {
            num: "9.1.6",
            text:
              "professional advisers (lawyers, auditors, insurers) on a confidential, need-to-know basis; and",
          },
          {
            num: "9.1.7",
            text: "government, regulatory or judicial authorities, where required by law.",
          },
        ],
      },
      {
        kind: "clause",
        num: "9.2",
        text:
          "Every Data Processor is bound by a written agreement requiring confidentiality, security, processing only on our instructions, and compliance with applicable data-protection law. We remain accountable for personal data processed on our behalf.",
      },
    ],
  },
  {
    num: "10",
    id: "cross-border",
    title: "Cross-border data and international patients",
    blocks: [
      {
        kind: "clause",
        num: "10.1",
        text:
          "The Institute serves patients in India and also foreign nationals and non-resident Indians, including by telemedicine. Your personal data, including health data, is stored on infrastructure located in India and processed primarily in India under the DPDP Act.",
      },
      {
        kind: "clause",
        num: "10.2",
        text:
          "By using our services from outside India, you understand and consent that your personal data will be transferred to, stored in and processed in India for the purposes in this Policy. Any transfer of personal data outside India will be made only in accordance with the DPDP Act and applicable law.",
      },
    ],
  },
  {
    num: "11",
    id: "security",
    title: "Security safeguards",
    blocks: [
      {
        kind: "clause",
        num: "11.1",
        text:
          "We implement reasonable technical and organisational security safeguards to protect personal data against unauthorised access, disclosure, alteration and loss, including access controls, encryption in transit, role-based access to health data, audit logging where appropriate, and binding confidentiality obligations on personnel and processors.",
      },
      {
        kind: "clause",
        num: "11.2",
        text:
          "In the event of a personal data breach, we will notify the Data Protection Board of India and affected Data Principals in the manner and within the timelines prescribed under the DPDP Act and the rules made under it.",
      },
    ],
  },
  {
    num: "12",
    id: "retention",
    title: "Retention",
    blocks: [
      {
        kind: "p",
        text:
          "We retain medical records and associated personal data for a minimum of seven (7) years. Where you withdraw your consent to the collection of your data and/or to our services, we will retain your medical records for at least seven (7) years from the date of withdrawal, in order to meet the minimum retention obligations applicable to medical records under Indian law and good medical practice and to establish, exercise or defend legal claims.",
      },
      {
        kind: "p",
        text:
          "Where a patient is lost to follow-up or is deceased, the same minimum period of seven (7) years applies; provided that we may retain such data for as long as required where it has continuing value or contribution toward positive research outcomes that may valuably add to, or change the manner in which, certain treatment protocols are practised. Any such retention and use of data for research is carried out in accordance with applicable law and the safeguards in this Policy, including de-identification of records wherever the research purpose can be achieved without identifying you. When data is no longer required, we securely delete or anonymise it.",
      },
    ],
  },
  {
    num: "13",
    id: "your-rights",
    title: "Your rights as a Data Principal",
    blocks: [
      {
        kind: "clause",
        num: "13.1",
        text: "Subject to the DPDP Act, you have the right to:",
        items: [
          {
            num: "13.1.1",
            text:
              "access a summary of the personal data we hold about you and how we process it;",
          },
          {
            num: "13.1.2",
            text:
              "correction and updating of inaccurate or incomplete data, and erasure of data no longer required for the purpose for which it was collected, unless retention is required by law;",
          },
          {
            num: "13.1.3",
            text: "grievance redressal, by contacting our Grievance Officer (Clause 16);",
          },
          {
            num: "13.1.4",
            text:
              "nominate another individual to exercise your rights in the event of your death or incapacity; and",
          },
          {
            num: "13.1.5",
            text:
              "withdraw your consent at any time. Withdrawal will not affect the lawfulness of processing before withdrawal. Withdrawing consent necessary for your care may mean we can no longer provide clinical services to you.",
          },
        ],
      },
      {
        kind: "clause",
        num: "13.2",
        text:
          "To exercise any right, contact us using the details in Clause 16. We may verify your identity before acting on a request, and will respond within the timelines prescribed under the DPDP Act.",
      },
      {
        kind: "clause",
        num: "13.3",
        text:
          "If you are not satisfied with our response, you may complain to the Data Protection Board of India.",
      },
    ],
  },
  {
    num: "14",
    id: "consent",
    title: "Consent and withdrawal",
    blocks: [
      {
        kind: "p",
        text:
          "We obtain your consent through clear, specific notices, and you may manage or withdraw your consent at any time through the patient portal or by contacting the Grievance Officer. We provide withdrawal mechanisms that are as easy to use as the mechanism by which consent was given.",
      },
    ],
  },
  {
    num: "15",
    id: "children",
    title: "Children and persons under guardianship",
    blocks: [
      {
        kind: "p",
        text:
          "Our services are intended for adults aged 18 and over. Where a child or a person with a disability who has a lawful guardian is treated, we process their personal data only with verifiable consent of the parent or lawful guardian, as required under the DPDP Act. We will not undertake any processing likely to cause a detrimental effect on the well-being of a child, nor any tracking, behavioural monitoring or targeted advertising directed at children.",
      },
    ],
  },
  {
    num: "16",
    id: "contact",
    title: "Grievance redressal and contact",
    blocks: [
      {
        kind: "p",
        text:
          "For any question about this Policy, to exercise your rights, or to raise a grievance:",
      },
      {
        kind: "contact",
        rows: [
          { label: "Grievance Officer", text: "{{GRIEVANCE_OFFICER_NAME}}" },
          {
            label: "Email",
            text: "[[{{GRIEVANCE_OFFICER_EMAIL}}|mailto:GRIEVANCE_OFFICER_EMAIL]]",
          },
          {
            label: "Phone",
            text: "[[{{GRIEVANCE_OFFICER_PHONE}}|tel:GRIEVANCE_OFFICER_PHONE]]",
          },
          {
            label: "Address",
            text: "811, Harnoor House, 1st Floor, Sector-42, Gurgaon-122002, Haryana",
          },
          {
            label: "General enquiries",
            text:
              "[[{{CONTACT_EMAIL}}|mailto:CONTACT_EMAIL]] \u00b7 [[{{CONTACT_PHONE}}|tel:CONTACT_PHONE]]",
          },
        ],
      },
      {
        kind: "note",
        text:
          "We will acknowledge and respond to grievances within the timelines prescribed under the DPDP Act and the rules made under it. If unresolved, you may escalate to the Data Protection Board of India.",
      },
    ],
  },
  {
    num: "17",
    id: "changes",
    title: "Changes to this Policy",
    blocks: [
      {
        kind: "p",
        text:
          "We may update this Policy from time to time. The current version is always available at www.dryuvraajsingh.com, with the \u201cLast updated\u201d date shown above. Where changes are material, we will take reasonable steps to bring them to your attention.",
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

function Note({ text, k }: { text: string; k: string }) {
  return (
    <aside
      className="rounded-[2px] px-5 py-4 md:px-6 md:py-5"
      style={{
        background: "var(--brand-olive-soft)",
        borderLeft: "3px solid var(--brand-olive)",
      }}
    >
      <p
        className="text-[15px] leading-[1.7] md:text-[16px]"
        style={{ fontFamily: SANS, color: "var(--brand-olive-dark)" }}
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
    case "note":
      return <Note key={key} text={block.text} k={key} />;
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
.pp-toc a[data-health="true"] .pp-n::after{content:"";display:inline-block;
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

export default function PatientDataProtectionPolicyPage() {
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
                  fontSize: "clamp(34px, 4.6vw, 58px)",
                }}
              >
                Patient Data Protection Policy
              </h1>
              <p
                className="mt-6 max-w-[660px] text-[16px] leading-[1.7] md:text-[17px]"
                style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
              >
                This Policy sets out how we protect your personal data, with particular focus
                on your medical and health data, under the Digital Personal Data Protection
                Act, 2023. It should be read together with our{" "}
                <RichText text="[[website Privacy Policy|PRIVACY_URL]]" k="hero-pp" /> and our{" "}
                <RichText text="[[Terms of Service|TERMS_URL]]" k="hero-tos" />.
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
            <nav aria-label="Sections of this policy" className="pp-toc text-[13px]">
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
                      data-health={s.emphasis ? "true" : undefined}
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
                Clauses carrying heightened protection for health data
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
                    {section.emphasis && (
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

                <div
                  className="space-y-6"
                  style={
                    section.emphasis
                      ? {
                          borderLeft: "2px solid var(--brand-olive-soft)",
                          paddingLeft: "20px",
                          marginLeft: "-22px",
                        }
                      : undefined
                  }
                >
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
              Haryana. Data Fiduciary under the Digital Personal Data Protection Act, 2023.
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
            Exercise a right, or raise a grievance
          </h2>
          <p
            className="mx-auto mt-4 max-w-[580px] text-[16px] leading-[1.7]"
            style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
          >
            Access, correction, erasure, nomination or withdrawal of consent — write to our
            Grievance Officer and we will respond within the timelines set by the DPDP Act.
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
              Contact the Grievance Officer
            </a>
            <Link
              href={config.PRIVACY_URL}
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
              Website Privacy Policy
            </Link>
          </div>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: TOC_JS }} />
    </main>
  );
}