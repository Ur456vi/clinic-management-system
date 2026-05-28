/**
 * Staff (admin / doctor) profile route — uses the shared
 * `<ProfileSettings />` component so the doctor and patient portals
 * stay visually identical and the form logic lives in one place.
 *
 * The component fetches `/api/me` which returns a `kind` discriminator
 * (`"staff"` or `"patient"`) and renders the right fields automatically.
 */
import ProfileSettings from "@/components/profile/ProfileSettings";

export default function AdminProfilePage() {
  return <ProfileSettings />;
}
