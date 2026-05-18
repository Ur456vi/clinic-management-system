"use client";
import { useState } from "react";
import { Search, Moon, Bell, User, CalendarCheck2, HelpCircle } from "lucide-react";

import { UserMenu } from "@/components/ui/UserMenu";

const patientMenuItems = [
  { label: "My profile", href: "/patient/profile", icon: User },
  { label: "My appointments", href: "/patient/appointments", icon: CalendarCheck2 },
  { label: "Help & Support", href: "/patient/help", icon: HelpCircle },
];

export default function Header() {
  const [search, setSearch] = useState("");

  return (
    <header className="h-16 bg-white border-b border-[#EAECF0] flex items-center justify-between px-8 z-10 gap-4 flex-shrink-0">
      {/* Search Bar */}
      <div className="flex items-center gap-2 w-96 h-10 border border-[#EAECF0] rounded-lg px-4 bg-[#F9FAFB] focus-within:bg-white focus-within:border-[#2E37A4] focus-within:ring-2 focus-within:ring-[#EEF0FF] transition-all">
        <Search className="w-4 h-4 text-[#6C7688]" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none outline-none text-sm text-[#141414] placeholder-[#6C7688] bg-transparent w-full font-medium"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Icons */}
        <div className="flex gap-2 border-r border-[#EAECF0] pr-4">
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] transition-colors text-[#6C7688]"
            aria-label="Toggle theme"
          >
            <Moon className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] transition-colors text-[#6C7688] relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </button>
        </div>

        {/* User Menu */}
        <UserMenu items={patientMenuItems} />
      </div>
    </header>
  );
}
