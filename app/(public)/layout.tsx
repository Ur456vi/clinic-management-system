/**
 * Public-site layout. Anything routed under `app/(public)/` gets the
 * cream-and-burgundy Header + Footer wrapper. The route group `(public)`
 * does NOT add a URL segment so `/about`, `/services/...`, and `/contact`
 * all stay at their natural paths.
 */
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--brand-cream)", color: "var(--brand-ink)" }}
    >
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
