"use client";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
    Search,
    Filter,
    ChevronDown,
    Download,
    Printer,
    Info,
    FileText,
    Calendar,
    MoreVertical,
    ChevronLeft,
    Share2
} from "lucide-react";

// ——— TYPES ———————————————————————————————————————————
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
    // Patient info is populated from the logged-in session, NOT hardcoded
  patientName?: string;
    patientId?: string;
    gender?: string;
    bloodGroup?: string;
    consultationType?: string;
    medicines?: Medicine[];
    followUpDate?: string;
    notes?: string;
}

// ——— MOCK PRESCRIPTIONS (list only - no patient PII) ————
// Note: Patient info is fetched dynamically from /api/patient/me
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

// ——— PATIENT PROFILE TYPE ————————————————————————————
interface PatientProfile {
    name: string;
    id: string;
    gender: string;
    bloodGroup: string;
}

// ——— PAGE COMPONENT ——————————————————————————————————
export default function PrescriptionsPage() {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("Recent");
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

  // Fetch the logged-in patient's own profile (for use in prescription detail)
  useEffect(() => {
        async function fetchProfile() {
                try {
                          const res = await fetch("/api/patient/me");
                          if (res.ok) {
                                      const data = await res.json();
                                      setPatientProfile({
                                                    name: data.name ?? data.firstName ?? "—",
                                                    id: data.patientId ?? data.id ?? "—",
                                                    gender: data.gender ?? "—",
                                                    bloodGroup: data.bloodGroup ?? "—",
                                      });
                          }
                } catch {
                          // If profile fetch fails, we show placeholder text
                } finally {
                          setProfileLoading(false);
                }
        }
        fetchProfile();
  }, []);

  const filteredPrescriptions = useMemo(() => {
        let result = [...MOCK_PRESCRIPTIONS];
        if (search) {
                result = result.filter(
                          (p) =>
                                      p.doctorName.toLowerCase().includes(search.toLowerCase()) ||
                                      p.id.toLowerCase().includes(search.toLowerCase()) ||
                                      p.category.toLowerCase().includes(search.toLowerCase())
                        );
        }
        if (sort === "Recent") {
                result = result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return result;
  }, [search, sort]);

  if (selectedPrescription) {
        // Prescription Detail View - use logged-in patient's own data
      const profile = patientProfile;
        return (
                <div className="p-6 max-w-4xl mx-auto">
                  {/* Back button */}
                        <button
                                    onClick={() => setSelectedPrescription(null)}
                                    className="flex items-center gap-2 text-sm text-indigo-600 hover:underline mb-4"
                                  >
                                  <ChevronLeft size={16} /> Back to Prescriptions
                        </button>button>
                
                  {/* Header Actions */}
                        <div className="flex justify-end gap-3 mb-4">
                                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                              <Share2 size={14} /> Share
                                  </button>button>
                                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                                              <Download size={14} /> Download PDF
                                  </button>button>
                        </div>div>
                
                  {/* Prescription Card */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
                          {/* Clinic Header */}
                                  <div className="flex items-start justify-between">
                                              <div className="flex items-center gap-4">
                                                            <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">V</span>span>
                                                            </div>div>
                                                            <div>
                                                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vyara Clinic</h2>h2>
                                                                            <p className="text-sm text-indigo-600">
                                                                              {selectedPrescription.doctorName} • {selectedPrescription.specialty}
                                                                            </p>p>
                                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
                                                                              {selectedPrescription.category}
                                                                            </p>p>
                                                            </div>div>
                                              </div>div>
                                              <div className="text-right">
                                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">
                                                                            ID: {selectedPrescription.id}
                                                            </span>span>
                                                            <p className="text-sm text-gray-500 mt-1">Date: {selectedPrescription.date}</p>p>
                                              </div>div>
                                  </div>div>
                        
                          {/* Patient Information — uses logged-in patient's own data */}
                                  <div className="grid grid-cols-2 gap-6 border-t pt-4">
                                              <div>
                                                            <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                                                                            Patient Information
                                                            </h3>h3>
                                                {profileLoading ? (
                                  <p className="text-sm text-gray-400">Loading patient info...</p>p>
                                ) : (
                                  <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-500">Name</span>span>
                                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                                          {profile?.name ?? "—"}
                                                                        </span>span>
                                                    </div>div>
                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-500">ID / Gender</span>span>
                                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                                          {profile?.id ?? "—"} / {profile?.gender ?? "—"}
                                                                        </span>span>
                                                    </div>div>
                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-500">Blood Group</span>span>
                                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                                          {profile?.bloodGroup ?? "—"}
                                                                        </span>span>
                                                    </div>div>
                                  </div>div>
                                                            )}
                                              </div>div>
                                              <div>
                                                            <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                                                                            Consultation Details
                                                            </h3>h3>
                                                            <div className="space-y-2 text-sm">
                                                                            <div className="flex justify-between">
                                                                                              <span className="text-gray-500">Type</span>span>
                                                                                              <span className="font-medium text-indigo-600">
                                                                                                {selectedPrescription.consultationType ?? "—"}
                                                                                                </span>span>
                                                                            </div>div>
                                                                            <div className="flex justify-between">
                                                                                              <span className="text-gray-500">Category</span>span>
                                                                                              <span className="font-medium text-gray-900 dark:text-white">
                                                                                                {selectedPrescription.category}
                                                                                                </span>span>
                                                                            </div>div>
                                                            </div>div>
                                              </div>div>
                                  </div>div>
                        
                          {/* Medicines */}
                          {selectedPrescription.medicines && selectedPrescription.medicines.length > 0 && (
                              <div className="border-t pt-4">
                                            <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                                                            Prescribed Medication
                                            </h3>h3>
                                            <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase">
                                                                              <tr>
                                                                                                  <th className="px-3 py-2 text-left">S.No</th>th>
                                                                                                  <th className="px-3 py-2 text-left">Medicine</th>th>
                                                                                                  <th className="px-3 py-2 text-left">Dosage</th>th>
                                                                                                  <th className="px-3 py-2 text-left">Frequency</th>th>
                                                                                                  <th className="px-3 py-2 text-left">Duration</th>th>
                                                                                                  <th className="px-3 py-2 text-left">Timings</th>th>
                                                                              </tr>tr>
                                                            </thead>thead>
                                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                              {selectedPrescription.medicines.map((med) => (
                                                    <tr key={med.sno}>
                                                                          <td className="px-3 py-2">{med.sno}</td>td>
                                                                          <td className="px-3 py-2 font-medium">{med.name}</td>td>
                                                                          <td className="px-3 py-2">{med.dosage}</td>td>
                                                                          <td className="px-3 py-2">{med.frequency}</td>td>
                                                                          <td className="px-3 py-2">{med.duration}</td>td>
                                                                          <td className="px-3 py-2">
                                                                                                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{med.timings}</span>span>
                                                                          </td>td>
                                                    </tr>tr>
                                                  ))}
                                                            </tbody>tbody>
                                            </table>table>
                              </div>div>
                                  )}
                        
                          {/* Follow Up */}
                          {selectedPrescription.followUpDate && (
                              <div className="border-t pt-4 flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar size={14} />
                                            <span>Follow Up Date: <strong>{selectedPrescription.followUpDate}</strong>strong></span>span>
                              </div>div>
                                  )}
                        </div>div>
                </div>div>
              );
  }
  
    // ——— PRESCRIPTION LIST VIEW ————————————————————————
    return (
          <div className="p-6 space-y-4">
            {/* Header */}
                <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescription</h1>h1>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                  <Download size={14} /> Export
                        </button>button>
                </div>div>
          
            {/* Search and Filters */}
                <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                                type="text"
                                                placeholder="Search..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                              />
                        </div>div>
                        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                  <Filter size={14} /> Filters
                        </button>button>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50"
                                    onClick={() => setSort(sort === "Recent" ? "Oldest" : "Recent")}>
                                  Sort By: {sort} <ChevronDown size={14} />
                        </div>div>
                </div>div>
          
            {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-sm">
                                  <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase tracking-wide">
                                              <tr>
                                                            <th className="px-4 py-3 text-left">Prescription ID</th>th>
                                                            <th className="px-4 py-3 text-left">Doctor Name</th>th>
                                                            <th className="px-4 py-3 text-left">Prescribed On</th>th>
                                                            <th className="px-4 py-3 text-right">Actions</th>th>
                                              </tr>tr>
                                  </thead>thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredPrescriptions.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                          <td className="px-4 py-3">
                                                            <span className="font-medium text-indigo-600">{p.id}</span>span>
                                          </td>td>
                                          <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                                                  {p.doctorName.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                                                                  </div>div>
                                                                                <div>
                                                                                                      <p className="font-medium text-gray-900 dark:text-white">{p.doctorName}</p>p>
                                                                                                      <p className="text-xs text-indigo-600">{p.specialty}</p>p>
                                                                                  </div>div>
                                                            </div>div>
                                          </td>td>
                                          <td className="px-4 py-3 text-gray-500">{p.date}</td>td>
                                          <td className="px-4 py-3">
                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button
                                                                                                        onClick={() => setSelectedPrescription(p)}
                                                                                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                                                                                        title="View prescription"
                                                                                                      >
                                                                                                      <Info size={16} />
                                                                                  </button>button>
                                                                                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                                                                                                      <MoreVertical size={16} />
                                                                                  </button>button>
                                                            </div>div>
                                          </td>td>
                          </tr>tr>
                        ))}
                                  </tbody>tbody>
                        </table>table>
                  {filteredPrescriptions.length === 0 && (
                      <div className="text-center py-12 text-gray-500">No prescriptions found.</div>div>
                        )}
                </div>div>
          </div>div>
        );
}</div>
