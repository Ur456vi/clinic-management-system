/**
 * Inline SVG icons used across the public landing pages.
 *
 * The Figma uses a thin-stroke, outlined icon style (lucide-react would be a
 * good fit but the Figma icons aren't 1:1 with lucide). These are hand-rolled
 * approximations sized to match the design (24px stroke 1.5).
 *
 * NOTE: doctor portraits, woman portrait, clinic photo, ECG illustration, and
 * the honeycomb hero pattern are placeholder graphics. Drop the real exports
 * into /public/images/landing/ to replace.
 */
import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function svg({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PhoneIcon = (p: IconProps) =>
  svg({ ...p, children: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.84.59 2.8.72a2 2 0 0 1 1.73 2.01z" /> });

export const FacebookIcon = (p: IconProps) =>
  svg({ ...p, children: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> });

export const InstagramIcon = (p: IconProps) =>
  svg({ ...p, children: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></> });

export const TwitterIcon = (p: IconProps) =>
  svg({ ...p, children: <path d="M22 5.8a8.5 8.5 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.6 1 4.2 4.2 0 0 0-7.2 3.8A11.9 11.9 0 0 1 3 4.5a4.2 4.2 0 0 0 1.3 5.6 4.2 4.2 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.5 8.5 0 0 1 2 18.6a11.9 11.9 0 0 0 6.5 1.9c7.8 0 12-6.5 12-12v-.5A8.6 8.6 0 0 0 22 5.8z" /> });

export const LinkedInIcon = (p: IconProps) =>
  svg({ ...p, children: <><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M6 9v8M6 6.5h.01M10 17V10m0 0v-1m0 1c.7-1 1.7-1.5 3-1.5 2 0 3 1.4 3 3.5V17" /></> });

export const ArrowRightIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></> });

export const CheckCircleIcon = (p: IconProps) =>
  svg({ ...p, children: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></> });

export const XCircleIcon = (p: IconProps) =>
  svg({ ...p, children: <><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6m0-6 6 6" /></> });

export const ShieldIcon = (p: IconProps) =>
  svg({ ...p, children: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> });

export const ClockIcon = (p: IconProps) =>
  svg({ ...p, children: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> });

export const StethoscopeIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 14v3a5 5 0 0 0 10 0" /><circle cx="20" cy="9" r="2" /></> });

export const HeartPulseIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M3 12h3l2-5 4 10 2-5h7" /></> });

export const MicroscopeIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M6 18h12" /><path d="M9 18a4 4 0 1 1 8 0" /><path d="M12 4v6" /><path d="M10 4h4l1 4h-6z" /></> });

export const BrainIcon = (p: IconProps) =>
  svg({ ...p, children: <path d="M12 5a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 1.5 2.6A3 3 0 0 0 9 18a3 3 0 0 0 3-2 3 3 0 0 0 3 2 3 3 0 0 0 1.5-4.4A3 3 0 0 0 18 11a3 3 0 0 0-3-3 3 3 0 0 0-3-3z" /> });

export const DumbbellIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M6 5v14M2 9v6M22 9v6M18 5v14M6 12h12" /></> });

export const SparkleIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></> });

export const LeafIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M11 20A7 7 0 0 1 4 13c0-4 3-7 9-9 .6 5-1 9-3 11" /><path d="M2 21c3-3 6-4 9-4" /></> });

export const ScaleIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M3 6h18M12 3v3M6 6l-3 7a4 4 0 0 0 6 0L6 6zm12 0-3 7a4 4 0 0 0 6 0l-3-7zM6 21h12M12 6v15" /></> });

export const AwardIcon = (p: IconProps) =>
  svg({ ...p, children: <><circle cx="12" cy="8" r="6" /><path d="m9 14-1.5 7L12 18l4.5 3L15 14" /></> });

export const TargetIcon = (p: IconProps) =>
  svg({ ...p, children: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></> });

export const ChartIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M3 3v18h18" /><path d="m7 15 4-4 4 4 5-7" /></> });

export const MapPinIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></> });

export const MailIcon = (p: IconProps) =>
  svg({ ...p, children: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 6 10 7 10-7" /></> });

export const CalendarIcon = (p: IconProps) =>
  svg({ ...p, children: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> });

export const UserIcon = (p: IconProps) =>
  svg({ ...p, children: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> });

export const QuoteIcon = (p: IconProps) =>
  svg({ ...p, children: <><path d="M7 17V8h-3v9zM17 17V8h-3v9z" fill="currentColor" /></> });

export const StarIcon = (p: IconProps) =>
  svg({ ...p, children: <path d="M12 2 15.1 8.6 22 9.3l-5 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-4.9 6.9-.7z" fill="currentColor" /> });

export const ChevronDownIcon = (p: IconProps) =>
  svg({ ...p, children: <path d="m6 9 6 6 6-6" /> });

export const MetabolicProgramIcon = (p: IconProps) =>
  svg({
    ...p,
    children: (
      <>
        {/* Central leaf */}
        <path d="M12 3c2 4 2 12 0 18c-2-6-2-14 0-18z" />

        {/* Inner right */}
        <path d="M12 19c2-3 6-6.5 6.5-11c-2 .5-5 4-6.5 8.5z" />

        {/* Inner left */}
        <path d="M12 19c-2-3-6-6.5-6.5-11c2 .5 5 4 6.5 8.5z" />

        {/* Outer right */}
        <path d="M12 20c4-2 9.5-5 10-7.5c-2.5.5-7 3.5-10 6z" />

        {/* Outer left */}
        <path d="M12 20c-4-2-9.5-5-10-7.5c2.5.5 7 3.5 10 6z" />
      </>
    ),
  });

export const MetabolicRestorationIcon = (p: IconProps) =>
  svg({
    ...p,
    children: (
      <>
        <circle cx="12" cy="11.5" r="9.5" />
        <path d="M 12 21 v 2" />
        <path d="M 12 5.5 C 13.5 8.5, 13.5 13.5, 12 15.5 C 10.5 13.5, 10.5 8.5, 12 5.5 Z" />
        <path d="M 12 15.5 C 10.5 14, 7.5 12, 7.5 9 C 9 9.5, 11 12, 12 15.5 Z" />
        <path d="M 12 15.5 C 13.5 14, 16.5 12, 16.5 9 C 15 9.5, 13 12, 12 15.5 Z" />
        <circle cx="12" cy="15.5" r="1.5" />
      </>
    ),
  });

export const HormonalBalanceIcon = (p: IconProps) =>
  svg({
    ...p,
    children: (
      <>
        <path d="M 21.5 11.5 A 9.5 9.5 0 1 1 18.7 5.3" />
        <path d="M 14 5 h 5 v 5" />
        <path d="M 10 14 C 9 13, 8 11, 8.5 9 C 9 7.5, 11 7, 12.5 8.5 C 14 10, 14.5 12, 14 13.5 C 13.5 14.5, 12 15, 10 14 Z" />
        <path d="M 10 14 L 7.5 16.5" />
      </>
    ),
  });

export const BodyCompositionIcon = (p: IconProps) =>
  svg({
    ...p,
    children: (
      <>
        <circle cx="6" cy="18" r="1.5" />
        <path d="M 7 17 L 16 8" />
        <path d="M 16 8 C 18 7, 19 8, 19 10" />
        <path d="M 14 10 C 16 11, 17 11, 19 10" />
        <path d="M 19 7 C 20.5 8, 20.5 12, 19 13" />
        <path d="M 9 13 A 5 5 0 0 1 13 17" />
        <path d="M 10 14.5 L 9.5 14 M 11.5 15.5 L 11 15" />
        <path d="M 12 12 L 13.5 13.5" />
      </>
    ),
  });

export const LongTermHealthIcon = (p: IconProps) =>
  svg({
    ...p,
    children: (
      <>
        <path d="M 12 2.5 C 16 2.5, 20 4.5, 20 9.5 C 20 15.5, 12 21.5, 12 21.5 C 12 21.5, 4 15.5, 4 9.5 C 4 4.5, 8 2.5, 12 2.5 Z" />
        <path d="M 12 15.5 C 12 15.5, 8.5 12.5, 8.5 10 C 8.5 8.5, 10 7.5, 12 9.5 C 14 7.5, 15.5 8.5, 15.5 10 C 15.5 12.5, 12 15.5, 12 15.5 Z" />
        <path d="M 12 9.5 V 13 M 10.25 11.25 H 13.75" />
      </>
    ),
  });
