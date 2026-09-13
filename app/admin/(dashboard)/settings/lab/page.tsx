"use client"

/**
 * Admin → Settings → Lab Integration. Configures the Mahajan Imaging partner
 * connection that used to live entirely in environment variables.
 *
 * Two conventions worth knowing when reading this form:
 *
 *  - A BLANK text field means "not set here — use the deployed environment
 *    value". It does not mean empty. That is why every placeholder shows the
 *    fallback rather than a generic hint: clearing a field reverts to the
 *    deployed default instead of breaking the integration.
 *  - Flags are three-state for the same reason, so "use the deployed value" is
 *    a distinct choice from "off". A checkbox could not express that.
 *
 * Secrets are write-only: stored encrypted, never sent back, and left blank on
 * save to keep the existing value.
 */

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, ChevronDown, FlaskConical, Loader2, PlugZap, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

type Tri = boolean | null

interface LabSettings {
  enabled: Tri
  baseUrl: string
  tokenUrl: string
  clientId: string
  hasClientSecret: boolean
  slotsPath: string
  bookHomePath: string
  bookCenterPath: string
  cancelHomePath: string
  rescheduleHomePath: string
  cancelCenterPath: string
  rescheduleCenterPath: string
  productsPath: string
  partnerSource: string
  hasWebhookSecret: boolean
  allowUnauthenticatedWebhooks: Tri
  patientBookingEnabled: Tri
}

const emptyForm = {
  enabled: null as Tri,
  baseUrl: "",
  tokenUrl: "",
  clientId: "",
  clientSecret: "",
  slotsPath: "",
  bookHomePath: "",
  bookCenterPath: "",
  cancelHomePath: "",
  rescheduleHomePath: "",
  cancelCenterPath: "",
  rescheduleCenterPath: "",
  productsPath: "",
  partnerSource: "",
  webhookSecret: "",
  allowUnauthenticatedWebhooks: null as Tri,
  patientBookingEnabled: null as Tri,
}

/** Built-in fallbacks, shown as placeholders so blank is never a mystery. */
const FALLBACK = {
  slotsPath: "/services/apexrest/getAvailableSlots",
  bookHomePath: "/services/apexrest/bookFullAppointment",
  bookCenterPath: "/services/apexrest/EnquiryCenterAppointment",
  cancelHomePath: "/services/apexrest/cancelFullAppointment",
  rescheduleHomePath: "/services/apexrest/rescheduleAppointment",
  cancelCenterPath: "/services/apexrest/CancelCenterAppointment",
  rescheduleCenterPath: "/services/apexrest/RescheduleCenterAppointment",
  productsPath: "/services/apexrest/GetAllPartnerProductsAPI",
  partnerSource: "MyCardioGen",
}

type TestResult = { success: boolean; stage: string; message: string }

export default function LabSettingsPage() {
  const [form, setForm] = useState(emptyForm)
  const [hasClientSecret, setHasClientSecret] = useState(false)
  const [hasWebhookSecret, setHasWebhookSecret] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showPaths, setShowPaths] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/lab", { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as { data: LabSettings }
      setForm({
        ...emptyForm,
        enabled: data.enabled,
        baseUrl: data.baseUrl,
        tokenUrl: data.tokenUrl,
        clientId: data.clientId,
        slotsPath: data.slotsPath,
        bookHomePath: data.bookHomePath,
        bookCenterPath: data.bookCenterPath,
        cancelHomePath: data.cancelHomePath,
        rescheduleHomePath: data.rescheduleHomePath,
        cancelCenterPath: data.cancelCenterPath,
        rescheduleCenterPath: data.rescheduleCenterPath,
        productsPath: data.productsPath,
        partnerSource: data.partnerSource,
        allowUnauthenticatedWebhooks: data.allowUnauthenticatedWebhooks,
        patientBookingEnabled: data.patientBookingEnabled,
      })
      setHasClientSecret(data.hasClientSecret)
      setHasWebhookSecret(data.hasWebhookSecret)
    } catch (err) {
      notify.error("Couldn't load lab settings", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/lab", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Only send a secret the admin actually typed.
          clientSecret: form.clientSecret || undefined,
          webhookSecret: form.webhookSecret || undefined,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      notify.success("Lab settings saved", {
        description: "Changes reach every server within about a minute.",
      })
      setForm((f) => ({ ...f, clientSecret: "", webhookSecret: "" }))
      setTestResult(null)
      await load()
    } catch (err) {
      notify.error("Couldn't save lab settings", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/settings/lab/test", {
        method: "POST",
        credentials: "include",
      })
      const { data } = (await res.json()) as { data: TestResult }
      setTestResult(data)
    } catch (err) {
      setTestResult({
        success: false,
        stage: "network",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Loading lab settings…</p>
      </div>
    )
  }

  const path = (k: keyof typeof FALLBACK, label: string) => (
    <Field key={k} label={label}>
      <input
        value={form[k as keyof typeof form] as string}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        placeholder={FALLBACK[k]}
        className={inputCls}
        spellCheck={false}
      />
    </Field>
  )

  return (
    <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm">
      <div className="px-6 py-5 border-b border-[#EAECF0] dark:border-[#374151] flex items-center gap-2.5">
        <FlaskConical className="h-5 w-5 text-[#6B2B26] dark:text-[#A5B4FC]" />
        <div>
          <h1 className="text-lg font-semibold text-[#101828] dark:text-[#F9FAFB]">
            Lab Integration
          </h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
            Mahajan Imaging partner connection. Leave a field blank to use the deployed
            environment value.
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-7">
        {/* ---------------- Connection ---------------- */}
        <Section title="Connection">
          <TriField
            label="Lab integration"
            value={form.enabled}
            onChange={(v) => setForm({ ...form, enabled: v })}
            onLabel="On"
            offLabel="Off"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Base URL">
              <input
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://…my.salesforce.com"
                className={inputCls}
                spellCheck={false}
              />
            </Field>
            <Field label="OAuth token URL">
              <input
                value={form.tokenUrl}
                onChange={(e) => setForm({ ...form, tokenUrl: e.target.value })}
                placeholder="https://…/services/oauth2/token"
                className={inputCls}
                spellCheck={false}
              />
            </Field>
            <Field label="Client ID">
              <input
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className={inputCls}
                spellCheck={false}
              />
            </Field>
            <Field label="Client secret">
              <input
                type="password"
                value={form.clientSecret}
                onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
                placeholder={
                  hasClientSecret ? "•••••••• (saved — leave blank to keep)" : "Partner client secret"
                }
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>
          </div>
        </Section>

        {/* ---------------- Partner identity ---------------- */}
        <Section
          title="Partner identity"
          hint="The panel name Mahajan registered us under. Sent on every booking — a wrong value makes their API fail with an unhelpful 500 rather than a validation error."
        >
          <Field label="Partner source" className="sm:max-w-sm">
            <input
              value={form.partnerSource}
              onChange={(e) => setForm({ ...form, partnerSource: e.target.value })}
              placeholder={FALLBACK.partnerSource}
              className={inputCls}
              spellCheck={false}
            />
          </Field>
        </Section>

        {/* ---------------- Endpoint paths ---------------- */}
        <Section
          title="Endpoint paths"
          hint="Only change these if Mahajan renames an endpoint."
        >
          <button
            type="button"
            onClick={() => setShowPaths((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#6B2B26] dark:text-[#A5B4FC] w-fit"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showPaths ? "" : "-rotate-90"}`}
            />
            {showPaths ? "Hide" : "Show"} 8 endpoint paths
          </button>
          {showPaths ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {path("slotsPath", "Available slots")}
              {path("bookHomePath", "Book — home collection")}
              {path("bookCenterPath", "Book — centre visit")}
              {path("cancelHomePath", "Cancel — home")}
              {path("rescheduleHomePath", "Reschedule — home")}
              {path("cancelCenterPath", "Cancel — centre")}
              {path("rescheduleCenterPath", "Reschedule — centre")}
              {path("productsPath", "Product catalogue")}
            </div>
          ) : null}
        </Section>

        {/* ---------------- Webhooks ---------------- */}
        <Section
          title="Inbound webhooks"
          hint="How Mahajan authenticates when it sends us status updates and reports."
        >
          <Field label="Webhook secret" className="sm:max-w-sm">
            <input
              type="password"
              value={form.webhookSecret}
              onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
              placeholder={
                hasWebhookSecret ? "•••••••• (saved — leave blank to keep)" : "Shared secret"
              }
              className={inputCls}
              autoComplete="new-password"
            />
          </Field>

          <TriField
            label="Accept unauthenticated webhooks"
            value={form.allowUnauthenticatedWebhooks}
            onChange={(v) => setForm({ ...form, allowUnauthenticatedWebhooks: v })}
            onLabel="Allow (unsafe)"
            offLabel="Require the secret"
          />

          {form.allowUnauthenticatedWebhooks === true ? (
            <div
              className="flex gap-2.5 rounded-lg px-3.5 py-3 text-sm"
              style={{ background: "#FDECEC", color: "#B4322B" }}
            >
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <p>
                While this is on, anyone who learns the webhook URL can write report links
                and lab results onto patient records. It is a stopgap for getting the
                partner connected — turn it off as soon as they send a secret. Setting{" "}
                <code>LAB_WEBHOOK_ALLOW_UNAUTHENTICATED=false</code> in the server
                environment locks it off so it cannot be re-enabled here.
              </p>
            </div>
          ) : null}
        </Section>

        {/* ---------------- Feature flags ---------------- */}
        <Section
          title="Patient self-booking"
          hint="Off means reception books every order on the patient's behalf."
        >
          <TriField
            label="Patients may book their own slots"
            value={form.patientBookingEnabled}
            onChange={(v) => setForm({ ...form, patientBookingEnabled: v })}
            onLabel="Allow"
            offLabel="Reception only"
          />
        </Section>

        {/* ---------------- Actions ---------------- */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#EAECF0] dark:border-[#374151] mt-1 pt-5">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save settings"}
          </Button>
          <Button variant="outline" onClick={test} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
            {testing ? "Testing…" : "Test connection"}
          </Button>
        </div>

        {testResult ? (
          <p
            className="text-sm font-medium rounded-lg px-3.5 py-3"
            style={
              testResult.success
                ? { background: "#E4F3EC", color: "#0E8C6A" }
                : { background: "#FDECEC", color: "#B4322B" }
            }
          >
            {testResult.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const inputCls =
  "w-full h-11 px-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{title}</h2>
        {hint ? (
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-0.5 max-w-2xl">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">{label}</span>
      {children}
    </label>
  )
}

/**
 * Three-state control. "Use environment default" is a real, distinct choice
 * from "off" — a checkbox would silently turn "unset" into "false" and quietly
 * override whatever the deployment configured.
 */
function TriField({
  label,
  value,
  onChange,
  onLabel,
  offLabel,
}: {
  label: string
  value: Tri
  onChange: (v: Tri) => void
  onLabel: string
  offLabel: string
}) {
  return (
    <Field label={label} className="sm:max-w-sm">
      <select
        value={value === null ? "env" : value ? "on" : "off"}
        onChange={(e) =>
          onChange(e.target.value === "env" ? null : e.target.value === "on")
        }
        className={inputCls}
      >
        <option value="env">Use environment default</option>
        <option value="on">{onLabel}</option>
        <option value="off">{offLabel}</option>
      </select>
    </Field>
  )
}
