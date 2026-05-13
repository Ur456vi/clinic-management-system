"use client";
import { useState, useMemo } from "react";
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

// ─── TYPES ────────────────────────────────────────────────────────────────────
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
  avatar: string;
  prescribedOn: string;
  clinic: string;
  department: string;
  consultationType: string;
  patientName: string;
  age: string;
  gender: string;
  blood: string;
  patientId: string;
  category: string;
  medicines: Medicine[];
  advice: string;
  followUp: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PRESCRIPTIONS: Prescription[] = [
  {
    id: "#PRE0025", doctorName: "Dr. Sumit Mittal", specialty: "Cardiologist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sumit",
    prescribedOn: "30 Apr 2025", clinic: "Trustcare Clinic", department: "Cardiology OP",
    consultationType: "Video", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Cardiology Prescription",
    medicines: [
      { sno: "01", name: "Ecosprin 75MG", dosage: "75mg", frequency: "1-0-1", duration: "1 month", timings: "Before meal" },
      { sno: "02", name: "Axer 90MG Tab", dosage: "90 mg", frequency: "1-1-1", duration: "1 month", timings: "After meal"  },
    ],
    advice: "Avoid strenuous exercise for a week. Chronology of events that have led the patient to seek medical care.",
    followUp: "30 Jul 2025",
  },
  {
    id: "#PRE0024", doctorName: "Dr. Akanksha Jain", specialty: "Orthopedic Surgeon", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Akanksha",
    prescribedOn: "15 Apr 2025", clinic: "Trustcare Clinic", department: "Orthopedics OP",
    consultationType: "In-person", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Orthopedic Prescription",
    medicines: [], advice: "Rest well.", followUp: "15 May 2025",
  },
  {
    id: "#PRE0023", doctorName: "Dr. Sonali Mittal", specialty: "Pediatrician", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sonali",
    prescribedOn: "02 Apr 2025", clinic: "Trustcare Clinic", department: "Pediatrics",
    consultationType: "In-person", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "General Checkup",
    medicines: [], advice: "Balanced diet.", followUp: "02 May 2025",
  },
  {
    id: "#PRE0022", doctorName: "Dr. Tarun Gupta", specialty: "Gynecologist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tarun",
    prescribedOn: "27 Mar 2025", clinic: "Trustcare Clinic", department: "Gynecology",
    consultationType: "Video", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Follow-up",
    medicines: [], advice: "Take vitamins.", followUp: "17 Apr 2025",
  },
  {
    id: "#PRE0021", doctorName: "Dr. Sarita Jain", specialty: "Psychiatrist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarita",
    prescribedOn: "12 Mar 2025", clinic: "Trustcare Clinic", department: "Psychiatry",
    consultationType: "In-person", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Mental Health",
    medicines: [], advice: "Regular therapy.", followUp: "26 Mar 2025",
  },
  {
    id: "#PRE0020", doctorName: "Dr. Nilesh Arora", specialty: "Neurosurgeon", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nilesh",
    prescribedOn: "05 Mar 2025", clinic: "Trustcare Clinic", department: "Neurology",
    consultationType: "Video", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Brain Scan Review",
    medicines: [], advice: "Adequate sleep.", followUp: "05 Apr 2025",
  },
  {
    id: "#PRE0019", doctorName: "Dr. Rakshita Gupta", specialty: "Oncologist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakshita",
    prescribedOn: "24 Feb 2025", clinic: "Trustcare Clinic", department: "Oncology",
    consultationType: "In-person", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Routine Checkup",
    medicines: [], advice: "Stay hydrated.", followUp: "24 Aug 2025",
  },
  {
    id: "#PRE0018", doctorName: "Dr. Amit Singh", specialty: "Pulmonologist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DoctorAmit",
    prescribedOn: "16 Feb 2025", clinic: "Trustcare Clinic", department: "Pulmonology",
    consultationType: "Video", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Asthma Review",
    medicines: [], advice: "Use inhaler.", followUp: "16 Apr 2025",
  },
  {
    id: "#PRE0017", doctorName: "Dr. Suresh Gupta", specialty: "Urologist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh",
    prescribedOn: "01 Feb 2025", clinic: "Trustcare Clinic", department: "Urology",
    consultationType: "In-person", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Kidney Health",
    medicines: [], advice: "Drink water.", followUp: "01 Mar 2025",
  },
  {
    id: "#PRE0016", doctorName: "Dr. Saurabh Jain", specialty: "Cardiologist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Saurabh",
    prescribedOn: "25 Jan 2025", clinic: "Trustcare Clinic", department: "Cardiology",
    consultationType: "Video", patientName: "Amit Singh", age: "28Y", gender: "Male",
    blood: "O+ve", patientId: "PT0025", category: "Heart Rate Monitor",
    medicines: [], advice: "Light cardio.", followUp: "25 Apr 2025",
  },
];

export default function PrescriptionsPage() {
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Recent");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? PRESCRIPTIONS.filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            p.doctorName.toLowerCase().includes(q) ||
            p.specialty.toLowerCase().includes(q)
        )
      : [...PRESCRIPTIONS];
    return sortBy === "Recent" ? list : list.reverse();
  }, [search, sortBy]);

  if (selected) {
    return (
      <div className="p-8 flex flex-col gap-6 max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-[#2E37A4] font-bold text-sm bg-white border border-[#EAECF0] px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronLeft size={18} />
            Back to Prescriptions
          </button>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 bg-white border border-[#EAECF0] rounded-lg px-4 py-2 text-sm font-bold text-[#141414] hover:bg-gray-50 transition-all shadow-sm">
              <Share2 size={16} className="text-[#6C7688]" />
              Share
            </button>
             <button className="flex items-center gap-2 bg-[#2E37A4] border-none rounded-lg px-4 py-2 text-sm font-bold text-white hover:bg-[#1e2570] transition-all shadow-sm">
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAECF0] overflow-hidden shadow-md">
          {/* Prescription Header */}
          <div className="p-8 border-b border-[#F2F4F7] bg-[#F9FAFB] flex justify-between items-start">
            <div className="flex gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-sm border border-[#EAECF0] flex items-center justify-center">
                 <div className="w-full h-full bg-[#2E37A4] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">V</span>
                 </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#141414] tracking-tight">{selected.clinic}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-sm font-bold text-[#2E37A4]">{selected.doctorName}</span>
                   <span className="w-1 h-1 rounded-full bg-[#D1D5DD]" />
                   <span className="text-sm font-bold text-[#6C7688]">{selected.specialty}</span>
                </div>
                <p className="text-xs font-bold text-[#98A2B3] mt-2 uppercase tracking-widest">{selected.department}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-[#EEF0FF] text-[#2E37A4] text-xs font-black px-4 py-2 rounded-full inline-block shadow-sm">
                ID: {selected.id}
              </div>
              <p className="text-xs font-bold text-[#6C7688] mt-4">Date: <span className="text-[#141414]">{selected.prescribedOn}</span></p>
            </div>
          </div>

          <div className="p-8 flex flex-col gap-10">
            {/* Patient & Consultation Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div>
                  <h3 className="text-[11px] font-black text-[#98A2B3] uppercase tracking-[0.2em] mb-4">Patient Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-[#F2F4F7] pb-2">
                      <span className="text-sm font-bold text-[#6C7688]">Name</span>
                      <span className="text-sm font-bold text-[#141414]">{selected.patientName}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F2F4F7] pb-2">
                      <span className="text-sm font-bold text-[#6C7688]">ID / Gender</span>
                      <span className="text-sm font-bold text-[#141414]">{selected.patientId} / {selected.gender}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F2F4F7] pb-2">
                      <span className="text-sm font-bold text-[#6C7688]">Blood Group</span>
                      <span className="text-sm font-bold text-[#141414]">{selected.blood}</span>
                    </div>
                  </div>
               </div>
               <div>
                  <h3 className="text-[11px] font-black text-[#98A2B3] uppercase tracking-[0.2em] mb-4">Consultation Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-[#F2F4F7] pb-2">
                      <span className="text-sm font-bold text-[#6C7688]">Type</span>
                      <span className="text-sm font-bold text-[#2E37A4]">{selected.consultationType}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F2F4F7] pb-2">
                      <span className="text-sm font-bold text-[#6C7688]">Category</span>
                      <span className="text-sm font-bold text-[#141414]">{selected.category}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Medication List */}
            <div>
              <h3 className="text-[11px] font-black text-[#98A2B3] uppercase tracking-[0.2em] mb-4">Prescribed Medication</h3>
              <div className="border border-[#EAECF0] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F9FAFB]">
                      {["S.No", "Medicine", "Dosage", "Frequency", "Duration", "Timings"].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-[#667085] font-black uppercase tracking-widest border-b border-[#EAECF0]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F4F7]">
                    {selected.medicines.length > 0 ? selected.medicines.map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#6C7688]">{m.sno}</td>
                        <td className="px-5 py-4 font-black text-[#141414] text-sm">{m.name}</td>
                        <td className="px-5 py-4 font-bold text-[#141414]">{m.dosage}</td>
                        <td className="px-5 py-4 font-bold text-[#2E37A4]">{m.frequency}</td>
                        <td className="px-5 py-4 font-bold text-[#141414]">{m.duration}</td>
                        <td className="px-5 py-4">
                           <span className="bg-[#F2F4F7] text-[#6C7688] px-2.5 py-1 rounded-md font-bold">{m.timings}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm font-bold text-[#98A2B3]">No medications prescribed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes & Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-[#EAECF0]">
                  <h4 className="text-sm font-black text-[#141414] mb-3 flex items-center gap-2">
                    <Info size={16} className="text-[#2E37A4]" />
                    Doctor's Advice
                  </h4>
                  <p className="text-sm text-[#6C7688] font-medium leading-relaxed">{selected.advice}</p>
               </div>
               <div className="flex flex-col justify-between items-end pr-4">
                  <div className="text-right">
                    <h4 className="text-sm font-black text-[#141414] mb-1">Follow Up Date</h4>
                    <p className="text-sm font-bold text-[#F04438]">{selected.followUp}</p>
                  </div>
                  <div className="mt-12 text-center">
                    <div className="w-48 h-1 bg-[#EAECF0] mb-3" />
                    <p className="text-lg font-serif italic text-[#141414]">{selected.doctorName.replace("Dr. ", "")}</p>
                    <p className="text-xs font-black text-[#2E37A4] uppercase tracking-widest">{selected.doctorName}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs font-black text-[#98A2B3] opacity-60">Copyright © 2026 — Vyara Medical Systems.</p>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#141414]">Prescription</h1>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 border border-[#EAECF0] rounded-lg px-4 py-2.5 bg-white text-sm font-bold text-[#141414] hover:bg-gray-50 transition-all shadow-sm">
            <Download size={18} className="text-[#6C7688]" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAECF0] overflow-hidden shadow-sm">
        {/* Table Header / Filters */}
        <div className="p-5 flex items-center justify-between border-b border-[#F2F4F7] flex-wrap gap-4">
          <div className="flex items-center gap-3 w-96 h-11 border border-[#EAECF0] rounded-xl px-4 bg-[#F9FAFB] focus-within:bg-white focus-within:border-[#2E37A4] focus-within:ring-4 focus-within:ring-[#EEF0FF] transition-all">
            <Search className="w-5 h-5 text-[#98A2B3]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="border-none outline-none text-sm text-[#141414] bg-transparent w-full font-medium" 
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 h-11 border border-[#EAECF0] rounded-xl px-5 bg-white text-sm font-bold text-[#141414] hover:bg-gray-50 transition-all shadow-sm">
              <Filter size={18} className="text-[#6C7688]" />
              Filters
            </button>
             <button 
              className="flex items-center gap-2 h-11 border border-[#EAECF0] rounded-xl px-5 bg-white text-sm font-bold text-[#141414] hover:bg-gray-50 transition-all shadow-sm"
              onClick={() => setSortBy(sortBy === "Recent" ? "Oldest" : "Recent")}
            >
              Sort By: <span className="text-[#2E37A4]">{sortBy}</span>
              <ChevronDown size={18} className="text-[#6C7688]" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="px-6 py-5 text-left text-[#667085] font-black text-xs uppercase tracking-[0.2em] border-b border-[#F2F4F7]">Prescription ID</th>
                <th className="px-6 py-5 text-left text-[#667085] font-black text-xs uppercase tracking-[0.2em] border-b border-[#F2F4F7]">Doctor Name</th>
                <th className="px-6 py-5 text-left text-[#667085] font-black text-xs uppercase tracking-[0.2em] border-b border-[#F2F4F7]">Prescribed On</th>
                <th className="px-6 py-5 text-right border-b border-[#F2F4F7]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {filtered.map((p) => (
                <tr 
                  key={p.id} 
                  className="hover:bg-[#F9FAFB] transition-all cursor-pointer group"
                  onClick={() => setSelected(p)}
                >
                  <td className="px-6 py-5 font-black text-[#2E37A4]">{p.id}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full overflow-hidden relative border-2 border-white shadow-sm group-hover:border-[#EEF0FF] transition-all">
                        <img src={p.avatar} alt={p.doctorName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="m-0 font-bold text-[#141414] group-hover:text-[#2E37A4] transition-colors">{p.doctorName}</p>
                        <p className="m-0 text-xs text-[#6C7688] font-bold">{p.specialty}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[#141414] font-bold">{p.prescribedOn}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#98A2B3] group-hover:bg-white group-hover:text-[#2E37A4] transition-all group-hover:shadow-sm">
                          <Info size={18} />
                       </div>
                       <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#98A2B3] hover:bg-white transition-all hover:shadow-sm">
                          <MoreVertical size={18} />
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder to match Figma feel */}
        <div className="p-5 border-t border-[#F2F4F7] flex justify-between items-center bg-[#F9FAFB]">
           <span className="text-xs font-bold text-[#6C7688]">Row Per Page <span className="text-[#141414] ml-1">10 ▾</span> Entries</span>
           <div className="flex gap-2">
              <button className="w-8 h-8 rounded border border-[#EAECF0] bg-white flex items-center justify-center text-[#6C7688] hover:bg-gray-50">1</button>
              <button className="w-8 h-8 rounded border border-transparent bg-[#2E37A4] text-white flex items-center justify-center shadow-sm">2</button>
              <button className="w-8 h-8 rounded border border-[#EAECF0] bg-white flex items-center justify-center text-[#6C7688] hover:bg-gray-50">→</button>
           </div>
        </div>
      </div>
      <p className="text-center text-xs font-bold text-[#98A2B3] mt-auto py-10 opacity-60">Copyright © 2026 — Vyara Medical Systems.</p>
    </div>
  );
}