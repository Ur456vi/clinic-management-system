/**
 * Site root — the public marketing home page.
 *
 * The actual UI lives in `app/(public)/_home-content.tsx` so the file
 * structure stays grouped under `(public)`. Because the route group's
 * `layout.tsx` only applies to routes physically inside `app/(public)/`,
 * this entry point wraps the Header/Footer manually to match.
 *
 * Login moved to `/login` (see app/login/page.tsx). Middleware redirects
 * authenticated users on a public path to their dashboard.
 */
import type { Metadata } from "next";

import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import HomeContent from "@/app/(public)/_home-content";

export const metadata: Metadata = {
  title:
    "Institute of Precision Hormonal & Metabolic Health — Dr. Yuvraaj Singh MD.",
  description:
    "Physician-led precision health for individuals who refuse to normalize decline. Advanced systems-based hormonal, metabolic, and regenerative medicine.",
};

export default function RootPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--brand-cream)", color: "var(--brand-ink)" }}
    >
      <Header />
      <main className="flex-1">
        <HomeContent />
      </main>
      <Footer />
    </div>
  );
}
