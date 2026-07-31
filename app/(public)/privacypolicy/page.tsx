import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   FILL THIS IN BEFORE PUBLISHING.

   Any value left as an empty string renders on the page as a loud amber
   "NEEDS INPUT" chip, so an unfilled legal placeholder can't quietly ship.
   Email and phone values become mailto: and tel: links automatically.
   ═══════════════════════════════════════════════════════════════════════════ */

const config = {
  EFFECTIVE_DATE: "1 August 2026", // e.g. "1 August 2026"
  LAST_UPDATED: "31 July 2026", // e.g. "31 July 2026"
  PORTAL_NAME: "Dr. Yuvraaj Singh", // patient portal name — clause 2.1
  PDPP_URL: "/dataprotection", // Patient Data Protection Policy — hero, clauses 2.2 / 5.3 / 9
  HOSTING_PROVIDER: "Amazon Web Server", // clause 5.1.1
  COMMUNICATION_PROVIDERS: "Dr. Yuvraaj Singh", // clause 5.1.2
  PAYMENT_PROCESSOR: "Razorpay", // clause 5.1.3
  GRIEVANCE_OFFICER_NAME: "Dr. Yuvraaj Singh", // clause 12
  GRIEVANCE_OFFICER_EMAIL: "dryuvraajsingh@iphmh.com",
  GRIEVANCE_OFFICER_PHONE: "+91 9266843439",
  CONTACT_EMAIL: "dryuvraajsingh@iphmh.com",
  CONTACT_PHONE: "+91 9266843439",
} as const;

export const metadata: Metadata = {
  title: "Privacy Policy | Institute of Precision Hormonal & Metabolic Health",
  description:
    "How Vyara Wellness Pvt. Ltd. collects and uses personal data through www.dryuvraajsingh.com, in accordance with India's Digital Personal Data Protection Act, 2023.",
  alternates: { canonical: "https://www.dryuvraajsingh.com/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | Institute of Precision Hormonal & Metabolic Health",
    description:
      "How we collect and use personal data through our website, under the DPDP Act, 2023.",
    url: "https://www.dryuvraajsingh.com/privacy",
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

type Section = { num: string; id: string; title: string; blocks: Block[] };

const sections: Section[] = [
  {
    num: "01",
    id: "introduction",
    title: "Introduction",
    blocks: [
      {
        kind: "clause",
        num: "1.1",
        text:
          "This Privacy Policy explains how Vyara Wellness Pvt. Ltd., a company incorporated under the Companies Act, 2013 having its place of business at 811, Harnoor House, 1st Floor, Sector-42, Gurgaon-122002, Haryana, operating under the name \u2018Institute of Precision Hormonal and Metabolic Health\u2019 (\u201cwe\u201d, \u201cus\u201d, \u201cour\u201d), collects and uses personal data through our website at www.dryuvraajsingh.com (the \u201cWebsite\u201d).",
      },
      {
        kind: "clause",
        num: "1.2",
        text:
          "We are committed to protecting your privacy and handling your data responsibly and in accordance with applicable law, including the Digital Personal Data Protection Act, 2023 (the \u201cDPDP Act\u201d).",
      },
    ],
  },
  {
    num: "02",
    id: "scope",
    title: "Scope of this Policy",
    blocks: [
      {
        kind: "clause",
        num: "2.1",
        text:
          "This Policy applies to personal data we collect through the Website, including general browsing, enquiry and contact forms, appointment requests, and sign-up for the patient portal {{PORTAL_NAME}}.",
      },
      {
        kind: "clause",
        num: "2.2",
        text:
          "This Policy does not cover the medical, clinical and other sensitive personal data we process when providing healthcare services, whether in person, by telemedicine or through the patient portal. That data is governed by our separate [[Patient Data Protection Policy|PDPP_URL]], which you should read together with this Policy.",
      },
      {
        kind: "clause",
        num: "2.3",
        text: "This Policy does not apply to third-party websites we link to but do not control.",
      },
    ],
  },
  {
    num: "03",
    id: "data-we-collect",
    title: "The data we collect through the Website",
    blocks: [
      {
        kind: "clause",
        num: "3.1",
        text: "Information you give us:",
        items: [
          {
            num: "3.1.1",
            text:
              "when you complete a contact or enquiry form: your name, email address, telephone number and the contents of your message;",
          },
          {
            num: "3.1.2",
            text:
              "when you request or book an appointment: the details you provide for that purpose; and",
          },
          {
            num: "3.1.3",
            text:
              "when you sign up for the patient portal: your registration details and login credentials. (The clinical data held within the portal is governed by the Patient Data Protection Policy.)",
          },
        ],
      },
      {
        kind: "clause",
        num: "3.2",
        text:
          "Information we collect automatically: when you visit the Website, we may collect device and browser information, IP address, pages viewed and similar usage information through cookies and similar technologies (see Clause 7).",
      },
      {
        kind: "note",
        text:
          "Please do not submit detailed medical information through general Website forms. Provide such information only through the secure channels we direct you to for clinical care.",
      },
    ],
  },
  {
    num: "04",
    id: "how-we-use-your-data",
    title: "How we use your data",
    blocks: [
      {
        kind: "clause",
        num: "4.1",
        text: "We use Website personal data to:",
        items: [
          { num: "4.1.1", text: "respond to your enquiries and requests;" },
          { num: "4.1.2", text: "manage appointment requests and bookings;" },
          { num: "4.1.3", text: "create and administer your patient portal account;" },
          { num: "4.1.4", text: "operate, maintain, secure and improve the Website; and" },
          {
            num: "4.1.5",
            text:
              "send you information or communications you have requested or consented to receive, which you may opt out of at any time.",
          },
        ],
      },
      {
        kind: "clause",
        num: "4.2",
        text:
          "We process this data on the basis of your consent and, where applicable, to take steps at your request before providing a service. We do not use Website data for any purpose incompatible with those set out above.",
      },
    ],
  },
  {
    num: "05",
    id: "sharing",
    title: "Sharing your data",
    blocks: [
      {
        kind: "clause",
        num: "5.1",
        text: "We share Website personal data only as necessary, with:",
        items: [
          { num: "5.1.1", text: "{{HOSTING_PROVIDER}}, which hosts the Website;" },
          { num: "5.1.2", text: "{{COMMUNICATION_PROVIDERS}}, to respond to you;" },
          {
            num: "5.1.3",
            text: "{{PAYMENT_PROCESSOR}}, where you make a payment through the Website; and",
          },
          {
            num: "5.1.4",
            text: "government, regulatory or judicial authorities, where required by law.",
          },
        ],
      },
      {
        kind: "clause",
        num: "5.2",
        text:
          "Anyone who processes data on our behalf does so under a written agreement requiring confidentiality, security, and processing only on our instructions. We do not sell your personal data.",
      },
      {
        kind: "clause",
        num: "5.3",
        text:
          "For sharing of clinical and medical data (including with our compounding pharmacy partner and diagnostic laboratories), see the [[Patient Data Protection Policy|PDPP_URL]].",
      },
    ],
  },
  {
    num: "06",
    id: "retention",
    title: "Retention",
    blocks: [
      {
        kind: "p",
        text:
          "We keep Website enquiry and contact data only for as long as necessary to deal with your enquiry and for a reasonable period thereafter, and account data for as long as your portal account is active, unless a longer period is required by law. Retention of clinical records is dealt with in the Patient Data Protection Policy.",
      },
    ],
  },
  {
    num: "07",
    id: "cookies",
    title: "Cookies and similar technologies",
    blocks: [
      {
        kind: "p",
        text:
          "The Website uses cookies and similar technologies to enable core functionality, remember your preferences, and keep you signed in to the portal. You can control cookies through your browser settings. Disabling some cookies may affect how the Website works.",
      },
    ],
  },
  {
    num: "08",
    id: "security",
    title: "Security",
    blocks: [
      {
        kind: "p",
        text:
          "We apply reasonable technical and organisational measures to protect Website data against unauthorised access, disclosure or loss. No website is completely secure, but we review our safeguards regularly.",
      },
    ],
  },
  {
    num: "09",
    id: "your-rights",
    title: "Your rights",
    blocks: [
      {
        kind: "p",
        text:
          "You have rights under the DPDP Act in respect of your personal data, including the rights of access, correction, erasure, grievance redressal, nomination, and withdrawal of consent. These rights, and how to exercise them, are described in full in our [[Patient Data Protection Policy|PDPP_URL]]. To make any request or raise a concern, contact our Grievance Officer (Clause 12).",
      },
    ],
  },
  {
    num: "10",
    id: "international-visitors",
    title: "International visitors",
    blocks: [
      {
        kind: "p",
        text:
          "The Website may be accessed from outside India, including by foreign nationals and non-resident Indians. Personal data collected through the Website is stored and processed in India under the DPDP Act. By using the Website from outside India, you consent to your data being transferred to and processed in India for the purposes set out in this Policy.",
      },
    ],
  },
  {
    num: "11",
    id: "children",
    title: "Children",
    blocks: [
      {
        kind: "p",
        text:
          "The Website is intended for adults aged 18 and over. We do not knowingly collect personal data of children through the Website except where provided by a parent or lawful guardian, and we handle any such data in accordance with the DPDP Act and our Patient Data Protection Policy.",
      },
    ],
  },
  {
    num: "12",
    id: "contact",
    title: "Contact and grievances",
    blocks: [
      { kind: "p", text: "For questions about this Policy or to raise a grievance:" },
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
    ],
  },
  {
    num: "13",
    id: "changes",
    title: "Changes to this Policy",
    blocks: [
      {
        kind: "p",
        text:
          "We may update this Policy from time to time. The current version is always available at www.dryuvraajsingh.com, with the \u201cLast updated\u201d date shown above.",
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
      title="Not set yet — fill this in at the top of app/privacy/page.tsx"
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
    <div className="grid grid-cols-[52px_1fr] gap-x-1 md:grid-cols-[64px_1fr]">
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
                className="grid grid-cols-[56px_1fr] gap-x-1 md:grid-cols-[64px_1fr]"
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

/** Clinical-safety callout — the one place this page raises its voice. */
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

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>
              <p
                className="mt-6 max-w-[640px] text-[16px] leading-[1.7] md:text-[17px]"
                style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
              >
                This is the website Privacy Policy. How we handle your medical and other
                sensitive personal data in connection with clinical care is set out
                separately in our{" "}
                <RichText text="[[Patient Data Protection Policy|PDPP_URL]]" k="hero" />.
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
        <div className="grid gap-12 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-20">
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
                    <a href={`#${s.id}`} style={{ fontFamily: SANS }}>
                      <span
                        className="pp-n tabular-nums"
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
                    className="tabular-nums"
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      color: "var(--brand-burgundy)",
                    }}
                  >
                    {section.num}
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
              Haryana.
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
            Questions about your data
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.7]"
            style={{ fontFamily: SANS, color: "var(--brand-ink-soft)" }}
          >
            Write to our Grievance Officer and we will respond within the timelines set by the
            DPDP Act.
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
              href="/assessment"
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
              Request Consultation
            </Link>
          </div>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: TOC_JS }} />
    </main>
  );
}