import type { Metadata } from "next";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

export const metadata: Metadata = {
    title: {
      default: "Dr. Yuvraaj Singh, M.D. | Institute of Precision Metabolic & Hormonal Health",
          template: "%s | Dr. Yuvraaj Singh, M.D.",
    },
    description:
          "Physician-led precision health for individuals who refuse to normalize decline. Advanced systems-based clinical institute focused on hormonal, metabolic and regenerative health.",
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
          <div className="min-h-screen bg-[#FAF8F3] font-serif">
                <PublicNavbar />
                <main>{children}</main>main>
                <PublicFooter />
          </div>div>
        );
}</div>
