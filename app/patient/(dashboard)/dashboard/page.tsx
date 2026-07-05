"use client";

/**
 * Patient dashboard — real data only.
 *
 * Sources:
 *   - GET /api/patient/me                     profile + primary doctor
 *   - GET /api/patient/me/vitals              latest reading (cards)
 *   - GET /api/patient/me/appointments        upcoming + recent activity + doctors
 *   - GET /api/patient/me/treatment-plans     recent prescriptions/plans
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Calendar,
  ChevronRight,
  Heart,
  Loader2,
  Plus,
  Ruler,
  Stethoscope,
  Thermometer,
  Weight as WeightIcon,
  Droplets,
} from "lucide-react";

import { formatClinicDateShort, formatClinicTime } from "@/lib/date-utils";

type Profile = {
  id: string;
  fullName: string;
  patientNumber: string;
  primaryDoctor: { id: string; fullName: string } | null;
  knownAllergies?: string | null;
};

type VitalRow = {
  id: string;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  weightKg: number | null;
  heightCm: number | null;
  temperatureF: number | null;
  spo2: number | null;
  recordedAt: string;
};

type Vital = Omit<VitalRow, "id"> | null;

type Appt = {
  id: string;
  startsAt: string;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  reason: string | null;
  staff: { id: string; fullName: string; specialization: string | null } | null;
  department: { id: string; name: string } | null;
};

type Plan = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-[#FFFAEB] text-[#B54708]",
  CONFIRMED: "bg-[#EFF8FF] text-[#175CD3]",
  COMPLETED: "bg-[#ECFDF3] text-[#027A48]",
  CANCELLED: "bg-[#FEF3F2] text-[#B42318]",
  NO_SHOW: "bg-[#F2F4F7] text-[#475467]",
};

async function getList<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.data) ? (json.data as T[]) : [];
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vital, setVital] = useState<Vital | undefined>(undefined);
  const [vitalHistory, setVitalHistory] = useState<VitalRow[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [meRes, vitalsRes, apptList, planList] = await Promise.all([
        fetch("/api/patient/me", { credentials: "include" }),
        fetch("/api/patient/me/vitals", { credentials: "include" }),
        getList<Appt>("/api/patient/me/appointments?limit=50"),
        getList<Plan>("/api/patient/me/treatment-plans?limit=5"),
      ]);
      if (meRes.ok) {
        const j = await meRes.json();
        setProfile(j?.data ?? null);
      }
      if (vitalsRes.ok) {
        const j = await vitalsRes.json();
        setVital(j?.data?.latest ?? null);
        setVitalHistory(Array.isArray(j?.data?.history) ? j.data.history : []);
      } else {
        setVital(null);
        setVitalHistory([]);
      }
      setAppts(apptList);
      setPlans(planList);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      appts
        .filter(
          (a) =>
            new Date(a.startsAt).getTime() >= now &&
            (a.status === "REQUESTED" || a.status === "CONFIRMED"),
        )
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [appts, now],
  );
  const recent = useMemo(
    () =>
      [...appts]
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
        .slice(0, 6),
    [appts],
  );
  const doctors = useMemo(() => {
    const map = new Map<string, { id: string; fullName: string; sub: string }>();
    if (profile?.primaryDoctor) {
      map.set(profile.primaryDoctor.id, {
        id: profile.primaryDoctor.id,
        fullName: profile.primaryDoctor.fullName,
        sub: "Primary doctor",
      });
    }
    for (const a of appts) {
      if (a.staff && !map.has(a.staff.id)) {
        map.set(a.staff.id, {
          id: a.staff.id,
          fullName: a.staff.fullName,
          sub: a.staff.specialization ?? "Clinician",
        });
      }
    }
    return Array.from(map.values()).slice(0, 6);
  }, [appts, profile]);

  const bp = vital?.systolic && vital?.diastolic ? `${vital.systolic}/${vital.diastolic}` : null;

  const vitalCards = [
    { label: "Blood Pressure", value: bp, unit: "mmHg", icon: Heart, color: "text-[#D92D20]", bg: "bg-[#FEF3F2]" },
    { label: "Heart Rate", value: vital?.heartRate ?? null, unit: "bpm", icon: Activity, color: "text-[#6B2B26] dark:text-[#A5B4FC]", bg: "bg-[#6B2B26]/10 dark:bg-[#312E81]" },
    { label: "Weight", value: vital?.weightKg ?? null, unit: "kg", icon: WeightIcon, color: "text-[#175CD3]", bg: "bg-[#EFF8FF] dark:bg-[#1E3A5F]" },
    { label: "Height", value: vital?.heightCm ?? null, unit: "cm", icon: Ruler, color: "text-[#6938EF]", bg: "bg-[#F4F3FF] dark:bg-[#312E81]" },
    { label: "SpO₂", value: vital?.spo2 ?? null, unit: "%", icon: Droplets, color: "text-[#12B76A]", bg: "bg-[#ECFDF3]" },
    { label: "Temperature", value: vital?.temperatureF ?? null, unit: "°F", icon: Thermometer, color: "text-[#F79009]", bg: "bg-[#FFFAEB]" },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B2B26] dark:text-[#A5B4FC]" /> Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">
            Welcome{profile ? `, ${profile.fullName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            {profile ? `Patient #${profile.patientNumber}` : "Your health at a glance."}
          </p>
        </div>
        <button
          onClick={() => router.push("/patient/appointments/new")}
          className="bg-[#6B2B26] hover:bg-[#54201D] text-white rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Appointment
        </button>
      </div>

      {/* Drug allergy alert — surfaced from the latest RMO intake */}
      {profile?.knownAllergies ? (
        <div className="rounded-xl border-2 border-[#FDA29B] bg-[#FEF3F2] dark:border-[#7A271A] dark:bg-[#55160C] px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-[#D92D20]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#B42318]">Drug allergies on file</span>
          </div>
          <p className="mt-1 text-xl font-extrabold leading-tight text-[#B42318] whitespace-pre-wrap break-words">
            {profile.knownAllergies}
          </p>
          <p className="mt-1 text-xs text-[#B42318]/80">
            Always mention these to any clinician. Contact the clinic if this looks wrong.
          </p>
        </div>
      ) : null}

      {/* Vitals */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[#344054] dark:text-[#CBD5E1]">Latest vitals</h2>
          {vital ? (
            <span className="text-xs text-[#98A2B3] dark:text-[#94A3B8]">
              Recorded {new Date(vital.recordedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {vitalCards.map((c) => (
            <div key={c.label} className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">{c.label}</span>
                <span className={`h-7 w-7 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </span>
              </div>
              <div className="mt-2">
                {c.value !== null && c.value !== undefined ? (
                  <span className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">
                    {c.value}
                    <span className="text-xs font-normal text-[#98A2B3] dark:text-[#94A3B8] ml-1">{c.unit}</span>
                  </span>
                ) : (
                  <span className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">Not recorded</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {vitalHistory.length > 1 ? (
          <div className="mt-4 bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#667085] dark:text-[#94A3B8] mb-2">Vitals history</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#667085] dark:text-[#94A3B8] border-b border-[#EAECF0] dark:border-[#374151]">
                    <th className="py-2 pr-4 font-medium">Recorded</th>
                    <th className="py-2 pr-4 font-medium">BP (mmHg)</th>
                    <th className="py-2 pr-4 font-medium">HR (bpm)</th>
                    <th className="py-2 pr-4 font-medium">Weight (kg)</th>
                    <th className="py-2 pr-4 font-medium">Height (cm)</th>
                    <th className="py-2 pr-4 font-medium">Temp (°F)</th>
                    <th className="py-2 font-medium">SpO₂ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {vitalHistory.map((v) => (
                    <tr key={v.id} className="border-b border-[#F2F4F7] dark:border-[#374151] last:border-0 text-[#344054] dark:text-[#CBD5E1]">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatClinicDateShort(new Date(v.recordedAt))} • {formatClinicTime(new Date(v.recordedAt))}
                      </td>
                      <td className="py-2 pr-4">{v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : "—"}</td>
                      <td className="py-2 pr-4">{v.heartRate ?? "—"}</td>
                      <td className="py-2 pr-4">{v.weightKg ?? "—"}</td>
                      <td className="py-2 pr-4">{v.heightCm ?? "—"}</td>
                      <td className="py-2 pr-4">{v.temperatureF ?? "—"}</td>
                      <td className="py-2">{v.spo2 ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Doctors */}
        <Card title="My Doctors">
          {doctors.length === 0 ? (
            <Empty text="No doctors linked yet." />
          ) : (
            <ul className="flex flex-col divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {doctors.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3">
              <span className="h-9 w-9 rounded-full bg-[#6B2B26]/10 dark:bg-[#312E81] flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-[#6B2B26] dark:text-[#A5B4FC]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">{d.fullName}</p>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">{d.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Prescriptions / plans */}
        <Card title="Prescriptions" href="/patient/prescriptions" onNav={() => router.push("/patient/prescriptions")}>
          {plans.length === 0 ? (
            <Empty text="No prescriptions yet." />
          ) : (
            <ul className="flex flex-col divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {plans.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">{p.title}</p>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status] ?? STATUS_STYLE.REQUESTED}`}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card title="Recent Activity">
          {recent.length === 0 ? (
            <Empty text="No appointments yet." />
          ) : (
            <ul className="flex flex-col gap-3">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-col gap-0.5 border-l-2 border-[#EAECF0] dark:border-[#374151] pl-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">
                      {a.staff?.fullName ?? "Appointment"}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[a.status] ?? STATUS_STYLE.REQUESTED}`}>
                      {a.status}
                    </span>
                  </div>
                  <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
                    {formatClinicDateShort(new Date(a.startsAt))}
                    {" · "}
                    {formatClinicTime(new Date(a.startsAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Upcoming */}
      <Card title="Upcoming Appointments" onNav={() => router.push("/patient/appointments")}>
        {upcoming.length === 0 ? (
          <Empty text="No upcoming appointments. Book one to get started." />
        ) : (
          <ul className="flex flex-col divide-y divide-[#EAECF0] dark:divide-[#374151]">
            {upcoming.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-[#6B2B26]/10 dark:bg-[#312E81] flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-[#6B2B26] dark:text-[#A5B4FC]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">
                      {a.staff?.fullName ?? "Doctor"}{a.department ? ` · ${a.department.name}` : ""}
                    </p>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      {formatClinicDateShort(new Date(a.startsAt))}
                      {" · "}
                      {formatClinicTime(new Date(a.startsAt))}
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[a.status] ?? STATUS_STYLE.REQUESTED}`}>
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
  onNav,
}: {
  title: string;
  href?: string;
  onNav?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">{title}</h2>
        {onNav ? (
          <button onClick={onNav} className="text-[#667085] dark:text-[#94A3B8] hover:text-[#6B2B26] dark:hover:text-[#A5B4FC]">
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-[#667085] dark:text-[#94A3B8] py-4">{text}</p>;
}
