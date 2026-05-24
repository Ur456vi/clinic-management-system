"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  CalendarCheck2,
  FlaskConical,
  FileCheck,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
} from "lucide-react"

const navItems = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "Appointments", icon: CalendarCheck2 },
  { href: "/patient/lab-management", label: "Lab Management", icon: FlaskConical },
  { href: "/patient/prescriptions", label: "Prescriptions", icon: FileCheck },
  { href: "/patient/reports", label: "Reports", icon: BarChart3 },
]

const bottomItems = [
  { href: "/patient/settings", label: "Settings", icon: Settings },
  { href: "/patient/help", label: "Help & Support", icon: HelpCircle },
]

import Header from "@/components/patient/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="flex flex-col w-[280px] h-full bg-white border-r border-[#EAECF0]">
        {/* Logo area */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#EAECF0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2E37A4] rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-xl font-bold text-[#141414]">Vyara</span>
          </div>
          <button className="flex items-center justify-center w-8 h-8 hover:bg-[#F9FAFB] rounded-lg transition-colors">
            <ChevronLeft size={18} className="text-[#6C7688]" />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col justify-between flex-1 py-6 px-4">
          <div className="flex flex-col gap-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-[#EEF0FF] text-[#2E37A4] font-bold shadow-sm"
                      : "text-[#6C7688] hover:bg-[#F9FAFB] hover:text-[#141414] font-medium"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-[#2E37A4]" : "text-[#6C7688]"} />
                  <span className="text-sm">{label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col gap-1.5 pt-6 border-t border-[#EAECF0]">
            {bottomItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-[#EEF0FF] text-[#2E37A4] font-bold"
                      : "text-[#6C7688] hover:bg-[#F9FAFB] hover:text-[#141414] font-medium"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-[#2E37A4]" : "text-[#6C7688]"} />
                  <span className="text-sm">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}