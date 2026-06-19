"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  MoreVertical, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Check, 
  SlidersHorizontal,
  FileDown,
  Download
} from "lucide-react";
import RefillRequests from "@/components/patient/RefillRequests";

type PlanItem = {
  id: string;
  kind: "RX" | "SUPPLEMENT" | "IV" | "REHAB" | "AESTHETIC";
  name: string;
  dose: string | null;
  frequency: string | null;
  durationDays: number | null;
  instructions: string | null;
};

type Plan = {
  id: string;
  customId?: string;
  title: string;
  summary: string | null;
  status: string;
  version: number;
  createdAt: string;
  signedBy: { 
    id: string; 
    staff: { 
      fullName: string; 
      avatarUrl: string | null; 
      specialization: string | null; 
    } | null; 
  } | null;
  createdBy: { 
    id: string; 
    staff: { 
      fullName: string; 
      avatarUrl: string | null; 
      specialization: string | null; 
    } | null; 
  } | null;
  items: PlanItem[];
};

type PatientProfile = {
  id: string;
  patientNumber: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  dateOfBirth: string | null;
  sex: string | null;
};

const KIND_LABEL: Record<string, string> = {
  RX: "Medication",
  SUPPLEMENT: "Supplement",
  IV: "IV therapy",
  REHAB: "Rehab",
  AESTHETIC: "Aesthetic",
};




export default function PatientPrescriptionsPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDoctor, setFilterDoctor] = useState("ALL");
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
  
  // UI State
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [selectedPlanForDetail, setSelectedPlanForDetail] = useState<Plan | null>(null);
  const router = useRouter();
  const openPrescription = useCallback((id: string) => router.push(`/patient/prescriptions/${id}`), [router]);
  const [printPlan, setPrintPlan] = useState<Plan | null>(null);
  const [printAllMode, setPrintAllMode] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Refs for closing popovers on outside click
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // Real prescriptions come from two sources: signed TreatmentPlans and
      // the doctor's MAIN consultation Final Prescriptions. Merge + sort.
      const [planRes, rxRes] = await Promise.all([
        fetch("/api/patient/me/treatment-plans?limit=100", { credentials: "include" }),
        fetch("/api/patient/me/prescriptions?limit=100", { credentials: "include" }),
      ]);
      const planJson = planRes.ok ? await planRes.json() : null;
      const rxJson = rxRes.ok ? await rxRes.json() : null;
      const plansList: Plan[] = Array.isArray(planJson?.data) ? planJson.data : [];
      const rxList: Plan[] = Array.isArray(rxJson?.data) ? rxJson.data : [];
      const combined = [...plansList, ...rxList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setPlans(combined);

      // Load patient profile
      const profRes = await fetch("/api/patient/me", { credentials: "include" });
      if (profRes.ok) {
        const profJson = await profRes.json();
        if (profJson?.data) {
          setProfile(profJson.data);
        }
      }
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFiltersPopover(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
      if (activeActionMenuId) {
        setActiveActionMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeActionMenuId]);

  // Reset page when filters change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterDoctor]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isFiltered = searchQuery !== "" || filterStatus !== "ALL" || filterDoctor !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("ALL");
    setFilterDoctor("ALL");
  };

  // Format ID helper
  const getPrescriptionId = (chronologicalIndex: number) => {
    const baseNum = 16 + chronologicalIndex;
    return `#PRED${String(baseNum).padStart(4, "0")}`;
  };

  // Get initials helper
  const getInitials = (name: string) => {
    if (!name) return "DR";
    const cleanName = name.replace(/^Dr\.\s+/i, "");
    const parts = cleanName.split(/\s+/);
    return parts.map(p => p[0]).join("").substring(0, 2).toUpperCase();
  };

  // Get age calculator helper
  const getAge = (dobString: string | null | undefined) => {
    if (!dobString) return "28Y";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}Y`;
  };

  if (plans === null || loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#6B2B26]" />
        Loading prescriptions...
      </div>
    );
  }

  // Pre-calculate chronological indices
  const sortedByChronology = [...plans].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const plansWithChronologyIndex = plans.map(plan => {
    const idx = sortedByChronology.findIndex(p => p.id === plan.id);
    return { plan, index: idx };
  });

  const uniqueDoctors = Array.from(
    new Set(
      plans
        .map(p => p.signedBy?.staff?.fullName || p.createdBy?.staff?.fullName)
        .filter(Boolean)
    )
  ) as string[];

  // Filter Logic
  const filteredPlans = plansWithChronologyIndex.filter(({ plan, index }) => {
    const matchesSearch = () => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const idStr = getPrescriptionId(index).toLowerCase();
      const docName = (plan.signedBy?.staff?.fullName || plan.createdBy?.staff?.fullName || "").toLowerCase();
      const docSpec = (plan.signedBy?.staff?.specialization || plan.createdBy?.staff?.specialization || "").toLowerCase();
      const planTitle = plan.title.toLowerCase();
      const planSummary = (plan.summary || "").toLowerCase();
      
      return (
        idStr.includes(query) ||
        docName.includes(query) ||
        docSpec.includes(query) ||
        planTitle.includes(query) ||
        planSummary.includes(query)
      );
    };

    const matchesDoctor = () => {
      if (filterDoctor === "ALL") return true;
      const docName = plan.signedBy?.staff?.fullName || plan.createdBy?.staff?.fullName || "";
      return docName === filterDoctor;
    };

    const matchesStatus = () => {
      if (filterStatus === "ALL") return true;
      return plan.status === filterStatus;
    };

    return matchesSearch() && matchesDoctor() && matchesStatus();
  });

  // Sort Logic
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    const timeA = new Date(a.plan.createdAt).getTime();
    const timeB = new Date(b.plan.createdAt).getTime();
    return sortBy === "recent" ? timeB - timeA : timeA - timeB;
  });

  // Pagination calculations
  const totalEntries = sortedPlans.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedPlans = sortedPlans.slice(startIndex, endIndex);

  // CSV Export
  const handleDownloadCSV = (plan: Plan, chronologicalIndex: number, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    const headers = [
      "Prescription ID",
      "Title",
      "Date",
      "Doctor Name",
      "Specialization",
      "Medication Name",
      "Kind",
      "Dosage",
      "Frequency",
      "Duration",
      "Instructions"
    ];

    const docName = plan.signedBy?.staff?.fullName || plan.createdBy?.staff?.fullName || "Clinic Clinician";
    const docSpec = plan.signedBy?.staff?.specialization || plan.createdBy?.staff?.specialization || "";
    const planIdStr = getPrescriptionId(chronologicalIndex);
    const planDateStr = new Date(plan.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const rows = plan.items.map(it => [
      planIdStr,
      plan.title,
      planDateStr,
      docName,
      docSpec,
      it.name,
      KIND_LABEL[it.kind] || it.kind,
      it.dose || "",
      it.frequency || "",
      it.durationDays ? `${it.durationDays} days` : "",
      it.instructions || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Prescription_${planIdStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkExportCSV = () => {
    const headers = [
      "Prescription ID",
      "Title",
      "Date",
      "Doctor Name",
      "Specialization",
      "Medication Name",
      "Kind",
      "Dosage",
      "Frequency",
      "Duration",
      "Instructions"
    ];

    const allRows: string[][] = [];
    sortedPlans.forEach(({ plan, index }) => {
      const docName = plan.signedBy?.staff?.fullName || plan.createdBy?.staff?.fullName || "Clinic Clinician";
      const docSpec = plan.signedBy?.staff?.specialization || plan.createdBy?.staff?.specialization || "";
      const planIdStr = getPrescriptionId(index);
      const planDateStr = new Date(plan.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      plan.items.forEach(it => {
        allRows.push([
          planIdStr,
          plan.title,
          planDateStr,
          docName,
          docSpec,
          it.name,
          KIND_LABEL[it.kind] || it.kind,
          it.dose || "",
          it.frequency || "",
          it.durationDays ? `${it.durationDays} days` : "",
          it.instructions || ""
        ]);
      });
    });

    const csvContent = [headers, ...allRows]
      .map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "All_Prescriptions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handlePrintSingle = (plan: Plan, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setPrintAllMode(false);
    setPrintPlan(plan);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintAll = () => {
    setPrintAllMode(true);
    setPrintPlan(null);
    setShowExportDropdown(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const printStyle = `
    @media print {
      body {
        background: white !important;
        color: black !important;
      }
      body > div:first-child,
      header,
      aside,
      main,
      nav,
      button,
      footer,
      .no-print {
        display: none !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      .print-container {
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        visibility: visible !important;
        background: white !important;
        color: black !important;
        z-index: 99999 !important;
      }
      .print-container * {
        visibility: visible !important;
      }
      .page-break-before {
        page-break-before: always !important;
        break-before: page !important;
      }
    }
  `;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <style dangerouslySetInnerHTML={{ __html: printStyle }} />

      {/* RENDER VIEW: DETAIL VIEW */}
      {selectedPlanForDetail ? (() => {
        const plan = selectedPlanForDetail;
        const detailIndex = sortedByChronology.findIndex(p => p.id === plan.id);
        const presId = plan.customId || getPrescriptionId(detailIndex);
        const docName = plan.signedBy?.staff?.fullName || plan.createdBy?.staff?.fullName || "Clinic Clinician";
        const docSpec = plan.signedBy?.staff?.specialization || plan.createdBy?.staff?.specialization || "Integrative Medicine";
        const dateStr = new Date(plan.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
        const timeStr = new Date(plan.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        const getDoctorQualifications = (name: string, spec: string | null) => {
          if (name.includes("Mick Thompson") || name.includes("Sumit Mittal")) {
            return "MD Cardiologist, MBBS, MS";
          }
          if (spec) {
            return `MD ${spec}, MBBS`;
          }
          return "MD Physician, MBBS";
        };

        return (
          <div className="flex flex-col gap-4 no-print animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Back Button */}
            <button
              onClick={() => setSelectedPlanForDetail(null)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm font-semibold select-none cursor-pointer self-start transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prescriptions</span>
            </button>

            {/* Official Medical Prescription Sheet Card */}
            <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-10 flex flex-col gap-6 max-w-4xl mx-auto w-full">
              
              {/* Row 1: Logo & Badge */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0 text-[#6B2B26] dark:text-[#A5B4FC]">
                    {/* Preclinic Blue circular cross logo */}
                    <svg className="h-8 w-8 text-[#6B2B26]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" className="fill-[#6B2B26]/10 dark:fill-red-950/20 stroke-[#6B2B26] dark:stroke-red-400" strokeWidth="2" />
                      <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white font-sans select-none">Preclinic</h2>
                </div>

                <span className="px-3.5 py-1 bg-[#6B2B26]/10 dark:bg-red-950/20 text-[#6B2B26] dark:text-[#A5B4FC] border border-[#6B2B26]/20 dark:border-red-900/40 rounded-lg text-xs font-bold tracking-wide uppercase select-none">
                  {presId}
                </span>
              </div>

              {/* Row 2: Doctor & Meta Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-5 border-b border-gray-200 dark:border-gray-700">
                
                {/* Doctor section */}
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#6B2B26]/10 dark:bg-red-950/40 text-[#6B2B26] dark:text-[#A5B4FC] text-xs font-bold ring-1 ring-gray-100 dark:ring-gray-800">
                    <svg className="h-6 w-6 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-950 dark:text-white">Trustcare Clinic</span>
                    <span className="text-xs text-gray-705 dark:text-gray-300 mt-0.5">Dr. {docName}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{getDoctorQualifications(docName, docSpec)}</span>
                  </div>
                </div>

                {/* Department and Meta details */}
                <div className="text-left sm:text-right flex flex-col gap-1 text-xs text-gray-550 dark:text-gray-400 font-medium">
                  <p><span className="text-gray-400 dark:text-gray-550 font-normal">Department :</span> <span className="text-gray-900 dark:text-white font-bold">{docSpec.includes("Cardiologist") || docSpec.includes("Cardiology") ? "Cardiology OP" : `${docSpec} OP`}</span></p>
                  <p><span className="text-gray-400 dark:text-gray-550 font-normal">Prescribed on :</span> <span className="text-gray-900 dark:text-white font-bold">{dateStr}, {timeStr}</span></p>
                  <p><span className="text-gray-400 dark:text-gray-550 font-normal">Consultation :</span> <span className="text-gray-900 dark:text-white font-bold">Video</span></p>
                </div>
              </div>

              {/* Row 3: Patient Details block */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider select-none text-left">
                  Patient Details
                </div>
                <div className="px-5 py-3.5 bg-gray-50 dark:bg-[#111827] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <span className="font-bold text-gray-950 dark:text-white text-sm leading-none">{profile?.fullName || "M.Reyan Veral"}</span>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-700 dark:text-gray-300 font-medium">
                    <span>{getAge(profile?.dateOfBirth)} / {profile?.sex ? (profile.sex.toLowerCase() === "male" ? "Male" : "Female") : "Male"}</span>
                    <span>Blood : O+ve</span>
                    <span>Patient ID {profile?.patientNumber || "PT0025"}</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Prescription Title & Medication Table */}
              <div className="flex flex-col gap-3">
                <h3 className="text-center font-bold text-base text-gray-950 dark:text-white select-none my-1">
                  {plan.title}
                </h3>
                
                <div className="w-full overflow-x-auto border border-gray-150 dark:border-gray-750 rounded-lg">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold select-none uppercase tracking-wider">
                        <th className="py-3 px-4 w-16 text-center">SNO</th>
                        <th className="py-3 px-4">Medecine Name</th>
                        <th className="py-3 px-4">Dosage</th>
                        <th className="py-3 px-4">Frequency</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Timings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-750 text-gray-700 dark:text-gray-300">
                      {plan.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-gray-500 italic">No prescription items found.</td>
                        </tr>
                      ) : (
                        plan.items.map((it, idx) => (
                          <tr key={it.id} className="align-middle hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-center text-gray-400 dark:text-gray-500">{String(idx + 1).padStart(2, "0")}</td>
                            <td className="py-3.5 px-4 font-bold text-gray-955 dark:text-white">{it.name}</td>
                            <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-250">{it.dose || "—"}</td>
                            <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-250">{it.frequency || "—"}</td>
                            <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-250">{it.durationDays ? (it.durationDays === 30 ? "1 month" : `${it.durationDays} days`) : "—"}</td>
                            <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 font-medium">{it.instructions || "Before meal"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 5: Advice block */}
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-bold text-gray-950 dark:text-white select-none">Advice</h4>
                <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed font-medium">
                  {plan.summary || "An account of the present illness, which includes the circumstances surrounding the onset of recent health changes and the chronology of subsequent events that have led the patient to seek medical care, is essential to understanding the course of the disease process. Medications are listed in the medical history because they may play a role in the current illness."}
                </p>
              </div>

              {/* Row 6: Follow Up & Sign info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-950 dark:text-white select-none">Follow Up</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    Follow up after 3 months, Have to come on empty stomach
                  </p>
                </div>
                
                {/* Doctor Digital Signature */}
                <div className="text-left sm:text-right shrink-0 flex flex-col sm:items-end">
                  <span 
                    className="text-2xl text-[#6B2B26] dark:text-[#A5B4FC] select-none leading-none font-semibold pb-1"
                    style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive, sans-serif" }}
                  >
                    {docName.replace(/^Dr\.\s+/i, "")}
                  </span>
                  <div className="border-t border-dashed border-gray-300 dark:border-gray-700 w-36 my-1.5" />
                  <h5 className="text-xs font-bold text-gray-950 dark:text-white">Dr. {docName}</h5>
                  <p className="text-[10px] text-gray-400 dark:text-gray-555 mt-0.5">{getDoctorQualifications(docName, docSpec)}</p>
                </div>
              </div>

              {/* Row 7: Actions Footer Buttons */}
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handlePrintSingle(plan)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-950 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-250 dark:text-gray-950 text-white rounded-lg shadow-sm text-sm font-semibold transition-all cursor-pointer select-none"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => handleDownloadCSV(plan, detailIndex)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-semibold transition-all cursor-pointer select-none"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>

            </div>

            {/* Copyright Footer */}
            <div className="text-center text-[11px] text-gray-400 dark:text-gray-550 mt-6 mb-4 select-none">
              Copyright © 2026 - Vyara.
            </div>
          </div>
        );
      })() : (
        /* RENDER VIEW: LIST VIEW */
        <>
          {/* Refill requests — patient self-service */}
          <div className="no-print mb-6">
            <RefillRequests />
          </div>

          {/* Prescription Header */}
          <div className="flex justify-between items-center no-print mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">Prescription</h1>
            </div>
            
            {/* Export Dropdown */}
            <div className="relative shrink-0" ref={exportRef}>
              <button
                onClick={() => setShowExportDropdown(prev => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1F2937] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xs text-sm font-medium transition-all cursor-pointer"
              >
                <span>Export</span>
                <ChevronDown className={`h-4 w-4 text-gray-550 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 py-1 transition-all animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={handleBulkExportCSV}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FileDown className="h-4 w-4 text-gray-400" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    onClick={handlePrintAll}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Printer className="h-4 w-4 text-gray-400" />
                    <span>Print All ({sortedPlans.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter and Search Bar Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print mt-2">
            {/* Search Box */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-white dark:bg-[#1F2937] border border-gray-300 dark:border-gray-700 focus:border-[#6B2B26] dark:focus:border-[#6B2B26]/80 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-hidden transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-650 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filters & Sorting buttons */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Filter Toggle */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFiltersPopover(prev => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium border rounded-lg shadow-xs transition-all ${
                    filterStatus !== "ALL" || filterDoctor !== "ALL"
                      ? "bg-[#6B2B26]/10 dark:bg-red-950/20 text-[#6B2B26] dark:text-[#A5B4FC] border-[#6B2B26]/20 dark:border-red-900/50"
                      : "bg-white dark:bg-[#1F2937] hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span>Filters</span>
                  {(filterStatus !== "ALL" || filterDoctor !== "ALL") && (
                    <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-[#6B2B26] text-white text-[10px] font-bold">
                      {[filterStatus !== "ALL", filterDoctor !== "ALL"].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {showFiltersPopover && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-700 pb-2.5 mb-4">
                      <span className="text-sm font-semibold text-gray-955 dark:text-white flex items-center gap-1.5">
                        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                        Refine Prescriptions
                      </span>
                      {(filterStatus !== "ALL" || filterDoctor !== "ALL") && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-medium cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Status Filter Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Status
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-[#111827] p-1 rounded-lg">
                          {["ALL", "SIGNED", "REVOKED"].map(status => (
                            <button
                              key={status}
                              onClick={() => setFilterStatus(status)}
                              className={`px-2 py-1.5 rounded-md text-xs font-semibold uppercase transition-all ${
                                filterStatus === status
                                  ? "bg-white dark:bg-[#1F2937] text-gray-900 dark:text-white shadow-xs"
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                              }`}
                            >
                              {status === "ALL" ? "All" : status.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Doctor Filter Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Doctor Name
                        </label>
                        <select
                          value={filterDoctor}
                          onChange={(e) => setFilterDoctor(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-lg outline-hidden focus:border-[#6B2B26] dark:focus:border-[#6B2B26]/80 font-medium"
                        >
                          <option value="ALL">All Doctors</option>
                          {uniqueDoctors.map(name => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Toggle */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSortDropdown(prev => !prev)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#1F2937] hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xs text-sm font-medium transition-all"
                >
                  <span>Sort By: {sortBy === "recent" ? "Recent" : "Oldest"}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-550 transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`} />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        setSortBy("recent");
                        setShowSortDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span>Recent</span>
                      {sortBy === "recent" && <Check className="h-4 w-4 text-[#6B2B26] dark:text-[#A5B4FC]" />}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("oldest");
                        setShowSortDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span>Oldest</span>
                      {sortBy === "oldest" && <Check className="h-4 w-4 text-[#6B2B26] dark:text-[#A5B4FC]" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {isFiltered && (
            <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-wrap gap-2 items-center text-xs text-gray-600 dark:text-gray-400 no-print transition-all">
              <span className="font-semibold text-gray-500">Active filters:</span>
              {searchQuery && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700">
                  <span>Search: &quot;{searchQuery}&quot;</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setSearchQuery("")} />
                </span>
              )}
              {filterStatus !== "ALL" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 capitalize">
                  <span>Status: {filterStatus.toLowerCase()}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setFilterStatus("ALL")} />
                </span>
              )}
              {filterDoctor !== "ALL" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700">
                  <span>Doctor: {filterDoctor}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setFilterDoctor("ALL")} />
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-[#6B2B26] dark:text-[#A5B4FC] hover:underline font-semibold ml-auto"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Main Table Card Wrapper */}
          <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs overflow-hidden no-print transition-all mt-1">
            {/* Table/Content Area */}
            {sortedPlans.length === 0 ? (
              <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                <SlidersHorizontal className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-base font-semibold text-gray-900 dark:text-white">No prescriptions found</p>
                <p className="text-sm text-gray-500 dark:text-gray-450 mt-1 max-w-sm mx-auto">
                  {isFiltered 
                    ? "Try adjusting your keywords, changing statuses, or clearing filters to see results."
                    : "No treatment plans signed yet. They'll appear here once approved by your physician."}
                </p>
                {isFiltered && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-[#6B2B26]/10 hover:bg-[#54201D]/20 text-[#6B2B26] dark:text-[#A5B4FC] font-semibold rounded-lg text-sm border border-[#6B2B26]/20 dark:border-red-900/40 transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 select-none bg-gray-50/70 dark:bg-gray-800/40">
                      <th className="py-4.5 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prescription ID
                      </th>
                      <th className="py-4.5 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Doctor Name
                      </th>
                      <th className="py-4.5 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prescribed On
                      </th>
                      <th className="relative py-4.5 px-6 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-700 bg-white dark:bg-[#1F2937]">
                    {paginatedPlans.map(({ plan, index }) => {
                      const docName = plan.signedBy?.staff?.fullName || plan.createdBy?.staff?.fullName || "Clinic Clinician";
                      const docSpec = plan.signedBy?.staff?.specialization || plan.createdBy?.staff?.specialization || "Integrative Doctor";
                      const avatarUrl = plan.signedBy?.staff?.avatarUrl || plan.createdBy?.staff?.avatarUrl;
                      const presId = getPrescriptionId(index);
                      
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => openPrescription(plan.id)}
                          className="group cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors align-middle"
                        >
                          {/* ID Column */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#6B2B26] dark:group-hover:text-[#A5B4FC] transition-colors">
                                {presId}
                              </span>
                              <span className={`inline-flex items-center justify-center w-1.5 h-1.5 rounded-full ${plan.status === 'SIGNED' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={plan.status} />
                            </div>
                          </td>

                          {/* Doctor Name Column */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#6B2B26]/10 dark:bg-red-950/40 text-[#6B2B26] dark:text-[#A5B4FC] text-xs font-bold ring-1 ring-gray-100 dark:ring-gray-800">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={docName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  getInitials(docName)
                                )}
                              </div>
                              {/* Text Info */}
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {docName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {docSpec}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Date Column */}
                          <td className="py-4.5 px-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(plan.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>

                          {/* Action dots Menu */}
                          <td className="py-4.5 px-6 whitespace-nowrap text-right text-sm font-medium relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(prev => prev === plan.id ? null : plan.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-gray-250 hover:bg-gray-100 dark:hover:bg-gray-855 rounded-lg transition-all"
                            >
                              <MoreVertical className="h-4.5 w-4.5" />
                            </button>

                            {/* Dropdown element */}
                            {activeActionMenuId === plan.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-6 mt-1 w-40 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-150"
                              >
                                <button
                                  onClick={() => {
                                    openPrescription(plan.id);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  View details
                                </button>
                                <button
                                  onClick={() => {
                                    handleDownloadCSV(plan, index);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  Download CSV
                                </button>
                                <button
                                  onClick={() => {
                                    handlePrintSingle(plan);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  Print PDF
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Section */}
            {sortedPlans.length > 0 && (
              <div className="p-4 sm:px-6 sm:py-5 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4 text-sm bg-gray-50/50 dark:bg-gray-800/10">
                {/* Rows Per Page Choice */}
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span>Row Per Page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-700 rounded-md font-semibold text-gray-800 dark:text-white outline-hidden cursor-pointer"
                  >
                    {[5, 10, 25, 50].map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>Entries</span>
                </div>

                {/* Pagination Pages Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1F2937] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>

                  <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#6B2B26] text-white shadow-xs select-none min-w-[28px] text-center">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1F2937] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Copyright Footer */}
          <div className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-8 mb-4 no-print select-none">
            Copyright © 2026 - Vyara.
          </div>
        </>
      )}

      {/* -------------------- PRINT MEDIA TEMPLATES -------------------- */}

      {/* 1. Single Prescription Print Layout */}
      {printPlan && (
        <div className="print-container hidden print:block p-12 bg-white text-black font-sans min-h-screen w-full">
          <div className="flex justify-between items-start border-b-2 border-gray-400 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold tracking-wider text-indigo-950 font-serif">VYRSA</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">Vyrsa Clinic & Integrative Medicine Center</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-gray-950 tracking-wider">OFFICIAL PRESCRIPTION</h2>
              <p className="text-xs text-gray-600 mt-1">Prescription ID: {getPrescriptionId(sortedByChronology.findIndex(p => p.id === printPlan.id))}</p>
              <p className="text-xs text-gray-600">Prescribed On: {new Date(printPlan.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-gray-200 text-sm">
            <div>
              <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] mb-1.5">Prescribing Physician:</h3>
              <p className="font-extrabold text-base text-gray-950">{printPlan.signedBy?.staff?.fullName || printPlan.createdBy?.staff?.fullName || "Clinic Practitioner"}</p>
              <p className="text-xs text-gray-600 mt-0.5">{printPlan.signedBy?.staff?.specialization || printPlan.createdBy?.staff?.specialization || "Integrative Practitioner"}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] mb-1.5">Authorized Details:</h3>
              <p className="font-bold text-gray-900">Status: <span className="font-black text-indigo-750 uppercase">{printPlan.status}</span></p>
              <p className="text-xs text-gray-600 mt-0.5">Version: {printPlan.version}</p>
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 border-l-4 border-indigo-700">
            <h4 className="font-black text-base text-gray-900">{printPlan.title}</h4>
            {printPlan.summary && (
              <p className="text-xs text-gray-700 italic mt-1.5 leading-relaxed">{printPlan.summary}</p>
            )}
          </div>

          <div className="mb-12">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 border-b-2 border-gray-200 pb-2 mb-4">Prescribed Items</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-gray-750 font-bold uppercase tracking-wider">
                  <th className="py-2.5 w-12 text-center">SNO</th>
                  <th className="py-2.5 px-2 text-left">Medecine Name</th>
                  <th className="py-2.5 px-2 text-left">Dosage</th>
                  <th className="py-2.5 px-2 text-left">Frequency</th>
                  <th className="py-2.5 px-2 text-left">Duration</th>
                  <th className="py-2.5 pl-2 text-left">Timings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {printPlan.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500 italic">No items prescribed on this plan.</td>
                  </tr>
                ) : (
                  printPlan.items.map((it, idx) => (
                    <tr key={it.id} className="align-middle">
                      <td className="py-3 font-bold text-center text-gray-400">{String(idx + 1).padStart(2, "0")}</td>
                      <td className="py-3 px-2 font-bold text-gray-955">{it.name}</td>
                      <td className="py-3 px-2 font-medium text-gray-800">{it.dose || "—"}</td>
                      <td className="py-3 px-2 font-medium text-gray-800">{it.frequency || "—"}</td>
                      <td className="py-3 px-2 font-medium text-gray-800">{it.durationDays ? (it.durationDays === 30 ? "1 month" : `${it.durationDays} days`) : "—"}</td>
                      <td className="py-3 pl-2 text-gray-700 font-medium">{it.instructions || "Before meal"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-gray-300 pt-8 mt-auto flex justify-between items-end text-[10px] text-gray-500">
            <div>
              <p>Generated via Vyrsa Clinic Patient Portal &middot; Secure Digital Record</p>
              <p className="mt-1">Copyright © 2026 - Vyrsa. All rights reserved.</p>
            </div>
            <div className="text-center w-56 border-t border-dashed border-gray-400 pt-3">
              <p className="font-bold text-gray-800 text-xs">{printPlan.signedBy?.staff?.fullName || printPlan.createdBy?.staff?.fullName || "Physician Signatory"}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">Clinic Digital Signature</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Bulk Print Layout (All Filtered Prescriptions) */}
      {printAllMode && (
        <div className="print-container hidden print:block bg-white text-black font-sans min-h-screen w-full">
          {sortedPlans.map(({ plan, index }, planIdx) => {
            const docName = plan.signedBy?.staff?.fullName || plan.createdBy?.staff?.fullName || "Clinic Clinician";
            const docSpec = plan.signedBy?.staff?.specialization || plan.createdBy?.staff?.specialization || "";
            const planIdStr = getPrescriptionId(index);
            const planDateStr = new Date(plan.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            });

            return (
              <div
                key={plan.id}
                className={`p-12 min-h-screen flex flex-col ${planIdx > 0 ? "page-break-before" : ""}`}
              >
                <div className="flex justify-between items-start border-b-2 border-gray-400 pb-6 mb-8">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-extrabold tracking-wider text-indigo-950 font-serif">VYRSA</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Vyrsa Clinic & Integrative Medicine Center</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black text-gray-950 tracking-wider">OFFICIAL PRESCRIPTION</h2>
                    <p className="text-xs text-gray-600 mt-1">Prescription ID: {planIdStr}</p>
                    <p className="text-xs text-gray-600">Prescribed On: {planDateStr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-gray-200 text-sm">
                  <div>
                    <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] mb-1.5">Prescribed By:</h3>
                    <p className="font-extrabold text-base text-gray-900">{docName}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{docSpec}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] mb-1.5">Authorized Status:</h3>
                    <p className="font-bold text-gray-900">Status: <span className="font-black text-indigo-750 uppercase">{plan.status}</span></p>
                    <p className="text-xs text-gray-600 mt-0.5">Version: {plan.version}</p>
                  </div>
                </div>

                <div className="mb-8 p-4 bg-gray-50 border-l-4 border-indigo-700">
                  <h4 className="font-black text-base text-gray-900">{plan.title}</h4>
                  {plan.summary && (
                    <p className="text-xs text-gray-700 italic mt-1.5 leading-relaxed">{plan.summary}</p>
                  )}
                </div>

                <div className="mb-12">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 border-b-2 border-gray-200 pb-2 mb-4">Prescribed Items</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300 text-gray-755 font-bold uppercase tracking-wider">
                        <th className="py-2.5 w-12 text-center">SNO</th>
                        <th className="py-2.5 px-2 text-left">Medecine Name</th>
                        <th className="py-2.5 px-2 text-left">Dosage</th>
                        <th className="py-2.5 px-2 text-left">Frequency</th>
                        <th className="py-2.5 px-2 text-left">Duration</th>
                        <th className="py-2.5 pl-2 text-left">Timings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {plan.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-500 italic">No items prescribed.</td>
                        </tr>
                      ) : (
                        plan.items.map((it, idx) => (
                          <tr key={it.id} className="align-middle">
                            <td className="py-3 font-bold text-center text-gray-400">{String(idx + 1).padStart(2, "0")}</td>
                            <td className="py-3 px-2 font-bold text-gray-955">{it.name}</td>
                            <td className="py-3 px-2 font-medium text-gray-800">{it.dose || "—"}</td>
                            <td className="py-3 px-2 font-medium text-gray-800">{it.frequency || "—"}</td>
                            <td className="py-3 px-2 font-medium text-gray-800">{it.durationDays ? (it.durationDays === 30 ? "1 month" : `${it.durationDays} days`) : "—"}</td>
                            <td className="py-3 pl-2 text-gray-750 font-medium">{it.instructions || "Before meal"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t-2 border-gray-300 pt-8 mt-auto flex justify-between items-end text-[10px] text-gray-500">
                  <div>
                    <p>Generated via Vyrsa Clinic Patient Portal &middot; Page {planIdx + 1} of {sortedPlans.length}</p>
                    <p className="mt-1">Copyright © 2026 - Vyrsa. All rights reserved.</p>
                  </div>
                  <div className="text-center w-56 border-t border-dashed border-gray-400 pt-3">
                    <p className="font-bold text-gray-800 text-xs">{docName}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">Clinic Digital Signature</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
