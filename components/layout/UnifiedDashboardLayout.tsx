"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserMenu, type UserMenuItem } from "@/components/ui/UserMenu"
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
  Search,
  Moon,
  Bell,
  CalendarCheck2,
  ChevronsLeft,
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

  const isPatient = rawRole === "PATIENT"
  const sidebarItems = isPatient ? patientSidebarItems : adminSidebarItems
  const bottomItems = isPatient ? patientBottomItems : adminBottomItems
  const menuItems = isPatient ? patientMenuItems : adminMenuItems

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#EAECF0] flex flex-col">
        {/* Logo Section */}
        <div className="h-[90px] px-6 flex items-center justify-between border-b border-[#EAECF0]/50">
          <div className="flex items-center -ml-2">
            <Image
              src="/images/logos/vyara.png"
              alt="Vyara Logo"
              width={140}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </div>
          <button className="h-10 w-10 flex items-center justify-center bg-[#F2F4F7] text-[#101828] hover:bg-gray-100 rounded-full transition-all shadow-sm">
            <ChevronsLeft className="h-5 w-5" />
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                  isActive 
                    ? "bg-[#F4F5FF] text-[#2E37A4]" 
                    : "text-[#667085] hover:bg-gray-50 hover:text-[#101828]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive ? "text-[#2E37A4]" : "text-[#667085] group-hover:text-[#101828]"}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                {isActive && <div className="w-1 h-5 bg-[#2E37A4] rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Items */}
        <div className="px-4 py-6 border-t border-[#EAECF0] space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  isActive 
                    ? "bg-[#F4F5FF] text-[#2E37A4]" 
                    : "text-[#667085] hover:bg-gray-50 hover:text-[#101828]"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-[#2E37A4]" : "text-[#667085] group-hover:text-[#101828]"}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-[#EAECF0] px-8 flex items-center justify-between flex-shrink-0">
          <div className="relative w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#667085]" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-11 pr-3 py-2 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border-r border-[#EAECF0] pr-4 mr-2">
              <button className="p-2 text-[#667085] hover:bg-gray-50 rounded-lg transition-colors">
                <Moon className="h-5 w-5" />
              </button>
              <button className="p-2 text-[#667085] hover:bg-gray-50 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
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
