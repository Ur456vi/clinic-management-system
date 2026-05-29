/**
 * Admin Settings — the shared <ProfileSettings /> form plus links to
 * admin-only configuration sections (e.g. Email/SMTP).
 */
import Link from "next/link";
import { Mail, ChevronRight } from "lucide-react";

import ProfileSettings from "@/components/profile/ProfileSettings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/settings/email"
        className="flex items-center justify-between gap-3 max-w-[720px] bg-white border border-[#EAECF0] rounded-xl shadow-sm p-5 hover:border-[#2E37A4] hover:bg-[#F4F5FF] transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-lg bg-[#F4F5FF] flex items-center justify-center">
            <Mail className="h-5 w-5 text-[#2E37A4]" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#101828]">Email (SMTP)</span>
            <span className="block text-xs text-[#667085]">
              Configure Brevo SMTP credentials for transactional email
            </span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-[#98A2B3]" />
      </Link>

      <ProfileSettings />
    </div>
  );
}
