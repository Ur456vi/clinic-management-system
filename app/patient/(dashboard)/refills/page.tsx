"use client";

/**
 * Patient Refills page.
 *
 * First-class home for medication refill requests (previously only reachable
 * embedded in the Prescriptions page). Renders the self-contained
 * <RefillRequests /> card, which fetches the patient's own signed prescribed
 * items + their refill requests and lets them request a refill per item.
 */

import RefillRequests from "@/components/patient/RefillRequests";

export default function PatientRefillsPage() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Refills</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          Request a refill on your prescribed medications. The clinic reviews each
          request and marks it fulfilled once your refill is ready.
        </p>
      </div>

      <RefillRequests />
    </div>
  );
}
