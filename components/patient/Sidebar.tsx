"use client";
import { useRouter, usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Dashboard",
    href: "/patient/dashboard",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    label: "Appointments",
    href: "/patient/appointments",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 14l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Lab Management",
    href: "/patient/lab-management",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path d="M9 3h6M10 3v6l-4 8a2 2 0 001.8 3h8.4A2 2 0 0018 17l-4-8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Prescriptions",
    href: "/patient/prescriptions",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 3v5h5M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/patient/reports",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 17v-4M12 17v-7M16 17v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const bottomMenu = [
  {
    label: "Settings",
    href: "/patient/settings",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    label: "Help & Support",
    href: "/patient/help",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="w-[313px] min-h-screen bg-white flex flex-col border-r border-[#C2C8CC] fixed top-0 left-0 z-[100]">
      <div className="p-5 border-b border-[#C2C8CC] flex justify-between items-center h-16">
        <img src="/dr-yuvraaj-logo.png" alt="IPHMH" width={48} height={48} className="object-contain cursor-pointer" onClick={() => router.push("/patient/dashboard")} />
        <div className="w-10 h-10 bg-[#F5F6F8] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      
      <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`flex flex-row justify-between items-center py-3 pl-5 pr-0 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive ? "bg-[#F5F6F8] text-[#6B2B26]" : "text-[#141414] hover:bg-[#F9FAFB]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={isActive ? "text-[#6B2B26]" : "text-[#141414]"}>
                    {item.icon}
                  </div>
                  <span className={`text-base ${isActive ? "font-semibold" : "font-normal"}`}>
                    {item.label}
                  </span>
                </div>
                {isActive && <div className="w-1 h-6.5 bg-[#6B2B26] rounded-full" />}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          {bottomMenu.map((item) => (
            <div 
              key={item.label} 
              onClick={() => router.push(item.href)} 
              className="flex items-center gap-2 py-3 pl-5 rounded-lg cursor-pointer hover:bg-[#F9FAFB] transition-colors text-[#141414]"
            >
              {item.icon}
              <span className="text-base font-normal">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
