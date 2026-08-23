import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Adamina, Pinyon_Script, Playfair_Display } from "next/font/google";
import "./globals.css";

import AuthProvider from "@/components/providers/AuthProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Public-site brand fonts. Adamina = display serif used for headings.
// Pinyon Script = the cursive logotype that reads "Dr. Yuvraaj Singh M.D."
const adamina = Adamina({
  variable: "--font-adamina",
  subsets: ["latin"],
  weight: ["400"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: ["400"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Institute of Precision Hormonal & Metabolic Health — Dr. Yuvraaj Singh M.D.",
  description:
    "Physician-led precision health for individuals who refuse to normalize decline. An advanced systems-based clinical institute focused on hormonal, metabolic and regenerative health.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${adamina.variable} ${pinyon.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Theme boot script — runs synchronously before React hydrates so the
          right `.dark` class is on <html> before first paint. Without this,
          users see a light-mode flash on every page load when their stored
          preference (or OS preference) is dark. See lib/theme.ts for details.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />

        {/* ============================
            MICROSOFT CLARITY
        ============================ */}

        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){
                (c[a].q=c[a].q||[]).push(arguments)
              };

              t=l.createElement(r);
              t.async=1;
              t.src="https://www.clarity.ms/tag/"+i;

              y=l.getElementsByTagName(r)[0];
              y.parentNode.insertBefore(t,y);

            })(window, document, "clarity", "script", "xx1itxjof8");
          `}
        </Script>

{/* ============================
            GOOGLE ANALYTICS
        ============================ */}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CE112S3XHG"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag(){
              dataLayer.push(arguments);
            }

            gtag('js', new Date());

            gtag('config', 'G-CE112S3XHG');
          `}
        </Script>

<meta name="google-site-verification" content="_iL7moeANlP4XphtSHajbynlu7G0uvarTDORe5W-6Wg" />

      </head>
      <body
        className="min-h-full flex flex-col bg-white dark:bg-[#0F172A] text-[#101828] dark:text-white"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
