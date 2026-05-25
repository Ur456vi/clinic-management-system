"use client"

/**
 * Staff "My Profile" page — fully wired to /api/me + /api/me/avatar.
 *
 * Behaviour:
 *   - On mount, GET /api/me to load the staff profile (name, phone, DoB,
 *     specialization, license, experience, qualifications, biography,
 *     address, department, signed avatar URL).
 *   - Edit toggles a controlled form. Save PATCHes /api/me with the
 *     diff and surfaces zod validation errors per field.
 *   - Avatar: clicking the camera badge opens a file picker, POSTs the
 *     file to /api/me/avatar, swaps the image in place, and refreshes
 *     the NextAuth session so the dashboard header avatar updates too.
 *   - "Remove photo" DELETEs the object + clears the DB field.
 */

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import {
  Mail,
  ShieldCheck,
  Pencil,
  Save,
  Camera,
  Trash2,
  Loader2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { notify } from "@/lib/notify"

type StaffProfile = {
  kind: "staff"
  id: string
  role: string
  email: string
  fullName: string
  phone: string | null
  dateOfBirth: string | null
  specialization: string | null
  licenseNumber: string | null
  experienceYrs: number | null
  qualifications: string[]
  biography: string | null
  address: string | null
  department: { id: string; name: string } | null
  avatarUrl: string | null
  avatarKey: string | null
}

type FormState = {
  fullName: string
  phone: string
  dateOfBirth: string
  specialization: string
  licenseNumber: string
  experienceYrs: string
  qualifications: string
  biography: string
  address: string
}

function profileToForm(p: StaffProfile): FormState {
  return {
    fullName: p.fullName ?? "",
    phone: p.phone ?? "",
    dateOfBirth: p.dateOfBirth ?? "",
    specialization: p.specialization ?? "",
    licenseNumber: p.licenseNumber ?? "",
    experienceYrs: p.experienceYrs?.toString() ?? "",
    qualifications: (p.qualifications ?? []).join(", "),
    biography: p.biography ?? "",
    address: p.address ?? "",
  }
}

function formToPatch(f: FormState) {
  // Strings → null when empty so we can clear fields. Trims trailing
  // whitespace so users don't accidentally save " ".
  const optional = (v: string) => (v.trim() === "" ? null : v.trim())
  return {
    fullName: f.fullName.trim(),
    phone: optional(f.phone),
    dateOfBirth: optional(f.dateOfBirth),
    specialization: optional(f.specialization),
    licenseNumber: optional(f.licenseNumber),
    experienceYrs:
      f.experienceYrs.trim() === ""
        ? null
        : Math.max(0, Math.min(80, Number.parseInt(f.experienceYrs, 10) || 0)),
    qualifications: f.qualifications
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20),
    biography: optional(f.biography),
    address: optional(f.address),
  }
}

export default function AdminProfilePage() {
  const { update: refreshSession } = useSession()
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const displayRole = profile?.role
    ? profile.role.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
    : "—"

  // Load profile. Doesn't toggle `loading` at the start so it's safe to
  // call synchronously from useEffect (the React 18 set-state-in-effect
  // rule). Initial state is already `loading=true` via useState.
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as { data: StaffProfile }
      setProfile(data)
      setForm(profileToForm(data))
    } catch (err) {
      console.error("[profile] load failed", err)
      notify.error("Couldn't load your profile", {
        description: "Check your connection and reload the page.",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetch-on-mount is the canonical use case; the React 18 lint rule
    // for set-state-in-effect doesn't recognise post-await updates, so
    // we silence it here. The setState calls all run after `await`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfile()
  }, [fetchProfile])

  // Save (PATCH)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setEditing(false)
      notify.success("Profile updated", {
        description: "Your changes have been saved.",
      })
      // Refresh NextAuth session so the header reflects the new fullName.
      await refreshSession()
    } catch (err) {
      console.error("[profile] save failed", err)
      notify.error("Couldn't save your profile", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  // Avatar upload (POST multipart)
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
      // Optimistic local swap + refresh from server for fresh signed URL.
      setProfile((p) =>
        p
          ? { ...p, avatarUrl: json.data.avatarUrl ?? null, avatarKey: json.data.key }
          : p,
      )
      notify.success("Photo updated")
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

  // Avatar delete
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
      notify.success("Photo removed")
      await refreshSession()
    } catch (err) {
      notify.error("Couldn't remove photo", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setUploading(false)
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────
  if (loading || !profile || !form) {
    return (
      <div className="flex items-center gap-3 text-sm text-[#667085] p-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your profile…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">My profile</h1>
          <p className="text-sm text-[#667085] mt-1">
            Personal information visible across the portal.
          </p>
        </div>
        {!editing ? (
          <Button
            onClick={() => setEditing(true)}
            className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit profile</span>
          </Button>
        ) : null}
      </div>

      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-6">
        {/* Header row — avatar + name + email + role */}
        <div className="flex items-start gap-5">
          <div className="relative">
            <UserAvatar
              name={profile.fullName}
              src={profile.avatarUrl}
              size={72}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change photo"
              className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white border-2 border-white flex items-center justify-center shadow-sm transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleAvatarUpload(f)
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-[#101828] truncate">
              {profile.fullName}
            </p>
            <p className="text-sm text-[#667085] truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2E37A4] mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {displayRole}
              {profile.department ? (
                <span className="text-[#667085] font-normal normal-case tracking-normal ml-1">
                  · {profile.department.name}
                </span>
              ) : null}
            </p>
            {profile.avatarKey ? (
              <button
                type="button"
                onClick={() => void handleAvatarDelete()}
                disabled={uploading}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#B42318] hover:text-[#7A1411] font-semibold disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Remove photo
              </button>
            ) : null}
          </div>
        </div>

        {/* Form */}
        {editing ? (
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t border-[#EAECF0] pt-6"
          >
            <Field label="Full name" required error={fieldErrors.fullName}>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Your full name"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4]"
              />
            </Field>
            <Field label="Phone" error={fieldErrors.phone}>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 …"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm w-full"
              />
            </Field>
            <Field label="Date of birth" error={fieldErrors.dateOfBirth}>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm w-full"
              />
            </Field>
            <Field label="Specialization" error={fieldErrors.specialization}>
              <input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g. Endocrinology"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm w-full"
              />
            </Field>
            <Field label="License number" error={fieldErrors.licenseNumber}>
              <input
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="Medical license #"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm w-full"
              />
            </Field>
            <Field label="Years of experience" error={fieldErrors.experienceYrs}>
              <input
                type="number"
                min={0}
                max={80}
                value={form.experienceYrs}
                onChange={(e) => setForm({ ...form, experienceYrs: e.target.value })}
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm w-full"
              />
            </Field>
            <Field
              label="Qualifications"
              hint="Comma-separated, e.g. MD, MBBS, FRCP"
              wide
              error={fieldErrors.qualifications}
            >
              <input
                value={form.qualifications}
                onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                placeholder="MD, MBBS, …"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm w-full"
              />
            </Field>
            <Field label="Biography" wide error={fieldErrors.biography}>
              <textarea
                rows={4}
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                placeholder="Short professional bio shown on the public site."
                className="rounded-lg border border-[#D0D5DD] p-3 text-sm w-full resize-y"
              />
            </Field>
            <Field label="Address" wide error={fieldErrors.address}>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-lg border border-[#D0D5DD] p-3 text-sm w-full resize-y"
              />
            </Field>

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? "Saving…" : "Save"}</span>
              </Button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setForm(profileToForm(profile))
                  setFieldErrors({})
                }}
                disabled={saving}
                className="text-sm font-semibold text-[#667085] hover:text-[#101828] disabled:opacity-50 inline-flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <ReadOnlyDetails profile={profile} />
        )}
      </div>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────

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
      <span className="text-[#344054] font-medium">
        {label}
        {required ? <span className="text-[#B42318]"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-[#667085]">{hint}</span> : null}
      {error ? <span className="text-xs text-[#B42318]">{error}</span> : null}
    </label>
  )
}

function ReadOnlyDetails({ profile }: { profile: StaffProfile }) {
  const rows: Array<[string, string]> = [
    ["Phone", profile.phone ?? "—"],
    ["Date of birth", profile.dateOfBirth ?? "—"],
    ["Specialization", profile.specialization ?? "—"],
    ["License number", profile.licenseNumber ?? "—"],
    ["Years of experience", profile.experienceYrs?.toString() ?? "—"],
    [
      "Qualifications",
      profile.qualifications.length ? profile.qualifications.join(", ") : "—",
    ],
    ["Biography", profile.biography ?? "—"],
    ["Address", profile.address ?? "—"],
  ]
  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-6 border-t border-[#EAECF0] pt-6">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
            {k}
          </dt>
          <dd className="text-sm text-[#101828] mt-0.5 whitespace-pre-wrap break-words">
            {v}
          </dd>
        </div>
      ))}
    </dl>
  )
}
