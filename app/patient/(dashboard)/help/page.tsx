"use client";

export default function HelpPage() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1000px] mx-auto animate-in fade-in duration-500">
      <h1 className="text-xl font-bold text-[#141414] dark:text-[#F9FAFB]">Help & Support</h1>
      <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#141414] dark:text-[#F9FAFB] mb-4">How can we help you?</h2>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-[#2E37A4] dark:text-[#A5B4FC]">Frequently Asked Questions</h3>
            <p className="text-sm text-[#667085] dark:text-[#94A3B8]">Find quick answers to common questions about appointments, lab reports, and prescriptions.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-[#2E37A4] dark:text-[#A5B4FC]">Contact Support</h3>
            <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
              Email us at{" "}
              <a
                href="mailto:care@precisionhealth.in"
                className="text-[#2E37A4] dark:text-[#A5B4FC] font-medium hover:underline"
              >
                care@precisionhealth.in
              </a>{" "}
              or call our 24/7 helpline at{" "}
              <a
                href="tel:+919976540310"
                className="text-[#2E37A4] dark:text-[#A5B4FC] font-medium hover:underline"
              >
                +91 99765 40310
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
