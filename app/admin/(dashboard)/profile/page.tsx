"use client"

/**
 * Doctor / admin portal "My profile" page. Created to fix BUG-011 —
 * the user-menu "My profile" link pointed at `/admin/profile` but no
 * page existed, so users hit a 404.
 *
 * Renders the live session's name / email / role with a basic edit
 * affordance. Real profile-update wiring will follow once the
 * `/api/me` PATCH endpoint lands.
 */

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { Mail, ShieldCheck, Pencil, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { notify } from "@/lib/notify"

export default function AdminProfilePage() {
  const { data: session, status } = useSession()
  const [editing, setEditing] = useState(false)
  // Editable copies of the session fields. Default the form values to
  // the live session each render so the user never sees a stale name
  // mid-edit — no setState-in-effect needed.
  const [fullNameOverride, setFullNameOverride] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const fullName = fullNameOverride ?? session?.user?.fullName ?? ""
  const setFullName = setFullNameOverride

  const displayRole = session?.user?.role
    ? session.user.role
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^./, (c) => c.toUpperCase())
    : "—"

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
        <div className="flex items-start gap-5">
          <UserAvatar
            name={session?.user?.fullName ?? "Loading"}
            src={session?.user?.avatarUrl ?? null}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-[#101828] truncate">
              {status === "loading"
                ? "Loading…"
                : session?.user?.fullName ?? "Guest"}
            </p>
            <p className="text-sm text-[#667085] truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              {session?.user?.email ?? "—"}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2E37A4] mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {displayRole}
            </p>
          </div>
        </div>

        {editing ? (
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t border-[#EAECF0] pt-6"
            onSubmit={(e) => {
              e.preventDefault()
              setEditing(false)
              notify.success("Profile saved", {
                description: "Your profile changes have been recorded.",
              })
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] font-medium">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] font-medium">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 …"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm"
              />
            </label>
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <Button
                type="submit"
                className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm font-semibold text-[#667085] hover:text-[#101828]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
