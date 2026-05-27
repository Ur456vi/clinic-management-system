import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Adamina, Pinyon_Script, Playfair_Display } from "next/font/google";
import "./globals.css";

import AuthProvider from "@/components/providers/AuthProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

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
  title: "Institute of Precision Metabolic & Hormonal Health — Dr. Yuvraaj Singh M.D.",
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
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-[#0F172A] text-[#101828] dark:text-white">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
