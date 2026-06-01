/**
 * Bespoke landing page for Brain & Mitochondrial Restorative Care.
 * Implements a luxury-clinical organic aesthetic: warm cream, burgundy accents,
 * thin line-art custom icons, and high-fidelity AI-generated assets.
 * Mounted at `/services/brain-mitochondrial` outside route groups to suppress standard headers
 * while reusing the global shared Footer component.
 */
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";

// Custom SVGs & Line-Art Icons for Clinical Elegance

// 1. Lotus Brand Logo (Exactly matching the curved 5-petal Figma design)
function LotusIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Central petal */}
      <path d="M12 21C12 21 14.5 16 14.5 12C14.5 7.5 12 3 12 3C12 3 9.5 7.5 9.5 12C9.5 16 12 21 12 21Z" />
      {/* Inner left petal */}
      <path d="M12 21C12 21 7.5 18 7.5 12.5C7.5 7.5 12 3 12 3" />
      {/* Inner right petal */}
      <path d="M12 21C12 21 16.5 18 16.5 12.5C16.5 7.5 12 3 12 3" />
      {/* Outer left petal */}
      <path d="M12 21C12 21 4.5 16.5 4.5 13.5C4.5 9 12 3 12 3" />
      {/* Outer right petal */}
      <path d="M12 21C12 21 19.5 16.5 19.5 13.5C19.5 9 12 3 12 3" />
    </svg>
  );
}

// 2. Battery / Lightning (Cellular Energy - Vertical upright Figma battery)
function BatteryIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="5" width="10" height="15" rx="1.5" />
      <path d="M11 2h2" />
      <path d="M12 8l-2 3h4l-2 3" />
    </svg>
  );
}

// 3. Brain Outline (Cognitive Clarity - Highly recognizable symmetrical brain outline)
function BrainIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Left hemisphere cerebrum */}
      <path d="M12 4.5c-2.5 0-4.5 2-4.5 4.5c0 1 .4 1.8.9 2.5a4 4 0 0 0-1.9 3.5c0 2.2 1.8 4 4 4c.5 0 1-.1 1.5-.3" />
      {/* Right hemisphere cerebrum */}
      <path d="M12 4.5c2.5 0 4.5 2 4.5 4.5c0 1-.4 1.8-.9 2.5a4 4 0 0 1 1.9 3.5c0 2.2-1.8 4-4 4c-.5 0-1-.1-1.5-.3" />
      {/* Central dividing fissure line */}
      <line x1="12" y1="4.5" x2="12" y2="19.5" strokeDasharray="1.5 1.5" />
      {/* Internal brain fold tracks - universally recognized loops */}
      <path d="M8.5 9c1.5 0 2-.8 3.5-.8" opacity="0.85" />
      <path d="M15.5 9c-1.5 0-2-.8-3.5-.8" opacity="0.85" />
      <path d="M7 13.5c1.5 0 2.5.8 4 .8" opacity="0.85" />
      <path d="M17 13.5c-1.5 0-2.5.8-4 .8" opacity="0.85" />
    </svg>
  );
}

// 4. Hexagon / Molecular (Neurological Recovery - Figma radiating nodes)
function MolecularIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="6" cy="6" r="1.5" />
      <circle cx="18" cy="6" r="1.5" />
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      
      <line x1="12" y1="12" x2="6" y2="6" />
      <line x1="12" y1="12" x2="18" y2="6" />
      <line x1="12" y1="12" x2="6" y2="18" />
      <line x1="12" y1="12" x2="18" y2="18" />
      <line x1="12" y1="12" x2="12" y2="5" />
      <line x1="12" y1="12" x2="12" y2="19" />
    </svg>
  );
}

// 5. Shield with Leaf (Metabolic Resilience - Figma shield curved leaf)
function ShieldLeafIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
      <path d="M12 8C10.5 9.5 10.5 12.5 12 14.5C13.5 12.5 13.5 9.5 12 8Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 14.5V17" />
    </svg>
  );
}

// 6. Fatigue (Person silhouette / Heavy)
function FatigueIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" />
      <path d="M6 20C6 17 9 15 12 15C15 15 18 17 18 20" />
      <path d="M12 11V13" strokeLinecap="round" />
    </svg>
  );
}

// 7. Brain Fog (Brain with active centers)
function BrainFogIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.5 15.5C9.5 15.5 11 14.5 12 14.5C13 14.5 14.5 15.5 14.5 15.5" />
      <path d="M12 5.5C9.5 5.5 7.5 7.5 7.5 10C7.5 11.5 8.2 12.8 9.3 13.7" />
      <path d="M14.7 13.7C15.8 12.8 16.5 11.5 16.5 10C16.5 7.5 14.5 5.5 12 5.5Z" />
      <circle cx="12" cy="9.5" r="1.5" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

// 8. Concentration (Target with Eye - Supports className)
function ConcentrationIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

// 9. Reduced Productivity (Declining line chart)
function ProductivityIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3V21H21" />
      <path d="M7 16L12 11L16 14L20 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 10. Emotional Volatility (Frowning and scaling face)
function EmotionalIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 15S10 16 12 16S15 15 15 15" strokeLinecap="round" />
      <line x1="9" y1="9.5" x2="10.5" y2="10" strokeLinecap="round" />
      <line x1="15" y1="9.5" x2="13.5" y2="10" strokeLinecap="round" />
    </svg>
  );
}

// 11. Poor Recovery (Broken circular cycle - Supports className)
function RecoveryIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 12A8 8 0 1 0 12 20" strokeDasharray="3 3" />
      <path d="M12 4V2L15 4.5L12 7V5" />
    </svg>
  );
}

// 12. Sleep Disruption (Crescent moon and stars)
function SleepIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3C10.5 4.5 10.5 7.5 12 9C13.5 10.5 16.5 10.5 18 9C17.5 14 13.5 18 8.5 18C4 18 2 14.5 2 10.5C2 5.5 6 3 12 3Z" />
    </svg>
  );
}

// 13. Reduced Resilience (Shield with minus sign)
function ResilienceIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
      <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round" />
    </svg>
  );
}

// 14. Check Circle Outline
function CheckOutlineIcon({ className = "w-4.5 h-4.5 text-[#4A7C40] shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" strokeWidth="1" />
      <path d="M8 12.5L11 15.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 15. Red X Circle Mark
function RedXIcon() {
  return (
    <svg className="w-5 h-5 text-[#C0392B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" strokeWidth="1" />
      <path d="M8 8L16 16M16 8L8 16" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 16. Custom Mitochondria outline shape icon (white/sage)
function MitoShapeIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 2C8 2 6 5 6 9C6 14 10 22 12 22C14 22 18 14 18 9C18 5 16 2 12 2Z" />
      <path d="M12 6C11 6 10 7 10 9C10 11 12 13 12 15C12 17 13 18 12 18" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

// 17. Custom Inflammatory / Flame icon
function InflammatoryIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7C12 7 9 9.5 9 12C9 14.5 12 17 12 17C12 17 15 14.5 15 12C15 9.5 12 7 12 7Z" />
    </svg>
  );
}

// 18. Custom Oxidative / Sparkle icon
function OxidativeIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 3L4 6V11C4 16 12 21 12 21C12 21 20 16 20 11V6L12 3Z" />
      <path d="M12 7L13.5 10.5L17 12L13.5 13.5L12 17L10.5 13.5L7 12L10.5 10.5L12 7Z" strokeWidth="1" />
    </svg>
  );
}

// 19. Custom Scale / Balance icon
function ScaleIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="12" y1="3" x2="12" y2="20" />
      <line x1="6" y1="7" x2="18" y2="7" />
      <path d="M6 7L4 14H8L6 7Z" />
      <path d="M18 7L16 14H20L18 7Z" />
      <path d="M10 20H14" />
    </svg>
  );
}

// 20. Custom Vascular / Heart icon
function VascularIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 5C10 -1 3 0 3 7C3 13 12 19 12 19C12 19 21 13 21 7C21 0 14 -1 12 5Z" />
      <path d="M12 9C12 9 10.5 11 12 13" strokeLinecap="round" />
    </svg>
  );
}

// 21. Custom Flask / chemical model icon
function FlaskIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M9 3H15" />
      <path d="M10 3V10L5 19C4 21 5.5 22 7 22H17C18.5 22 20 21 19 19L14 10V3" />
      <line x1="7.5" y1="17" x2="16.5" y2="17" />
    </svg>
  );
}

// 22. Custom Recovery Wave icon
function RecoveryWaveIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M3 12H7L9 5L12 19L14 9L16 13L18 12H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 23. Infusions: Amino Acids
function AminoAcidsIcon() {
  return (
    <svg className="w-6 h-6 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="3" />
      <circle cx="17" cy="17" r="3" />
      <line x1="9.5" y1="9.5" x2="14.5" y2="14.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// 24. Infusions: Antioxidants
function AntioxidantsIcon() {
  return (
    <svg className="w-6 h-6 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}

// 25. Infusions: Vitamins
function VitaminsIcon() {
  return (
    <svg className="w-6 h-6 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 3a9 9 0 0 0-9 9c0 3 1.5 5 3.5 6.5L6 21h12l-.5-2.5c2-1.5 3.5-3.5 3.5-6.5a9 9 0 0 0-9-9z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

// 26. Infusions: Metabolic Cofactors
function CofactorsIcon() {
  return (
    <svg className="w-6 h-6 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

// 27. Infusions: Mitochondrial Support
function MitoSupportIcon() {
  return (
    <svg className="w-6 h-6 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M12 8v8M9 11h6" />
    </svg>
  );
}

// 28. Infusions: Neuro supportive
function NeuroSupportIcon() {
  return (
    <svg className="w-6 h-6 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 4a8 8 0 0 0-8 8c0 4 3 6.5 4 8h8c1-1.5 4-4 4-8a8 8 0 0 0-8-8z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// 29. Diagnostics: Clipboard
function ClipboardIcon() {
  return (
    <svg className="w-7 h-7 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="6" y="5" width="12" height="15" rx="1" />
      <path d="M9 5a3 3 0 0 1 6 0" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

// 30. Diagnostics: Bar Graph
function BarGraphIcon() {
  return (
    <svg className="w-7 h-7 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="4" y="12" width="3" height="8" rx="0.5" />
      <rect x="10" y="7" width="3" height="13" rx="0.5" />
      <rect x="16" y="14" width="3" height="6" rx="0.5" />
      <line x1="2" y1="20" x2="22" y2="20" strokeLinecap="round" />
    </svg>
  );
}

// 31. Diagnostics: Moon Wave
function MoonWaveIcon() {
  return (
    <svg className="w-7 h-7 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M12 3a7.5 7.5 0 0 0 7.5 7.5 7.5 7.5 0 0 0-7.5-7.5Z" />
      <path d="M3 17c1.5 0 2-1 3.5-1s2 1 3.5 1 2-1 3.5-1 2 1 3.5-1 2 1 3.5 1" strokeLinecap="round" />
    </svg>
  );
}

// 32. Diagnostics: Clinical Person
function PersonIcon() {
  return (
    <svg className="w-7 h-7 text-[#5C5C4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="7" r="4" />
      <path d="M5 20c0-3 3-5 7-5s7 2 7 5" />
    </svg>
  );
}

// 33. ECG / Pulse heartbeat wave line
function EcgLine({ className = "", color = "#6D7956" }: { className?: string; color?: string }) {
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

export default function BrainMitochondrialPage() {
  return (
    <div
      className="flex min-h-screen flex-col relative"
      style={{
        background: "#F5F2EC", // Warm off-white primary background
        color: "#1A1A1A", // Near-black text
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Adamina&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {/* Scope visual tokens & Dynamic Google Font Import */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap');

        :root {
          --color-bg-primary: #F5F2EC;
          --color-bg-section-dark: #5C2D2D;
          --color-bg-card-light: #FFFFFF;
          --color-bg-green-dark: #3D4F2E;
          --color-bg-beige-soft: #EDE8DF;
          --color-accent-red: #8B2020;
          --color-accent-green: #4A5E35;
          --color-text-primary: #1A1A1A;
          --color-text-body: #3A3A3A;
          --color-text-muted: #6B6B6B;
          --color-text-white: #FFFFFF;
          --color-border-light: #D8D0C4;
          --color-icon-stroke: #5C5C4A;
          --color-red-x: #C0392B;
          --color-check-green: #4A7C40;
        }
        
        .font-serif-brand {
          font-family: 'Cormorant Garamond', var(--font-playfair), Georgia, serif;
        }
        
        .accent-italic {
          color: var(--color-accent-red);
          font-style: italic;
          font-weight: 600;
        }
      `}} />

      {/* SECTION 1 — HEADER / NAVBAR */}
      <Header />

      {/* SECTION 2 — HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-[var(--color-bg-primary)]">
        {/* Asymmetric 3-column Layout */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
          
          {/* LEFT COLUMN: Text Block (40% on large screens) */}
          <div className="lg:col-span-5 flex flex-col justify-center z-20">
            <h1 className="font-serif-brand text-[44px] sm:text-[52px] xl:text-[60px] font-normal leading-[1.05] tracking-tight text-[var(--color-text-primary)]">
              <span className="font-light">Brain &</span>
              <span className="block font-light mt-1">Mitochondrial</span>
              <span className="block mt-1 text-[var(--color-accent-red)] font-normal">
                Restorative Care
              </span>
            </h1>
            
            <p className="mt-6 font-serif-brand text-[18px] sm:text-[20px] leading-relaxed text-[var(--color-text-body)]">
              Burnout is not always psychological.
              <span className="block mt-1">
                Sometimes, it is <span className="text-[var(--color-accent-red)] font-semibold">biological exhaustion</span>.
              </span>
            </p>
            
            <p className="mt-4 font-serif-brand text-[15px] sm:text-[17px] leading-relaxed text-[var(--color-text-muted)] font-normal">
              Outwardly, you continue functioning.
              <span className="block mt-0.5">
                Internally, the system is struggling to keep up.
              </span>
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#program"
                className="inline-flex items-center justify-center rounded px-6 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 bg-[var(--color-accent-green)]"
              >
                Explore the Program &rarr;
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center rounded border-[1.5px] px-6 py-3.5 text-[13px] font-semibold bg-transparent transition-colors hover:bg-[var(--color-accent-red)]/5 border-[var(--color-accent-red)] text-[var(--color-accent-red)]"
              >
                Book Consultation
              </Link>
            </div>

            {/* Relocated Hero Icon Bar: Placed directly in the left column underneath the buttons */}
            <div className="mt-10 flex flex-row flex-wrap items-center gap-x-6 gap-y-4 border-t border-[var(--color-border-light)] pt-6">
              
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full border border-[var(--color-border-light)]/60 bg-white/20">
                  <BatteryIcon className="w-6 h-6 text-[var(--color-icon-stroke)] shrink-0" />
                </div>
                <div className="flex flex-col text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--color-text-body)] leading-[1.3] text-left">
                  <span>Cellular</span>
                  <span>Energy</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full border border-[var(--color-border-light)]/60 bg-white/20">
                  <BrainIcon className="w-6 h-6 text-[var(--color-icon-stroke)] shrink-0" />
                </div>
                <div className="flex flex-col text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--color-text-body)] leading-[1.3] text-left">
                  <span>Cognitive</span>
                  <span>Clarity</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full border border-[var(--color-border-light)]/60 bg-white/20">
                  <MolecularIcon className="w-6 h-6 text-[var(--color-icon-stroke)] shrink-0" />
                </div>
                <div className="flex flex-col text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--color-text-body)] leading-[1.3] text-left">
                  <span>Neurological</span>
                  <span>Recovery</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full border border-[var(--color-border-light)]/60 bg-white/20">
                  <ShieldLeafIcon className="w-6 h-6 text-[var(--color-icon-stroke)] shrink-0" />
                </div>
                <div className="flex flex-col text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--color-text-body)] leading-[1.3] text-left">
                  <span>Metabolic</span>
                  <span>Resilience</span>
                </div>
              </div>

            </div>
          </div>

          {/* CENTER COLUMN: Beautiful Empty Scientific Space (40% on large screens) */}
          <div className="lg:col-span-4 relative flex items-center justify-center min-h-[360px] lg:min-h-[480px] overflow-visible">
            {/* Radial soft glow sage green circle */}
            <div className="absolute top-[10%] left-[10%] right-[10%] bottom-[10%] -z-10 rounded-full opacity-35 bg-[radial-gradient(circle,#C5CFA8_0%,transparent_70%)] pointer-events-none" />
            
            {/* Neural network light drawing SVG */}
            <svg
              className="absolute inset-0 w-full h-full text-[#8A9E72] opacity-25 -z-10 pointer-events-none"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            >
              <circle cx="50" cy="50" r="32" strokeDasharray="2 2" />
              <circle cx="50" cy="50" r="20" />
              <path d="M30 40 L40 35 L60 35 L70 40 L65 60 L50 65 L35 60 Z" />
              <line x1="50" y1="18" x2="50" y2="82" />
              <line x1="18" y1="50" x2="82" y2="50" />
            </svg>
            
            {/* Constellation scattering background SVG in upper-right */}
            <svg
              className="absolute right-4 top-4 w-[160px] h-[120px] text-[#8A9E72] opacity-25 -z-10 pointer-events-none"
              viewBox="0 0 80 60"
              fill="currentColor"
            >
              <circle cx="10" cy="20" r="1.5" />
              <circle cx="30" cy="15" r="1" />
              <circle cx="45" cy="35" r="2" />
              <circle cx="65" cy="25" r="1" />
              <circle cx="20" cy="50" r="1.5" />
              <circle cx="55" cy="48" r="1" />
              
              <line x1="10" y1="20" x2="30" y2="15" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
              <line x1="30" y1="15" x2="45" y2="35" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
              <line x1="45" y1="35" x2="65" y2="25" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
              <line x1="20" y1="50" x2="45" y2="35" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
              <line x1="45" y1="35" x2="55" y2="48" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
            </svg>

            {/* Muted abstract geometric cellular/neural icon frame leaving an elegant scientific space */}
            <div className="w-[300px] h-[400px] border border-[var(--color-border-light)]/40 rounded-full flex items-center justify-center relative select-none bg-white/10 shadow-inner">
              <svg className="w-56 h-56 text-[#8A9E72]/15" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75">
                <circle cx="50" cy="50" r="42" />
                <circle cx="50" cy="50" r="32" strokeDasharray="3 3" />
                <path d="M50 8 A42 42 0 0 1 92 50" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 50 A42 42 0 0 1 50 92" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* RIGHT COLUMN: Floating Quote Card (25% on large screens) */}
          <div className="lg:col-span-3 flex flex-col justify-center z-20">
            <div className="bg-[var(--color-bg-card-light)] rounded-xl p-8 shadow-[0_12px_32px_rgba(0,0,0,0.03)] border border-[var(--color-border-light)]/50 relative overflow-hidden">
              <span className="text-[var(--color-accent-red)] text-6xl font-serif-brand leading-none absolute top-2 left-4 select-none opacity-85">
                ❝
              </span>
              
              {/* Premium Serif Typography for the quote */}
              <p className="font-serif-brand text-[23px] font-bold italic leading-[1.35] text-[var(--color-text-primary)] mt-8 relative z-10">
                "The brain is one of the most <span className="text-[var(--color-accent-red)] font-semibold not-italic">energy-demanding</span> organs in the body."
              </p>
              
              <div className="my-5 border-t border-[var(--color-border-light)] border-dashed" />
              
              <p className="text-[13.5px] leading-relaxed text-[var(--color-text-muted)] font-medium font-sans relative z-10">
                Its performance depends on multiple interconnected systems working in perfect balance.
              </p>
              
              {/* Botanical sage green leaf cluster SVG */}
              <svg
                className="absolute bottom-2 right-2 w-14 h-14 text-[#A8B88A] opacity-25 z-0 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M12 22C12 22 12 18 10 14C8 10 4 9 4 9C4 9 8 8 10 6C12 4 12 2 12 2C12 2 12 4 14 6C16 8 20 9 20 9C20 9 16 10 14 14C12 18 12 22 12 22Z" />
                <path d="M12 14c-1-2-3-2-3-2m3 2c1-2 3-2 3-2" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — SYMPTOMS SECTION ("When These Systems Begin Deteriorating") */}
      <section className="w-full py-8 bg-[var(--color-bg-primary)]">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Block (30%) */}
          <div className="lg:col-span-4 lg:pr-6">
            <h2 className="font-serif-brand text-[28px] sm:text-[34px] font-normal leading-[1.2] text-[var(--color-text-primary)]">
              When These Systems Begin Deteriorating, You May Experience
            </h2>
          </div>

          {/* Right Block (70%) — Single Horizontal Row of 8 circles */}
          <div className="lg:col-span-8 flex flex-row items-center w-full overflow-x-auto no-scrollbar py-2">
            <div className="flex flex-nowrap lg:flex-wrap items-center justify-between w-full gap-4 sm:gap-6 min-w-[640px] lg:min-w-0">
              
              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <FatigueIcon />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Fatigue</span>
              </div>

              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <BrainFogIcon />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Brain Fog</span>
              </div>

              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <ConcentrationIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Poor Concentration</span>
              </div>

              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <ProductivityIcon />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Reduced Productivity</span>
              </div>

              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <EmotionalIcon />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Emotional Volatility</span>
              </div>

              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <RecoveryIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Poor Recovery</span>
              </div>

              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <SleepIcon />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Sleep Disruption</span>
              </div>

              <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-[70px]">
                <div className="w-[48px] h-[48px] rounded-full border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-icon-stroke)] bg-white/70 shadow-sm transition-transform hover:scale-105">
                  <ResilienceIcon />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-body)] tracking-tight">Reduced Resilience</span>
              </div>

            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 4 — "NOT SIMPLY STRESS" + "CONVENTIONAL APPROACHES" (Unified Combined Double-Column Card Container) */}
      <section className="w-full py-6 md:py-8 bg-[var(--color-bg-primary)]">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          
          <div className="w-full bg-[#F9F7F3] border border-[var(--color-border-light)] rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* LEFT COLUMN: Not Simply Stress */}
            <div className="lg:col-span-6 flex flex-col justify-center p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-[var(--color-border-light)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
                <div className="flex-1 text-left">
                  <h3 className="font-serif-brand text-[24px] sm:text-[28px] font-normal leading-[1.25] text-[var(--color-accent-red)] block">
                    This Is Not Simply "Stress."
                  </h3>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--color-text-body)] font-medium font-sans">
                    In many individuals, there is an underlying state of chronic physiological overload affecting cellular energy production and neurological recovery.
                  </p>
                </div>
                
                {/* Abstract line-art circular brain profile SVG */}
                <div className="shrink-0 flex items-center justify-center bg-white p-3 rounded-full border border-[var(--color-border-light)]/50 shadow-inner">
                  <svg className="w-20 h-20 text-[#7A8C5E] opacity-80" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                    <circle cx="50" cy="50" r="46" strokeWidth="0.8" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="38" strokeWidth="0.5" />
                    <path d="M36 74C36 74 41 71 41 66C41 61 39 58 39 51C39 43 44 35 52 35C60 35 65 42 65 50C65 57 63 60 63 66C63 71 67 74 67 74" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="52" cy="48" r="12" strokeWidth="0.75" strokeDasharray="2 2" />
                    <circle cx="52" cy="48" r="1.5" fill="currentColor" />
                    <path d="M48 48C48 48 50 46 52 46S55 48 55 48" strokeLinecap="round" strokeWidth="0.75" />
                  </svg>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Conventional Approaches (with horizontal dotted sequential line of 4 items) */}
            <div className="lg:col-span-6 p-8 md:p-10 flex flex-col justify-between">
              <div>
                <h3 className="font-serif-brand text-[20px] sm:text-[22px] font-semibold leading-[1.3] text-[var(--color-text-primary)]">
                  Conventional Approaches Often Suppress Symptoms Without Restoring Function.
                </h3>
                
                {/* Horizontal sequential connected timeline list of 4 items */}
                <div className="relative mt-8">
                  {/* Connecting Line behind the items */}
                  <div className="absolute top-[21px] left-8 right-8 h-[1px] border-t border-dashed border-[var(--color-border-light)] z-0 hidden sm:block" />
                  
                  <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center items-start">
                    
                    <div className="flex flex-col items-center text-center gap-2 max-w-[105px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shadow-sm transition-colors hover:bg-red-50/15 relative z-10">
                        <RedXIcon />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-[var(--color-text-body)] mt-1">More caffeine.</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[105px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shadow-sm transition-colors hover:bg-red-50/15 relative z-10">
                        <RedXIcon />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Sleep aids.</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[105px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shadow-sm transition-colors hover:bg-red-50/15 relative z-10">
                        <RedXIcon />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Temporary stimulants.</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[105px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-white flex items-center justify-center shadow-sm transition-colors hover:bg-red-50/15 relative z-10">
                        <RedXIcon />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Short bursts of "wellness".</span>
                    </div>

                  </div>
                </div>
              </div>

              <p className="mt-8 text-[12.5px] text-[var(--color-text-muted)] italic font-bold border-t border-[var(--color-border-light)]/50 pt-4">
                But recovery cannot occur if the underlying physiology remains depleted.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5 — PROGRAM SECTION (Unified Combined Double-Column Card Container) */}
      <section id="program" className="w-full py-6 md:py-8 bg-[var(--color-bg-primary)]">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          
          <div className="w-full bg-[#F9F7F3] border border-[var(--color-border-light)] rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* LEFT COLUMN: Cellular Level Support (Cream Background with Top Green Bar) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#F9F7F3] border-b lg:border-b-0 lg:border-r border-[var(--color-border-light)]">
              {/* Upper Green Header Bar */}
              <div className="bg-[var(--color-bg-green-dark)] py-6 px-8 text-left">
                <h3 className="font-serif-brand text-[17px] sm:text-[18px] lg:text-[20px] font-normal leading-[1.3] text-white">
                  Our Brain & Mitochondrial Restorative Programs<br className="hidden lg:inline" /> Are Designed To Support Recovery At A Cellular Level.
                </h3>
              </div>

              {/* Cream Column Inner Body */}
              <div className="p-8 md:p-10 flex-1 flex flex-col justify-center gap-8">
                <p className="text-[14px] leading-relaxed text-[var(--color-text-body)] font-medium font-sans">
                  At the Institute of Precision Hormonal and Metabolic Health, these programs are structured around evaluating and supporting:
                </p>

                {/* 7 Cell Recovery indicators grid (4 top, 3 bottom) */}
                <div className="flex flex-col gap-6 w-full">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
                    
                    <div className="flex flex-col items-center text-center gap-2 max-w-[95px] group">
                      <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-105">
                        <MitoShapeIcon className="w-6 h-6 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Mitochondrial Function</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[95px] group">
                      <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-105">
                        <InflammatoryIcon className="w-6 h-6 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Inflammatory Burden</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[95px] group">
                      <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-105">
                        <OxidativeIcon className="w-6 h-6 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Oxidative Stress</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[95px] group">
                      <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-105">
                        <ScaleIcon className="w-6 h-6 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Metabolic Efficiency</span>
                    </div>

                  </div>

                  <div className="grid grid-cols-3 gap-2 justify-items-center sm:px-6">
                    
                    <div className="flex flex-col items-center text-center gap-2 max-w-[105px] group">
                      <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-105">
                        <VascularIcon className="w-6 h-6 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Vascular & Neuro Health</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[105px] group">
                      <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-105">
                        <FlaskIcon className="w-6 h-6 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Hormonal Contributors</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[105px] group">
                      <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-105">
                        <RecoveryWaveIcon className="w-6 h-6 text-[var(--color-accent-green)]" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Recovery Physiology</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Restorative Infusion Medicine (Cream Column with High-End Typography) */}
            <div className="lg:col-span-7 bg-[#F9F7F3] p-8 md:p-10 flex flex-col justify-between">
              <div>
                <h3 className="font-sans text-[26px] sm:text-[30px] font-bold leading-[1.15] text-[var(--color-text-primary)] tracking-tight text-left">
                  We Are Not A Recreational Wellness Therapy Center.
                  <span className="block mt-1 font-bold">It Is Structured Restorative Medicine.</span>
                </h3>
                
                <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-text-body)] font-medium">
                  Protocols include physician-supervised infusion therapies and targeted restorative interventions designed to support:
                </p>

                {/* Checklist inside 2 columns */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <CheckOutlineIcon />
                      <span className="text-[13.5px] font-medium text-[var(--color-text-body)]">Cellular energy production</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckOutlineIcon />
                      <span className="text-[13.5px] font-medium text-[var(--color-text-body)]">Neurological recovery</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckOutlineIcon />
                      <span className="text-[13.5px] font-medium text-[var(--color-text-body)]">Antioxidant defense systems</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckOutlineIcon />
                      <span className="text-[13.5px] font-medium text-[var(--color-text-body)]">Metabolic resilience</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <CheckOutlineIcon />
                      <span className="text-[13.5px] font-medium text-[var(--color-text-body)]">Cognitive performance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckOutlineIcon />
                      <span className="text-[13.5px] font-medium text-[var(--color-text-body)]">Hydration & micronutrient replenishment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Structured Connected Timeline Box at Bottom */}
              <div className="mt-10 bg-[#EDE8DF]/60 rounded-xl border border-[var(--color-border-light)]/50 p-5 md:p-6 shadow-inner">
                <p className="text-[12.5px] text-[var(--color-text-muted)] italic font-semibold mb-6">
                  Depending on clinical assessment, programs may include carefully selected combinations of:
                </p>
                
                {/* Connected Timeline */}
                <div className="relative mt-8">
                  {/* Connecting Line behind the items */}
                  <div className="absolute top-[21px] left-8 right-8 h-[1px] border-t border-dashed border-[var(--color-border-light)] z-0 hidden sm:block" />
                  
                  <div className="relative z-10 grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-2 justify-items-center items-start">
                    
                    <div className="flex flex-col items-center text-center gap-2 max-w-[85px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-[#F5F2EC] flex items-center justify-center shadow-sm transition-colors group-hover:bg-white relative">
                        <AminoAcidsIcon />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Amino Acids</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[85px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-[#F5F2EC] flex items-center justify-center shadow-sm transition-colors group-hover:bg-white relative">
                        <AntioxidantsIcon />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Antioxidants</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[85px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-[#F5F2EC] flex items-center justify-center shadow-sm transition-colors group-hover:bg-white relative">
                        <VitaminsIcon />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Vitamins & Micronutrients</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[85px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-[#F5F2EC] flex items-center justify-center shadow-sm transition-colors group-hover:bg-white relative">
                        <CofactorsIcon />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Metabolic Cofactors</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[85px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-[#F5F2EC] flex items-center justify-center shadow-sm transition-colors group-hover:bg-white relative">
                        <MitoSupportIcon />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Mitochondrial Support</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 max-w-[85px] group">
                      <div className="w-[42px] h-[42px] rounded-full border border-[var(--color-border-light)] bg-[#F5F2EC] flex items-center justify-center shadow-sm transition-colors group-hover:bg-white relative">
                        <NeuroSupportIcon />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-[var(--color-text-body)] mt-1">Neuro-Supportive</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 6 — "WHO THIS PROGRAM IS DESIGNED FOR" + "FUNCTIONAL RESTORATION" (Two side-by-side cards) */}
      <section className="w-full py-6 md:py-8 bg-[var(--color-bg-primary)]">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT CARD: Who Program is Designed For (Light Cream) */}
          <div className="lg:col-span-7 bg-[#F9F7F3] border border-[var(--color-border-light)] rounded-2xl p-8 md:p-10 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div>
              <h2 className="font-serif-brand text-[26px] sm:text-[28px] font-normal text-[var(--color-text-primary)]">
                Who This Program Is Designed For
              </h2>
              <p className="mt-2 text-[13.5px] font-semibold text-[var(--color-text-muted)]">
                Individuals experiencing:
              </p>

              {/* 3-column Checklist Grid */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Chronic fatigue and burnout</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Brain fog</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Poor concentration and mental clarity</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Executive fatigue</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Prolonged stress overload</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Reduced productivity & recovery</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Post-illness fatigue states</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Poor sleep-related recovery</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Cognitive exhaustion</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">High-performance burnout</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckOutlineIcon className="w-4.5 h-4.5 text-[var(--color-check-green)] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[var(--color-text-body)] font-medium leading-tight">Metabolic & inflammatory fatigue</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT CARD: Functional Restoration (Dark Burgundy background) */}
          <div className="lg:col-span-5 bg-[var(--color-bg-section-dark)] rounded-2xl p-8 md:p-10 text-white flex flex-col justify-between shadow-sm relative">
            <div>
              <h2 className="font-serif-brand text-[22px] sm:text-[24px] font-normal leading-[1.3] text-white">
                This Is About Functional Restoration.
              </h2>
              <p className="mt-2 text-[13.5px] text-white/80 leading-relaxed font-semibold">
                The objective is not temporary stimulation— but improving:
              </p>
            </div>

            {/* Row of 6 indicators with beautiful white borders */}
            <div className="mt-8 grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start justify-items-center">
              
              <div className="flex flex-col items-center text-center gap-2.5 group w-[75px] sm:w-[90px]">
                <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center bg-white/5 transition-colors group-hover:bg-white/15">
                  <BrainIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-white/90 mt-1">Mental Clarity</span>
              </div>

              <div className="flex flex-col items-center text-center gap-2.5 group w-[75px] sm:w-[90px]">
                <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center bg-white/5 transition-colors group-hover:bg-white/15">
                  <RecoveryIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-white/90 mt-1">Recovery Capacity</span>
              </div>

              <div className="flex flex-col items-center text-center gap-2.5 group w-[75px] sm:w-[90px]">
                <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center bg-white/5 transition-colors group-hover:bg-white/15">
                  <ShieldLeafIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-white/90 mt-1">Resilience</span>
              </div>

              <div className="flex flex-col items-center text-center gap-2.5 group w-[75px] sm:w-[90px]">
                <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center bg-white/5 transition-colors group-hover:bg-white/15">
                  <BatteryIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-white/90 mt-1">Sustained Energy</span>
              </div>

              <div className="flex flex-col items-center text-center gap-2.5 group w-[75px] sm:w-[90px]">
                <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center bg-white/5 transition-colors group-hover:bg-white/15">
                  <ConcentrationIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-white/90 mt-1">Cognitive Performance</span>
              </div>

              <div className="flex flex-col items-center text-center gap-2.5 group w-[75px] sm:w-[90px]">
                <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center bg-white/5 transition-colors group-hover:bg-white/15">
                  <RecoveryWaveIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-white/90 mt-1">Physiological Adaptability</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 7 — "EVERY PROGRAM IS INDIVIDUALIZED" SECTION (Single elegant card container) */}
      <section className="w-full py-2 bg-[var(--color-bg-primary)] px-6 md:px-10">
        <div className="mx-auto max-w-[1280px]">
          
          <div className="bg-[var(--color-bg-card-light)] border border-[var(--color-border-light)] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch shadow-sm">
            
            {/* LEFT BLOCK: Content (8 cols width on desktop to support horizontal split) */}
            <div className="md:col-span-8 p-8 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[var(--color-border-light)]">
              <h2 className="font-serif-brand text-[28px] sm:text-[34px] font-semibold leading-[1.2] text-[var(--color-text-primary)]">
                Every Program Is Individualized And Structured.
              </h2>
              
              {/* Horizontal split under the heading */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Subtext on the left (col-span-4) */}
                <div className="lg:col-span-4 lg:pr-4">
                  <p className="text-[14.5px] leading-relaxed text-[var(--color-text-muted)] font-medium">
                    No infusion is administered<br className="hidden lg:inline" /> casually or as a trend-based<br className="hidden lg:inline" /> intervention.
                  </p>
                </div>

                {/* Timeline on the right (col-span-8) */}
                <div className="lg:col-span-8 lg:border-l lg:border-[var(--color-border-light)]/60 lg:pl-6">
                  <p className="text-[14.5px] font-bold text-[var(--color-text-primary)] mb-4">
                    Each protocol is designed based on:
                  </p>
                  
                  {/* Connected timeline row of 5 indicators */}
                  <div className="relative mt-8">
                    {/* Connecting line */}
                    <div className="absolute top-[23px] left-8 right-8 h-[1px] border-t border-dashed border-[var(--color-border-light)] z-0 hidden sm:block" />
                    
                    <div className="relative z-10 grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-4 justify-items-center">
                      
                      <div className="flex flex-col items-center text-center gap-2.5 max-w-[95px] group">
                        <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-colors group-hover:bg-[#EDE8DF]">
                          <ClipboardIcon />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Clinical History</span>
                      </div>

                      <div className="flex flex-col items-center text-center gap-2.5 max-w-[95px] group">
                        <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-colors group-hover:bg-[#EDE8DF]">
                          <BarGraphIcon />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Metabolic Profile</span>
                      </div>

                      <div className="flex flex-col items-center text-center gap-2.5 max-w-[95px] group">
                        <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-colors group-hover:bg-[#EDE8DF]">
                          <InflammatoryIcon className="w-7 h-7 text-[var(--color-icon-stroke)]" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Inflammatory Status</span>
                      </div>

                      <div className="flex flex-col items-center text-center gap-2.5 max-w-[95px] group">
                        <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-colors group-hover:bg-[#EDE8DF]">
                          <MoonWaveIcon />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Recovery Patterns</span>
                      </div>

                      <div className="flex flex-col items-center text-center gap-2.5 max-w-[95px] group">
                        <div className="w-[46px] h-[46px] border border-[var(--color-border-light)] rounded-full flex items-center justify-center bg-white shadow-sm transition-colors group-hover:bg-[#EDE8DF]">
                          <PersonIcon />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-body)] leading-snug">Physiological Demands</span>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT BLOCK: Neural glowing hand (4 cols width on desktop) */}
            <div className="md:col-span-4 min-h-[300px] relative overflow-hidden bg-black flex items-center justify-center">
              <Image
                src="/images/landing/neural_glow_hand.png"
                alt="Artistic green glowing brain resting on open palm against a dark background"
                fill
                className="object-cover w-full h-full select-none"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              {/* Subtle green ambient lighting overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(138,186,122,0.15)_0%,transparent_80%)] pointer-events-none" />
            </div>

          </div>
          
        </div>
      </section>

      {/* SECTION 8 — FOOTER CTA BAR */}
      <section className="w-full bg-[var(--color-bg-primary)] px-6 md:px-10 py-2">
        <div className="mx-auto max-w-[1280px] bg-[#EDE8DF] border border-[var(--color-border-light)] rounded-2xl p-8 md:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Block (55%) with vertical divider */}
          <div className="lg:col-span-7 flex flex-col md:flex-row items-start gap-4 lg:border-r lg:border-[var(--color-border-light)] lg:pr-8">
            <div className="p-3 border border-[var(--color-border-light)] rounded-full bg-white text-[var(--color-icon-stroke)] shrink-0 shadow-sm">
              <LotusIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[14.5px] leading-relaxed text-black">
                Because true recovery is not created through stimulation alone.<br className="hidden lg:inline" /> It happens when the body and brain regain the biological capacity<br className="hidden lg:inline" /> to restore, repair, and function efficiently again.
              </p>
            </div>
          </div>

          {/* Right Block (45%) centered content */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <span className="font-serif-brand text-[18px] font-semibold text-[var(--color-accent-red)] text-center mb-4">
              Restoring Biology. Restoring You.
            </span>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center rounded px-5 py-2.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 bg-[var(--color-accent-green)] text-center shadow-sm"
              >
                Book Consultation &rarr;
              </Link>
              <Link
                href="#program"
                className="inline-flex items-center justify-center rounded border-[1.5px] px-5 py-2.5 text-[12.5px] font-semibold bg-transparent transition-colors hover:bg-[var(--color-accent-red)]/5 border-[var(--color-accent-red)] text-[var(--color-accent-red)] text-center"
              >
                Learn More About The Program &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 9 — FINAL POSITIONING (Frame 17 from Home Page) */}
      <section className="w-full bg-[#FEF9EF] pt-2 pb-8">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          
          {/* Left card: Final Positioning */}
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
              <EcgLine color="#6D7956" />
            </div>
          </div>

          {/* Right Content Block: Clinical Assessment */}
          <div className="flex flex-col items-center lg:items-end justify-center pl-0 lg:pl-10 text-center lg:text-right z-20">
            <h2 
              className="text-[#8A9E72] mb-4 font-normal tracking-normal whitespace-nowrap"
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
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 bg-[var(--color-accent-red)] text-center shadow-md animate-pulse-subtle"
              >
                Request A Consultation
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* SHARED CLINIC FOOTER COMPONENT */}
      <Footer />

    </div>
  );
}

