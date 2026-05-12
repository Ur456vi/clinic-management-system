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
  Clock,
  HeartPulse
} from "lucide-react"
import { Button } from "@/components/ui/button"
import TestTabContent from "@/components/patients/TestTabContent"
import SummaryTabContent from "@/components/patients/SummaryTabContent"

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

const testSections = [
  "Routine",
  "Male Hormonal",
  "Female Hormonal",
  "Dutch",
  "Autoimmune",
  "Genetic",
  "Tumor Markers",
  "Micronutrient",
  "Metabolic",
  "Stool Test"
]


export default function AddPatientPage() {
  const [activeMainStep, setActiveMainStep] = React.useState("RMO Consultation")
  const [activeSection, setActiveSection] = React.useState("Informant")
  const [activeTestSection, setActiveTestSection] = React.useState("Routine")

  const [calendarDate, setCalendarDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNames = ['Su.','Mo.','Tu.','We.','Th.','Fr.','Sa.']
  const dayFullNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const timeSlots = ['5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM']
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    "Past Medical History": true,
    "Past Surgical History": true,
    "Family History": true,
    "Travel History": true,
    "Medication / Drug History": true,
    "Allergy History": true,
    "Appetite": true,
    "Bowels": true,
    "Sleep": true,
    "Bladder Habits": true,
    "Energy Levels": true,
    "Libido / Sex Drive": true,
    "Mentation": true,
    "Diet, Exercise & Hygiene": true,
    "Miscellaneous": true,
    "Appearance & Mental Status": true,
    "Head & Neck Features": true,
    "General Physical Examination (GPE)": true,
    "Clinical Signs": true,
    "Systemic Examination": true,
    "Cardiovascular System (CVS)": true,
    "Respiratory System (RS)": true,
    "Per Abdomen (P/A)": true,
    "Central Nervous System (CNS)": true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border whitespace-nowrap ${activeMainStep === step
              ? "bg-[#F4F5FF] text-[#2E37A4] border-[#2E37A4]" 
              : "text-[#667085] hover:bg-gray-50 border-transparent"
              }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Main Form Content Area */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation */}
        {(activeMainStep === "RMO Consultation" || activeMainStep === "Test") && (
          <aside className="w-[240px] flex-shrink-0">
            <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
              {activeMainStep === "RMO Consultation" ? (
                formSections.map((section) => (
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
                ))
              ) : (
                testSections.map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveTestSection(section)}
                    className={`w-full text-left px-6 py-4 text-sm font-medium transition-all border-b border-[#EAECF0] last:border-b-0 ${activeTestSection === section
                      ? "bg-[#F9FAFB] text-[#2E37A4] border-l-4 border-l-[#2E37A4]"
                      : "text-[#667085] hover:bg-gray-50 hover:text-[#101828]"
                      }`}
                  >
                    {section}
                  </button>
                ))
              )}
            </div>
          </aside>
        )}


        {/* Form Container */}
        <div className="flex-1">
          {activeMainStep === "Summary" ? (
            <SummaryTabContent />
          ) : (
            <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-8">
              <div className={activeMainStep === "Infusion, Rehab & Aesthetics" ? "max-w-none" : "max-w-[800px]"}>
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select referral source</option>
                                  <option value="doctor">Doctor</option>
                                  <option value="walk-in">Walk-in</option>
                                  <option value="relative">Relative</option>
                                  <option value="media">Media</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Past Medical History")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Past Medical History</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Past Medical History"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Past Medical History"] && (
                            <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Medical Conditions</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select condition</option>
                                  <option value="dm">Diabetes Mellitus</option>
                                  <option value="htn">Hypertension</option>
                                  <option value="cad">Cardiovascular Disease</option>
                                  <option value="hypo">Hypothyroidism</option>
                                  <option value="hyper">Hyperthyroidism</option>
                                  <option value="asthma">Asthma</option>
                                  <option value="copd">COPD</option>
                                  <option value="ckd">Chronic Kidney Disease</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                              <p className="text-xs text-[#667085]">Include known conditions with dates of diagnosis and current status</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">ICU Admissions</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select admission status</option>
                                  <option value="none">None</option>
                                  <option value="resp">Respiratory Failure</option>
                                  <option value="sepsis">Sepsis</option>
                                  <option value="post_op">Post-Surgical</option>
                                  <option value="cardiac">Cardiac Arrest</option>
                                  <option value="trauma">Trauma</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                        </div>

                        {/* Past Surgical History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Past Surgical History")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Past Surgical History</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Past Surgical History"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Past Surgical History"] && (
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
                        )}
                        </div>

                        {/* Family History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Family History")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Family History</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Family History"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Family History"] && (
                            <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Parents Status</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select status</option>
                                    <option value="both_living">Both Living</option>
                                    <option value="both_deceased">Both Deceased</option>
                                    <option value="father_living">Father Living</option>
                                    <option value="mother_living">Mother Living</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
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
                        )}
                        </div>

                        {/* Travel History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Travel History")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Travel History</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Travel History"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Travel History"] && (
                            <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Current Residence</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select residence</option>
                                    <option value="india">India</option>
                                    <option value="abroad">Abroad</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Travel Frequency</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select frequency</option>
                                    <option value="frequent">Frequent</option>
                                    <option value="occasional">Occasional</option>
                                    <option value="rare">Rare</option>
                                    <option value="never">Never</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
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
                        )}
                        </div>

                        {/* Medication / Drug History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Medication / Drug History")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Medication / Drug History</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Medication / Drug History"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Medication / Drug History"] && (
                            <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Current Medications</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select medication status</option>
                                  <option value="none">None</option>
                                  <option value="antihypertensives">Antihypertensives</option>
                                  <option value="antidiabetics">Antidiabetics</option>
                                  <option value="antibiotics">Antibiotics</option>
                                  <option value="anticoagulants">Anticoagulants</option>
                                  <option value="supplements">Supplements</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                        )}
                        </div>

                        {/* Allergy History Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Allergy History")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Allergy History</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Allergy History"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Allergy History"] && (
                            <div className="p-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Known Allergies</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select allergy status</option>
                                  <option value="none">None</option>
                                  <option value="drug">Drug Allergy</option>
                                  <option value="food">Food Allergy</option>
                                  <option value="environmental">Environmental Allergy</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select beverage type</option>
                                  <option value="malts">Malts</option>
                                  <option value="scotch">Scotch</option>
                                  <option value="whiskey">Whiskey</option>
                                  <option value="beer">Beer</option>
                                  <option value="wine">Wine</option>
                                  <option value="vodka">Vodka</option>
                                  <option value="gin">Gin</option>
                                  <option value="tequila">Tequila</option>
                                  <option value="rum">Rum</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                            onClick={() => toggleSection("Appetite")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Appetite</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Appetite"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Appetite"] && (
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select craving</option>
                                  <option value="none">None</option>
                                  <option value="sweet">Sweet</option>
                                  <option value="salty">Salty</option>
                                  <option value="sour">Sour</option>
                                  <option value="spicy">Spicy</option>
                                  <option value="carbs">Carbohydrates</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                        </div>

                        {/* Bowels Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                            onClick={() => toggleSection("Bowels")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Bowels</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Bowels"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Bowels"] && (
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">None</option>
                                  <option value="streaks">Streaks</option>
                                  <option value="frank">Frank blood</option>
                                  <option value="occult">Occult</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Other Symptoms</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select symptoms</option>
                                  <option value="none">None</option>
                                  <option value="worms">Worms</option>
                                  <option value="itching">Itching</option>
                                  <option value="tags">Anal tags</option>
                                  <option value="abscesses">Abscesses</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                        </div>

                        {/* Sleep Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Sleep")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Sleep</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Sleep"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Sleep"] && (
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">None</option>
                                  <option value="light">Light</option>
                                  <option value="deep">Deep</option>
                                  <option value="apneic">Apneic spells</option>
                                  <option value="positional">Position-related</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                        )}
                        </div>

                        {/* Bladder Habits Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Bladder Habits")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Bladder Habits</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Bladder Habits"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Bladder Habits"] && (
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">None</option>
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="frank">Frank blood</option>
                                  <option value="painful">Painful</option>
                                  <option value="painless">Painless</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Other Symptoms</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select symptoms</option>
                                  <option value="none">None</option>
                                  <option value="burning">Burning</option>
                                  <option value="pain">Pain</option>
                                  <option value="itching">Itching</option>
                                  <option value="nocturia">Nocturia</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                        </div>

                        {/* Energy Levels Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Energy Levels")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Energy Levels</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Energy Levels"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Energy Levels"] && (
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
                        )}
                        </div>

                        {/* Libido / Sex Drive Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Libido / Sex Drive")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Libido / Sex Drive</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Libido / Sex Drive"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Libido / Sex Drive"] && (
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
                        )}
                        </div>

                        {/* Mentation Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Mentation")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Mentation</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Mentation"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Mentation"] && (
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">None</option>
                                  <option value="mild_dep">Mild Depression</option>
                                  <option value="sev_dep">Severe Depression</option>
                                  <option value="anxiety">Anxiety</option>
                                  <option value="panic">Panic Attacks</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Tendencies</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select tendency</option>
                                  <option value="none">None</option>
                                  <option value="aggression">Aggression</option>
                                  <option value="suicidal">Suicidal</option>
                                  <option value="withdrawal">Withdrawal</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                        )}
                        </div>

                        {/* Diet, Exercise & Hygiene Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Diet, Exercise & Hygiene")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Diet, Exercise & Hygiene</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Diet, Exercise & Hygiene"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Diet, Exercise & Hygiene"] && (
                            <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Dietary Considerations</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select dietary pattern</option>
                                  <option value="veg">Vegetarian</option>
                                  <option value="non_veg">Non-Vegetarian</option>
                                  <option value="vegan">Vegan</option>
                                  <option value="gluten_free">Gluten-Free</option>
                                  <option value="keto">Ketogenic</option>
                                  <option value="diabetic">Diabetic Diet</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Exercise Regimen</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select regimen</option>
                                  <option value="none">None</option>
                                  <option value="light">Light (Walking)</option>
                                  <option value="moderate">Moderate (Gym/Jogging)</option>
                                  <option value="heavy">Heavy (Athletic)</option>
                                  <option value="occasional">Occasional</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Personal Hygiene</label>
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
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Personal Habits</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">None</option>
                                  <option value="cosmetics">Cosmetics</option>
                                  <option value="sunscreens">Sunscreens</option>
                                  <option value="other">Other applicants</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                        </div>

                        {/* Miscellaneous Accordion */}
                        <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                          <div 
                            className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer"
                            onClick={() => toggleSection("Miscellaneous")}
                          >
                            <h3 className="text-sm font-semibold text-[#101828]">Miscellaneous</h3>
                            <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Miscellaneous"] ? "rotate-180" : ""}`} />
                          </div>
                          {expandedSections["Miscellaneous"] && (
                            <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Perspiration</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select status</option>
                                    <option value="normal">Normal</option>
                                    <option value="excessive">Excessive</option>
                                    <option value="minimal">Minimal</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054]">Body Odor</label>
                                <div className="relative">
                                  <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select status</option>
                                    <option value="not_present">Not Present</option>
                                    <option value="present">Present</option>
                                    <option value="sweet">Sweet</option>
                                    <option value="pungent">Pungent</option>
                                    <option value="other">Other</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Halitosis (Bad Breath)</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="not_present">Not Present</option>
                                  <option value="present">Present</option>
                                  <option value="occasional">Occasional</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </>
                  ) : activeSection === "Examination Summary" ? (
                    <>
                      {/* Appearance & Mental Status Accordion */}
                      <div className="border border-[#EAECF0] rounded-xl overflow-hidden mb-6">
                        <div 
                          className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                          onClick={() => toggleSection("Appearance & Mental Status")}
                        >
                          <h2 className="text-sm font-bold text-[#101828]">Appearance & Mental Status</h2>
                          <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Appearance & Mental Status"] ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSections["Appearance & Mental Status"] && (
                          <div className="p-6 space-y-10">
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select attention span</option>
                                  <option value="normal">Normal</option>
                                  <option value="distracted">Distracted</option>
                                  <option value="poor">Poor</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Short Term Memory</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="intact">Intact</option>
                                  <option value="impaired">Impaired</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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

                          </div>
                        )}
                      </div>

                      {/* Head & Neck Features Accordion */}
                      <div className="border border-[#EAECF0] rounded-xl overflow-hidden mb-6">
                        <div 
                          className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                          onClick={() => toggleSection("Head & Neck Features")}
                        >
                          <h2 className="text-sm font-bold text-[#101828]">Head & Neck Features</h2>
                          <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Head & Neck Features"] ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSections["Head & Neck Features"] && (
                          <div className="p-6 space-y-10">

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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select finding</option>
                                  <option value="normal">Normal</option>
                                  <option value="pursed">Pursed</option>
                                  <option value="cheilitis">Cheilitis</option>
                                  <option value="cleft">Cleft lip</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Buccopharyngeal Examination</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select finding</option>
                                  <option value="normal">Normal</option>
                                  <option value="thrush">Thrush</option>
                                  <option value="ulcers">Ulcers</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                          </div>
                        )}
                      </div>

                      {/* General Physical Examination (GPE) Accordion */}
                      <div className="border border-[#EAECF0] rounded-xl overflow-hidden mb-6">
                        <div 
                          className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                          onClick={() => toggleSection("General Physical Examination (GPE)")}
                        >
                          <h2 className="text-sm font-bold text-[#101828]">General Physical Examination (GPE)</h2>
                          <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["General Physical Examination (GPE)"] ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSections["General Physical Examination (GPE)"] && (
                          <div className="p-6 space-y-10">

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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">Not Present</option>
                                  <option value="carotid">Carotid</option>
                                  <option value="renal">Renal</option>
                                  <option value="femoral">Femoral</option>
                                  <option value="abdominal">Abdominal</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select pattern</option>
                                  <option value="normal">Normal</option>
                                  <option value="dyspneic">Dyspneic</option>
                                  <option value="tachypneic">Tachypneic</option>
                                  <option value="bradypneic">Bradypneic</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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

                          </div>
                        )}
                      </div>

                      {/* Clinical Signs Accordion */}
                      <div className="border border-[#EAECF0] rounded-xl overflow-hidden mb-6">
                        <div 
                          className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                          onClick={() => toggleSection("Clinical Signs")}
                        >
                          <h2 className="text-sm font-bold text-[#101828]">Clinical Signs</h2>
                          <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Clinical Signs"] ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSections["Clinical Signs"] && (
                          <div className="p-6 space-y-10">

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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select area</option>
                                  <option value="none">None</option>
                                  <option value="cervical">Cervical</option>
                                  <option value="axillary">Axillary</option>
                                  <option value="inguinal">Inguinal</option>
                                  <option value="supraclavicular">Supraclavicular</option>
                                  <option value="generalized">Generalized</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select location</option>
                                  <option value="none">None</option>
                                  <option value="bilateral_lower">Bilateral lower limbs</option>
                                  <option value="facial">Facial</option>
                                  <option value="sacral">Sacral</option>
                                  <option value="generalized">Generalized (Anasarca)</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
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
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select change</option>
                                  <option value="none">None</option>
                                  <option value="ridges">Ridges</option>
                                  <option value="color">Color changes</option>
                                  <option value="pitting">Pitting</option>
                                  <option value="koilonychia">Koilonychia</option>
                                  <option value="splinter">Splinter hemorrhages</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Skin Hyperpigmentation</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">None</option>
                                  <option value="localized">Localized</option>
                                  <option value="generalized">Generalized</option>
                                  <option value="patchy">Patchy</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054]">Hair Changes</label>
                              <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select status</option>
                                  <option value="none">None</option>
                                  <option value="alopecia">Alopecia</option>
                                  <option value="thinning">Thinning</option>
                                  <option value="brittle">Brittle</option>
                                  <option value="premature_greying">Premature greying</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                          </div>
                        )}
                      </div>

                      {/* Systemic Examination Accordion */}
                      <div className="border border-[#EAECF0] rounded-xl overflow-hidden mb-6">
                        <div 
                          className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                          onClick={() => toggleSection("Systemic Examination")}
                        >
                          <h2 className="text-sm font-bold text-[#101828]">Systemic Examination</h2>
                          <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Systemic Examination"] ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSections["Systemic Examination"] && (
                          <div className="p-6 space-y-6">
                            {/* Cardiovascular System (CVS) Sub-Accordion */}
                            <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                              <div 
                                className="bg-[#F9FAFB] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                                onClick={() => toggleSection("Cardiovascular System (CVS)")}
                              >
                                <h3 className="text-sm font-semibold text-[#101828]">Cardiovascular System (CVS)</h3>
                                <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Cardiovascular System (CVS)"] ? "rotate-180" : ""}`} />
                              </div>
                              {expandedSections["Cardiovascular System (CVS)"] && (
                                <div className="p-6 space-y-6">
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Inspection</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal</option>
                                          <option value="deformity">Chest deformity</option>
                                          <option value="pulsations">Visible pulsations</option>
                                          <option value="scars">Visible scars</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Palpation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal apex beat and no thrills</option>
                                          <option value="shifted_apex">Shifted apex beat</option>
                                          <option value="thrills">Thrills present</option>
                                          <option value="heaves">Heaves present</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Auscultation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal S1, S2, no murmurs</option>
                                          <option value="murmur">Murmur present</option>
                                          <option value="added_sounds">Added sounds (S3, S4)</option>
                                          <option value="clicks">Clicks / Snaps</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Respiratory System (RS) Sub-Accordion */}
                            <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                              <div 
                                className="bg-[#F9FAFB] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                                onClick={() => toggleSection("Respiratory System (RS)")}
                              >
                                <h3 className="text-sm font-semibold text-[#101828]">Respiratory System (RS)</h3>
                                <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Respiratory System (RS)"] ? "rotate-180" : ""}`} />
                              </div>
                              {expandedSections["Respiratory System (RS)"] && (
                                <div className="p-6 space-y-6">
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Inspection</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal shape and movement</option>
                                          <option value="barrel">Barrel chest</option>
                                          <option value="pectus">Pectus excavatum/carinatum</option>
                                          <option value="scars">Visible scars/pulsations</option>
                                          <option value="accessory">Accessory muscle use</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Palpation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal expansion and fremitus</option>
                                          <option value="decreased_expansion">Decreased expansion</option>
                                          <option value="shifted_trachea">Tracheal deviation</option>
                                          <option value="altered_fremitus">Altered tactile fremitus</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Percussion</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="resonant">Resonant</option>
                                          <option value="dull">Dull</option>
                                          <option value="stony_dull">Stony dull</option>
                                          <option value="hyper_resonant">Hyper-resonant</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Auscultation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="vesicular">Vesicular breath sounds</option>
                                          <option value="bronchial">Bronchial breath sounds</option>
                                          <option value="crackles">Crackles / Crepitations</option>
                                          <option value="wheeze">Wheeze</option>
                                          <option value="pleural_rub">Pleural rub</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Per Abdomen (P/A) Sub-Accordion */}
                            <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                              <div 
                                className="bg-[#F9FAFB] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                                onClick={() => toggleSection("Per Abdomen (P/A)")}
                              >
                                <h3 className="text-sm font-semibold text-[#101828]">Per Abdomen (P/A)</h3>
                                <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Per Abdomen (P/A)"] ? "rotate-180" : ""}`} />
                              </div>
                              {expandedSections["Per Abdomen (P/A)"] && (
                                <div className="p-6 space-y-6">
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Inspection</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal shape and skin</option>
                                          <option value="distended">Distended</option>
                                          <option value="scars">Visible scars / Striae</option>
                                          <option value="hernia">Visible hernia / pulsations</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Palpation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="soft">Soft, non-tender</option>
                                          <option value="tender">Tenderness / Guarding</option>
                                          <option value="organomegaly">Organomegaly (Liver/Spleen)</option>
                                          <option value="mass">Palpable mass</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Percussion</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="tympanitic">Tympanitic</option>
                                          <option value="dull">Dull over masses/organs</option>
                                          <option value="shifting_dullness">Shifting dullness (Ascites)</option>
                                          <option value="fluid_thrill">Fluid thrill</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Auscultation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal bowel sounds</option>
                                          <option value="increased">Hyperactive bowel sounds</option>
                                          <option value="absent">Absent bowel sounds</option>
                                          <option value="bruits">Bruits / Rubs</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Central Nervous System (CNS) Sub-Accordion */}
                            <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
                              <div 
                                className="bg-[#F9FAFB] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] cursor-pointer group"
                                onClick={() => toggleSection("Central Nervous System (CNS)")}
                              >
                                <h3 className="text-sm font-semibold text-[#101828]">Central Nervous System (CNS)</h3>
                                <ChevronDown className={`h-5 w-5 text-[#667085] transition-transform duration-200 pointer-events-none ${expandedSections["Central Nervous System (CNS)"] ? "rotate-180" : ""}`} />
                              </div>
                              {expandedSections["Central Nervous System (CNS)"] && (
                                <div className="p-6 space-y-6">
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Inspection</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal observation</option>
                                          <option value="wasting">Muscle wasting / atrophy</option>
                                          <option value="tremors">Involuntary movements / Tremors</option>
                                          <option value="posture">Abnormal posture</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Palpation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal tone and bulk</option>
                                          <option value="hypertonia">Hypertonia (Spasticity/Rigidity)</option>
                                          <option value="hypotonia">Hypotonia (Flaccidity)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Percussion</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="normal">Normal reflexes</option>
                                          <option value="brisk">Brisk / Hyperreflexia</option>
                                          <option value="diminished">Diminished / Hyporeflexia</option>
                                          <option value="absent">Absent</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Auscultation</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select finding</option>
                                          <option value="none">No bruits heard</option>
                                          <option value="cranial_bruit">Cranial bruit present</option>
                                          <option value="carotid_bruit">Carotid bruit present</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Consciousness Level</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select level</option>
                                          <option value="alert">Alert / Fully Conscious</option>
                                          <option value="drowsy">Drowsy / Lethargic</option>
                                          <option value="stuporous">Stuporous</option>
                                          <option value="comatose">Comatose</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Higher Mental Functions</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select status</option>
                                          <option value="intact">Intact</option>
                                          <option value="impaired_orientation">Impaired Orientation</option>
                                          <option value="impaired_memory">Impaired Memory</option>
                                          <option value="aphasia">Speech abnormalities / Aphasia</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Motor System</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select status</option>
                                          <option value="normal">Normal Power (5/5)</option>
                                          <option value="paresis">Paresis / Weakness (1-4/5)</option>
                                          <option value="paralysis">Paralysis (0/5)</option>
                                          <option value="incoordination">Ataxia / Incoordination</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-[#344054]">Sensory System</label>
                                      <div className="relative">
                                        <select className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                          <option value="">Select status</option>
                                          <option value="intact">Intact to all modalities</option>
                                          <option value="hypoesthesia">Hypoesthesia / Numbness</option>
                                          <option value="hyperesthesia">Hyperesthesia / Pain</option>
                                          <option value="paresthesia">Paresthesia / Tingling</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] pointer-events-none" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px] mb-10">
                  {/* Infusion Therapy Card */}
                  <div className="bg-white p-8 rounded-2xl border border-[#EAECF0] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow w-full lg:w-[349px] h-auto lg:h-[432px] flex flex-col">
                    <div className="w-12 h-12 bg-[#00A3FF] rounded-2xl flex items-center justify-center mb-6">
                      <Droplet className="w-6 h-6 text-white" />
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
                  <div className="bg-white p-8 rounded-2xl border border-[#EAECF0] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow w-full lg:w-[349px] h-auto lg:h-[432px] flex flex-col">
                    <div className="w-12 h-12 bg-[#12B76A] rounded-2xl flex items-center justify-center mb-6">
                      <HeartPulse className="w-6 h-6 text-white" />
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
                  <div className="bg-white p-8 rounded-2xl border border-[#EAECF0] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow w-full lg:w-[349px] h-auto lg:h-[432px] flex flex-col">
                    <div className="w-12 h-12 bg-[#F63D68] rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles className="w-6 h-6 text-white" />
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
            ) : activeMainStep === "Test" ? (
              <TestTabContent activeSection={activeTestSection} />
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
      )}
    </div>
  </div>
</div>
  );
}

