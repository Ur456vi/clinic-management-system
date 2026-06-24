/**
 * HTML email templates for the RMO -> Dr. Yuvraaj appointment hand-off.
 *
 *   - patientAppointmentEmail(): confirmation sent to the patient with the
 *     date / time of their appointment with Dr. Yuvraaj Singh.
 *   - doctorAppointmentEmail(): hand-off sent to the doctor with the
 *     appointment details, the RMO consultation summary, and the patient's
 *     full health-assessment quiz summary.
 *
 * Styles are inlined and table-free where possible for broad client support.
 */

import { RMO_FIELDS, SECTION_LABEL, SECTION_ORDER, SECTION_KEY } from "@/lib/rmo-fields"
import { QUESTIONS } from "@/components/public/assessment/questions"
import { CATEGORIES, type CategoryKey } from "@/components/public/assessment/types"

const BRAND = "#6B2B26"
const GOLD = "#C9A227"
const INK = "#101828"
const MUTE = "#667085"
const RULE = "#EAECF0"

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function shell(title: string, inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F5F6FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="text-align:center;padding:8px 0 20px">
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:26px;color:${GOLD}">Dr. Yuvraaj Singh M.D.</div>
    </div>
    <div style="background:#fff;border:1px solid ${RULE};border-radius:14px;overflow:hidden">
      <div style="background:${BRAND};padding:20px 28px;color:#fff;font-size:18px;font-weight:700">${esc(title)}</div>
      <div style="padding:28px">${inner}</div>
    </div>
    <p style="text-align:center;color:${MUTE};font-size:12px;margin-top:18px">© 2026 Dr. Yuvraaj Singh M.D. — Institute of Precision Hormonal & Metabolic Health</p>
  </div></body></html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:${MUTE};font-size:13px;width:160px;vertical-align:top">${esc(label)}</td>
    <td style="padding:8px 0;color:${INK};font-size:14px;font-weight:600">${esc(value)}</td>
  </tr>`
}

export interface AppointmentInfo {
  patientName: string
  patientNumber?: string | null
  doctorName: string
  startsAt: Date
  endsAt: Date
  reason?: string | null
}

/* ── Patient confirmation ─────────────────────────────────────────── */

export function patientAppointmentEmail(a: AppointmentInfo): {
  subject: string
  text: string
  html: string
} {
  const subject = `Your appointment with ${a.doctorName} — ${fmtDate(a.startsAt)}`
  const text = [
    `Dear ${a.patientName},`,
    ``,
    `Your appointment with ${a.doctorName} is confirmed.`,
    `Date: ${fmtDate(a.startsAt)}`,
    `Time: ${fmtTime(a.startsAt)} – ${fmtTime(a.endsAt)}`,
    a.reason ? `Reason: ${a.reason}` : ``,
    ``,
    `Please arrive 10 minutes early. If you need to reschedule, reply to this email.`,
    ``,
    `Warm regards,`,
    `Dr. Yuvraaj Singh M.D.`,
  ]
    .filter(Boolean)
    .join("\n")

  const inner = `
    <p style="font-size:15px;margin:0 0 16px">Dear <strong>${esc(a.patientName)}</strong>,</p>
    <p style="font-size:14px;color:${MUTE};margin:0 0 20px">Your appointment with <strong style="color:${INK}">${esc(a.doctorName)}</strong> is confirmed. We look forward to seeing you.</p>
    <div style="background:#F9FAFB;border:1px solid ${RULE};border-radius:12px;padding:18px 22px">
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Date", fmtDate(a.startsAt))}
        ${detailRow("Time", `${fmtTime(a.startsAt)} – ${fmtTime(a.endsAt)}`)}
        ${detailRow("Doctor", a.doctorName)}
        ${a.reason ? detailRow("Reason", a.reason) : ""}
      </table>
    </div>
    <p style="font-size:13px;color:${MUTE};margin:20px 0 0">Please arrive 10 minutes early. To reschedule, simply reply to this email.</p>`
  return { subject, text, html: shell("Appointment Confirmed", inner) }
}

/* ── Assessment booking confirmation (patient) ────────────────────── */

export interface BookingInfo {
  patientName: string
  dateStr: string
  timeStr: string
  loginUrl: string
}

export interface NewAccountBookingInfo extends BookingInfo {
  email: string
  tempPassword: string
}

const slotBox = (a: BookingInfo): string => `
  <div style="background:#F9FAFB;border:1px solid ${RULE};border-radius:12px;padding:18px 22px">
    <table style="width:100%;border-collapse:collapse">
      ${detailRow("Assessment", "Comprehensive Hormone & Metabolic Assessment")}
      ${detailRow("Date", a.dateStr)}
      ${detailRow("Time", a.timeStr)}
    </table>
  </div>`

/** New patient — includes portal login credentials in a highlighted box. */
export function patientBookingNewAccountEmail(a: NewAccountBookingInfo): {
  subject: string
  text: string
  html: string
} {
  const subject = "Your Appointment & Account Confirmation — Dr. Yuvraaj Singh M.D."
  const text = [
    `Hello ${a.patientName},`,
    ``,
    `Thank you for booking your Comprehensive Hormone & Metabolic Assessment with Dr. Yuvraaj Singh M.D.`,
    ``,
    `Your appointment is requested for:`,
    `Date: ${a.dateStr}`,
    `Time: ${a.timeStr}`,
    ``,
    `We have also set up your Patient Portal account so you can view your upcoming appointments, medical reports, and treatment plans.`,
    ``,
    `Your login credentials:`,
    `Login URL: ${a.loginUrl}`,
    `Email: ${a.email}`,
    `Temporary Password: ${a.tempPassword}`,
    ``,
    `Please log in and change your password upon your first visit.`,
    ``,
    `Best regards,`,
    `Dr. Yuvraaj Singh M.D.`,
  ].join("\n")

  const inner = `
    <p style="font-size:15px;margin:0 0 16px">Hello <strong>${esc(a.patientName)}</strong>,</p>
    <p style="font-size:14px;color:${MUTE};margin:0 0 20px">Thank you for booking your <strong style="color:${INK}">Comprehensive Hormone &amp; Metabolic Assessment</strong> with Dr. Yuvraaj Singh M.D. Your appointment is requested for:</p>
    ${slotBox(a)}

    <p style="font-size:14px;color:${MUTE};margin:22px 0 10px">We&apos;ve set up your <strong style="color:${INK}">Patient Portal</strong> account so you can view your appointments, reports, and treatment plans.</p>

    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:18px 22px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#92400E;margin-bottom:10px">Your login credentials</div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:5px 0;color:${MUTE};font-size:13px;width:150px">Login URL</td><td style="padding:5px 0"><a href="${esc(
          a.loginUrl,
        )}" style="color:${BRAND};font-size:14px;font-weight:600;text-decoration:none">${esc(a.loginUrl)}</a></td></tr>
        <tr><td style="padding:5px 0;color:${MUTE};font-size:13px">Email</td><td style="padding:5px 0;color:${INK};font-size:14px;font-weight:600">${esc(
          a.email,
        )}</td></tr>
        <tr><td style="padding:5px 0;color:${MUTE};font-size:13px">Temporary Password</td><td style="padding:5px 0"><code style="background:#fff;border:1px solid #FDE68A;border-radius:6px;padding:3px 8px;color:${INK};font-size:14px;font-weight:700">${esc(
          a.tempPassword,
        )}</code></td></tr>
      </table>
    </div>

    <p style="font-size:13px;color:${MUTE};margin:20px 0 0">Please log in and change your password on your first visit.</p>
    <div style="margin-top:18px"><a href="${esc(
      a.loginUrl,
    )}" style="display:inline-block;background:${BRAND};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px">Open Patient Portal</a></div>`

  return { subject, text, html: shell("Appointment & Account Confirmed", inner) }
}

/** Returning patient — confirmation only, no credentials. */
export function patientBookingReturningEmail(a: BookingInfo): {
  subject: string
  text: string
  html: string
} {
  const subject = "Your Appointment Confirmation — Dr. Yuvraaj Singh M.D."
  const text = [
    `Hello ${a.patientName},`,
    ``,
    `Thank you for booking your Comprehensive Hormone & Metabolic Assessment with Dr. Yuvraaj Singh M.D.`,
    ``,
    `Your appointment is requested for:`,
    `Date: ${a.dateStr}`,
    `Time: ${a.timeStr}`,
    ``,
    `View your appointment details in your Patient Portal: ${a.loginUrl}`,
    ``,
    `Best regards,`,
    `Dr. Yuvraaj Singh M.D.`,
  ].join("\n")

  const inner = `
    <p style="font-size:15px;margin:0 0 16px">Hello <strong>${esc(a.patientName)}</strong>,</p>
    <p style="font-size:14px;color:${MUTE};margin:0 0 20px">Thank you for booking your <strong style="color:${INK}">Comprehensive Hormone &amp; Metabolic Assessment</strong> with Dr. Yuvraaj Singh M.D. Your appointment is requested for:</p>
    ${slotBox(a)}
    <p style="font-size:13px;color:${MUTE};margin:22px 0 0">Track your appointment and health updates in your Patient Portal.</p>
    <div style="margin-top:16px"><a href="${esc(
      a.loginUrl,
    )}" style="display:inline-block;background:${BRAND};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px">Open Patient Portal</a></div>`

  return { subject, text, html: shell("Appointment Confirmed", inner) }
}

/* ── Doctor hand-off (RMO summary + quiz) ─────────────────────────── */

export interface QuizInfo {
  totalScore: number
  scoreOutOf: number
  band: string
  byCategory: Record<string, number>
  topRisks: { key: string; label: string; severity: string }[]
  suggestedFocus: { key: string; label: string }[]
  answers: Record<string, unknown>
  contactSex: string | null
}

function rmoSummaryHtml(sections: Record<string, Record<string, unknown>> | null): string {
  if (!sections) return `<p style="color:${MUTE};font-size:13px">No RMO consultation recorded.</p>`
  let any = false
  const blocks: string[] = []
  for (const sec of SECTION_ORDER) {
    const fields = RMO_FIELDS.filter((f) => f.s === sec)
      .map((f) => ({ f, v: sections[SECTION_KEY[sec]]?.[f.n] }))
      .filter((x) => x.v != null && String(x.v).trim() !== "")
    if (fields.length === 0) continue
    any = true
    const rows = fields
      .map(
        ({ f, v }) => `<tr>
          <td style="padding:6px 0;color:${MUTE};font-size:12px;width:200px;vertical-align:top">${esc(f.l)}</td>
          <td style="padding:6px 0;color:${INK};font-size:13px">${esc(v)}</td>
        </tr>`,
      )
      .join("")
    blocks.push(`
      <div style="margin-top:14px">
        <div style="font-size:13px;font-weight:700;color:${BRAND};border-bottom:1px solid ${RULE};padding-bottom:6px;margin-bottom:4px">${esc(
          SECTION_LABEL[sec],
        )}</div>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>`)
  }
  if (!any) return `<p style="color:${MUTE};font-size:13px">RMO consultation started but no fields were filled in.</p>`
  return blocks.join("")
}

function promptFor(q: (typeof QUESTIONS)[number], sex: string | null): string {
  if (q.kind === "splitGender") {
    const variant = sex === "male" ? q.male : sex === "female" ? q.female : q[q.defaultVariant]
    return variant.prompt
  }
  return q.prompt
}

function renderAnswer(q: (typeof QUESTIONS)[number], raw: unknown): string {
  if (!raw || typeof raw !== "object") return "—"
  const a = raw as { kind?: string }
  if (a.kind === "single" && (q.kind === "single" || q.kind === "femaleOnly")) {
    const opt = q.options[(a as { choice: number }).choice]
    return opt ? opt.label : "—"
  }
  if (a.kind === "splitGender" && q.kind === "splitGender") {
    const { variant, choice } = a as { variant: "male" | "female"; choice: number }
    const opt = q[variant].options[choice]
    return opt ? opt.label : "—"
  }
  if (a.kind === "multiToggle" && q.kind === "multiToggle") {
    const yes = (a as { yes: boolean[] }).yes
    return q.options.map((o, i) => `${o.label}: ${yes[i] ? "Yes" : "No"}`).join("; ")
  }
  if (a.kind === "comorbidities" && q.kind === "comorbidities") {
    const sel = (a as { selected: number[] }).selected
    if (!sel.length) return "None reported"
    return sel.map((i) => q.options[i]).filter(Boolean).join(", ")
  }
  return "—"
}

function quizSummaryHtml(quiz: QuizInfo | null): string {
  if (!quiz) return `<p style="color:${MUTE};font-size:13px">No health-assessment quiz on file for this patient.</p>`
  const risks = quiz.topRisks
    .map(
      (r) =>
        `<span style="display:inline-block;background:#FEF3F2;color:#B42318;font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px;margin:2px 4px 2px 0">${esc(
          r.label,
        )} · ${esc(r.severity)}</span>`,
    )
    .join("")
  const cats = CATEGORIES.map(
    (c) =>
      `<tr><td style="padding:5px 0;color:${MUTE};font-size:12px">${esc(c.label)}</td><td style="padding:5px 0;text-align:right;font-weight:700;color:${INK};font-size:13px">${esc(
        quiz.byCategory[c.key as CategoryKey] ?? 0,
      )}</td></tr>`,
  ).join("")
  const answers = QUESTIONS.map((q, i) => {
    return `<tr>
      <td style="padding:6px 0;color:${MUTE};font-size:12px;vertical-align:top;width:55%">Q${i + 1}. ${esc(
        promptFor(q, quiz.contactSex),
      )}</td>
      <td style="padding:6px 0;color:${INK};font-size:12px;font-weight:600">${esc(
        renderAnswer(q, quiz.answers[q.id]),
      )}</td>
    </tr>`
  }).join("")

  return `
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
      <div style="background:#F9ECEB;border-radius:10px;padding:10px 16px">
        <div style="font-size:22px;font-weight:800;color:${INK}">${esc(quiz.totalScore)}<span style="font-size:13px;color:${MUTE};font-weight:500"> / ${esc(
          quiz.scoreOutOf,
        )}</span></div>
        <div style="font-size:12px;color:${BRAND};font-weight:700">${esc(quiz.band)}</div>
      </div>
      <div>${risks || ""}</div>
    </div>
    <div style="font-size:12px;font-weight:700;color:${BRAND};margin:8px 0 2px">Per-category subtotals</div>
    <table style="width:100%;border-collapse:collapse">${cats}</table>
    <div style="font-size:12px;font-weight:700;color:${BRAND};margin:16px 0 2px">Full responses</div>
    <table style="width:100%;border-collapse:collapse">${answers}</table>`
}

export function doctorAppointmentEmail(
  a: AppointmentInfo,
  rmoSections: Record<string, Record<string, unknown>> | null,
  quiz: QuizInfo | null,
): { subject: string; text: string; html: string } {
  const subject = `New patient hand-off: ${a.patientName} — ${fmtDate(a.startsAt)} ${fmtTime(
    a.startsAt,
  )}`
  const text = [
    `New appointment booked for you.`,
    `Patient: ${a.patientName}${a.patientNumber ? ` (#${a.patientNumber})` : ""}`,
    `Date: ${fmtDate(a.startsAt)}`,
    `Time: ${fmtTime(a.startsAt)} – ${fmtTime(a.endsAt)}`,
    ``,
    `The RMO consultation summary and the patient's full quiz assessment are included in the HTML version of this email.`,
  ].join("\n")

  const inner = `
    <p style="font-size:14px;color:${MUTE};margin:0 0 18px">A new appointment has been booked following an RMO consultation. Details, the RMO summary, and the patient's full assessment follow.</p>
    <div style="background:#F9FAFB;border:1px solid ${RULE};border-radius:12px;padding:18px 22px">
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Patient", `${a.patientName}${a.patientNumber ? ` (#${a.patientNumber})` : ""}`)}
        ${detailRow("Date", fmtDate(a.startsAt))}
        ${detailRow("Time", `${fmtTime(a.startsAt)} – ${fmtTime(a.endsAt)}`)}
        ${a.reason ? detailRow("Reason", a.reason) : ""}
      </table>
    </div>

    <h3 style="font-size:15px;color:${INK};margin:26px 0 4px">RMO Consultation Summary</h3>
    ${rmoSummaryHtml(rmoSections)}

    <h3 style="font-size:15px;color:${INK};margin:28px 0 4px">Health Assessment Quiz</h3>
    ${quizSummaryHtml(quiz)}`

  return { subject, text, html: shell("New Patient Hand-off", inner) }
}
