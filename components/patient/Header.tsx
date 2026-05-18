"use client";
import { useState } from "react";
import { Search, Moon, Bell } from "lucide-react";

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

      <div className="flex items-center gap-6">
        {/* Icons */}
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] transition-colors text-[#6C7688]">
            <Moon className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] transition-colors text-[#6C7688] relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer group pl-4 border-l border-[#EAECF0]">
          <div className="flex flex-col items-end">
            <span className="text-sm text-[#141414] font-bold leading-tight">Amit Singh</span>
            <span className="text-xs text-[#2E37A4] font-bold">Patient</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F2F4F7] overflow-hidden relative shadow-sm border-2 border-white group-hover:border-[#2E37A4] transition-all">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Amit" 
              alt="Amit Singh" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
