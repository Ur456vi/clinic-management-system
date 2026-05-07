"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronDown,
  Droplet,
  Activity,
  Sparkles,
  TrendingUp,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"

const mainSteps = [
  "RMO Consultation",
  "Patient Details",
  "Main Consultation",
  "Infusion, Rehab & Aesthetics",
  "Test",
  "Summary"
]

const formSections = [
  "Informant",
  "Demographics",
  "Medical History",
  "Social History",
  "Personal History",
  "Examination Summary"
]

export default function AddPatientPage() {
  const [activeMainStep, setActiveMainStep] = React.useState("RMO Consultation")
  const [activeSection, setActiveSection] = React.useState("Informant")
  const [calendarDate, setCalendarDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNames = ['Su.','Mo.','Tu.','We.','Th.','Fr.','Sa.']
  const dayFullNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const timeSlots = ['5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM']
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Add New Patient</h1>
          <p className="text-sm text-[#667085] mt-1">Register a new patient in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="px-6 border-[#D0D5DD] text-[#344054] h-11 font-semibold rounded-lg">
            Cancel
          </Button>
          <Button className="px-6 bg-[#2E37A4] hover:bg-[#1d246b] text-white h-11 font-semibold rounded-lg">
            Add Patient
          </Button>
        </div>
      </div>

      {/* Back Link */}
      <div>
        <Link href="/admin/patients" className="inline-flex items-center gap-2 text-[#667085] hover:text-[#101828] text-sm font-medium transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Patients</span>
        </Link>
      </div>

      {/* Stepper Tabs */}
      <div className="bg-white border border-[#EAECF0] p-1 rounded-xl shadow-sm inline-flex gap-1 overflow-x-auto w-full md:w-auto">
        {mainSteps.map((step) => (
          <button
            key={step}
            onClick={() => setActiveMainStep(step)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainStep === step
              ? "bg-[#F4F5FF] text-[#2E37A4] border border-[#2E37A4]/10"
              : "text-[#667085] hover:bg-gray-50"
              }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Main Form Content Area */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation - Only show if RMO Consultation is active */}
        {activeMainStep === "RMO Consultation" && (
          <aside className="w-[240px] flex-shrink-0">
            <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
              {formSections.map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`w-full text-left px-6 py-4 text-sm font-medium transition-all border-b border-[#EAECF0] last:border-b-0 ${activeSection === section
                    ? "bg-[#F9FAFB] text-[#2E37A4] border-l-4 border-l-[#2E37A4]"
                    : "text-[#667085] hover:bg-gray-50 hover:text-[#101828]"
                    }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Form Container */}
        <div className="flex-1">
          <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-8">
            <div className="max-w-[800px]">
              {activeMainStep === "RMO Consultation" ? (
                <>
                  {activeSection === "Informant" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828]">Informant Details</h2>
                        <p className="text-sm text-[#667085] mt-1">Information about who is providing patient details</p>
                      </div>

                      {/* Informant Subsection */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Informant</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">
                                Relationship to Patient<span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select relationship</option>
                                  <option value="parent">Parent</option>
                                  <option value="sibling">Sibling</option>
                                  <option value="spouse">Spouse</option>
                                  <option value="friend">Friend</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">
                                Informant Name<span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Full name"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Person(s) in Attendance</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Attendee Names</label>
                              <textarea
                                placeholder="Names of relatives or friends present"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Relationship</label>
                              <input
                                type="text"
                                placeholder="Relative / Friend"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Demographics" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828]">Demographics</h2>
                        <p className="text-sm text-[#667085] mt-1">Basic patient information and contact details</p>
                      </div>

                      {/* Basic Information Subsection */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                            {/* Date of Birth */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">
                                Date of Birth<span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                              <p className="text-xs text-[#667085]">System will calculate age in years and months</p>
                            </div>

                            {/* Sex */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">
                                Sex<span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="sex" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Male</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="sex" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Female</span>
                                </label>
                              </div>
                            </div>

                            {/* Occupation */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">
                                Occupation<span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Current occupation"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                              <p className="text-xs text-[#667085]">Important for identifying occupational hazards and exposures</p>
                            </div>

                            {/* Place of Residence */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Place of Residence</label>
                              <textarea
                                placeholder="Full address"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                              <p className="text-xs text-[#667085]">Geography matters for geographically induced diseases</p>
                            </div>
                          </div>
                        </div>

                        {/* Consultation Details */}
                        <div className="pt-6 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Consultation Details</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">
                                Date of Consultation<span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Last Visit Date</label>
                              <input
                                type="date"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Referral Source</label>
                              <input
                                type="text"
                                placeholder="Doctor / Walk-in / Relative / Media"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                              <p className="text-xs text-[#667085]">How did the patient find this practice</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Medical History" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828]">Medical History</h2>
                        <p className="text-sm text-[#667085] mt-1">Complete medical, surgical, family, and medication history</p>
                      </div>

                      <div className="space-y-6">
                        {/* Past Medical History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Past Medical History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Medical Conditions</label>
                              <textarea
                                placeholder="e.g., Type 2 DM, HTN with CAD - Post PTCA status, Hypothyroidism"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                              <p className="text-xs text-[#667085]">Include known conditions with dates of diagnosis and current status</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">ICU Admissions</label>
                              <textarea
                                placeholder="Indication, duration, ventilator or inotropes used"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Past Surgical History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Past Surgical History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] rotate-180" />
                          </div>
                          <div className="p-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Surgical Procedures</label>
                              <textarea
                                placeholder="e.g., Post Cholecystectomy status - 2017, indication, outcome"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                              <p className="text-xs text-[#667085]">Include procedure name, date, indication, and outcome</p>
                            </div>
                          </div>
                        </div>

                        {/* Family History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Family History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Parents Status</label>
                                <input
                                  type="text"
                                  placeholder="Living / Deceased"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Parental Medical History</label>
                                <textarea
                                  placeholder="Significant conditions or causes of death"
                                  rows={2}
                                  className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Grandparents Medical History</label>
                              <textarea
                                placeholder="If patient can recall"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Travel History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Travel History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Current Residence</label>
                                <input
                                  type="text"
                                  placeholder="India / Abroad"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Travel Frequency</label>
                                <input
                                  type="text"
                                  placeholder="International / Domestic frequency"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Modes of Transport</label>
                              <input
                                type="text"
                                placeholder="Usual modes of transportation"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Medication / Drug History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Medication / Drug History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Current Medications</label>
                              <textarea
                                placeholder="Names, compositions, dosages, duration since initiation"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Previous Medications (Discontinued)</label>
                              <textarea
                                placeholder="Include reason for discontinuing"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Supplements</label>
                              <textarea
                                placeholder="Names, compositions, duration"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Illicit Drug Use</label>
                              <textarea
                                placeholder="Any use of illicit drugs"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Allergy History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Allergy History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] rotate-180" />
                          </div>
                          <div className="p-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Known Allergies</label>
                              <textarea
                                placeholder="Drug / Food / Cosmetic / Plant allergies with reactions"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Social History" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828]">Social History</h2>
                        <p className="text-sm text-[#667085] mt-1">Lifestyle, work, and social factors</p>
                      </div>

                      <div className="space-y-10">
                        {/* Marital Status Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Marital Status</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Status</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="single">Single</option>
                                  <option value="married">Married</option>
                                  <option value="divorced">Divorced</option>
                                  <option value="widowed">Widowed</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration</label>
                              <input
                                type="text"
                                placeholder="Duration in years"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Consanguineous Marriage</label>
                              <input
                                type="text"
                                placeholder="Yes / No"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Ethnicity</label>
                              <input
                                type="text"
                                placeholder="To be filled manually"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Work History Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Work History</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Work Hours</label>
                              <input
                                type="text"
                                placeholder="Hours per week"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Work Location</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select location</option>
                                  <option value="office">Office</option>
                                  <option value="remote">Remote</option>
                                  <option value="field">Field</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Physically Strenuous</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="physically_strenuous" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="physically_strenuous" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">No</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Night Shifts</label>
                              <input
                                type="text"
                                placeholder="Duration and frequency"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Alcohol Consumption Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Alcohol Consumption</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Frequency</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select frequency</option>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                  <option value="rarely">Rarely</option>
                                  <option value="never">Never</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration</label>
                              <input
                                type="text"
                                placeholder="Years / Months"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054]">Type of Beverage</label>
                              <input
                                type="text"
                                placeholder="Malts, Scotch, Whiskey, Beer, Wine, Vodka, Gin, Tequila, Ru"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tobacco Use Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Tobacco Use</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Variety</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select type</option>
                                  <option value="cigarettes">Cigarettes</option>
                                  <option value="cigars">Cigars</option>
                                  <option value="chewing">Chewing Tobacco</option>
                                  <option value="vape">Vape</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Number per Day</label>
                              <input
                                type="text"
                                placeholder="Quantity"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                              <p className="text-xs text-[#667085]">System will calculate pack years</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Years of Use</label>
                              <input
                                type="text"
                                placeholder="Duration in years"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Other Information Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Other Information</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Pets at Home</label>
                              <input
                                type="text"
                                placeholder="Animals / Birds (How many)"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Proximity / Exposure</label>
                              <input
                                type="text"
                                placeholder="Duration and level of contact"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Inherited Diseases</label>
                              <textarea
                                placeholder="What, how, and when detected"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Under Medical Care</label>
                              <input
                                type="text"
                                placeholder="Doctor name, since when"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Children Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Children</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Number of Children</label>
                              <input
                                type="text"
                                placeholder="Number"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Ages / Years of Birth</label>
                              <input
                                type="text"
                                placeholder="e.g., 5, 8, 12"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054]">Delivery Details</label>
                              <textarea
                                placeholder="NVD / LSCS / Complications"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sexual Life Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Sexual Life</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Partners</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="partners" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Single Partner</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="partners" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Multiple Partners</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Frequency</label>
                              <input
                                type="text"
                                placeholder="Frequency"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Protection</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="protection" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Protected</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="protection" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Unprotected</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Preferences</label>
                              <input
                                type="text"
                                placeholder="Same sex / Opposite sex"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Personal History" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828]">Personal History</h2>
                        <p className="text-sm text-[#667085] mt-1">Detailed personal habits and daily functioning</p>
                      </div>

                      <div className="space-y-6">
                        {/* Appetite Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Appetite</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Appetite Level</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select appetite level</option>
                                  <option value="normal">Normal</option>
                                  <option value="increased">Increased</option>
                                  <option value="decreased">Decreased</option>
                                  <option value="variable">Variable</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Food Cravings</label>
                              <input
                                type="text"
                                placeholder="Sweet / Salty / None"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bowels Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Bowels</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Regularity</label>
                                <div className="flex items-center gap-4 h-11">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="regularity" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] group-hover:text-[#101828]">Regular</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="regularity" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] group-hover:text-[#101828]">Constipation</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="regularity" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] group-hover:text-[#101828]">Frequent Diarrhea</span>
                                  </label>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Frequency (per day)</label>
                                <input
                                  type="text"
                                  placeholder="Average number"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Consistency</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select consistency</option>
                                    <option value="soft">Soft</option>
                                    <option value="hard">Hard</option>
                                    <option value="liquid">Liquid</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Color</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select color</option>
                                    <option value="brown">Brown</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="clay">Clay</option>
                                    <option value="black">Black</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Blood in Stool</label>
                              <textarea
                                placeholder="Streaks / Frank blood / Volume / Frequency / Painful or painless"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Other Symptoms</label>
                              <textarea
                                placeholder="Worms / Itching / Anal tags / Abscesses"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sleep Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Sleep</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Quality of Sleep</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select quality</option>
                                    <option value="good">Good</option>
                                    <option value="interrupted">Interrupted</option>
                                    <option value="poor">Poor</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Sleep Duration (hours)</label>
                                <input
                                  type="text"
                                  placeholder="Hours per night"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Sleep Time</label>
                                <input
                                  type="time"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Wake Time</label>
                                <input
                                  type="time"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Snoring</label>
                              <textarea
                                placeholder="Light / Deep / Apneic spells / Position-related"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-medium text-[#344054]">Parasomnias (select all that apply)</label>
                              <div className="grid grid-cols-2 gap-y-3">
                                {[
                                  "Sleep Walking", "Bed Wetting", "Nightmares", "Drooling of Saliva", "Sleep Paralysis",
                                  "Talking in Sleep", "Daytime Somnolence", "Night Sweats", "Grinding of Teeth"
                                ].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                    <input type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] group-hover:text-[#101828]">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bladder Habits Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Bladder Habits</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Frequency (times per day)</label>
                                <input
                                  type="text"
                                  placeholder="Average number"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Urgency</label>
                                <div className="flex items-center gap-6 h-11">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="urgency" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] group-hover:text-[#101828]">Normal</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="urgency" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] group-hover:text-[#101828]">Increased</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Color & Consistency</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select appearance</option>
                                    <option value="clear">Clear</option>
                                    <option value="straw">Straw yellow</option>
                                    <option value="dark">Dark yellow</option>
                                    <option value="cloudy">Cloudy</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Flow</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select flow</option>
                                    <option value="normal">Normal</option>
                                    <option value="weak">Weak</option>
                                    <option value="strained">Strained</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Blood in Urine</label>
                              <textarea
                                placeholder="Mild / Moderate / Frank / Painful or painless / Frequency"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Other Symptoms</label>
                              <textarea
                                placeholder="Burning / Pain / Itching / Nocturia frequency"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Energy Levels Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Energy Levels</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Energy Pattern</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select energy level</option>
                                  <option value="high">Consistently High</option>
                                  <option value="fluctuating">Fluctuating</option>
                                  <option value="low">Consistently Low</option>
                                  <option value="morning">Better in Morning</option>
                                  <option value="evening">Better in Evening</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Libido / Sex Drive Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Libido / Sex Drive</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Libido Level</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select level</option>
                                  <option value="normal">Normal</option>
                                  <option value="increased">Increased</option>
                                  <option value="decreased">Decreased</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration / Pattern</label>
                              <input
                                type="text"
                                placeholder="Duration and pattern"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mentation Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Mentation</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Mood</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select mood</option>
                                    <option value="stable">Stable</option>
                                    <option value="anxious">Anxious</option>
                                    <option value="depressed">Depressed</option>
                                    <option value="irritable">Irritable</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Irritability</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select frequency</option>
                                    <option value="none">None</option>
                                    <option value="rare">Rare</option>
                                    <option value="frequent">Frequent</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Forgetfulness</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select level</option>
                                    <option value="none">None</option>
                                    <option value="mild">Mild</option>
                                    <option value="significant">Significant</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Concentration & Focus</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select level</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Depression & Anxiety</label>
                              <textarea
                                placeholder="Any depression, anxiety, or panic attacks"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Tendencies</label>
                              <input
                                type="text"
                                placeholder="Aggression / Suicidal / Withdrawal"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Brain Fog</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="brain_fog" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="brain_fog" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">No</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Diet, Exercise & Hygiene Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Diet, Exercise & Hygiene</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Dietary Considerations</label>
                              <textarea
                                placeholder="Dietary patterns, restrictions, preferences"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Exercise Regimen</label>
                              <textarea
                                placeholder="Type, frequency, duration of exercise"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Personal Hygiene</label>
                              <textarea
                                placeholder="Bathing / Brushing / Change of underclothes / Nail care"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Personal Habits</label>
                              <input
                                type="text"
                                placeholder="Cosmetics / Sunscreens / Other applicants"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Miscellaneous Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0]">
                            <h3 className="text-sm font-semibold text-[#101828]">Miscellaneous</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Perspiration</label>
                                <input
                                  type="text"
                                  placeholder="Normal / Excessive / Minimal"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Body Odor</label>
                                <input
                                  type="text"
                                  placeholder="Present / Not Present / Type"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Halitosis (Bad Breath)</label>
                              <input
                                type="text"
                                placeholder="Present / Not Present"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Examination Summary" ? (
                    <>
                      {/* Appearance & Mental Status Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828]">Appearance & Mental Status</h2>
                        <p className="text-sm text-[#667085] mt-1">General appearance and cognitive assessment</p>
                      </div>

                      <div className="space-y-10">
                        {/* General Appearance Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">General Appearance</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054]">Appearance / Attitude</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Attention Span</label>
                              <input
                                type="text"
                                placeholder="Normal / Distracted / Poor"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Short Term Memory</label>
                              <input
                                type="text"
                                placeholder="Intact / Impaired"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Gait Assessment Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Gait Assessment</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Stance & Swing Phases</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="stance_swing" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Normal</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="stance_swing" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Abnormal</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Gait Pattern</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select gait pattern</option>
                                  <option value="normal">Normal</option>
                                  <option value="antalgic">Antalgic</option>
                                  <option value="ataxic">Ataxic</option>
                                  <option value="hemiplegic">Hemiplegic</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration (if abnormal)</label>
                              <input
                                type="text"
                                placeholder="Duration"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Head & Neck Features Header */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h2 className="text-xl font-bold text-[#101828]">Head & Neck Features</h2>
                          <p className="text-sm text-[#667085] mt-1">Facial features, oral cavity, and neck examination</p>
                        </div>

                        {/* Facial Features Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Facial Features</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Facies</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select facies type</option>
                                  <option value="normal">Normal</option>
                                  <option value="adenoid">Adenoid</option>
                                  <option value="cushingoid">Cushingoid</option>
                                  <option value="parkinsonian">Parkinsonian</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Facial Tics</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="facial_tics" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="facial_tics" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054]">Scars / Bruises / Naevi</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Facial Puffiness</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select type</option>
                                  <option value="none">None</option>
                                  <option value="periorbital">Periorbital</option>
                                  <option value="generalized">Generalized</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lips & Mouth Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Lips & Mouth</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Lip Findings</label>
                              <input
                                type="text"
                                placeholder="Pursed / Cheilitis / Cleft lip"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Buccopharyngeal Examination</label>
                              <input
                                type="text"
                                placeholder="Thrush / Ulcers / Normal"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Tongue Pattern</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select tongue pattern</option>
                                  <option value="normal">Normal</option>
                                  <option value="geographic">Geographic</option>
                                  <option value="fissured">Fissured</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Tongue Coating</label>
                              <input
                                type="text"
                                placeholder="Color and thickness"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dental Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Dental</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Dental Formula</label>
                              <input
                                type="text"
                                placeholder="e.g., 32/32"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Dental Caries</label>
                              <input
                                type="text"
                                placeholder="Location and extent"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Gingivitis</label>
                              <div className="flex items-center gap-4 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="gingivitis" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="gingivitis" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Mild</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="gingivitis" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Moderate</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="gingivitis" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Severe</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration (if present)</label>
                              <input
                                type="text"
                                placeholder=""
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* ENT Examination Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">ENT Examination</h3>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-[#344054]">ENT Findings</label>
                            <textarea
                              placeholder="Ears, nose, throat examination findings"
                              rows={3}
                              className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                            />
                          </div>
                        </div>

                        {/* General Physical Examination (GPE) Header */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h2 className="text-xl font-bold text-[#101828]">General Physical Examination (GPE)</h2>
                          <p className="text-sm text-[#667085] mt-1">Cardiovascular, respiratory, and other vital parameters</p>
                        </div>

                        {/* Pulse Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Pulse</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Rate (bpm)</label>
                              <input
                                type="text"
                                placeholder="e.g., 72"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Rhythm</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select rhythm</option>
                                  <option value="regular">Regular</option>
                                  <option value="irregular">Irregularly Irregular</option>
                                  <option value="regular_irregular">Regularly Irregular</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Volume</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select volume</option>
                                  <option value="normal">Normal</option>
                                  <option value="low">Low</option>
                                  <option value="high">High</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Character</label>
                              <input
                                type="text"
                                placeholder="e.g., Normal, Collapsing"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">All Peripheral Pulses & Adequately</label>
                              <input
                                type="text"
                                placeholder="All present and equal"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Bruits</label>
                              <input
                                type="text"
                                placeholder="Present / Not Present / Location"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Blood Pressure Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Blood Pressure</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Systolic (mmHg)</label>
                              <input
                                type="text"
                                placeholder="e.g., 120"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Diastolic (mmHg)</label>
                              <input
                                type="text"
                                placeholder="e.g., 80"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Pulse Pressure</label>
                              <input
                                type="text"
                                placeholder="Calculated automatically"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">MAP</label>
                              <input
                                type="text"
                                placeholder="Mean Arterial Pressure"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Auscultation Gap</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="auscultation_gap" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="auscultation_gap" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Body Temperature & Hydration Status Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Body Temperature & Hydration Status</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Body Temperature (°F)</label>
                              <input
                                type="text"
                                placeholder="98.6"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Hydration Status</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="good">Good</option>
                                  <option value="fair">Fair</option>
                                  <option value="dehydrated">Dehydrated</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Respiratory Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Respiratory</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Rate (per min)</label>
                              <input
                                type="text"
                                placeholder="e.g., 16"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Pattern</label>
                              <input
                                type="text"
                                placeholder="Normal / Dyspneic / Tachypneic"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">SpO2 (%)</label>
                              <input
                                type="text"
                                placeholder="98"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Signs of COPD</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="copd_signs" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="copd_signs" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054]">Respiratory Failure Signs</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Clinical Signs Header */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h2 className="text-xl font-bold text-[#101828]">Clinical Signs</h2>
                          <p className="text-sm text-[#667085] mt-1">Pallor, icterus, cyanosis, and other signs</p>
                        </div>

                        {/* Pallor Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Pallor</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Pallor</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="pallor" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="pallor" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Degree (if present)</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">1*, 2*, 3*, 4*</option>
                                  <option value="1">1*</option>
                                  <option value="2">2*</option>
                                  <option value="3">3*</option>
                                  <option value="4">4*</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Icterus Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Icterus</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Icterus</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="icterus" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="icterus" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Degree (if present)</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">1*, 2*, 3*, 4*, Deep Jaundice</option>
                                  <option value="1">1*</option>
                                  <option value="2">2*</option>
                                  <option value="3">3*</option>
                                  <option value="4">4*</option>
                                  <option value="deep">Deep Jaundice</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration</label>
                              <input
                                type="text"
                                placeholder="Duration In Days"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cyanosis Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Cyanosis</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Cyanosis</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="cyanosis" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="cyanosis" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Type (if present)</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select type</option>
                                  <option value="central">Central</option>
                                  <option value="peripheral">Peripheral</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Degree</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select degree</option>
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="severe">Severe</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lymphadenopathy Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Lymphadenopathy</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Anatomical Area</label>
                              <input
                                type="text"
                                placeholder="Cervical / Axillary / Inguinal"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Tenderness</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="tenderness" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Tender</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="tenderness" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Non-tender</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Size & Number</label>
                              <input
                                type="text"
                                placeholder="Size and number of nodes"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration</label>
                              <input
                                type="text"
                                placeholder=""
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Edema Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Edema</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Location</label>
                              <input
                                type="text"
                                placeholder="Bilateral lower limbs / Facial"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Type</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="edema_type" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Pitting</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="edema_type" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] group-hover:text-[#101828]">Non-pitting</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Degree</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select degree</option>
                                  <option value="1">1+</option>
                                  <option value="2">2+</option>
                                  <option value="3">3+</option>
                                  <option value="4">4+</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Duration</label>
                              <input
                                type="text"
                                placeholder=""
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Nails, Skin & Hair Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Nails, Skin & Hair</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Digital Clubbing</label>
                              <input
                                type="text"
                                placeholder="Grade and distribution"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Nail Changes</label>
                              <textarea
                                placeholder="Ridges / Color changes / Pitting"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Skin Hyperpigmentation</label>
                              <textarea
                                placeholder="Location / Extent / Margins"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Hair Changes</label>
                              <input
                                type="text"
                                placeholder="Alopecia / Thinning"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Systemic Examination Header */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h2 className="text-xl font-bold text-[#101828]">Systemic Examination</h2>
                          <p className="text-sm text-[#667085] mt-1">CVS, RS, P/A, and CNS examination findings</p>
                        </div>

                        {/* Cardiovascular System (CVS) Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Cardiovascular System (CVS)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Inspection</label>
                              <textarea
                                placeholder="Visible pulsations, chest deformities, scars"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Palpation</label>
                              <textarea
                                placeholder="Apical beat, thrills, heaves, parasternal impulse"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Percussion</label>
                              <textarea
                                placeholder="Cardiac dullness boundaries"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Auscultation</label>
                              <textarea
                                placeholder="Heart sounds (S1, S2), murmurs, additional sounds"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Respiratory System (RS) Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Respiratory System (RS)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Inspection</label>
                              <textarea
                                placeholder="Chest shape, respiratory rate, use of accessory muscles"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Palpation</label>
                              <textarea
                                placeholder="Chest expansion, tactile fremitus, tracheal position"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Percussion</label>
                              <textarea
                                placeholder="Resonance, dullness, hyperresonance"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Auscultation</label>
                              <textarea
                                placeholder="Breath sounds, crackles, wheezes, vocal resonance"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Per Abdomen (P/A) Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Per Abdomen (P/A)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Inspection</label>
                              <textarea
                                placeholder="Shape, distension, scars, visible peristalsis, veins"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Palpation</label>
                              <textarea
                                placeholder="Tenderness, guarding, rigidity, organomegaly, masses"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Percussion</label>
                              <textarea
                                placeholder="Liver span, shifting dullness, free fluid"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Auscultation</label>
                              <textarea
                                placeholder="Bowel sounds, bruits, friction rubs"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Central Nervous System (CNS) Section */}
                        <div className="pt-8 border-t border-[#EAECF0]">
                          <h3 className="text-base font-semibold text-[#101828] mb-4">Central Nervous System (CNS)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Consciousness Level</label>
                              <input
                                type="text"
                                placeholder="Alert / Drowsy / Stuporous / Comatose"
                                className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Higher Mental Functions (MMSE)</label>
                              <textarea
                                placeholder="Orientation (time, place, person), memory, speech"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Cranial Nerves (I-XII)</label>
                              <textarea
                                placeholder="CN I to XII examination findings"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Motor System</label>
                              <textarea
                                placeholder="Tone, power (grade 0-5), reflexes, coordination"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Sensory System</label>
                              <textarea
                                placeholder="Touch, pain, temperature, vibration, proprioception"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                ) : null}
              </>
            ) : activeMainStep === "Patient Details" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#101828]">Patient Details</h2>
                </div>
                <div className="space-y-10">
                  <div>
                    <h3 className="text-base font-semibold text-[#101828] mb-6 border-b border-[#EAECF0] pb-4">Blood Group Information</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#344054]">Do you know your Rh factor?</label>
                        <div className="flex items-center gap-6">
                          {["Yes (Positive)", "Yes (Negative)", "Not sure"].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="rh_factor" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                              <span className="text-sm text-[#344054] group-hover:text-[#101828]">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#344054]">Have you ever been advised to match blood group before a procedure or surgery?</label>
                        <div className="flex items-center gap-6">
                          {["Yes", "No", "Don't remember"].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="match_blood" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                              <span className="text-sm text-[#344054] group-hover:text-[#101828]">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#344054]">Is your blood group mentioned on any ID or medical record you carry?</label>
                        <div className="flex items-center gap-6">
                          {["Yes", "No"].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="id_mention" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                              <span className="text-sm text-[#344054] group-hover:text-[#101828]">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#344054]">Have any close family members been told they have a rare blood group?</label>
                        <div className="flex items-center gap-6">
                          {["Yes", "No", "Not sure"].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="family_rare" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                              <span className="text-sm text-[#344054] group-hover:text-[#101828]">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#344054]">In case of an emergency, is there someone who knows your blood group?</label>
                        <div className="flex items-center gap-6">
                          {["Yes", "No"].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="emergency_knows" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                              <span className="text-sm text-[#344054] group-hover:text-[#101828]">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#344054]">Would you like your blood group to be reconfirmed during this visit if needed?</label>
                        <div className="flex items-center gap-6">
                          {["Yes", "No", "Decide later"].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="reconfirm_visit" className="w-4 h-4 border-[#D0D5DD] text-[#2E37A4] focus:ring-[#2E37A4]/20" />
                              <span className="text-sm text-[#344054] group-hover:text-[#101828]">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : activeMainStep === "Main Consultation" ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#101828]">Main Consultation</h2>
                  <p className="text-sm text-[#667085] mt-1">Select a date and time for the consultation</p>
                </div>
                <div className="flex gap-10">
                  {/* Calendar */}
                  <div className="flex-1">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <button
                        onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                        className="w-9 h-9 rounded-full border border-[#D0D5DD] flex items-center justify-center text-[#667085] hover:bg-gray-50 transition-all"
                      >
                        &#8249;
                      </button>
                      <span className="text-lg font-bold text-[#101828] min-w-[160px] text-center">
                        {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                      </span>
                      <button
                        onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                        className="w-9 h-9 rounded-full bg-[#2E37A4] flex items-center justify-center text-white hover:bg-[#1d246b] transition-all shadow-sm"
                      >
                        &#8250;
                      </button>
                    </div>
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-3">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-sm font-medium text-[#667085] py-1">{d}</div>
                      ))}
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-2">
                      {Array.from({ length: getFirstDayOfMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {Array.from({ length: getDaysInMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => {
                        const day = i + 1
                        const thisDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
                        const today = new Date()
                        const isToday = thisDate.toDateString() === today.toDateString()
                        const isSelected = selectedDate?.toDateString() === thisDate.toDateString()
                        const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        return (
                          <div key={day} className="flex items-center justify-center py-1">
                            <button
                              onClick={() => !isPast && setSelectedDate(thisDate)}
                              disabled={isPast}
                              className={`w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#2E37A4] text-white shadow-md'
                                  : isToday
                                  ? 'bg-[#E8F5E9] text-[#2E37A4] border border-[#2E37A4]/20'
                                  : isPast
                                  ? 'text-[#D0D5DD] cursor-not-allowed'
                                  : 'text-[#344054] hover:bg-[#F4F5FF] hover:text-[#2E37A4]'
                              }`}
                            >
                              {day}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="w-[320px] flex-shrink-0">
                    {selectedDate ? (
                      <>
                        <h3 className="text-base font-semibold text-[#101828] mb-5">
                          {dayFullNames[selectedDate.getDay()]}, {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              className={`h-12 rounded-xl border text-sm font-medium transition-all ${
                                selectedTime === slot
                                  ? 'border-[#2E37A4] bg-[#F4F5FF] text-[#2E37A4]'
                                  : 'border-[#D0D5DD] text-[#667085] hover:border-[#2E37A4]/40 hover:text-[#2E37A4] hover:bg-[#F9FAFB]'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                        {selectedTime && (
                          <div className="mt-6 p-4 bg-[#F4F5FF] rounded-xl border border-[#2E37A4]/10">
                            <p className="text-sm font-medium text-[#2E37A4]">Selected Appointment</p>
                            <p className="text-xs text-[#667085] mt-1">{dayFullNames[selectedDate.getDay()]}, {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()} at {selectedTime}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                        <div className="w-12 h-12 bg-[#F4F5FF] rounded-full flex items-center justify-center mb-3">
                          <span className="text-xl">??</span>
                        </div>
                        <p className="text-sm font-medium text-[#344054]">Select a date</p>
                        <p className="text-xs text-[#667085] mt-1">Choose a date to see available time slots</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : activeMainStep === "Infusion, Rehab & Aesthetics" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#101828]">Infusion, Rehab & Aesthetics</h2>
                  <p className="text-sm text-[#667085] mt-1">Overview of clinical services and patient throughput</p>
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                  {/* Infusion Therapy Card */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#F0F5FF] rounded-2xl flex items-center justify-center mb-6">
                      <Droplet className="w-6 h-6 text-[#2E90FA]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#101828] mb-1">Infusion Therapy</h3>
                    <p className="text-sm text-[#667085] mb-6">View detailed insights and metrics</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Total Patients</span>
                        <span className="text-sm font-bold text-[#101828]">247</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Active Today</span>
                        <span className="text-sm font-bold text-[#101828]">18</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Avg Duration</span>
                        <span className="text-sm font-bold text-[#101828]">2.5 hrs</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#F2F4F7]">
                        <span className="text-sm text-[#667085]">Completion Rate</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#101828]">94%</span>
                          <div className="flex items-center text-[#12B76A] text-xs font-medium bg-[#ECFDF3] px-1.5 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            +12%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rehabilitation Card */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#ECFDF3] rounded-2xl flex items-center justify-center mb-6">
                      <Activity className="w-6 h-6 text-[#12B76A]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#101828] mb-1">Rehabilitation</h3>
                    <p className="text-sm text-[#667085] mb-6">View detailed insights and metrics</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Total Patients</span>
                        <span className="text-sm font-bold text-[#101828]">412</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Active Today</span>
                        <span className="text-sm font-bold text-[#101828]">32</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Avg Duration</span>
                        <span className="text-sm font-bold text-[#101828]">1.5 hrs</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#F2F4F7]">
                        <span className="text-sm text-[#667085]">Completion Rate</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#101828]">87%</span>
                          <div className="flex items-center text-[#12B76A] text-xs font-medium bg-[#ECFDF3] px-1.5 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            +8%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aesthetics Card */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#FFF1F3] rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles className="w-6 h-6 text-[#F04438]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#101828] mb-1">Aesthetics</h3>
                    <p className="text-sm text-[#667085] mb-6">View detailed insights and metrics</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Total Patients</span>
                        <span className="text-sm font-bold text-[#101828]">328</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Active Today</span>
                        <span className="text-sm font-bold text-[#101828]">15</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#667085]">Avg Duration</span>
                        <span className="text-sm font-bold text-[#101828]">45 mins</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#F2F4F7]">
                        <span className="text-sm text-[#667085]">Completion Rate</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#101828]">98%</span>
                          <div className="flex items-center text-[#12B76A] text-xs font-medium bg-[#ECFDF3] px-1.5 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            +15%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-8 rounded-[24px] border border-[#EAECF0]">
                  <h3 className="text-lg font-bold text-[#101828] mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0]">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-[#101828]">Sarah Johnson</span>
                        <span className="text-xs text-[#667085]">IV Vitamin Therapy</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-[#667085]" />
                          <span className="text-[11px] text-[#667085]">09:30 AM</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#EFF8FF] text-[#175CD3] text-xs font-medium rounded-full border border-[#B2DDFF]">
                        In Progress
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0]">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-[#101828]">Michael Chen</span>
                        <span className="text-xs text-[#667085]">Chemotherapy</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-[#667085]" />
                          <span className="text-[11px] text-[#667085]">10:15 AM</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#F2F4F7] text-[#344054] text-xs font-medium rounded-full border border-[#D0D5DD]">
                        Scheduled
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">??</span>
                </div>
                <h3 className="text-lg font-semibold text-[#101828]">{activeMainStep}</h3>
                <p className="text-sm text-[#667085] mt-1">This section is under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
