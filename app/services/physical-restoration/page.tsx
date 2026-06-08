/**
 * Bespoke landing page for Physical Restoration Programs.
 * Implements a luxury-clinical organic aesthetic: warm cream, dark red accents,
 * thin line-art custom icons, and high-fidelity placeholders.
 * Mounted at `/services/physical-restoration` outside route groups to suppress standard headers
 * while reusing global shared Header and Footer components.
 */
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";

// Custom SVGs & Line-Art Icons for Clinical Elegance

function LotusIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21C12 21 14.5 16 14.5 12C14.5 7.5 12 3 12 3C12 3 9.5 7.5 9.5 12C9.5 16 12 21 12 21Z" />
      <path d="M12 21C12 21 7.5 18 7.5 12.5C7.5 7.5 12 3 12 3" />
      <path d="M12 21C12 21 16.5 18 16.5 12.5C16.5 7.5 12 3 12 3" />
      <path d="M12 21C12 21 4.5 16.5 4.5 13.5C4.5 9 12 3 12 3" />
      <path d="M12 21C12 21 19.5 16.5 19.5 13.5C19.5 9 12 3 12 3" />
    </svg>
  );
}

function DumbbellIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="9" width="3" height="6" rx="1" />
      <rect x="19" y="9" width="3" height="6" rx="1" />
      <rect x="5" y="6" width="2" height="12" rx="0.5" />
      <rect x="17" y="6" width="2" height="12" rx="0.5" />
      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2" />
    </svg>
  );
}

function JointIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3" />
      <path d="M12 10v6" />
      <path d="M7 13h10" />
      <path d="M9 16c1.5 2 4.5 2 6 0" />
      <path d="M9 10C10.5 8 13.5 8 15 10" />
    </svg>
  );
}

function LeafIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 15 6 15 10C15 15 12 22 12 22C12 22 9 15 9 10C9 6 12 2 12 2Z" />
      <path d="M12 7c-1.5 2-1.5 4 0 6" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

function ClockIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SpineIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="10" y="3" width="4" height="2" rx="0.5" />
      <rect x="9" y="6" width="6" height="2" rx="0.5" />
      <rect x="8" y="9" width="8" height="2" rx="0.5" />
      <rect x="9" y="12" width="6" height="2" rx="0.5" />
      <rect x="8" y="15" width="8" height="2" rx="0.5" />
      <rect x="10" y="18" width="4" height="2" rx="0.5" />
      <line x1="12" y1="5" x2="12" y2="18" strokeDasharray="1 1" />
    </svg>
  );
}

function HeartIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 5C10 -1 3 0 3 7C3 13 12 19 12 19C12 19 21 13 21 7C21 0 14 -1 12 5Z" />
    </svg>
  );
}

function RecoveryWaveIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M3 12H7L9 5L12 19L14 9L16 13L18 12H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipboardIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="6" y="5" width="12" height="15" rx="1" />
      <path d="M9 5a3 3 0 0 1 6 0" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function CheckOutlineIcon({ className = "w-4.5 h-4.5 text-[#4A7C40] shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" strokeWidth="1" />
      <path d="M8 12.5L11 15.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedXIcon({ className = "w-5 h-5 text-[#8B1A1A] shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" strokeWidth="1" />
      <path d="M8 8L16 16M16 8L8 16" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CouchIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" />
      <path d="M5 14V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5" />
      <path d="M3 11h3" />
      <path d="M18 11h3" />
      <path d="M8 14v4" />
      <path d="M16 14v4" />
    </svg>
  );
}

function MeditationIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5v8" />
      <path d="M5 12c1-1.5 3-2.5 7-2.5s6 1 7 2.5" />
      <path d="M3 20c1.5-2.5 4.5-4 9-4s7.5 1.5 9 4" />
      <path d="M7 16c-1 1-1.5 2.5-1.5 3.5" />
      <path d="M17 16c1 1 1.5 2.5 1.5 3.5" />
    </svg>
  );
}

function BicepIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 15a4.5 4.5 0 0 0 9 0c0-1.5-1-2.5-2.5-3.5" />
      <path d="M13 11.5V6a2 2 0 0 0-4 0v5.5" />
      <path d="M9 8h4" />
      <path d="M6.5 15v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function MovementVariabilityIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.57.57" />
    </svg>
  );
}

function RecoveryPhysiologyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12H7L9 5L12 19L14 9L16 13L18 12H21" />
    </svg>
  );
}

function InflammationIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 12h18M18.36 5.64L5.64 18.36M18.36 18.36L5.64 5.64" />
    </svg>
  );
}

function MetabolicIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5L12 21l7.5-4.5v-9L12 3 4.5 7.5v9z" />
      <path d="M12 3v18M4.5 7.5L19.5 16.5M4.5 16.5L19.5 7.5" />
    </svg>
  );
}

function HormonalDeclineIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M10 3v14a2 2 0 0 0 4 0V3M14 11h-4" />
      <path d="M7 21h10" />
    </svg>
  );
}

function BrainIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5c-2.5 0-4.5 2-4.5 4.5c0 1 .4 1.8.9 2.5a4 4 0 0 0-1.9 3.5c0 2.2 1.8 4 4 4" />
      <path d="M12 4.5c2.5 0 4.5 2 4.5 4.5c0 1-.4 1.8-.9 2.5a4 4 0 0 1 1.9 3.5c0 2.2-1.8 4-4 4" />
      <line x1="12" y1="4.5" x2="12" y2="19.5" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

function AgingShieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 16c0-2.5 2-3.5 4-3.5s4 1 4 3.5" />
    </svg>
  );
}

function RunnerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="1.5" />
      <path d="M13 9.5L10 12.5L7.5 11" />
      <path d="M12 7.5L13 9.5L15.5 14L18 13.5" />
      <path d="M10 12.5L8.5 16.5L6 18" />
      <path d="M10 12.5L12 16.5L15 18" />
    </svg>
  );
}

function LoopArrowsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6" />
      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l.57.57" />
    </svg>
  );
}

function MobilityJointIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M7.5 16.5 C10 13 14 11 16.5 7.5" />
      <path d="M6 16v-6c0-2.2 1.8-4 4-4h6" strokeDasharray="2 2" />
    </svg>
  );
}

function BalanceIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M5 7l7-2 7 2" />
      <path d="M3 13h18" />
      <circle cx="6" cy="16" r="1.5" />
      <circle cx="18" cy="16" r="1.5" />
    </svg>
  );
}

function BoneIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.5 2.5 0 0 0-4.5 1.5l-5 5A2.5 2.5 0 0 0 3 14c0 1.4 1.1 2.5 2.5 2.5a2.5 2.5 0 0 0 1.5-4.5l5-5A2.5 2.5 0 0 0 17 3z" />
      <path d="M19.5 7.5A2.5 2.5 0 0 0 21 10c0 1.4-1.1 2.5-2.5 2.5a2.5 2.5 0 0 0-1.5-4.5l-5 5a2.5 2.5 0 0 0 4.5 4.5z" />
    </svg>
  );
}

function FireIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 11l2 2 4-4" />
    </svg>
  );
}

function EcgLine({ className = "", color = "#4A5240" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 480 60" width="100%" height="60" aria-hidden="true">
      <path
        d="M0 30 L80 30 L100 30 L110 10 L130 50 L150 5 L165 30 L260 30 L275 18 L290 42 L305 30 L480 30"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PhysicalRestorationPage() {
  return (
    <div
      className="flex min-h-screen flex-col relative"
      style={{
        background: "#F5F0E8", // Cream/off-white background
        color: "#1A1A1A", // Dark charcoal primary text
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Adamina&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Scope CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --color-bg-primary: #F5F0E8;
          --color-bg-section-dark: #5C2D2D;
          --color-bg-card-light: #FFFFFF;
          --color-bg-green-dark: #3D4F2E;
          --color-bg-beige-soft: #EDE8DF;
          --color-accent-red: #8B1A1A;
          --color-accent-green: #4A5240;
          --color-text-primary: #1A1A1A;
          --color-text-body: #3A3A3A;
          --color-text-muted: #6B6B6B;
          --color-text-white: #FFFFFF;
          --color-border-light: #D8D0C4;
          --color-icon-stroke: #4A5240;
        }
        
        .font-serif-brand {
          font-family: 'Cormorant Garamond', var(--font-playfair), Georgia, serif;
        }

        .img-placeholder {
          background-color: #E0DACE;
          border: 1px solid var(--color-border-light);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}} />

      {/* HEADER NAVBAR */}
      <Header />

      {/* SECTION 1 — HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-[var(--color-bg-primary)] py-8">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
          
          {/* LEFT COLUMN: Hero content & 5 horizontal pills (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col justify-center z-20">
            <span
              className="text-[11px] uppercase font-bold tracking-[0.2em] text-[var(--color-accent-red)] mb-4"
            >
              FUNCTION. STRENGTH. LONGEVITY.
            </span>
            <h1 className="font-serif-brand text-[44px] sm:text-[52px] xl:text-[60px] font-normal leading-[1.05] tracking-tight text-[var(--color-text-primary)]">
              Physical<br />
              <span className="text-[var(--color-accent-red)]">Restoration</span><br />
              Programs
            </h1>
            
            <p className="mt-6 font-sans text-[16px] sm:text-[17px] leading-relaxed text-[var(--color-text-body)]">
              Movement is not simply exercise.<br />
              <span className="block mt-1">
                It is one of the most <span className="text-[var(--color-accent-green)] font-semibold">powerful biological</span><br />
                signals the human body receives.
              </span>
            </p>
            

            
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#program"
                className="inline-flex items-center justify-center rounded-none px-6 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 bg-[var(--color-accent-green)] shadow-sm"
              >
                Explore Our Programs &rarr;
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center rounded-none border-[1.5px] px-6 py-3.5 text-[13px] font-semibold bg-transparent transition-colors hover:bg-[var(--color-accent-red)]/5 border-[var(--color-accent-red)] text-[var(--color-accent-red)]"
              >
                Book Consultation
              </Link>
            </div>

            {/* INTEGRATED 5 HORIZONTAL PILLS: Lined up inside the left column under the buttons */}
            <div className="border-t border-[var(--color-border-light)]/60 pt-8 mt-10">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-center">
                
                {/* Pill 1 */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full border border-[var(--color-border-light)] bg-white shrink-0">
                    <DumbbellIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-[0.08em] font-bold text-[var(--color-text-body)] leading-none">
                      Strength
                    </span>
                    <span className="text-[8px] text-[var(--color-text-muted)] font-semibold mt-0.5 leading-none whitespace-nowrap">
                      Muscle Integrity
                    </span>
                  </div>
                </div>

                {/* Pill 2 */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full border border-[var(--color-border-light)] bg-white shrink-0">
                    <JointIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-[0.08em] font-bold text-[var(--color-text-body)] leading-none">
                      Mobility
                    </span>
                    <span className="text-[8px] text-[var(--color-text-muted)] font-semibold mt-0.5 leading-none whitespace-nowrap">
                      Flexibility
                    </span>
                  </div>
                </div>

                {/* Pill 3 */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full border border-[var(--color-border-light)] bg-white shrink-0">
                    <LeafIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-[0.08em] font-bold text-[var(--color-text-body)] leading-none">
                      Metabolic
                    </span>
                    <span className="text-[8px] text-[var(--color-text-muted)] font-semibold mt-0.5 leading-none whitespace-nowrap">
                      Health
                    </span>
                  </div>
                </div>

                {/* Pill 4 */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full border border-[var(--color-border-light)] bg-white shrink-0">
                    <RecoveryWaveIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-[0.08em] font-bold text-[var(--color-text-body)] leading-none">
                      Recovery
                    </span>
                    <span className="text-[8px] text-[var(--color-text-muted)] font-semibold mt-0.5 leading-none whitespace-nowrap">
                      Resilience
                    </span>
                  </div>
                </div>

                {/* Pill 5 */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full border border-[var(--color-border-light)] bg-white shrink-0">
                    <ClockIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-[0.08em] font-bold text-[var(--color-text-body)] leading-none">
                      Longevity
                    </span>
                    <span className="text-[8px] text-[var(--color-text-muted)] font-semibold mt-0.5 leading-none whitespace-nowrap">
                      Independence
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>          {/* RIGHT COLUMN: Image Area (col-span-7) */}
          <div className="lg:col-span-7 relative flex items-center justify-center w-full z-10 pl-0 pr-4 md:pr-6 xl:pl-8 xl:pr-10">
            <div className="flex flex-col xl:flex-row items-center xl:justify-between w-full xl:h-[400px] relative gap-4">
              
              {/* Left part: Separate Left-side Indicators Container (no longer relative to the image) */}
              <div className="relative w-[200px] h-[340px] shrink-0 hidden xl:block pointer-events-none">
                {/* Dotted curve background */}
                <svg className="absolute left-[10px] top-0 bottom-0 w-[80px] h-[340px] text-[var(--color-border-light)] opacity-60 z-0 pointer-events-none" viewBox="0 0 80 340" fill="none">
                  <path d="M70 10 C20 60 10 170 10 240 C10 290 20 320 70 330" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
                </svg>
                
                {/* Curved Indicators */}
                {/* Item 1: Metabolic Health */}
                <div 
                  className="absolute flex items-center gap-2 pointer-events-auto"
                  style={{
                    top: "3%",
                    left: "71.5px",
                    transform: "translate(-10px, -50%)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <LeafIcon className="w-2.5 h-2.5 text-[var(--color-accent-green)]" />
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-text-body)] whitespace-nowrap bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded-sm">
                    Metabolic Health
                  </span>
                </div>

                {/* Item 2: Hormonal Function */}
                <div 
                  className="absolute flex items-center gap-2 pointer-events-auto"
                  style={{
                    top: "25%",
                    left: "38px",
                    transform: "translate(-10px, -50%)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-2.5 h-2.5 text-[var(--color-accent-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 3H15" /><path d="M10 3V10L5 19C4 21 5.5 22 7 22H17C18.5 22 20 21 19 19L14 10V3" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-text-body)] whitespace-nowrap bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded-sm">
                    Hormonal Function
                  </span>
                </div>

                {/* Item 3: Vascular Health */}
                <div 
                  className="absolute flex items-center gap-2 pointer-events-auto"
                  style={{
                    top: "47%",
                    left: "24.5px",
                    transform: "translate(-10px, -50%)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <HeartIcon className="w-2.5 h-2.5 text-[var(--color-accent-green)]" />
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-text-body)] whitespace-nowrap bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded-sm">
                    Vascular Health
                  </span>
                </div>

                {/* Item 4: Cognitive Resilience */}
                <div 
                  className="absolute flex items-center gap-2 pointer-events-auto"
                  style={{
                    top: "69%",
                    left: "20px",
                    transform: "translate(-10px, -50%)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-2.5 h-2.5 text-[var(--color-accent-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 4.5c-2.5 0-4.5 2-4.5 4.5c0 1 .4 1.8.9 2.5a4 4 0 0 0-1.9 3.5c0 2.2 1.8 4 4 4" />
                      <path d="M12 4.5c2.5 0 4.5 2 4.5 4.5c0 1-.4 1.8-.9 2.5a4 4 0 0 1 1.9 3.5c0 2.2-1.8 4-4 4" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-text-body)] whitespace-nowrap bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded-sm">
                    Cognitive Resilience
                  </span>
                </div>

                {/* Item 5: Longevity & Independence */}
                <div 
                  className="absolute flex items-center gap-2 pointer-events-auto"
                  style={{
                    top: "91%",
                    left: "32px",
                    transform: "translate(-10px, -50%)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <ClockIcon className="w-2.5 h-2.5 text-[var(--color-accent-green)]" />
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-text-body)] whitespace-nowrap bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded-sm">
                    Longevity &amp; Independence
                  </span>
                </div>
              </div>

              {/* Center part: Image container (wider, placeholder box removed completely) */}
              <div className="relative w-[280px] h-[400px] flex items-center justify-center shrink-0 hidden xl:flex">
                {/* Empty container with absolute zero styling / borders, placeholder box completely removed */}
              </div>

              {/* Right part: Small Rectangle Blog Quote (w-[180px] shrink-0) */}
              <div 
                className="border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[220px] w-full max-w-[420px] xl:w-[180px] xl:shrink-0 z-20 mx-auto"
                style={{
                  backgroundColor: "#FEFDFB",
                  borderColor: "var(--color-border-light)",
                }}
              >
                {/* Large elegant olive quote mark */}
                <span 
                  className="text-4xl font-serif-brand leading-none absolute top-2 left-2 select-none opacity-20"
                  style={{ color: "var(--color-accent-green)" }}
                >
                  ❝
                </span>
                
                <div className="mt-4 relative z-10">
                  <p className="font-serif-brand text-[15px] font-medium leading-[1.35] text-[var(--color-text-primary)]">
                    The goal is not<br />
                    <span className="text-[var(--color-accent-red)] font-semibold not-italic">exhaustion</span>.<br />
                    The goal is<br />
                    adaptation and<br />
                    restoration.
                  </p>
                </div>

                {/* Beautiful branch/leaves outline at bottom-right */}
                <div className="absolute bottom-1 right-1 opacity-20 pointer-events-none z-0">
                  <svg className="w-12 h-12 text-[var(--color-accent-green)]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M85 85 C65 75 45 65 25 45" />
                    <path d="M25 45 C35 35 45 25 55 15" />
                    <path d="M45 65 C55 55 65 45 75 35" />
                    <path d="M65 75 C70 70 75 65 80 60" />
                  </svg>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — PROBLEM STATEMENT & CONVENTIONAL EXTREMES (Figma-Aligned Frame 26) */}
      <section className="w-full py-4 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8">
          <div 
            className="w-full rounded-[24px] border border-[var(--color-border-light)] p-4 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            style={{ backgroundColor: "#EDE8DF" }}
          >
            
            {/* Three Independent Grid Columns (Figma-Aligned) */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              
              {/* COLUMN 1: Too Inactive vs Too Intense */}
              <div className="flex flex-col justify-between h-full">
                <div>
                  <h2 className="font-serif-brand text-[20px] sm:text-[24px] md:text-[26px] font-normal leading-[1.15] text-[var(--color-accent-red)]">
                    Too Inactive. Too Intense.<br />
                    Either Way, The Body Pays.
                  </h2>
                  <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-text-muted)] font-sans">
                    Many individuals are caught between two extremes:
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-[#FBF9F5] border border-[var(--color-border-light)] rounded-xl relative flex flex-col sm:flex-row items-stretch justify-between gap-3 sm:gap-0">
                  {/* Couch Box */}
                  <div className="flex-1 rounded-xl border border-[var(--color-border-light)]/60 p-4 flex flex-col items-center justify-center text-center min-h-[120px] bg-[#EFECE6] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    <CouchIcon className="w-7 h-7 text-[var(--color-accent-green)] mb-2" />
                    <span className="text-[12px] font-bold text-[var(--color-text-primary)] leading-tight">
                      Complete<br />Physical<br />Inactivity
                    </span>
                  </div>

                  {/* Symmetrical Circular 'or' connector */}
                  <div className="self-center -my-2 sm:my-0 sm:-mx-3.5 z-10 w-8 h-8 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[11px] font-medium text-[var(--color-text-muted)] shrink-0 shadow-sm select-none">
                    or
                  </div>

                  {/* Dumbbell Box */}
                  <div className="flex-1 rounded-xl border border-[var(--color-border-light)]/60 p-4 flex flex-col items-center justify-center text-center min-h-[120px] bg-[#F7EBEB] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    <DumbbellIcon className="w-7 h-7 text-[var(--color-accent-red)] mb-2" />
                    <span className="text-[12px] font-bold text-[var(--color-text-primary)] leading-tight">
                      Aggressive Training<br />Without Understanding<br />Their Physiology
                    </span>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: The Result Is Often */}
              <div className="flex flex-col justify-start h-full lg:border-l border-[var(--color-border-light)]/60 lg:pl-6">
                <div>
                  <h3 className="font-serif-brand text-[17px] sm:text-[19px] md:text-[20px] font-normal leading-[1.2] text-[var(--color-text-primary)] mb-4">
                    The Result Is Often:
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Chronic fatigue</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Poor recovery</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Persistent aches and pains</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Declining mobility</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Loss of muscle mass</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Stiffness</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Reduced stamina</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Injuries</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RedXIcon className="w-4 h-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-tight">Burnout from unsustainable routines</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 3: Physical Decline Develops Gradually */}
              <div className="flex flex-col justify-start h-full lg:border-l border-[var(--color-border-light)]/60 lg:pl-6">
                <div>
                  <h3 className="font-serif-brand text-[17px] sm:text-[19px] md:text-[20px] font-normal leading-[1.25] text-[var(--color-text-primary)] mb-4">
                    Physical Decline Develops Gradually Through:
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3.5">
                    {/* Left sub-column */}
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                          <BicepIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11.5px] font-bold text-[var(--color-text-body)] leading-tight font-sans">Muscle loss</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                          <MovementVariabilityIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11.5px] font-bold text-[var(--color-text-body)] leading-tight font-sans">Reduced movement variability</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                          <RecoveryPhysiologyIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11.5px] font-bold text-[var(--color-text-body)] leading-tight font-sans">Poor recovery physiology</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                          <InflammationIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11.5px] font-bold text-[var(--color-text-body)] leading-tight font-sans">Chronic inflammation</span>
                        </div>
                      </div>
                    </div>

                    {/* Right sub-column */}
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                          <MetabolicIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11.5px] font-bold text-[var(--color-text-body)] leading-tight font-sans">Metabolic dysfunction</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                          <CouchIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11.5px] font-bold text-[var(--color-text-body)] leading-tight font-sans">Sedentary lifestyles</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                          <HormonalDeclineIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11.5px] font-bold text-[var(--color-text-body)] leading-tight font-sans">Hormonal decline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Row 1: Full-width horizontal info bar (6 items with icons + posture image on right) */}
            <div className="w-full bg-[#FBF9F5] border border-[var(--color-border-light)] rounded-2xl overflow-hidden p-4 md:p-5 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-sm">
              {/* Left Column: Heading */}
              <div className="max-w-[280px] shrink-0 text-center xl:text-left">
                <h3 className="font-serif-brand text-[17px] sm:text-[19px] md:text-[20px] font-normal leading-[1.25] text-[var(--color-text-primary)]">
                  Over time, this affects far more than<br />
                  physical appearance. It impacts:
                </h3>
              </div>

              {/* Middle Column: 6 Centered Icon Columns */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 justify-items-center w-full">
                {/* Item 1 */}
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shadow-sm transition-transform hover:scale-105">
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[var(--color-text-body)] leading-tight font-sans">
                    Energy<br />Levels
                  </span>
                </div>

                {/* Item 2 */}
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shadow-sm transition-transform hover:scale-105">
                    <MeditationIcon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[var(--color-text-body)] leading-tight font-sans">
                    Confidence
                  </span>
                </div>

                {/* Item 3 */}
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shadow-sm transition-transform hover:scale-105">
                    <SpineIcon className="w-4.5 h-4.5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[var(--color-text-body)] leading-tight font-sans">
                    Posture &amp;<br />Movement Quality
                  </span>
                </div>

                {/* Item 4 */}
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shadow-sm transition-transform hover:scale-105">
                    <HeartIcon className="w-4.5 h-4.5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[var(--color-text-body)] leading-tight font-sans">
                    Cardiovascular<br />Resilience
                  </span>
                </div>

                {/* Item 5 */}
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shadow-sm transition-transform hover:scale-105">
                    <BrainIcon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[var(--color-text-body)] leading-tight font-sans">
                    Cognitive<br />Function
                  </span>
                </div>

                {/* Item 6 */}
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shadow-sm transition-transform hover:scale-105">
                    <AgingShieldIcon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[var(--color-text-body)] leading-tight font-sans">
                    Long-Term<br />Independence<br />&amp; Aging
                  </span>
                </div>
              </div>

              {/* Right Column: Posture Portrait Space */}
              <div className="w-[110px] h-[80px] shrink-0 bg-[#E0DACE] border border-[var(--color-border-light)] rounded-xl flex flex-col items-center justify-center text-[7.5px] text-[var(--color-text-muted)] font-bold text-center p-2.5 select-none leading-relaxed">
                <span>[ POSTURE</span>
                <span>PORTRAIT ]</span>
              </div>
            </div>

            {/* Row 2: 3-column independent layout (Left, Middle, Right) */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Heading, description, bullet points, image (col-span-4) */}
              <div className="lg:col-span-4 bg-white border border-[var(--color-border-light)] rounded-2xl p-5 md:p-6 flex flex-col justify-start shadow-sm">
                <div>
                  <h3 className="font-serif-brand text-[18px] sm:text-[20px] md:text-[21px] font-normal leading-[1.25] text-[#1A1A1A] mb-4">
                    Most Exercise Programs Are Built Around Intensity. Very Few Are Built Around Physiology.
                  </h3>
                  <p className="text-[13px] leading-relaxed text-[var(--color-text-body)] mb-5">
                    Generic workouts, trend-driven fitness plans, and unsupervised exercise routines often fail because they ignore:
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <RedXIcon />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)]">Recovery capacity</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RedXIcon />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)]">Metabolic state</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RedXIcon />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)]">Hormonal environment</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RedXIcon />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)]">Musculoskeletal limitations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RedXIcon />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)]">Injury history</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RedXIcon />
                      <span className="text-[12.5px] font-semibold text-[var(--color-text-body)]">Nervous system fatigue</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column: Heading + description + grid of 8 features (col-span-5) */}
              <div className="lg:col-span-5 bg-white border border-[var(--color-border-light)] rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="font-serif-brand text-[18px] sm:text-[20px] md:text-[21px] font-normal leading-[1.25] text-[var(--color-text-primary)] mb-4">
                    Our Physical Restoration Programs Are Designed Around Function—Not Punishment.
                  </h3>
                  <p className="text-[13px] leading-relaxed text-[var(--color-text-body)] mb-5">
                    Exercise is approached as a structured, physician-guided restorative intervention. Every program is individualized based on:
                  </p>
                  
                  {/* Grid of features with clear separator lines */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-[var(--color-border-light)]/40 border border-[var(--color-border-light)]/40 rounded-xl overflow-hidden shadow-xs mt-4">
                    {/* Item 1 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <MetabolicIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Age &amp; Body<br />Composition
                      </span>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <JointIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Mobility &amp;<br />Movement Assessment
                      </span>
                    </div>

                    {/* Item 3 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <HormonalDeclineIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Hormonal &amp;<br />Metabolic Status
                      </span>
                    </div>

                    {/* Item 4 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <HeartIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Cardiovascular<br />Conditioning
                      </span>
                    </div>

                    {/* Item 5 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <BicepIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Strength &amp;<br />Recovery Capacity
                      </span>
                    </div>

                    {/* Item 6 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <AgingShieldIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Pain Patterns &amp;<br />Previous Injuries
                      </span>
                    </div>

                    {/* Item 7 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <ClockIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Lifestyle &amp;<br />Occupational Demands
                      </span>
                    </div>

                    {/* Item 8 */}
                    <div className="bg-white flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-bg-primary)]/10">
                      <div className="w-7 h-7 rounded-full border border-[var(--color-border-light)]/60 bg-[#F5F0E8] flex items-center justify-center shrink-0">
                        <BrainIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight">
                        Neuromuscular<br />Control
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-[13.5px] text-[var(--color-text-primary)] font-bold border-t border-[var(--color-border-light)]/50 pt-3 leading-relaxed">
                  Restoration begins by adapting professional movement protocols to your unique metabolic &amp; structural baseline.
                </p>
              </div>

              {/* Right Column: Large curved image container (col-span-3) */}
              <div className="lg:col-span-3 min-h-[300px] lg:h-[350px] w-full flex items-stretch">
                <div 
                  className="w-full bg-[#E0DACE] border border-[var(--color-border-light)] flex items-center justify-center text-[10px] text-[var(--color-text-muted)] font-bold text-center shadow-sm select-none"
                  style={{
                    borderTopLeftRadius: "140px",
                    borderBottomLeftRadius: "140px",
                    borderTopRightRadius: "16px",
                    borderBottomRightRadius: "16px",
                  }}
                >
                  <div className="flex flex-col items-center justify-center p-6 gap-2">
                    <span>[ TRAINER GUIDING</span>
                    <span>ATHLETE ]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Physician-guided therapist programs (Figma-Aligned 2-Column layout) */}
            <div id="program" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Large merged rectangular white card (lg:col-span-8) */}
              <div className="lg:col-span-8 bg-white border border-[var(--color-border-light)] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
                
                {/* 2-Column inner layout for the merged Left card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch h-full">
                  
                  {/* Inner Left Column: Title, Paragraph, and 8 Icons Grid */}
                  <div className="md:col-span-7 flex flex-col justify-between h-full pr-0 md:pr-2">
                    <div>
                      <h3 className="font-serif-brand text-[18px] sm:text-[20px] md:text-[21px] font-normal leading-[1.3] text-[var(--color-text-primary)] mb-4">
                        These Are Physician-Guided, Therapist-Supervised Restoration Programs.
                      </h3>
                      <p className="text-[13px] leading-relaxed text-[var(--color-text-body)]">
                        Programs are conducted by trained Physical Restoration Specialists (PRS) within a structured clinical framework focused on:
                      </p>
                    </div>
                    
                    {/* Grid of 8 clinical icons/points with thin dividers inside a 4x2 grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-[var(--color-border-light)]/40 border border-[var(--color-border-light)]/40 rounded-xl overflow-hidden shadow-xs mt-6 bg-[#FEFDFB] text-center">
                      {/* Cell 1: Restoring Movement Quality */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <RunnerIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Restoring Movement<br />Quality
                        </span>
                      </div>

                      {/* Cell 2: Rebuilding Strength Safely */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <DumbbellIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Rebuilding Strength<br />Safely
                        </span>
                      </div>

                      {/* Cell 3: Improving Endurance & Stamina */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <LoopArrowsIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Improving Endurance<br />&amp; Stamina
                        </span>
                      </div>

                      {/* Cell 4: Enhancing Mobility & Flexibility */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <MobilityJointIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Enhancing Mobility<br />&amp; Flexibility
                        </span>
                      </div>

                      {/* Cell 5: Improving Balance & Coordination */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <BalanceIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Improving Balance<br />&amp; Coordination
                        </span>
                      </div>

                      {/* Cell 6: Preserving Muscle Mass & Bone Health */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <BoneIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Preserving Muscle Mass<br />&amp; Bone Health
                        </span>
                      </div>

                      {/* Cell 7: Supporting Metabolic Efficiency */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <FireIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Supporting Metabolic<br />Efficiency
                        </span>
                      </div>

                      {/* Cell 8: Optimizing Recovery */}
                      <div className="bg-[#FEFDFB] flex flex-col items-center justify-start p-3 gap-2.5 min-h-[90px]">
                        <ShieldCheckIcon className="w-5.5 h-5.5 text-[var(--color-accent-green)]" />
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.01em] text-[var(--color-text-body)] leading-tight font-sans">
                          Optimizing<br />Recovery
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inner Right Column: checklist of 8 programs with middle vertical separator line */}
                  <div className="md:col-span-5 flex flex-col justify-start h-full md:border-l border-[var(--color-border-light)]/60 md:pl-6 pt-4 md:pt-0">
                    <span className="text-[11px] uppercase font-bold tracking-[0.12em] text-[var(--color-accent-green)] mb-4 block">
                      Depending on individual needs, programs include:
                    </span>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Corrective Movement Training</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Structured Strength Conditioning</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Mobility &amp; Flexibility Work</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Posture &amp; Spine Correction</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Cardiovascular Endurance Training</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Low-Impact Metabolic Conditioning</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Recovery-Focused Movement Protocols</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckOutlineIcon className="w-4 h-4 text-[#4A7C40] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[var(--color-text-body)] leading-snug">Physiological Progress Monitoring</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Highlighted Red Capacity Card (lg:col-span-4) */}
              <div className="lg:col-span-4 bg-[var(--color-accent-red)] text-white rounded-2xl p-5 md:p-6 flex flex-col justify-start shadow-md">
                <div>
                  <h3 className="font-serif-brand text-[18px] sm:text-[20px] md:text-[21px] font-normal leading-[1.3] text-white mb-3">
                    We Are About Rebuilding Capacity.
                  </h3>
                  <p className="text-[13px] text-white/80 mb-5 leading-relaxed">
                    Outcomes focus on long-term physical durability, active strength, and baseline function:
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-white font-bold leading-none text-xs mt-0.5">•</span>
                      <span className="text-[12.5px] text-white/90">Restoring joint structural integrity</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-white font-bold leading-none text-xs mt-0.5">•</span>
                      <span className="text-[12.5px] text-white/90">Long-term posture correction and spinal health</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-white font-bold leading-none text-xs mt-0.5">•</span>
                      <span className="text-[12.5px] text-white/90">Rebuilding active structural movement patterns</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-white font-bold leading-none text-xs mt-0.5">•</span>
                      <span className="text-[12.5px] text-white/90">Enhancing cardiovascular capacity and recovery speed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6 — PROGRESS TRACKING BANNER (Figma-Aligned Frame 26) */}
      <section className="w-full py-4 bg-[#F5F0E8] px-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-[1280px]">
          
          <div className="relative bg-[#FEFDFB] border border-[var(--color-border-light)] rounded-2xl overflow-hidden p-5 md:p-12 shadow-sm">
            
            {/* Right Side Landscape Background Image with absolute positioning */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[45%] h-full bg-no-repeat bg-cover bg-right z-0 pointer-events-none opacity-90 hidden sm:block"
              style={{ 
                backgroundImage: "url('/images/landing/longitudinal_progress_bg.png')" 
              }}
            >
              {/* Soft fade-out overlay to blend the background image perfectly into #FEFDFB */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FEFDFB] via-[#FEFDFB]/40 to-transparent" />
            </div>

            <h2 className="font-serif-brand text-[22px] sm:text-[24px] font-normal leading-[1.2] text-[var(--color-text-primary)] text-left relative z-10">
              Every Program Evolves Longitudinally.
            </h2>
            <p className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.1em] font-bold text-[var(--color-accent-green)] mt-2 mb-6 text-left relative z-10">
              Progress is continuously tracked through:
            </p>
            
            {/* Connected horizontal sequence line */}
            <div className="relative mt-8 mb-8 z-10">
              {/* Connecting line */}
              <div className="absolute top-[23px] left-8 right-8 h-[1px] border-t border-dashed border-[var(--color-border-light)]/60 z-0 hidden md:block" />
              
              <div className="relative z-10 grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-4 justify-items-center">
                
                {/* Step 1: Strength Markers */}
                <div className="flex flex-col items-center text-center gap-2.5 max-w-[100px] group">
                  <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-transform hover:scale-105">
                    <DumbbellIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Strength Markers</span>
                </div>

                {/* Step 2: Endurance Capacity */}
                <div className="flex flex-col items-center text-center gap-2.5 max-w-[100px] group">
                  <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-transform hover:scale-105">
                    <RecoveryWaveIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Endurance Capacity</span>
                </div>

                {/* Step 3: Mobility Improvements */}
                <div className="flex flex-col items-center text-center gap-2.5 max-w-[100px] group">
                  <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-transform hover:scale-105">
                    <RunnerIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Mobility Improvements</span>
                </div>

                {/* Step 4: Body Composition */}
                <div className="flex flex-col items-center text-center gap-2.5 max-w-[100px] group">
                  <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-transform hover:scale-105">
                    <MetabolicIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Body Composition</span>
                </div>

                {/* Step 5: Recovery Patterns */}
                <div className="flex flex-col items-center text-center gap-2.5 max-w-[100px] group">
                  <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-transform hover:scale-105">
                    <ShieldCheckIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Recovery Patterns</span>
                </div>

                {/* Step 6: Functional Performance Metrics */}
                <div className="flex flex-col items-center text-center gap-2.5 max-w-[100px] group">
                  <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-transform hover:scale-105 overflow-hidden">
                    <EcgLine color="var(--color-icon-stroke)" className="w-9 h-6 shrink-0" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Functional Performance Metrics</span>
                </div>

              </div>
            </div>

            {/* Two elegant cards at the bottom of progress tracker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 relative z-10">
              {/* Card 1: Longevity quote with LeafIcon */}
              <div className="bg-[#FEFDFB]/95 border border-[var(--color-border-light)]/60 rounded-xl p-5 flex items-start gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                  <LeafIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="font-serif-brand text-[15px] sm:text-[16px] font-normal leading-snug text-[var(--color-text-primary)] mb-1.5">
                    "Because longevity without strength and function is incomplete."
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed font-sans">
                    The ability to move freely, remain strong, recover efficiently, and maintain physical independence is one of the most important determinants of long-term health.
                  </p>
                </div>
              </div>

              {/* Card 2: Human body quote with LotusIcon */}
              <div className="bg-[#FEFDFB]/95 border border-[var(--color-border-light)]/60 rounded-xl p-5 flex items-start gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="w-10 h-10 rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center text-[var(--color-accent-green)] shrink-0 shadow-sm mt-0.5">
                  <LotusIcon className="w-5 h-5 text-[var(--color-icon-stroke)]" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="font-serif-brand text-[15px] sm:text-[16px] font-normal leading-snug text-[var(--color-text-primary)] mb-1.5">
                    "The human body is designed to adapt, strengthen, and recover."
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed font-sans">
                    But only when movement is approached intelligently, progressively, and in alignment with physiology.
                  </p>
                </div>
              </div>
            </div>

            {/* Compact dark olive green CTA banner at bottom with negative margins to touch bottom card borders */}
            <div className="mt-8 -mx-5 md:-mx-12 -mb-5 md:-mb-12 rounded-t-none rounded-b-2xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 bg-[#4A5240] text-white relative z-10 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                <div className="text-white/80 shrink-0">
                  <LeafIcon className="w-8 h-8 text-[#EDE8DF]" />
                </div>
                <p className="text-[#FAF8F5]/90 text-[14px] md:text-[15px] font-medium leading-relaxed tracking-wide font-sans">
                  Restore Function. Rebuild Strength.<br className="hidden md:block" />
                  Renew Your Capacity For Life.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 shrink-0 w-full lg:w-auto">
                <Link
                  href="/assessment"
                  className="bg-[#FAF8F5] hover:bg-[#FAF8F5]/90 text-[#4A5240] border border-[#FAF8F5] transition-all py-3 px-6 rounded-full text-[12px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  Book Consultation &rarr;
                </Link>
                <Link
                  href="#program"
                  className="bg-transparent hover:bg-white/5 text-[#FAF8F5] border border-[#FAF8F5]/80 transition-all py-3 px-6 rounded-full text-[12px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  Explore Our Programs &rarr;
                </Link>
              </div>
            </div>

          </div>
          
        </div>
      </section>

      {/* SECTION 8 — FINAL POSITIONING */}
      <section className="w-full bg-[#FEF9EF] pt-2 pb-8 px-6 md:px-10">
        <div className="mx-auto max-w-[1280px] grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          
          {/* Left card: Final Positioning quote box */}
          <div className="rounded-2xl p-8 md:p-10 flex flex-col justify-between bg-[#EDE8DF] border border-[var(--color-border-light)]/40 shadow-sm min-h-[340px]">
            <div>
              <span className="font-serif-brand text-[15px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent-red)] mb-4 block">
                Final Positioning
              </span>
              <p className="text-[15.5px] leading-relaxed text-[var(--color-text-body)] font-medium font-sans">
                "The Institute operates with a serious clinical framework at the intersection of Internal Medicine, Pre-Critical Care, Endocrinology, Metabolic health and Regenerative care through physician-led precision frameworks designed for long-term physiological restoration."
              </p>
            </div>
            <div className="mt-8">
              <EcgLine color="#4A5240" />
            </div>
          </div>

          {/* Right Content Block: Clinical Assessment */}
          <div className="flex flex-col items-center lg:items-end justify-center pl-0 lg:pl-10 text-center lg:text-right z-20">
            <h2 
              className="text-[#4A5240] mb-4 font-normal tracking-normal whitespace-nowrap"
              style={{
                fontFamily: "Adamina, serif",
                fontSize: "clamp(24px, 2.5vw, 40px)",
                lineHeight: "100%",
              }}
            >
              Begin With A Clinical Assessment
            </h2>
            <p 
              className="text-[#1A1A1A] mb-8 font-normal whitespace-nowrap"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(16px, 1.8vw, 24px)",
                lineHeight: "115%",
              }}
            >
              Start your physician-led biological evaluation
            </p>
            <div>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center rounded-none px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 bg-[var(--color-accent-red)] text-center shadow-md"
              >
                Request A Consultation
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}
