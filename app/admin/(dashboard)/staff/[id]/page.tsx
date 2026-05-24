"use client"

/**
 * Staff member detail / edit page.
 *
 * Wired up for BUG-008 so the per-row Details / Edit / 3-dot actions on
 * /admin/staff route to a real page. Real data wiring is pending the
 * BE-staff endpoints — this stub renders a layout shell for any id.
 */

import React from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  Calendar,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

export default function StaffDetailPage() {
  const params = useParams()
  const search = useSearchParams()
  const router = useRouter()
  const id = (params?.id as string) ?? ""
  const editing = search?.get("edit") === "1"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/staff"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] text-[#344054] hover:bg-gray-50"
            aria-label="Back to staff"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">
              {editing ? "Edit staff member" : "Staff member details"}
            </h1>
            <p className="text-sm text-[#667085] mt-1">ID: {id}</p>
          </div>
        </div>

        {!editing ? (
          <Link href={`/admin/staff/${id}?edit=1`}>
            <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#101828] mb-4">Profile</h2>
        {editing ? (
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              notify.success("Staff updated", {
                description: `Saved changes for ${id}`,
              })
              router.push(`/admin/staff/${id}`)
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] font-medium">Full name</span>
              <input
                defaultValue=""
                placeholder="Staff member name"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] font-medium">Email</span>
              <input
                type="email"
                defaultValue=""
                placeholder="name@example.com"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] font-medium">Role</span>
              <select
                defaultValue="DOCTOR"
                className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm bg-white"
              >
                <option value="ADMIN">Admin</option>
                <option value="DOCTOR">Doctor</option>
                <option value="RMO">RMO</option>
                <option value="RECEPTION">Reception</option>
                <option value="INFUSION_SPECIALIST">Infusion specialist</option>
              </select>
            </label>
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <Button
                type="submit"
                className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold"
              >
                Save changes
              </Button>
              <Link
                href={`/admin/staff/${id}`}
                className="text-sm font-semibold text-[#667085] hover:text-[#101828]"
              >
                Cancel
              </Link>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Email</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Role</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-[#667085] mt-0.5" />
              <div>
                <dt className="text-xs uppercase text-[#667085]">Created</dt>
                <dd className="text-[#101828] font-medium">—</dd>
              </div>
            </div>
          </dl>
        )}
      </div>
    </div>
  )
}
