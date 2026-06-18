"use client";

/**
 * Shared profile settings page — used by both the admin (staff) and
 * patient dashboards. It calls the same `/api/me` endpoint, which
 * returns a `kind` discriminator (`"staff"` or `"patient"`) so the
 * component can render the appropriate fields without two divergent
 * page implementations.
 *
 * Tabs:
 *   - Profile Settings  — name, contact info, role-specific fields,
 *                          avatar upload (POST/DELETE /api/me/avatar)
 *   - Change Password   — links to the existing password-reset flow
 *   - Notifications     — stub (preference endpoint pending)
 *
 * Why one component for both roles? Both views need the same shell,
 * same avatar widget, same save mechanics, and the same error/success
 * affordances. Forking gave us drift on copy, palette, and validation —
 * unifying makes future schema changes a single-file edit.
 */

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  Camera,
  Loader2,
  Lock,
  Save,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { notify } from "@/lib/notify";

/* ---- API response types ---------------------------------------------- */

type StaffProfile = {
  kind: "staff";
  id: string;
  role: string;
  email: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  specialization: string | null;
  licenseNumber: string | null;
  experienceYrs: number | null;
  qualifications: string[];
  biography: string | null;
  address: string | null;
  department: { id: string; name: string } | null;
  avatarUrl: string | null;
  avatarKey: string | null;
};

type PatientProfile = {
  kind: "patient";
  id: string;
  role: string;
  email: string;
  patientNumber: string;
  fullName: string;
  patientEmail: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  sex: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED" | null;
  occupation: string | null;
  placeOfResidence: string | null;
  address: string | null;
  avatarUrl: string | null;
  avatarKey: string | null;
};

type AnyProfile = StaffProfile | PatientProfile;

/* ---- Form shapes (kept as a single union; only the relevant slice is
 *      rendered per role) -------------------------------------------- */

type StaffForm = {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  specialization: string;
  licenseNumber: string;
  experienceYrs: string;
  qualifications: string;
  biography: string;
  address: string;
};

type PatientForm = {
  fullName: string;
  patientEmail: string;
  phone: string;
  dateOfBirth: string;
  sex: "" | "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED";
  occupation: string;
  placeOfResidence: string;
  address: string;
};

type AnyForm = StaffForm | PatientForm;

/* ---- Helpers -------------------------------------------------------- */

const optional = (v: string) => (v.trim() === "" ? null : v.trim());

function profileToForm(p: AnyProfile): AnyForm {
  if (p.kind === "staff") {
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
    };
  }
  return {
    fullName: p.fullName ?? "",
    patientEmail: p.patientEmail ?? "",
    phone: p.phone ?? "",
    dateOfBirth: p.dateOfBirth ?? "",
    sex: p.sex ?? "",
    occupation: p.occupation ?? "",
    placeOfResidence: p.placeOfResidence ?? "",
    address: p.address ?? "",
  };
}

function formToPatch(kind: AnyProfile["kind"], f: AnyForm) {
  if (kind === "staff") {
    const s = f as StaffForm;
    return {
      fullName: s.fullName.trim(),
      phone: optional(s.phone),
      dateOfBirth: optional(s.dateOfBirth),
      specialization: optional(s.specialization),
      licenseNumber: optional(s.licenseNumber),
      experienceYrs:
        s.experienceYrs.trim() === ""
          ? null
          : Math.max(0, Math.min(80, Number.parseInt(s.experienceYrs, 10) || 0)),
      qualifications: s.qualifications
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean)
        .slice(0, 20),
      biography: optional(s.biography),
      address: optional(s.address),
    };
  }
  const p = f as PatientForm;
  return {
    fullName: p.fullName.trim(),
    email: optional(p.patientEmail),
    phone: optional(p.phone),
    dateOfBirth: optional(p.dateOfBirth),
    sex: p.sex === "" ? null : p.sex,
    occupation: optional(p.occupation),
    placeOfResidence: optional(p.placeOfResidence),
    address: optional(p.address),
  };
}

function formatRole(role: string): string {
  return role.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/* ---- Component ------------------------------------------------------ */

export type ProfileSettingsTab = "profile" | "password" | "notifications";

interface ProfileSettingsProps {
  activeTab?: ProfileSettingsTab;
  showTabsHeader?: boolean;
  showHeader?: boolean;
}

export default function ProfileSettings({
  activeTab,
  showTabsHeader = true,
  showHeader = true,
}: ProfileSettingsProps = {}) {
  const { update: refreshSession } = useSession();
  const [localTab, setLocalTab] = useState<ProfileSettingsTab>("profile");

  const tab = activeTab ?? localTab;
  const setTab = (t: ProfileSettingsTab) => {
    setLocalTab(t);
  };
  const [profile, setProfile] = useState<AnyProfile | null>(null);
  const [form, setForm] = useState<AnyForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = (await res.json()) as { data: AnyProfile };
      setProfile(data);
      setForm(profileToForm(data));
    } catch (err) {
      console.error("[profile] load failed", err);
      notify.error("Couldn't load your profile", {
        description: "Check your connection and reload the page.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = async () => {
    if (!form || !profile || saving) return;
    setSaving(true);
    setFieldErrors({});
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formToPatch(profile.kind, form)),
      });
      const json = await res.json();
      if (!res.ok) {
        const issues = json?.error?.issues;
        if (Array.isArray(issues)) {
          const map: Record<string, string> = {};
          for (const issue of issues) {
            const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
            if (path) map[path] = issue.message;
          }
          setFieldErrors(map);
        }
        throw new Error(json?.error?.message ?? "Save failed");
      }
      await fetchProfile();
      notify.success("Profile saved");
      await refreshSession();
    } catch (err) {
      notify.error("Couldn't save your profile", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setForm(profileToForm(profile));
    setFieldErrors({});
  };

  const handleAvatarUpload = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed");
      setProfile((p) =>
        p ? { ...p, avatarUrl: json.data.avatarUrl ?? null, avatarKey: json.data.key } : p,
      );
      notify.success("Profile image updated");
      await refreshSession();
    } catch (err) {
      notify.error("Couldn't upload photo", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    if (uploading || !profile?.avatarKey) return;
    setUploading(true);
    try {
      const res = await fetch("/api/me/avatar", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      setProfile((p) => (p ? { ...p, avatarUrl: null, avatarKey: null } : p));
      notify.success("Profile image removed");
      await refreshSession();
    } catch (err) {
      notify.error("Couldn't remove photo", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleAvatarUpload(f);
  };

  /* ── Rendering ────────────────────────────────────────────────── */

  return (
    <div className={showHeader ? "p-6 lg:p-8 flex flex-col gap-6 max-w-[1200px] mx-auto" : "flex flex-col gap-6 w-full"}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Profile Settings</h1>
            <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
              Personal information visible across the portal.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm overflow-hidden">
        {/* Tabs */}
        {showTabsHeader && (
          <div className="flex border-b border-[#F2F4F7] dark:border-[#374151] overflow-x-auto">
            <TabButton
              label="Profile Settings"
              icon={<UserIcon className="h-4 w-4" />}
              active={tab === "profile"}
              onClick={() => setTab("profile")}
            />
            <TabButton
              label="Change Password"
              icon={<Lock className="h-4 w-4" />}
              active={tab === "password"}
              onClick={() => setTab("password")}
            />
            <TabButton
              label="Notifications"
              icon={<Bell className="h-4 w-4" />}
              active={tab === "notifications"}
              onClick={() => setTab("notifications")}
            />
          </div>
        )}

        <div className="p-6 lg:p-8">
          {tab === "profile" ? (
            loading || !profile || !form ? (
              <div className="flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
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

          {tab === "password" ? <ChangePasswordTab /> : null}
          {tab === "notifications" ? <NotificationsTab /> : null}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}

/* ── Profile tab ──────────────────────────────────────────────────── */

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
  profile: AnyProfile;
  form: AnyForm;
  setForm: (f: AnyForm) => void;
  fieldErrors: Record<string, string>;
  saving: boolean;
  uploading: boolean;
  onSave: () => void;
  onCancel: () => void;
  onPickFile: () => void;
  onRemovePhoto: () => void;
}) {
  const isStaff = profile.kind === "staff";
  const sub = isStaff
    ? `${formatRole(profile.role)}${profile.department ? ` · ${profile.department.name}` : ""}`
    : `Patient #${(profile as PatientProfile).patientNumber}`;

  // Per-role setter convenience.
  const set = <K extends keyof AnyForm>(key: K, value: AnyForm[K]) =>
    setForm({ ...form, [key]: value } as AnyForm);

  return (
    <div className="flex flex-col gap-8">
      {/* Basic information */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB]">Basic Information</h2>
          <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{sub}</span>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#F5E5E3] shadow-sm bg-gradient-to-br from-[#6B2B26] to-[#4BA461] flex items-center justify-center">
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
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] border-2 border-white cursor-pointer flex items-center justify-center text-white shadow-md transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div>
            <div className="text-sm font-bold text-[#141414] dark:text-[#F9FAFB] mb-1">Profile Image</div>
            <div className="text-xs text-[#667085] dark:text-[#94A3B8] mb-2 font-medium">
              PNG, JPEG or WebP. Max 5 MB.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPickFile}
                disabled={uploading}
                className="px-4 py-1.5 border border-[#D0D0D0] rounded-lg bg-white dark:bg-[#1F2937] text-xs font-bold text-[#141414] dark:text-[#F9FAFB] hover:bg-gray-50 transition-colors disabled:opacity-50"
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

        {/* Identity grid (shared across roles) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full Name" required error={fieldErrors.fullName}>
            <input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Your full name"
              className={inputCls}
            />
          </Field>
          <Field label="Account Email">
            <input
              type="email"
              value={profile.email}
              disabled
              className={`${inputCls} bg-[#F9FAFB] dark:bg-[#111827] text-[#667085] dark:text-[#94A3B8]`}
            />
          </Field>
          {profile.kind === "patient" ? (
            <Field label="Contact Email" error={fieldErrors.email}>
              <input
                type="email"
                value={(form as PatientForm).patientEmail}
                onChange={(e) => set("patientEmail" as never, e.target.value as never)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </Field>
          ) : null}
          <Field label="Phone Number" error={fieldErrors.phone}>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className={inputCls}
            />
          </Field>
          <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              className={inputCls}
            />
          </Field>
          {profile.kind === "patient" ? (
            <>
              <Field label="Sex" error={fieldErrors.sex}>
                <select
                  value={(form as PatientForm).sex}
                  onChange={(e) =>
                    set("sex" as never, e.target.value as never)
                  }
                  className={inputCls}
                >
                  <option value="">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNDISCLOSED">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Occupation" error={fieldErrors.occupation}>
                <input
                  value={(form as PatientForm).occupation}
                  onChange={(e) => set("occupation" as never, e.target.value as never)}
                  placeholder="e.g. Software Engineer"
                  className={inputCls}
                />
              </Field>
            </>
          ) : null}
        </div>
      </section>

      {/* Professional info (staff only) */}
      {profile.kind === "staff" ? (
        <section className="flex flex-col gap-6">
          <div className="h-px bg-[#F2F4F7] dark:bg-[#111827]" />
          <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB]">Professional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Specialization" error={fieldErrors.specialization}>
              <input
                value={(form as StaffForm).specialization}
                onChange={(e) => set("specialization" as never, e.target.value as never)}
                placeholder="e.g. Endocrinology"
                className={inputCls}
              />
            </Field>
            <Field label="License Number" error={fieldErrors.licenseNumber}>
              <input
                value={(form as StaffForm).licenseNumber}
                onChange={(e) => set("licenseNumber" as never, e.target.value as never)}
                placeholder="Medical license #"
                className={inputCls}
              />
            </Field>
            <Field label="Years of Experience" error={fieldErrors.experienceYrs}>
              <input
                type="number"
                min={0}
                max={80}
                value={(form as StaffForm).experienceYrs}
                onChange={(e) => set("experienceYrs" as never, e.target.value as never)}
                className={inputCls}
              />
            </Field>
            <Field
              label="Qualifications"
              hint="Comma-separated, e.g. MD, MBBS, FRCP"
              error={fieldErrors.qualifications}
            >
              <input
                value={(form as StaffForm).qualifications}
                onChange={(e) => set("qualifications" as never, e.target.value as never)}
                placeholder="MD, MBBS, …"
                className={inputCls}
              />
            </Field>
            <Field label="Biography" wide error={fieldErrors.biography}>
              <textarea
                rows={4}
                value={(form as StaffForm).biography}
                onChange={(e) => set("biography" as never, e.target.value as never)}
                placeholder="Short professional bio shown on the public site."
                className="rounded-md border border-[#D0D0D0] p-3 text-sm w-full resize-y bg-white dark:bg-[#1F2937] text-[#141414] dark:text-[#F9FAFB] focus:outline-none focus:border-[#6B2B26] focus:ring-2 focus:ring-[#6B2B26]/10"
              />
            </Field>
          </div>
        </section>
      ) : null}

      {/* Address (shared) */}
      <section className="flex flex-col gap-6">
        <div className="h-px bg-[#F2F4F7] dark:bg-[#111827]" />
        <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB]">Address Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {profile.kind === "patient" ? (
            <Field label="Place of Residence" error={fieldErrors.placeOfResidence}>
              <input
                value={(form as PatientForm).placeOfResidence}
                onChange={(e) => set("placeOfResidence" as never, e.target.value as never)}
                placeholder="City / region"
                className={inputCls}
              />
            </Field>
          ) : null}
          <Field label="Full Address" wide error={fieldErrors.address}>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, locality, city, postal code"
              className="rounded-md border border-[#D0D0D0] p-3 text-sm w-full resize-y bg-white dark:bg-[#1F2937] text-[#141414] dark:text-[#F9FAFB] focus:outline-none focus:border-[#6B2B26] focus:ring-2 focus:ring-[#6B2B26]/10"
            />
          </Field>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#F2F4F7] dark:border-[#374151]">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-2.5 border border-[#D0D0D0] rounded-lg bg-white dark:bg-[#1F2937] text-sm font-bold text-[#141414] dark:text-[#F9FAFB] hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 border-none rounded-lg bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-sm font-bold text-white inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ── Stub tabs (kept until the corresponding endpoints land) ───────── */

function ChangePasswordTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setFieldErrors({});
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const local: Record<string, string> = {};
    if (!current) local.currentPassword = "Current password is required";
    if (next.length < 8) local.newPassword = "Password must be at least 8 characters";
    if (next && confirm !== next) local.confirmPassword = "Passwords do not match";
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const issues = json?.error?.issues;
        if (Array.isArray(issues)) {
          const map: Record<string, string> = {};
          for (const issue of issues) {
            const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
            if (path) map[path] = issue.message;
          }
          setFieldErrors(map);
        }
        throw new Error(json?.error?.message ?? "Couldn't change password");
      }
      notify.success("Password changed");
      reset();
    } catch (err) {
      notify.error("Couldn't change password", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 text-sm max-w-md">
      <div>
        <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB]">Change Password</h2>
        <p className="text-[#667085] dark:text-[#94A3B8] mt-1">
          Enter your current password and choose a new one (at least 8
          characters).
        </p>
      </div>

      <Field label="Current password" required error={fieldErrors.currentPassword}>
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="New password" required error={fieldErrors.newPassword}>
        <input
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Confirm new password" required error={fieldErrors.confirmPassword}>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
      </Field>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 border-none rounded-lg bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-sm font-bold text-white inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {saving ? "Saving…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

type NotificationPrefs = {
  appointments: boolean;
  labResults: boolean;
  prescriptions: boolean;
};

const NOTIFICATION_CHANNELS: {
  key: keyof NotificationPrefs;
  label: string;
  hint: string;
}[] = [
  {
    key: "appointments",
    label: "Appointment confirmations",
    hint: "Booking, reschedule, and reminder emails.",
  },
  {
    key: "labResults",
    label: "Lab results",
    hint: "Email me when new lab results are available.",
  },
  {
    key: "prescriptions",
    label: "Prescription updates",
    hint: "Email me when a prescription is issued or changed.",
  },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me/notification-preferences", {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setPrefs(json?.data ?? null);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (key: keyof NotificationPrefs) => {
    if (!prefs || savingKey) return;
    const nextValue = !prefs[key];
    const optimistic = { ...prefs, [key]: nextValue };
    setPrefs(optimistic);
    setSavingKey(key);
    try {
      const res = await fetch("/api/me/notification-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [key]: nextValue }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json?.data) setPrefs(json.data);
    } catch {
      // Roll back the optimistic flip on failure.
      setPrefs((p) => (p ? { ...p, [key]: !nextValue } : p));
      notify.error("Couldn't update preference", {
        description: "Please try again.",
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-sm max-w-lg">
      <div>
        <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB]">Notifications</h2>
        <p className="text-[#667085] dark:text-[#94A3B8] mt-1">
          Choose which email alerts you&apos;d like to receive.
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-[#B42318]">
          Couldn&apos;t load your preferences. Please refresh and try again.
        </p>
      ) : prefs === null ? (
        <div className="flex items-center gap-2 text-[#667085] dark:text-[#94A3B8]">
          <Loader2 className="h-4 w-4 animate-spin text-[#6B2B26] dark:text-[#A5B4FC]" /> Loading…
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[#EAECF0] dark:divide-[#374151] border border-[#EAECF0] dark:border-[#374151] rounded-xl">
          {NOTIFICATION_CHANNELS.map((ch) => {
            const on = prefs[ch.key];
            return (
              <li
                key={ch.key}
                className="flex items-center justify-between gap-4 px-4 py-3.5"
              >
                <div className="flex items-start gap-3">
                  <Bell className="h-4 w-4 text-[#667085] dark:text-[#94A3B8] mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#141414] dark:text-[#F9FAFB]">{ch.label}</p>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">{ch.hint}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={ch.label}
                  disabled={savingKey === ch.key}
                  onClick={() => void toggle(ch.key)}
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                    on ? "bg-[#6B2B26]" : "bg-[#D0D5DD]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-[#1F2937] shadow transition-transform ${
                      on ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Atoms ─────────────────────────────────────────────────────────── */

const inputCls =
  "h-10 rounded-md border border-[#D0D0D0] px-3 text-sm w-full bg-white dark:bg-[#1F2937] text-[#141414] dark:text-[#F9FAFB] focus:outline-none focus:border-[#6B2B26] focus:ring-2 focus:ring-[#6B2B26]/10";

function Field({
  label,
  required,
  hint,
  wide,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  wide?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-[#141414] dark:text-[#F9FAFB] font-bold">
        {label}
        {required ? <span className="text-[#E53E3E]"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{hint}</span> : null}
      {error ? <span className="text-xs text-[#B42318]">{error}</span> : null}
    </label>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm whitespace-nowrap transition-all border-b-2 ${
        active
          ? "text-[#6B2B26] dark:text-[#A5B4FC] font-bold border-[#6B2B26]"
          : "text-[#667085] dark:text-[#94A3B8] font-medium border-transparent hover:text-[#141414]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
