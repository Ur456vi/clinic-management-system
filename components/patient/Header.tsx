"use client";
import { useState } from "react";
import { Search, User, CalendarCheck2, HelpCircle } from "lucide-react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/ui/UserMenu";
import { NotificationBell } from "@/components/ui/NotificationBell";

const patientMenuItems = [
  { label: "My profile", href: "/patient/profile", icon: User },
  { label: "My appointments", href: "/patient/appointments", icon: CalendarCheck2 },
  { label: "Help & Support", href: "/patient/help", icon: HelpCircle },
];

export default function Header() {
  const [search, setSearch] = useState("");

  return (
    <header className="h-16 bg-white dark:bg-[#1F2937] border-b border-[#EAECF0] dark:border-[#374151] flex items-center justify-between px-8 z-10 gap-4 flex-shrink-0">
      {/* Search Bar */}
      <div className="flex items-center gap-2 w-96 h-10 border border-[#EAECF0] dark:border-[#374151] rounded-lg px-4 bg-[#F9FAFB] dark:bg-[#111827] focus-within:bg-white focus-within:border-[#6B2B26] focus-within:ring-2 focus-within:ring-[#EEF0FF] transition-all">
        <Search className="w-4 h-4 text-[#6C7688] dark:text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none outline-none text-sm text-[#141414] dark:text-[#F9FAFB] placeholder-[#6C7688] dark:placeholder-[#94A3B8] bg-transparent w-full font-medium"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Icons */}
        <div className="flex gap-2 border-r border-[#EAECF0] dark:border-[#374151] pr-4">
          <ThemeToggle />
          <NotificationBell
            buttonClassName="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] transition-colors text-[#6C7688] dark:text-[#94A3B8] relative"
            iconClassName="w-5 h-5"
          />
        </div>

        {/* User Menu */}
        <UserMenu items={patientMenuItems} />
      </div>
    </header>
  );
}
