"use client";

import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MiniDonutProps {
  percentage: number;
  color: string;
  size?: number;
}

// ─── Mini Donut SVG (replaces canvas, no Chart.js dep needed for small donuts) ─
function MiniDonut({ percentage, color, size = 72 }: MiniDonutProps) {
  const r = 28;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (percentage / 100) * circumference;
  const gap = circumference - filled;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Background track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#E6E6E6"
        strokeWidth="8"
      />
      {/* Filled arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${filled} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{
      width: "100%",
      height: 8,
      background: "#ECECEC",
      borderRadius: 12,
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        background: color,
        borderRadius: 12,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

// ─── Line Chart (Disease Timeline) ────────────────────────────────────────────
function DiseaseTimelineChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamic import for Chart.js (works in Next.js)
    import("chart.js/auto").then(({ default: Chart }) => {
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();

      new Chart(canvas, {
        type: "line",
        data: {
          labels: ["Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26"],
          datasets: [
            {
              label: "Diabetes",
              data: [3, 4, 3.5, 5, 4.2, 5.5],
              borderColor: "#56CA00",
              backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, "rgba(86, 202, 0, 0.175)");
                gradient.addColorStop(1, "rgba(86, 202, 0, 0)");
                return gradient;
              },
              tension: 0.4,
              fill: true,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: "#56CA00",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
            {
              label: "Lab Tests",
              data: [4, 3.2, 4.5, 3.8, 4.8, 4],
              borderColor: "#16B1FF",
              backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, "rgba(22, 177, 255, 0.175)");
                gradient.addColorStop(1, "rgba(22, 177, 255, 0)");
                return gradient;
              },
              tension: 0.4,
              fill: true,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: "#16B1FF",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
            {
              label: "Respiratory Infection",
              data: [2, 3.5, 2.8, 4, 3, 3.5],
              borderColor: "#FF4C51",
              backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, "rgba(255, 76, 81, 0.175)");
                gradient.addColorStop(1, "rgba(255, 76, 81, 0)");
                return gradient;
              },
              tension: 0.4,
              fill: true,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: "#FF4C51",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#141414",
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
              ticks: { color: "#959596", font: { size: 13, family: "Inter" } },
            },
            y: {
              grid: { 
                color: "#E8E8E8",
                drawTicks: false,
                tickBorderDash: [4, 4],
              },
              border: { dash: [4, 4] },
              ticks: { 
                color: "#959596", 
                font: { size: 13, family: "Inter" },
                stepSize: 1,
                padding: 10
              },
              min: 0,
              max: 6,
            },
          },
        },
      });
    });
  }, []);

  return <canvas ref={canvasRef} />;
}

// ─── Donut Chart (Medication Stats) ───────────────────────────────────────────
function MedicationDonutChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    import("chart.js/auto").then(({ default: Chart }) => {
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();

      new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: ["Antibiotics", "Diabetes", "Thyroid"],
          datasets: [
            {
              data: [21, 70, 9],
              backgroundColor: ["#1FC6C6", "#F5C842", "#2563eb"],
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
            },
          },
        },
      });
    });
  }, []);

  return <canvas ref={canvasRef} />;
}

// ─── Full Page ────────────────────────────────────────────────────────────────
export default function PatientReportsPage() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 bg-[#F9FAFB]">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#141414]">Patient Reports</h1>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Card 1: Online + In-Person */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-6 shadow-sm flex items-center gap-8 divide-x divide-[#ACB5BD]">
          <div className="flex-1 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[#646464] font-medium leading-tight">Total Online<br/>Appointments</span>
              <span className="text-2xl font-bold text-[#141414]">30%</span>
            </div>
            <MiniDonut percentage={30} color="#56CA00" size={60} />
          </div>
          <div className="flex-1 flex items-center justify-between gap-4 pl-8">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[#646464] font-medium leading-tight">Total In-Person<br/>Appointments</span>
              <span className="text-2xl font-bold text-[#141414]">70%</span>
            </div>
            <MiniDonut percentage={70} color="#16B1FF" size={60} />
          </div>
        </div>

        {/* Card 2: Lab Tests + Prescriptions */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-6 shadow-sm flex flex-col justify-center gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#646464] font-medium">Lab Tests</span>
            <span className="text-2xl font-bold text-[#141414]">05</span>
          </div>
          <div className="h-px bg-[#ACB5BD] w-full" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#646464] font-medium">Prescriptions</span>
            <span className="text-2xl font-bold text-[#141414]">15</span>
          </div>
        </div>

        {/* Card 3: Treatment + Medications */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-6 shadow-sm flex items-center gap-8 divide-x divide-[#ACB5BD]">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-[#646464] font-medium leading-tight">Treatment<br/>Completed</span>
              <span className="text-2xl font-bold text-[#141414]">07</span>
            </div>
            <ProgressBar value={62} max={100} color="#2E37A4" />
          </div>
          <div className="flex-1 flex flex-col gap-4 pl-8">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-[#646464] font-medium leading-tight">Medications<br/>Prescribed</span>
              <span className="text-2xl font-bold text-[#141414]">15</span>
            </div>
            <ProgressBar value={62} max={100} color="#FF6B0F" />
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disease Timeline */}
        <div className="lg:col-span-2 bg-white border border-[#D0D0D0] rounded-lg p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#ACB5BD] pb-4">
            <h3 className="text-base font-medium text-[#141414] font-inter">Disease Timeline</h3>
            <select className="px-5 py-1 border border-[#ACB5BD] rounded-lg bg-[#FBFDFC] text-base text-[#141414] outline-none cursor-pointer hover:border-[#2E37A4] transition-colors">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="relative h-[250px] w-full">
            <DiseaseTimelineChart />
          </div>
          <div className="flex justify-center items-center gap-10 mt-2">
            {[
              { color: "#56CA00", label: "Diabetes" },
              { color: "#16B1FF", label: "Lab Tests" },
              { color: "#FF4C51", label: "Respiratory Infection" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-none" style={{ backgroundColor: l.color }} />
                <span className="text-base text-[#646464] font-inter">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Medication Stats */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-[#141414] font-inter">Medication Stats</h3>
            <select className="px-5 py-1 border border-[#ACB5BD] rounded-lg bg-[#FBFDFC] text-base text-[#141414] outline-none cursor-pointer hover:border-[#2E37A4] transition-colors">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="relative h-[220px] flex items-center justify-center">
            <MedicationDonutChart />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[#141414]">39%</span>
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Thyroid</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            {[
              { color: "#1FC6C6", label: "Antibiotics", pct: "21%" },
              { color: "#F5C842", label: "Diabetes", pct: "70%" },
              { color: "#2563eb", label: "Thyroid", pct: "9%" },
            ].map((l) => (
              <div key={l.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-sm font-medium text-[#646464]">{l.label}</span>
                </div>
                <span className="text-sm font-bold text-[#141414]">{l.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Latest Appointments */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">📅</span>
              <h3 className="text-sm font-bold text-[#141414]">Latest Appointments</h3>
            </div>
            <button className="text-xs font-bold text-[#2E37A4] hover:underline bg-transparent border-none cursor-pointer">View all</button>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { name: "Dr. Sumit Mittal", type: "In Person", color: "text-[#059669] bg-[#ECFDF5]" },
              { name: "Dr. Sarita Jain", type: "Online", color: "text-[#2563eb] bg-[#EFF6FF]" },
            ].map((a) => (
              <div key={a.name} className="flex items-center justify-between py-2 border-b border-[#F2F4F7] last:border-0">
                <span className="text-sm font-bold text-[#344054]">{a.name}</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${a.color}`}>{a.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-purple-500">⚡</span>
            <h3 className="text-sm font-bold text-[#141414]">Recent Activity</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { dot: "bg-green-500", text: "Prescription Downloaded", time: "2 minutes ago" },
              { dot: "bg-orange-500", text: "Appointment Rescheduled", time: "15 minutes ago" },
            ].map((a) => (
              <div key={a.text} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.dot}`} />
                <div>
                  <p className="m-0 text-sm font-bold text-[#344054]">{a.text}</p>
                  <p className="m-0 text-[10px] font-medium text-[#667085]">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">📈</span>
            <h3 className="text-sm font-bold text-[#141414]">Performance</h3>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Patient Satisfaction", val: "4.8/5.0", color: "text-green-600" },
              { label: "Attendance Rate", val: "94%", color: "text-green-600" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between py-2 border-b border-[#F2F4F7] last:border-0">
                <span className="text-sm font-medium text-[#667085]">{p.label}</span>
                <span className={`text-sm font-bold ${p.color}`}>{p.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center border-t border-[#EAECF0]">
        <p className="m-0 text-xs text-[#6C7688] font-bold">Copyright © 2026 - Vyara.</p>
      </footer>
    </div>
  );
}