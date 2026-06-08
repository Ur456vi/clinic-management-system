"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserMenu, type UserMenuItem } from "@/components/ui/UserMenu"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { NotificationBell } from "@/components/ui/NotificationBell"
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
  User,
  CalendarCheck2,
  ChevronsLeft,
  ChevronsRight,
  Stethoscope,
} from "lucide-react"

const adminSidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "Patient", icon: Users, href: "/admin/patients" },
  { name: "Appointments", icon: Calendar, href: "/admin/appointments" },
  { name: "Assessments", icon: ClipboardCheck, href: "/admin/assessments" },
  { name: "Staff", icon: UserSquare2, href: "/admin/staff" },
  { name: "Department", icon: Building2, href: "/admin/departments" },
  { name: "Invoices", icon: FileText, href: "/admin/invoices" },
  { name: "Reports", icon: BarChart3, href: "/admin/reports" },
]

// Admin-only extra: a scoped view of Dr. Yuvraaj Singh's appointments.
const adminOnlySidebarItems = [
  { name: "Dr Yuvraaj Appointment", icon: Stethoscope, href: "/admin/yuvraaj-appointments" },
]

const adminBottomItems = [
  { name: "Profile", icon: User, href: "/admin/profile" },
  { name: "Settings", icon: Settings, href: "/admin/settings" },
  { name: "Help & Support", icon: HelpCircle, href: "/admin/help" },
]

const patientSidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/patient/dashboard" },
  { name: "Appointments", icon: Calendar, href: "/patient/appointments" },
  { name: "Lab Management", icon: FlaskConical, href: "/patient/lab-management" },
  { name: "Prescriptions", icon: FileSignature, href: "/patient/prescriptions" },
  { name: "Reports", icon: BarChart3, href: "/patient/reports" },
]

const patientBottomItems = [
  { name: "Profile", icon: User, href: "/patient/profile" },
  { name: "Help & Support", icon: HelpCircle, href: "/patient/help" },
]

// Items rendered inside the header avatar dropdown. Kept distinct from the
// sidebar items so we can expose role-appropriate shortcuts (e.g. patients
// land on /patient/profile, staff land on /admin/settings).
const adminMenuItems: UserMenuItem[] = [
  { label: "My profile", href: "/admin/profile", icon: User },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Help & Support", href: "/admin/help", icon: HelpCircle },
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

  const isPatient = rawRole === "PATIENT"
  const isAdmin = rawRole === "ADMIN"
  // Admins get the "Dr Yuvraaj Appointment" entry slotted in right after
  // "Appointments"; everyone else sees the base list unchanged.
  const adminItems = isAdmin
    ? adminSidebarItems.flatMap((item) =>
        item.href === "/admin/appointments"
          ? [item, ...adminOnlySidebarItems]
          : [item],
      )
    : adminSidebarItems
  const sidebarItems = isPatient ? patientSidebarItems : adminItems
  const bottomItems = isPatient ? patientBottomItems : adminBottomItems
  const menuItems = isPatient ? patientMenuItems : adminMenuItems

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-[#111827] font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-[84px]" : "w-[280px]"
        } bg-white dark:bg-[#1F2937] border-r border-[#EAECF0] dark:border-[#374151] flex flex-col transition-[width] duration-200 ease-in-out`}
      >
        {/* Logo Section */}
        <div
          className={`h-[90px] flex items-center border-b border-[#EAECF0]/50 dark:border-[#374151]/50 gap-2 ${
            collapsed ? "px-0 justify-center" : "px-4 justify-between"
          }`}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center min-w-0" aria-label="Home">
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
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-10 w-10 flex items-center justify-center bg-[#F2F4F7] dark:bg-[#111827] text-[#101828] dark:text-[#F9FAFB] hover:bg-gray-100 rounded-full transition-all shadow-sm shrink-0"
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
                title={collapsed ? item.name : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-[#F4F5FF] dark:bg-[#312E81] text-[#2E37A4] dark:text-[#A5B4FC]"
                    : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 hover:text-[#101828]"
                }`}
              >
                <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#2E37A4] dark:text-[#A5B4FC]" : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828]"}`} />
                  {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
                </div>
                {isActive && !collapsed && <div className="w-1 h-5 bg-[#2E37A4] rounded-full" />}
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
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-[#F4F5FF] dark:bg-[#312E81] text-[#2E37A4] dark:text-[#A5B4FC]"
                    : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 hover:text-[#101828]"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#2E37A4] dark:text-[#A5B4FC]" : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828]"}`} />
                {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header — the global search will be wired up when the
            search API lands; until then it would be misleading, so the
            slot is intentionally empty. The Moon and Bell buttons used
            to be decorative; they're now backed by ThemeToggle and
            NotificationBell, which have real handlers + a real feed. */}
        <header className="h-[72px] bg-white dark:bg-[#1F2937] border-b border-[#EAECF0] dark:border-[#374151] px-8 flex items-center justify-end flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border-r border-[#EAECF0] dark:border-[#374151] pr-4 mr-2">
              <ThemeToggle className="p-2 text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 rounded-lg transition-colors" />
              <NotificationBell
                buttonClassName="p-2 text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 rounded-lg transition-colors relative"
                iconClassName="h-5 w-5"
              />
            </div>

            <UserMenu items={menuItems} signOutRedirect="/login" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
