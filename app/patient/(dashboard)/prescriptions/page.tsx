"use client";

/**
 * Patient-side Prescriptions page.
 *
 * Visual rewrite (2026-05) to match the Lab Management page and the rest
 * of the patient dashboard. The previous version used `dark:` variants
 * extensively but the dashboard shell has a hard-coded light background,
 * so toggling theme made the "Prescription" heading invisible and the
 * table render as a dark slab.
 *
 * Behaviour preserved: client-side list + detail view, search & sort,
 * patient profile fetched from `/api/patient/me` and shown on the detail
 * page. List data is still the static MOCK array — wire it to a real
 * `/api/patient/me/prescriptions` endpoint when the backend lands.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  Download,
  Filter,
  Info,
  MoreVertical,
  Search,
  Share2,
  FileText,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────

interface Medicine {
  sno: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  timings: string;
}

interface Prescription {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  category: string;
  patientName?: string;
  patientId?: string;
  gender?: string;
  bloodGroup?: string;
  consultationType?: string;
  medicines?: Medicine[];
  followUpDate?: string;
  notes?: string;
}

interface PatientProfile {
  name: string;
  id: string;
  gender: string;
  bloodGroup: string;
}

// ─── Mock list (TODO: replace with /api/patient/me/prescriptions) ────────

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "#PRE0025",
    doctorName: "Dr. Sumit Mittal",
    specialty: "Cardiologist",
    date: "30 Apr 2025",
    category: "Cardiology Prescription",
    consultationType: "Video",
    medicines: [
      { sno: "01", name: "Ecosprin 75MG", dosage: "75mg", frequency: "1-0-1", duration: "1 month", timings: "Before meal" },
      { sno: "02", name: "Axer 90MG Tab", dosage: "90 mg", frequency: "1-1-1", duration: "1 month", timings: "After meal" },
    ],
    followUpDate: "30 Jun 2025",
  },
  {
    id: "#PRE0024",
    doctorName: "Dr. Akanksha Jain",
    specialty: "Orthopedic Surgeon",
    date: "15 Apr 2025",
    category: "Orthopedic Prescription",
    consultationType: "In-Person",
    medicines: [
      { sno: "01", name: "Ibuprofen 400mg", dosage: "400mg", frequency: "1-0-1", duration: "2 weeks", timings: "After meal" },
    ],
    followUpDate: "15 May 2025",
  },
  {
    id: "#PRE0023",
    doctorName: "Dr. Sonali Mittal",
    specialty: "Pediatrician",
    date: "02 Apr 2025",
    category: "General Prescription",
    consultationType: "In-Person",
    medicines: [],
    followUpDate: "",
  },
  {
    id: "#PRE0022",
    doctorName: "Dr. Tarun Gupta",
    specialty: "Gynecologist",
    date: "27 Mar 2025",
    category: "Gynecology Prescription",
    consultationType: "Online",
    medicines: [],
    followUpDate: "",
  },
  {
    id: "#PRE0021",
    doctorName: "Dr. Raika Jain",
    specialty: "Psychiatrist",
    date: "12 Mar 2025",
    category: "Psychiatry Prescription",
    consultationType: "Online",
    medicines: [],
    followUpDate: "",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────

function doctorInitials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function consultationPillColors(type: string | undefined): { bg: string; fg: string } {
  switch ((type ?? "").toLowerCase()) {
    case "video":
    case "online":
      return { bg: "#EFF8FF", fg: "#175CD3" };
    case "in-person":
      return { bg: "#ECFDF3", fg: "#027A48" };
    default:
      return { bg: "#F2F4F7", fg: "#344054" };
  }
}

// ─── Page ────────────────────────────────────────────────────────────────

export default function PrescriptionsPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"Recent" | "Oldest">("Recent");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch the patient's own profile for the detail view.
  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        const res = await fetch("/api/patient/me");
        if (res.ok && !cancelled) {
          const data = await res.json();
          const p = data.data ?? data;
          setPatientProfile({
            name: p.name ?? p.fullName ?? p.firstName ?? "—",
            id: p.patientId ?? p.patientNumber ?? p.id ?? "—",
            gender: p.gender ?? p.sex ?? "—",
            bloodGroup: p.bloodGroup ?? "—",
          });
        }
      } catch {
        // Detail view falls back to "—" placeholders.
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = [...MOCK_PRESCRIPTIONS];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.doctorName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === "Recent" ? diff : -diff;
    });
    return result;
  }, [search, sort]);

  // ─── Detail view ─────────────────────────────────────────────────────
  if (selectedPrescription) {
    return (
      <DetailView
        prescription={selectedPrescription}
        profile={patientProfile}
        profileLoading={profileLoading}
        onBack={() => setSelectedPrescription(null)}
      />
    );
  }

  // ─── List view ───────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Prescriptions</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            All medications prescribed to you across visits.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm font-semibold text-[#344054] dark:text-[#CBD5E1] bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] transition-colors"
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* Filter row */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] dark:text-[#94A3B8] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by prescription ID, doctor, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4] transition-all"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm font-semibold text-[#344054] dark:text-[#CBD5E1] bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] transition-colors"
        >
          <Filter size={14} /> Filters
        </button>
        <button
          type="button"
          onClick={() => setSort(sort === "Recent" ? "Oldest" : "Recent")}
          className="inline-flex items-center gap-2 px-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm font-semibold text-[#344054] dark:text-[#CBD5E1] bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] transition-colors"
        >
          Sort by: {sort} <ChevronDown size={14} />
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">No prescriptions found</p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1 max-w-sm">
              When a doctor prescribes medication during a visit, the prescription will appear here. Adjust the filters above to widen your search.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] dark:bg-[#111827] text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Prescription ID</th>
                <th className="px-4 py-3 text-left font-semibold">Doctor</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Prescribed On</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {filtered.map((p) => {
                const cp = consultationPillColors(p.consultationType);
                return (
                  <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedPrescription(p)}
                        className="font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
                      >
                        {p.id}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center text-xs font-bold text-[#2E37A4] dark:text-[#A5B4FC] flex-shrink-0">
                          {doctorInitials(p.doctorName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#101828] dark:text-[#F9FAFB] truncate">{p.doctorName}</p>
                          <p className="text-xs text-[#667085] dark:text-[#94A3B8] truncate">{p.specialty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {p.consultationType ? (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: cp.bg, color: cp.fg }}
                        >
                          {p.consultationType}
                        </span>
                      ) : (
                        <span className="text-[#98A2B3] dark:text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[#667085] dark:text-[#94A3B8]">{p.date}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPrescription(p)}
                          className="p-2 rounded-md hover:bg-[#F4F5FF] text-[#667085] dark:text-[#94A3B8] hover:text-[#2E37A4] transition-colors"
                          title="View prescription"
                          aria-label="View prescription"
                        >
                          <Info size={16} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-md hover:bg-[#F9FAFB] text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Detail view ────────────────────────────────────────────────────────

function DetailView({
  prescription,
  profile,
  profileLoading,
  onBack,
}: {
  prescription: Prescription;
  profile: PatientProfile | null;
  profileLoading: boolean;
  onBack: () => void;
}) {
  const cp = consultationPillColors(prescription.consultationType);
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
        >
          <ChevronLeft size={16} /> Back to Prescriptions
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm font-semibold text-[#344054] dark:text-[#CBD5E1] bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] transition-colors"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2E37A4] hover:bg-[#1d246b] transition-colors"
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Prescription card */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
        {/* Clinic header */}
        <div className="p-6 flex items-start justify-between gap-4 border-b border-[#EAECF0] dark:border-[#374151]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
              <span className="text-2xl font-bold text-[#2E37A4] dark:text-[#A5B4FC]">V</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Institute of Precision Metabolic &amp; Hormonal Health</h2>
              <p className="text-sm font-medium text-[#2E37A4] dark:text-[#A5B4FC]">
                {prescription.doctorName} · {prescription.specialty}
              </p>
              <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] uppercase tracking-wide mt-0.5">
                {prescription.category}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs bg-[#F4F5FF] dark:bg-[#312E81] text-[#2E37A4] dark:text-[#A5B4FC] px-2.5 py-1 rounded-md font-semibold">
              ID: {prescription.id}
            </span>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1.5">Date: {prescription.date}</p>
          </div>
        </div>

        {/* Patient + consultation */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#EAECF0] dark:border-[#374151]">
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-[#667085] dark:text-[#94A3B8] font-bold mb-3">
              Patient Information
            </h3>
            {profileLoading ? (
              <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">Loading patient info…</p>
            ) : (
              <dl className="space-y-2 text-sm">
                <Row label="Name" value={profile?.name ?? "—"} />
                <Row
                  label="ID / Gender"
                  value={`${profile?.id ?? "—"} / ${profile?.gender ?? "—"}`}
                />
                <Row label="Blood Group" value={profile?.bloodGroup ?? "—"} />
              </dl>
            )}
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-[#667085] dark:text-[#94A3B8] font-bold mb-3">
              Consultation Details
            </h3>
            <dl className="space-y-2 text-sm">
              <Row
                label="Type"
                valueNode={
                  prescription.consultationType ? (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: cp.bg, color: cp.fg }}
                    >
                      {prescription.consultationType}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <Row label="Category" value={prescription.category} />
            </dl>
          </div>
        </div>

        {/* Medication table */}
        <div className="p-6 border-b border-[#EAECF0] dark:border-[#374151]">
          <h3 className="text-[11px] uppercase tracking-wider text-[#667085] dark:text-[#94A3B8] font-bold mb-3">
            Prescribed Medication
          </h3>
          {prescription.medicines && prescription.medicines.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-[#EAECF0] dark:border-[#374151]">
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB] dark:bg-[#111827] text-[11px] text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold">S.No</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Medicine</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Dosage</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Frequency</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Duration</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Timings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                  {prescription.medicines.map((m) => (
                    <tr key={m.sno}>
                      <td className="px-3 py-2.5 text-[#667085] dark:text-[#94A3B8]">{m.sno}</td>
                      <td className="px-3 py-2.5 font-semibold text-[#101828] dark:text-[#F9FAFB]">{m.name}</td>
                      <td className="px-3 py-2.5 text-[#344054] dark:text-[#CBD5E1]">{m.dosage}</td>
                      <td className="px-3 py-2.5 text-[#344054] dark:text-[#CBD5E1]">{m.frequency}</td>
                      <td className="px-3 py-2.5 text-[#344054] dark:text-[#CBD5E1]">{m.duration}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 bg-[#F2F4F7] dark:bg-[#111827] rounded text-xs text-[#344054] dark:text-[#CBD5E1] font-medium">
                          {m.timings}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
              No medication was prescribed for this visit.
            </p>
          )}
        </div>

        {/* Follow up */}
        {prescription.followUpDate ? (
          <div className="px-6 py-4 bg-[#F9FAFB] dark:bg-[#111827] flex items-center gap-2 text-sm text-[#344054] dark:text-[#CBD5E1]">
            <Calendar size={16} className="text-[#2E37A4] dark:text-[#A5B4FC]" />
            <span>
              Follow-up Date: <strong>{prescription.followUpDate}</strong>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: React.ReactNode;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <dt className="text-[#667085] dark:text-[#94A3B8]">{label}</dt>
      <dd className="font-semibold text-[#101828] dark:text-[#F9FAFB] text-right">
        {valueNode ?? value}
      </dd>
    </div>
  );
}
