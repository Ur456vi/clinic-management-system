"use client"

/**
 * Patient "Profile Settings" page — fully wired to /api/me + /api/me/avatar.
 *
 * Profile tab loads the patient row on mount, edits in a controlled form,
 * and PATCHes the diff on Save. Avatar uploads stream the file to S3 via
 * /api/me/avatar (POST multipart) and refresh the NextAuth session so the
 * dashboard header avatar updates in place.
 *
 * Password and Notifications tabs are stubs — a follow-up will wire those
 * to /api/me/password and a notification-prefs endpoint.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { useSession } from "next-auth/react"
import {
  Camera,
  Loader2,
  Lock,
  Save,
  Trash2,
  User as UserIcon,
  Bell,
  X,
} from "lucide-react"

import { notify } from "@/lib/notify"
import { UserAvatar } from "@/components/ui/UserAvatar"

type PatientProfile = {
  kind: "patient"
  id: string
  role: string
  email: string
  patientNumber: string
  fullName: string
  patientEmail: string | null
  phone: string | null
  dateOfBirth: string | null
  sex: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN" | null
  occupation: string | null
  placeOfResidence: string | null
  address: string | null
  avatarUrl: string | null
  avatarKey: string | null
}

type FormState = {
  fullName: string
  patientEmail: string
  phone: string
  dateOfBirth: string
  sex: "" | "MALE" | "FEMALE" | "OTHER" | "UNKNOWN"
  occupation: string
  placeOfResidence: string
  address: string
}

function profileToForm(p: PatientProfile): FormState {
  return {
    fullName: p.fullName ?? "",
    patientEmail: p.patientEmail ?? "",
    phone: p.phone ?? "",
    dateOfBirth: p.dateOfBirth ?? "",
    sex: p.sex ?? "",
    occupation: p.occupation ?? "",
    placeOfResidence: p.placeOfResidence ?? "",
    address: p.address ?? "",
  }
}

function formToPatch(f: FormState) {
  const optional = (v: string) => (v.trim() === "" ? null : v.trim())
  return {
    fullName: f.fullName.trim(),
    email: optional(f.patientEmail),
    phone: optional(f.phone),
    dateOfBirth: optional(f.dateOfBirth),
    sex: f.sex === "" ? null : f.sex,
    occupation: optional(f.occupation),
    placeOfResidence: optional(f.placeOfResidence),
    address: optional(f.address),
  }
}

export default function PatientProfilePage() {
  const { update: refreshSession } = useSession()
  const [activeTab, setActiveTab] =
    useState<"profile" | "password" | "notifications">("profile")
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  // Same set-state-in-effect avoidance as the admin page — initial state
  // is `loading=true`, this fetcher only flips it off at the end.
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as { data: PatientProfile }
      setProfile(data)
      setForm(profileToForm(data))
    } catch (err) {
      console.error("[patient/profile] load failed", err)
      notify.error("Couldn't load your profile", {
        description: "Check your connection and reload the page.",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetch-on-mount; the React 18 lint rule doesn't see post-await
    // setState as safe but it is.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    if (!form || saving) return
    setSaving(true)
    setFieldErrors({})
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formToPatch(form)),
      })
      const json = await res.json()
      if (!res.ok) {
        const issues = json?.error?.issues
        if (Array.isArray(issues)) {
          const map: Record<string, string> = {}
          for (const issue of issues) {
            const path = Array.isArray(issue.path) ? issue.path.join(".") : ""
            if (path) map[path] = issue.message
          }
          setFieldErrors(map)
        }
        throw new Error(json?.error?.message ?? "Save failed")
      }
      await fetchProfile()
      notify.success("Profile saved", {
        description: "Your changes have been recorded.",
      })
      await refreshSession()
    } catch (err) {
      notify.error("Couldn't save your profile", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!profile) return
    setForm(profileToForm(profile))
    setFieldErrors({})
  }

  const handleAvatarUpload = async (file: File) => {
    if (uploading) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        credentials: "include",
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed")
      setProfile((p) =>
        p
          ? { ...p, avatarUrl: json.data.avatarUrl ?? null, avatarKey: json.data.key }
          : p,
      )
      notify.success("Profile image updated")
      await refreshSession()
    } catch (err) {
      notify.error("Couldn't upload photo", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleAvatarDelete = async () => {
    if (uploading || !profile?.avatarKey) return
    setUploading(true)
    try {
      const res = await fetch("/api/me/avatar", {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Delete failed")
      setProfile((p) => (p ? { ...p, avatarUrl: null, avatarKey: null } : p))
      notify.success("Profile image removed")
      await refreshSession()
    } catch (err) {
      notify.error("Couldn't remove photo", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setUploading(false)
    }
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) void handleAvatarUpload(f)
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#141414]">Profile Settings</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#F2F4F7] overflow-x-auto">
          <TabButton
            label="Profile Settings"
            icon={<UserIcon className="h-4 w-4" />}
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <TabButton
            label="Change Password"
            icon={<Lock className="h-4 w-4" />}
            active={activeTab === "password"}
            onClick={() => setActiveTab("password")}
          />
          <TabButton
            label="Notifications"
            icon={<Bell className="h-4 w-4" />}
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          />
        </div>

        <div className="p-6 lg:p-8">
          {activeTab === "profile" ? (
            loading || !profile || !form ? (
              <div className="flex items-center gap-3 text-sm text-[#667085]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your profile…
              </div>
            ) : (
              <ProfileTab
                profile={profile}
                form={form}
                setForm={setForm}
                fieldErrors={fieldErrors}
                saving={saving}
                uploading={uploading}
                onSave={handleSave}
                onCancel={handleCancel}
                onPickFile={() => fileRef.current?.click()}
                onRemovePhoto={handleAvatarDelete}
              />
            )
          ) : null}

          {activeTab === "password" ? <PasswordTabStub /> : null}
          {activeTab === "notifications" ? <NotificationsTabStub /> : null}
        </div>
      </div>

      {/* Hidden file input — shared by avatar buttons */}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}

// ─── Profile tab ─────────────────────────────────────────────────────────

function ProfileTab({
  profile,
  form,
  setForm,
  fieldErrors,
  saving,
  uploading,
  onSave,
  onCancel,
  onPickFile,
  onRemovePhoto,
}: {
  profile: PatientProfile
  form: FormState
  setForm: (f: FormState) => void
  fieldErrors: Record<string, string>
  saving: boolean
  uploading: boolean
  onSave: () => void
  onCancel: () => void
  onPickFile: () => void
  onRemovePhoto: () => void
}) {
  const set = <K extends keyof FormState>(key: K) => (val: FormState[K]) =>
    setForm({ ...form, [key]: val })

  return (
    <div className="flex flex-col gap-8">
      {/* Basic information */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#141414]">Basic Information</h2>
          <span className="text-xs text-[#667085]">
            Patient #{profile.patientNumber}
          </span>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#EEF0FB] shadow-sm bg-gradient-to-br from-[#2E37A4] to-[#4BA461] flex items-center justify-center">
              <UserAvatar
                name={profile.fullName}
                src={profile.avatarUrl}
                size={80}
              />
            </div>
            <button
              type="button"
              onClick={onPickFile}
              disabled={uploading}
              aria-label="Change photo"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] border-2 border-white cursor-pointer flex items-center justify-center text-white shadow-md transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div>
            <div className="text-sm font-bold text-[#141414] mb-1">Profile Image</div>
            <div className="text-xs text-[#667085] mb-2 font-medium">
              PNG, JPEG or WebP. Max 5 MB.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPickFile}
                disabled={uploading}
                className="px-4 py-1.5 border border-[#D0D0D0] rounded-lg bg-white text-xs font-bold text-[#141414] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Change Photo
              </button>
              {profile.avatarKey ? (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#B42318] font-bold hover:bg-[#FEF3F2] rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full Name" required error={fieldErrors.fullName}>
            <input
              value={form.fullName}
              onChange={(e) => set("fullName")(e.target.value)}
              placeholder="Your full name"
              className={inputCls}
            />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <input
              type="email"
              value={form.patientEmail}
              onChange={(e) => set("patientEmail")(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="Phone Number" error={fieldErrors.phone}>
            <input
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className={inputCls}
            />
          </Field>
          <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth")(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Sex" error={fieldErrors.sex}>
            <select
              value={form.sex}
              onChange={(e) =>
                set("sex")(e.target.value as FormState["sex"])
              }
              className={inputCls}
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </Field>
          <Field label="Occupation" error={fieldErrors.occupation}>
            <input
              value={form.occupation}
              onChange={(e) => set("occupation")(e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="h-px bg-[#F2F4F7]" />

      {/* Address information */}
      <section className="flex flex-col gap-6">
        <h2 className="text-base font-bold text-[#141414]">Address Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Place of Residence" error={fieldErrors.placeOfResidence}>
            <input
              value={form.placeOfResidence}
              onChange={(e) => set("placeOfResidence")(e.target.value)}
              placeholder="City / region"
              className={inputCls}
            />
          </Field>
          <Field label="Full Address" wide error={fieldErrors.address}>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => set("address")(e.target.value)}
              placeholder="Street, locality, city, postal code"
              className="rounded-md border border-[#D0D0D0] p-3 text-sm w-full resize-y bg-white text-[#141414] focus:outline-none focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/10"
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#F2F4F7]">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-2.5 border border-[#D0D0D0] rounded-lg bg-white text-sm font-bold text-[#141414] hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 border-none rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-sm font-bold text-white inline-flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

// ─── Stubs (kept until /api/me/password and a prefs endpoint land) ──────

function PasswordTabStub() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <h2 className="text-base font-bold text-[#141414]">Change Password</h2>
      <p className="text-[#667085] max-w-md">
        Password change is handled via the password-reset flow today. Click
        the link below to reset your password through email verification.
      </p>
      <a
        href="/admin/auth/forgot-password"
        className="inline-flex items-center gap-2 text-[#2E37A4] font-semibold hover:underline w-fit"
      >
        <Lock className="h-4 w-4" />
        Reset password
      </a>
    </div>
  )
}

function NotificationsTabStub() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <h2 className="text-base font-bold text-[#141414]">Notifications</h2>
      <p className="text-[#667085] max-w-md">
        Notification preferences are coming soon. For now, you&apos;ll
        receive email alerts for appointment confirmations, lab results,
        and prescription updates by default.
      </p>
    </div>
  )
}

// ─── Shared bits ─────────────────────────────────────────────────────────

const inputCls =
  "h-10 rounded-md border border-[#D0D0D0] px-3 text-sm w-full bg-white text-[#141414] focus:outline-none focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/10"

function Field({
  label,
  required,
  hint,
  wide,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  wide?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label
      className={`flex flex-col gap-1.5 text-sm ${wide ? "md:col-span-2" : ""}`}
    >
      <span className="text-[#141414] font-bold">
        {label}
        {required ? <span className="text-[#E53E3E]"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-[#667085]">{hint}</span> : null}
      {error ? <span className="text-xs text-[#B42318]">{error}</span> : null}
    </label>
  )
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm whitespace-nowrap transition-all border-b-2 ${
        active
          ? "text-[#2E37A4] font-bold border-[#2E37A4]"
          : "text-[#667085] font-medium border-transparent hover:text-[#141414]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
