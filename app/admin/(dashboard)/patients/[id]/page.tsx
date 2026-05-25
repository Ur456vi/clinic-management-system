"use client"

/**
 * Patient detail / edit landing page.
 *
 * Wired up for BUG-003: the per-row View / Edit buttons in the patients
 * list now route here. We expose a single component that renders either
 * the read-only detail view or the in-place edit form depending on
 * `?edit=1`. The data itself is still stubbed pending BE-04 (patient
 * read) wiring — this page intentionally avoids 404'ing for any
 * patient id so the action buttons feel correct end-to-end.
 */

import React from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

export default function PatientDetailPage() {
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
            href="/admin/patients"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] text-[#344054] hover:bg-gray-50"
            aria-label="Back to patients"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">
              {editing ? "Edit patient" : "Patient details"}
            </h1>
            <p className="text-sm text-[#667085] mt-1">ID: {id}</p>
          </div>
        </div>

        {!editing ? (
          <Link href={`/admin/patients/${id}?edit=1`}>
            <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-[#101828] mb-4">
            Contact information
          </h2>
          {editing ? (
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                notify.success("Patient updated", {
                  description: `Saved changes for ${id}`,
                })
                router.push(`/admin/patients/${id}`)
              }}
            >
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-[#344054] font-medium">Full name</span>
                <input
                  defaultValue=""
                  placeholder="Patient name"
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
                <span className="text-[#344054] font-medium">Phone</span>
                <input
                  defaultValue=""
                  placeholder="+91 …"
                  className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-[#344054] font-medium">Status</span>
                <select
                  defaultValue="Active"
                  className="h-10 rounded-lg border border-[#D0D5DD] px-3 text-sm bg-white"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Archived</option>
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
                  href={`/admin/patients/${id}`}
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
                <Phone className="h-4 w-4 text-[#667085] mt-0.5" />
                <div>
                  <dt className="text-xs uppercase text-[#667085]">Phone</dt>
                  <dd className="text-[#101828] font-medium">—</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-[#667085] mt-0.5" />
                <div>
                  <dt className="text-xs uppercase text-[#667085]">Registered</dt>
                  <dd className="text-[#101828] font-medium">—</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-[#667085] mt-0.5" />
                <div>
                  <dt className="text-xs uppercase text-[#667085]">Status</dt>
                  <dd className="text-[#101828] font-medium">Active</dd>
                </div>
              </div>
            </dl>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#101828] mb-4">
            Recent activity
          </h2>
          <p className="text-sm text-[#667085]">
            No recent activity to show for this patient yet.
          </p>
        </div>
      </div>
    </div>
  )
}
