"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserMenu, type UserMenuItem } from "@/components/ui/UserMenu"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { canAccessAdminPath, canAccessAreaList, type RbacRole } from "@/lib/rbac"
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserSquare2,
  Building2,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  FlaskConical,
  FileSignature,
  ClipboardCheck,
  Receipt,
  User,
  CalendarCheck2,
  ChevronsLeft,
  ChevronsRight,
  Stethoscope,
  RefreshCw,
  Menu,
  X
} from "lucide-react"

const adminSidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "Patient", icon: Users, href: "/admin/patients" },
  { name: "Appointments", icon: Calendar, href: "/admin/appointments" },
  { name: "Assessments", icon: ClipboardCheck, href: "/admin/assessments" },
  { name: "Staff", icon: UserSquare2, href: "/admin/staff" },
  { name: "Department", icon: Building2, href: "/admin/departments" },
  { name: "Invoices", icon: FileText, href: "/admin/invoices" },
  { name: "Refills", icon: RefreshCw, href: "/admin/refills" },
  { name: "Reports", icon: BarChart3, href: "/admin/reports" },
]

// Admin-only extra: a scoped view of Dr. Yuvraaj Singh's appointments.
const adminOnlySidebarItems = [
  { name: "Dr Yuvraaj Appointment", icon: Stethoscope, href: "/admin/yuvraaj-appointments" },
]

const adminBottomItems = [
  { name: "Profile", icon: User, href: "/admin/profile" },
  { name: "Settings", icon: Settings, href: "/admin/settings" },
  // { name: "Help & Support", icon: HelpCircle, href: "/admin/help" },
]

const patientSidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/patient/dashboard" },
  { name: "Appointments", icon: Calendar, href: "/patient/appointments" },
  { name: "Lab Management", icon: FlaskConical, href: "/patient/lab-management" },
  { name: "Prescriptions", icon: FileSignature, href: "/patient/prescriptions" },
  { name: "Summaries", icon: FileText, href: "/patient/summaries" },
  { name: "Refills", icon: RefreshCw, href: "/patient/refills" },
  { name: "Billing", icon: Receipt, href: "/patient/invoices" },
  // Reports is a Coming Soon placeholder — hidden from the patient nav for now.
  // { name: "Reports", icon: BarChart3, href: "/patient/reports" },
]

const patientBottomItems = [
  { name: "Profile", icon: User, href: "/patient/profile" },
  { name: "Help & Support", icon: HelpCircle, href: "/patient/help" },
]

// Items rendered inside the header avatar dropdown. Kept distinct from the
// sidebar items so we can expose role-appropriate shortcuts (e.g. patients
// land on /patient/profile, staff land on /admin/settings).
const adminMenuItems: UserMenuItem[] = [
  // { label: "My profile", href: "/admin/profile", icon: User },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  // { label: "Help & Support", href: "/admin/help", icon: HelpCircle },
]

const patientMenuItems: UserMenuItem[] = [
  { label: "My profile", href: "/patient/profile", icon: User },
  { label: "My appointments", href: "/patient/appointments", icon: CalendarCheck2 },
  { label: "Help & Support", href: "/patient/help", icon: HelpCircle },
]

export default function UnifiedDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const rawRole = session?.user?.role
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isPatient = rawRole === "PATIENT"
  const role = rawRole as RbacRole | undefined
  const areas = session?.user?.areas
  // Build the full staff nav (Dr Yuvraaj slotted after Appointments), then
  // filter every entry by the user's effective area set (admin-managed,
  // per-staff) — falling back to role defaults when the session carries no
  // area list. While the session is still loading (role undefined) we don't
  // filter, to avoid a flash of an empty sidebar.
  const visibleForStaff = (href: string) =>
    !role
      ? true
      : areas
        ? canAccessAreaList(areas, href)
        : canAccessAdminPath(role, href)
  const adminItems = adminSidebarItems
    .flatMap((item) =>
      item.href === "/admin/appointments" ? [item, ...adminOnlySidebarItems] : [item],
    )
    .filter((item) => visibleForStaff(item.href))
  const sidebarItems = isPatient ? patientSidebarItems : adminItems
  const bottomItems = isPatient
    ? patientBottomItems
    : adminBottomItems.filter((item) => visibleForStaff(item.href))
  const menuItems = isPatient
    ? patientMenuItems
    : adminMenuItems.filter((item) => visibleForStaff(item.href))

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-[#111827] font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0
          ${collapsed ? "md:w-[84px]" : "md:w-[280px]"} w-[280px]
          bg-white dark:bg-[#1F2937] border-r border-[#EAECF0] dark:border-[#374151] flex flex-col transition-all duration-200 ease-in-out
        `}
        style={isPatient ? { boxShadow: "4px 0 24px rgba(107, 43, 38, 0.15)" } : undefined}
      >
        {/* Logo Section */}
        <div
          className={`h-[90px] flex items-center border-b border-[#EAECF0]/50 dark:border-[#374151]/50 gap-2 ${
            collapsed ? "md:px-0 md:justify-center px-4 justify-between" : "px-4 justify-between"
          }`}
        >
          {(!collapsed || mobileMenuOpen) && (
            <Link href="/" className="flex items-center min-w-0" aria-label="Home" onClick={() => setMobileMenuOpen(false)}>
              <span
                className="whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-script)",
                  color: "#C9A227",
                  fontSize: "1.25rem",
                  lineHeight: 1.1,
                  letterSpacing: "0.01em",
                }}
              >
                Dr. Yuvraaj Singh M.D.
              </span>
            </Link>
          )}
          
          {/* Close button for mobile */}
          <button 
            className="md:hidden p-2 text-[#667085] dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex h-10 w-10 items-center justify-center bg-[#F2F4F7] dark:bg-[#111827] text-[#101828] dark:text-[#F9FAFB] hover:bg-gray-100 rounded-full transition-all shadow-sm shrink-0"
          >
            {collapsed ? (
              <ChevronsRight className="h-5 w-5" />
            ) : (
              <ChevronsLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={collapsed && !mobileMenuOpen ? item.name : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                  collapsed && !mobileMenuOpen ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC]"
                    : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#101828] dark:hover:text-[#F9FAFB]"
                }`}
              >
                <div className={`flex items-center gap-3 ${collapsed && !mobileMenuOpen ? "justify-center" : ""}`}>
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#6B2B26] dark:text-[#A5B4FC]" : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828] dark:group-hover:text-[#F9FAFB]"}`} />
                  {(!collapsed || mobileMenuOpen) && <span className="font-medium text-sm">{item.name}</span>}
                </div>
                {isActive && (!collapsed || mobileMenuOpen) && <div className="w-1 h-5 bg-[#6B2B26] rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Items */}
        <div className="px-4 py-6 border-t border-[#EAECF0] dark:border-[#374151] space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={collapsed && !mobileMenuOpen ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  collapsed && !mobileMenuOpen ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC]"
                    : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#101828] dark:hover:text-[#F9FAFB]"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#6B2B26] dark:text-[#A5B4FC]" : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828] dark:group-hover:text-[#F9FAFB]"}`} />
                {(!collapsed || mobileMenuOpen) && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-white dark:bg-[#1F2937] border-b border-[#EAECF0] dark:border-[#374151] px-4 md:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#667085] dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1 border-r border-[#EAECF0] dark:border-[#374151] pr-4 mr-2">
              <ThemeToggle className="p-2 text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 rounded-lg transition-colors" />
              {/* <NotificationBell
                buttonClassName="p-2 text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 rounded-lg transition-colors relative"
                iconClassName="h-5 w-5"
              /> */}
            </div>

            <UserMenu items={menuItems} signOutRedirect="/login" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
