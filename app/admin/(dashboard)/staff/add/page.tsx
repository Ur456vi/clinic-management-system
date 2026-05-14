"use client"

import React from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  UserPlus, 
  Phone, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Building2, 
  FileText, 
  Award,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AddStaffPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Add New Staff Member</h1>
          <p className="text-sm text-[#667085] mt-1">Create a new staff member account</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/staff">
            <Button variant="outline" className="px-6 h-11 border-[#D0D5DD] text-[#344054] font-semibold hover:bg-gray-50 rounded-lg">
              Cancel
            </Button>
          </Link>
          <Button className="px-6 h-11 bg-[#2E37A4] hover:bg-[#1d246b] text-white font-semibold rounded-lg shadow-sm">
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Back Link */}
      <div>
        <Link 
          href="/admin/staff"
          className="inline-flex items-center gap-2 text-[#667085] hover:text-[#101828] text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Staff</span>
        </Link>
      </div>

      {/* Green Banner */}
      <div className="bg-[#12B76A] rounded-xl p-6 text-white flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
          <UserPlus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Add New Staff Member</h2>
          <p className="text-white/80 text-sm">Create a new staff member account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#101828]">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="email"
                  placeholder="doctor@example.com"
                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
                <p className="text-xs text-[#667085]">This will be used for login</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-[#667085]" />
                </div>
                <input
                  type="tel"
                  placeholder="+1-555-0123"
                  className="w-full h-11 pl-10 pr-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Gender
              </label>
              <div className="relative">
                <select className="w-full h-11 px-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer shadow-sm">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-[#667085]" />
                </div>
                <input
                  type="text"
                  placeholder="Street address, City, State"
                  className="w-full h-11 pl-10 pr-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#101828]">Professional Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Specialization
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <GraduationCap className="h-4 w-4 text-[#667085]" />
                </div>
                <input
                  type="text"
                  placeholder="e.g., Cardiology, Pediatrics, Surg"
                  className="w-full h-11 pl-10 pr-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-[#667085]" />
                </div>
                <input
                  type="text"
                  placeholder="e.g., Emergency, ICU, Outpatient"
                  className="w-full h-11 pl-10 pr-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                License Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-[#667085]" />
                </div>
                <input
                  type="text"
                  placeholder="Medical license number"
                  className="w-full h-11 pl-10 pr-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#344054]">
                Years of Experience
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#344054]">
              Qualifications
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Award className="h-4 w-4 text-[#667085]" />
                </div>
                <input
                  type="text"
                  placeholder="e.g., MD, MBBS, PhD (Press Enter to add)"
                  className="w-full h-11 pl-10 pr-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
                />
              </div>
              <Button variant="outline" className="h-11 px-6 border-[#D0D5DD] text-[#344054] font-semibold rounded-lg bg-[#F9FAFB]">
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Biography */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#101828]">Biography</h3>
          <textarea
            placeholder="Brief professional biography..."
            rows={5}
            className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm resize-none"
          />
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#EAECF0]"></div>
          </div>
        </div>

        {/* Account Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#101828]">Account Information</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#344054]">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Enter password (min. 6 characters)"
              className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
            />
            <p className="text-xs text-[#667085]">Password must be at least 6 characters long</p>
          </div>

          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl p-4">
            <p className="text-sm font-semibold text-[#344054]">
              Role: <span className="font-normal text-[#667085]">Staff - Staff members have the same access as doctors</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
