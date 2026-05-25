"use client";

/**
 * Patient-side Reports page.
 *
 * Visual cleanup (2026-05) to match the rest of the patient dashboard
 * (Lab Management, Prescriptions, Dashboard):
 *   - Emoji-as-icons replaced with lucide-react icons
 *   - Inconsistent palette (#646464/#D0D0D0/#ACB5BD) normalised to the
 *     project's standard tokens (#667085/#EAECF0/#101828/#2E37A4)
 *   - Chart.js callback typed properly (no `any`)
 *   - Card radius bumped to rounded-xl to match the rest of the dashboard
 *   - Header gets the same title + subtitle treatment used elsewhere
 *
 * Charts are still client-side Chart.js rendered into a <canvas>. The
 * statistics tiles use the same dashboard-style colored backgrounds.
 *
 * NOTE: data is still static mock today. Wire up to a real reports API
 * (`/api/patient/me/reports` or similar) when the backend lands.
 */

import { useEffect, useRef } from "react";
import type { ScriptableContext } from "chart.js";
import {
  Calendar,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FlaskConical,
  FileText,
} from "lucide-react";

// ─── Mini Donut (SVG, no Chart.js dep) ─────────────────────────────────

interface MiniDonutProps {
  percentage: number;
  color: string;
  size?: number;
}

function MiniDonut({ percentage, color, size = 60 }: MiniDonutProps) {
  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (percentage / 100) * circumference;
  const gap = circumference - filled;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F2F4F7" strokeWidth={8} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${filled} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={size / 4.5}
        fontWeight={700}
        fill="#101828"
        fontFamily="Inter, sans-serif"
      >
        {percentage}%
      </text>
    </svg>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 bg-[#F2F4F7] rounded-full overflow-hidden flex-shrink-0">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── Disease Timeline (Chart.js line) ──────────────────────────────────

function DiseaseTimelineChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;
    void import("chart.js/auto").then(({ default: Chart }) => {
      if (destroyed) return;
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();

      const gradient = (color: string) => (ctx: ScriptableContext<"line">) => {
        const c = ctx.chart.ctx;
        const g = c.createLinearGradient(0, 0, 0, 320);
        g.addColorStop(0, `${color}33`); // ~20% opacity
        g.addColorStop(1, `${color}00`);
        return g;
      };

      new Chart(canvas, {
        type: "line",
        data: {
          labels: ["Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26"],
          datasets: [
            seriesConfig("Diabetes", [3, 4, 3.5, 5, 4.2, 5.5], "#12B76A", gradient("#12B76A")),
            seriesConfig("Lab Tests", [4, 3.2, 4.5, 3.8, 4.8, 4], "#0BA5EC", gradient("#0BA5EC")),
            seriesConfig("Respiratory Infection", [2, 3.5, 2.8, 4, 3, 3.5], "#F04438", gradient("#F04438")),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#101828",
              titleFont: { family: "Inter", size: 12, weight: "bold" },
              bodyFont: { family: "Inter", size: 12 },
              padding: 10,
              cornerRadius: 8,
              displayColors: true,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#98A2B3", font: { size: 12, family: "Inter" } },
            },
            y: {
              grid: { color: "#F2F4F7", drawTicks: false },
              border: { dash: [4, 4] },
              ticks: {
                color: "#98A2B3",
                font: { size: 12, family: "Inter" },
                stepSize: 1,
                padding: 10,
              },
              min: 0,
              max: 6,
            },
          },
        },
      });
    });

    return () => {
      destroyed = true;
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

type GradientFn = (ctx: ScriptableContext<"line">) => CanvasGradient;

function seriesConfig(label: string, data: number[], color: string, bg: GradientFn) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: bg,
    tension: 0.4,
    fill: true,
    borderWidth: 2.5,
    pointRadius: 4,
    pointBackgroundColor: color,
    pointBorderColor: "#fff",
    pointBorderWidth: 2,
  };
}

// ─── Medication Donut (Chart.js doughnut) ──────────────────────────────

function MedicationDonutChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;
    void import("chart.js/auto").then(({ default: Chart }) => {
      if (destroyed) return;
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();

      new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: ["Antibiotics", "Diabetes", "Thyroid"],
          datasets: [
            {
              data: [21, 70, 9],
              backgroundColor: ["#0BA5EC", "#FDB022", "#2E37A4"],
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
              },
              backgroundColor: "#101828",
              cornerRadius: 8,
              padding: 10,
            },
          },
        },
      });
    });

    return () => {
      destroyed = true;
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

// ─── Page ──────────────────────────────────────────────────────────────

export default function PatientReportsPage() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Health Reports</h1>
          <p className="text-sm text-[#667085] mt-1">
            An overview of your appointments, prescriptions, and clinical trends.
          </p>
        </div>
      </div>

      {/* ── Stat tiles row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <SplitDonutCard
          left={{ label: "Total Online Appointments", value: "30%", color: "#12B76A", percent: 30 }}
          right={{ label: "Total In-Person Appointments", value: "70%", color: "#0BA5EC", percent: 70 }}
        />

        <CountCard
          rows={[
            { icon: <FlaskConical className="h-5 w-5 text-[#2E37A4]" />, label: "Lab Tests", value: "05" },
            { icon: <FileText className="h-5 w-5 text-[#2E37A4]" />, label: "Prescriptions", value: "15" },
          ]}
        />

        <ProgressCard
          left={{ label: "Treatment Completed", value: "07", color: "#2E37A4", pct: 62 }}
          right={{ label: "Medications Prescribed", value: "15", color: "#FF6B0F", pct: 62 }}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Disease Timeline */}
        <div className="lg:col-span-2 bg-white border border-[#EAECF0] rounded-xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-[#EAECF0] px-6 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#2E37A4]" />
              <h3 className="text-base font-bold text-[#101828]">Disease Timeline</h3>
            </div>
            <select
              defaultValue="Last 6 Months"
              className="px-3 py-1.5 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#344054] font-medium focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4] transition-all"
            >
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="relative h-[250px] w-full">
              <DiseaseTimelineChart />
            </div>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2">
              {[
                { color: "#12B76A", label: "Diabetes" },
                { color: "#0BA5EC", label: "Lab Tests" },
                { color: "#F04438", label: "Respiratory Infection" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: l.color }}
                  />
                  <span className="text-sm text-[#667085] font-medium">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medication Stats */}
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-[#EAECF0] px-6 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#2E37A4]" />
              <h3 className="text-base font-bold text-[#101828]">Medication Stats</h3>
            </div>
            <select
              defaultValue="2026"
              className="px-3 py-1.5 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#344054] font-medium focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4] transition-all"
            >
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="p-6 flex flex-col gap-5">
            <div className="relative h-[200px] flex items-center justify-center">
              <MedicationDonutChart />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[#101828]">70%</span>
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                  Diabetes
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { color: "#0BA5EC", label: "Antibiotics", pct: "21%" },
                { color: "#FDB022", label: "Diabetes", pct: "70%" },
                { color: "#2E37A4", label: "Thyroid", pct: "9%" },
              ].map((l) => (
                <div key={l.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: l.color }}
                    />
                    <span className="text-sm font-medium text-[#344054]">{l.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[#101828]">{l.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Latest Appointments */}
        <SectionCard
          icon={<Calendar className="h-5 w-5 text-[#0BA5EC]" />}
          title="Latest Appointments"
          action={{ label: "View all", href: "/patient/appointments" }}
        >
          {[
            { name: "Dr. Sumit Mittal", type: "In Person", bg: "#ECFDF3", fg: "#027A48" },
            { name: "Dr. Sarita Jain", type: "Online", bg: "#EFF8FF", fg: "#175CD3" },
          ].map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between py-3 border-b border-[#F2F4F7] last:border-0"
            >
              <span className="text-sm font-semibold text-[#101828]">{a.name}</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: a.bg, color: a.fg }}
              >
                {a.type}
              </span>
            </div>
          ))}
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard
          icon={<Activity className="h-5 w-5 text-[#7A5AF8]" />}
          title="Recent Activity"
        >
          {[
            { dot: "#12B76A", text: "Prescription downloaded", time: "2 minutes ago" },
            { dot: "#F79009", text: "Appointment rescheduled", time: "15 minutes ago" },
          ].map((a) => (
            <div key={a.text} className="flex items-start gap-3 py-2.5">
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: a.dot }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#101828]">{a.text}</p>
                <p className="text-xs text-[#667085] mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Performance */}
        <SectionCard
          icon={<TrendingUp className="h-5 w-5 text-[#12B76A]" />}
          title="Performance"
        >
          {[
            { label: "Patient Satisfaction", val: "4.8/5.0", trend: "up" as const },
            { label: "Attendance Rate", val: "94%", trend: "up" as const },
          ].map((p) => (
            <div
              key={p.label}
              className="flex items-center justify-between py-3 border-b border-[#F2F4F7] last:border-0"
            >
              <span className="text-sm font-medium text-[#667085]">{p.label}</span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-[#027A48]">
                {p.trend === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {p.val}
              </span>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Reusable cards ────────────────────────────────────────────────────

function SplitDonutCard({
  left,
  right,
}: {
  left: { label: string; value: string; color: string; percent: number };
  right: { label: string; value: string; color: string; percent: number };
}) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-5 flex items-center gap-5">
      <SplitDonutColumn {...left} />
      <div className="h-16 w-px bg-[#EAECF0]" />
      <SplitDonutColumn {...right} />
    </div>
  );
}

function SplitDonutColumn({
  label,
  value,
  color,
  percent,
}: {
  label: string;
  value: string;
  color: string;
  percent: number;
}) {
  return (
    <div className="flex-1 flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-[#667085] font-semibold uppercase tracking-wider leading-tight">
          {label}
        </span>
        <span className="text-2xl font-bold text-[#101828]">{value}</span>
      </div>
      <MiniDonut percentage={percent} color={color} size={64} />
    </div>
  );
}

function CountCard({
  rows,
}: {
  rows: { icon: React.ReactNode; label: string; value: string }[];
}) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-5 flex flex-col justify-center gap-3">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F4F5FF] flex items-center justify-center">
                {r.icon}
              </div>
              <span className="text-sm font-medium text-[#344054]">{r.label}</span>
            </div>
            <span className="text-2xl font-bold text-[#101828]">{r.value}</span>
          </div>
          {i < rows.length - 1 ? <div className="h-px bg-[#EAECF0]" /> : null}
        </div>
      ))}
    </div>
  );
}

function ProgressCard({
  left,
  right,
}: {
  left: { label: string; value: string; color: string; pct: number };
  right: { label: string; value: string; color: string; pct: number };
}) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-5 flex flex-col gap-4">
      <ProgressRow {...left} />
      <div className="h-px bg-[#EAECF0]" />
      <ProgressRow {...right} />
    </div>
  );
}

function ProgressRow({
  label,
  value,
  color,
  pct,
}: {
  label: string;
  value: string;
  color: string;
  pct: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center gap-2">
        <span className="text-sm text-[#667085] font-medium leading-tight">{label}</span>
        <span className="text-2xl font-bold text-[#101828]">{value}</span>
      </div>
      <ProgressBar value={pct} max={100} color={color} />
    </div>
  );
}

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-[#101828]">{title}</h3>
        </div>
        {action ? (
          <a
            href={action.href}
            className="text-xs font-bold text-[#2E37A4] hover:underline"
          >
            {action.label}
          </a>
        ) : null}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
