/**
 * Maps the `IconKey` string from services-config.ts to a real icon component.
 * Centralizing this lets the content config stay JSON-shaped and serialisable.
 */
import {
  ScaleIcon,
  LeafIcon,
  BrainIcon,
  DumbbellIcon,
  SparkleIcon,
  StethoscopeIcon,
  HeartPulseIcon,
  MicroscopeIcon,
  ShieldIcon,
  TargetIcon,
  ChartIcon,
  ClockIcon,
  AwardIcon,
} from "./icons";
import type { IconKey } from "./services-config";

const MAP = {
  scale: ScaleIcon,
  leaf: LeafIcon,
  brain: BrainIcon,
  dumbbell: DumbbellIcon,
  sparkle: SparkleIcon,
  stethoscope: StethoscopeIcon,
  heart: HeartPulseIcon,
  microscope: MicroscopeIcon,
  shield: ShieldIcon,
  target: TargetIcon,
  chart: ChartIcon,
  clock: ClockIcon,
  award: AwardIcon,
} as const;

export function ResolvedIcon({
  name,
  size = 24,
  className,
}: {
  name: IconKey;
  size?: number;
  className?: string;
}) {
  const Icon = MAP[name] ?? AwardIcon;
  return <Icon size={size} className={className} />;
}
