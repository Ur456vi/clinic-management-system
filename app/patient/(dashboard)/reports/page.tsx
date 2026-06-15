"use client";

import { TrendingUp } from "lucide-react";

/*
// Original patient-side reports implementation (commented out as requested):

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Loader2,
  ChevronDown,
  Activity
} from "lucide-react";

type Appt = { id: string; status: string; startsAt: string; staff: { fullName: string } | null };
type Plan = { id: string; status: string; title: string; createdAt: string };
type Lab = { id: string };

type TimelineData = {
  month: string;
  diabetes: number;
  labTests: number;
  respiratory: number;
};

// 6 Months Timeline Data matching Figma
const TIMELINE_MOCKS: Record<string, TimelineData[]> = {
  "6months": [
    { month: "Oct '25", diabetes: 3.9, labTests: 3.2, respiratory: 4.7 },
    { month: "Nov '25", diabetes: 3.0, labTests: 4.8, respiratory: 5.1 },
    { month: "Dec '25", diabetes: 4.5, labTests: 4.7, respiratory: 3.0 },
    { month: "Jan '26", diabetes: 5.6, labTests: 5.9, respiratory: 4.1 },
    { month: "Feb '26", diabetes: 4.0, labTests: 4.8, respiratory: 6.0 },
    { month: "Mar '26", diabetes: 2.6, labTests: 5.5, respiratory: 5.8 },
  ],
  "3months": [
    { month: "Jan '26", diabetes: 5.6, labTests: 5.9, respiratory: 4.1 },
    { month: "Feb '26", diabetes: 4.0, labTests: 4.8, respiratory: 6.0 },
    { month: "Mar '26", diabetes: 2.6, labTests: 5.5, respiratory: 5.8 },
  ]
};

export default function PatientReportsPage() {
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  
  const [timelineRange, setTimelineRange] = useState("6months");
  const [medsYear, setMedsYear] = useState("2026");
  const [showTimelineDropdown, setShowTimelineDropdown] = useState(false);
  const [showMedsDropdown, setShowMedsDropdown] = useState(false);

  const load = useCallback(async () => {
    try {
      const resAppts = await fetch("/api/patient/me/appointments?limit=100", { credentials: "include" });
      const resPlans = await fetch("/api/patient/me/treatment-plans?limit=100", { credentials: "include" });
      const resLabs = await fetch("/api/patient/me/lab-results?limit=100", { credentials: "include" });

      if (resAppts.ok) {
        const j = await resAppts.json();
        setAppts(Array.isArray(j?.data) ? j.data : []);
      }
      if (resPlans.ok) {
        const j = await resPlans.json();
        setPlans(Array.isArray(j?.data) ? j.data : []);
      }
      if (resLabs.ok) {
        const j = await resLabs.json();
        setLabs(Array.isArray(j?.data) ? j.data : []);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#2E37A4]" />
        Loading reports...
      </div>
    );
  }

  const totalLabsCount = Math.max(5, labs.length);
  const totalPrescriptionsCount = Math.max(15, plans.length);

  const timelineData = TIMELINE_MOCKS[timelineRange] || TIMELINE_MOCKS["6months"];
  const chartHeight = 220;
  // ... rest of the original design logic ...
}
*/

export default function PatientReportsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto flex flex-col items-center justify-center min-h-[500px]">
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-center w-full max-w-md">
        <div className="w-12 h-12 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">
            Patient Reports
          </h1>
          <p className="text-sm text-[#2E37A4] dark:text-[#A5B4FC] mt-2 font-bold uppercase tracking-wider">
            Coming Soon
          </p>
          <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-2 leading-relaxed">
            We are preparing your medical reports, treatment progress, and analytics dashboard. Please check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
