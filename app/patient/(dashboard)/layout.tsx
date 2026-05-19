"use client"

import React from "react"
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout"

export default function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  return <UnifiedDashboardLayout>{children}</UnifiedDashboardLayout>
}
