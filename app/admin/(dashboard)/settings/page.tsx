"use client";

/**
 * Admin Settings Page — Features a vertical settings-specific sidebar layout
 * with options for Email SMTP (Admin only), Profile Settings, Change Password,
 * and Notifications wrapped inside a clean outline container.
 */
import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  Lock,
  Bell,
  Mail,
  Loader2,
} from "lucide-react";

import ProfileSettings, { type ProfileSettingsTab } from "@/components/profile/ProfileSettings";
import EmailSettingsPage from "./email/page";

type SettingsTab = "email-smtp" | ProfileSettingsTab;

function SettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";

  // Determine active tab from URL query param, defaulting to email-smtp for admins, or profile for others.
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const defaultTab = isAdmin ? "email-smtp" : "profile";
  const activeTab: SettingsTab =
    tabParam && ["email-smtp", "profile", "password", "notifications"].includes(tabParam)
      ? tabParam
      : defaultTab;

  const handleTabChange = (newTab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Loading settings…</p>
      </div>
    );
  }

  // Redirect non-admins if they try to access email-smtp directly via URL param
  if (activeTab === "email-smtp" && !isAdmin) {
    handleTabChange("profile");
    return null;
  }

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8 py-2">
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-4 flex flex-col gap-1.5">
          <h2 className="text-xs font-semibold text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider px-2 mb-2">
            Settings Menu
          </h2>

          {/* Email SMTP Tab (Admin only) - At the top */}
          {isAdmin && (
            <button
              onClick={() => handleTabChange("email-smtp")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full transition-all group font-medium text-sm ${
                activeTab === "email-smtp"
                  ? "bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC]"
                  : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#374151]/50 hover:text-[#101828] dark:hover:text-[#F9FAFB]"
              }`}
            >
              <Mail
                className={`h-5 w-5 shrink-0 ${
                  activeTab === "email-smtp"
                    ? "text-[#6B2B26] dark:text-[#A5B4FC]"
                    : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828] dark:group-hover:text-[#F9FAFB]"
                }`}
              />
              <span>Email SMTP</span>
            </button>
          )}

          {/* Profile Settings Tab */}
          <button
            onClick={() => handleTabChange("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full transition-all group font-medium text-sm ${
              activeTab === "profile"
                ? "bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC]"
                : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#374151]/50 hover:text-[#101828] dark:hover:text-[#F9FAFB]"
            }`}
          >
            <User
              className={`h-5 w-5 shrink-0 ${
                activeTab === "profile"
                  ? "text-[#6B2B26] dark:text-[#A5B4FC]"
                  : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828] dark:group-hover:text-[#F9FAFB]"
              }`}
            />
            <span>Profile Settings</span>
          </button>

          {/* Change Password Tab */}
          <button
            onClick={() => handleTabChange("password")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full transition-all group font-medium text-sm ${
              activeTab === "password"
                ? "bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC]"
                : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#374151]/50 hover:text-[#101828] dark:hover:text-[#F9FAFB]"
            }`}
          >
            <Lock
              className={`h-5 w-5 shrink-0 ${
                activeTab === "password"
                  ? "text-[#6B2B26] dark:text-[#A5B4FC]"
                  : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828] dark:group-hover:text-[#F9FAFB]"
              }`}
            />
            <span>Change Password</span>
          </button>

          {/* Notifications Tab */}
          <button
            onClick={() => handleTabChange("notifications")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full transition-all group font-medium text-sm ${
              activeTab === "notifications"
                ? "bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC]"
                : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#374151]/50 hover:text-[#101828] dark:hover:text-[#F9FAFB]"
            }`}
          >
            <Bell
              className={`h-5 w-5 shrink-0 ${
                activeTab === "notifications"
                  ? "text-[#6B2B26] dark:text-[#A5B4FC]"
                  : "text-[#667085] dark:text-[#94A3B8] group-hover:text-[#101828] dark:group-hover:text-[#F9FAFB]"
              }`}
            />
            <span>Notifications</span>
          </button>
        </div>
      </aside>

      {/* Main settings content */}
      <div className="flex-1 min-w-0">
        {activeTab === "email-smtp" ? (
          <EmailSettingsPage />
        ) : activeTab ? (
          <ProfileSettings
            activeTab={activeTab}
            showTabsHeader={false}
            showHeader={false}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
          <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-3" />
          <p className="text-sm font-medium">Loading settings…</p>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
