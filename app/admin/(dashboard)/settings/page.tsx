/**
 * Admin Settings — delegates to the shared <ProfileSettings />
 * component (the same one the patient portal uses at /patient/profile
 * and the doctor portal uses at /admin/profile).
 *
 * Why this is now a 5-line file: the previous Settings page shipped a
 * static layout with every input `disabled` and `opacity-60 +
 * pointer-events-none`. The audit flagged that the page never actually
 * saved anything. Rather than build a separate-but-near-identical form,
 * we reuse the real /api/me-backed component so the sidebar
 * "Settings" and "Profile" entries land on the same fully-functional
 * page. When we add tabs for theme/notifications/security those will go
 * inside ProfileSettings itself so both routes get them at once.
 */
import ProfileSettings from "@/components/profile/ProfileSettings";

export default function SettingsPage() {
  return <ProfileSettings />;
}
