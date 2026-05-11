"use client"

import React from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle, 
  ChevronDown,
  Search,
  Clock,
  MapPin,
  Video
} from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  { id: "patient", name: "Patient Information", icon: User },
  { id: "details", name: "Appointment Details", icon: Calendar },
  { id: "additional", name: "Additional Information", icon: FileText },
  { id: "review", name: "Review", icon: CheckCircle },
]

export default function NewAppointmentPage() {
  const [activeStep, setActiveStep] = React.useState(0)

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#F2F4FF] flex items-center justify-center border border-[#E0E2FF]">
                <User className="h-5 w-5 text-[#2E37A4]" />
              </div>
              <h2 className="text-xl font-bold text-[#101828]">Patient Information</h2>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[#667085]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search and select a patient..."
                    className="block w-full pl-11 pr-10 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                  />
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#667085] pointer-events-none" />
                </div>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[#EAECF0]"></div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#101828] mb-6">
                  Manual Entry <span className="text-[#667085] font-normal">(or)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#344054]">
                      Patient Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter patient's email address"
                      className="w-full px-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#344054]">
                      Patient Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter patient's phone number"
                      className="w-full px-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#ECFDF3] flex items-center justify-center border border-[#ABEFC6]">
                <Calendar className="h-5 w-5 text-[#027A48]" />
              </div>
              <h2 className="text-xl font-bold text-[#101828]">Appointment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Doctor Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[#667085]" />
                  </div>
                  <select className="w-full h-11 pl-10 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer">
                    <option value="">Select a doctor</option>
                    <option value="1">Dr. Amit Singh</option>
                    <option value="2">Dr. Sumit Mittal</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Appointment Type
                </label>
                <div className="relative">
                  <select className="w-full h-11 px-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer">
                    <option value="consultation">Consultation</option>
                    <option value="surgery">Surgery</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Appointment Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd-mm-yyyy"
                    className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                  />
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Appointment Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="--:--"
                    className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                  />
                  <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Status
                </label>
                <div className="relative">
                  <select className="w-full h-11 px-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer">
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Room 101, Building A"
                  className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#F9F5FF] flex items-center justify-center border border-[#E9D7FE]">
                <FileText className="h-5 w-5 text-[#6941C6]" />
              </div>
              <h2 className="text-xl font-bold text-[#101828]">Additional Information</h2>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe the reason for the appointment"
                  rows={4}
                  className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054]">
                  Notes
                </label>
                <textarea
                  placeholder="Add any additional notes or comments"
                  rows={4}
                  className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                />
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[#EAECF0]"></div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-[#2E37A4]" />
                    <span className="text-base font-semibold text-[#101828]">Video Consultation</span>
                  </div>
                  <p className="text-sm text-[#667085]">
                    Enable this to create a video consultation session that the patient can join remotely.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#344054]">Include Video Call</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E37A4]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#ECFDF3] flex items-center justify-center border border-[#ABEFC6]">
                <CheckCircle className="h-5 w-5 text-[#027A48]" />
              </div>
              <h2 className="text-xl font-bold text-[#101828]">Review</h2>
            </div>

            <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#344054]">Patient Information</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Name:</span>
                      <span className="text-[#101828]">Not provided</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Email:</span>
                      <span className="text-[#101828]">Not provided</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Phone:</span>
                      <span className="text-[#101828]">Not provided</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#344054]">Appointment Details</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Doctor:</span>
                      <span className="text-[#101828]">Not provided</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Type:</span>
                      <span className="text-[#101828]">Consultation</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Date:</span>
                      <span className="text-[#101828]">Not selected</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Time:</span>
                      <span className="text-[#101828]">Not selected</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-[#667085] min-w-[60px]">Status:</span>
                      <span className="text-[#101828]">Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        // ... (Default remains)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">New Appointment</h1>
          <p className="text-sm text-[#667085] mt-1">Create a new appointment for a patient</p>
        </div>
        <div className="flex items-center gap-3">
          {activeStep > 0 && (
            <Button 
              variant="outline" 
              className="px-6 h-11 border-[#2E37A4] text-[#2E37A4] font-semibold hover:bg-[#F4F5FF] rounded-lg"
              onClick={() => setActiveStep(activeStep - 1)}
            >
              Previous
            </Button>
          )}
          <Button variant="outline" className="px-6 h-11 border-[#D0D5DD] text-[#344054] font-semibold hover:bg-gray-50 rounded-lg">
            Cancel
          </Button>
          <Button 
            className="px-6 h-11 bg-[#2E37A4] hover:bg-[#1d246b] text-white font-semibold rounded-lg"
            onClick={() => activeStep < steps.length - 1 && setActiveStep(activeStep + 1)}
          >
            {activeStep === steps.length - 1 ? "Book Appointment" : "Next"}
          </Button>
        </div>
      </div>

      {/* Back Link */}
      <div>
        <button 
          onClick={() => activeStep > 0 ? setActiveStep(activeStep - 1) : window.history.back()}
          className="inline-flex items-center gap-2 text-[#667085] hover:text-[#101828] text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Stepper */}
      <div className="border-b border-[#EAECF0]">
        <div className="flex gap-8 overflow-x-auto no-scrollbar pb-px">
          {steps.map((step, index) => {
            const isActive = activeStep === index
            const isCompleted = activeStep > index
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`flex items-center gap-2 pb-4 px-1 relative transition-all whitespace-nowrap ${
                  isActive 
                    ? "text-[#2E37A4]" 
                    : "text-[#667085] hover:text-[#101828]"
                }`}
              >
                <step.icon className={`h-5 w-5 ${isActive ? "text-[#2E37A4]" : "text-[#667085]"}`} />
                <span className={`text-sm font-medium ${isActive ? "font-semibold" : ""}`}>
                  {step.name}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E37A4] rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 max-w-[1000px]">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}
