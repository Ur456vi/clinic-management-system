"use client";

export default function HelpPage() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1000px] mx-auto animate-in fade-in duration-500">
      <h1 className="text-xl font-bold text-[#141414]">Help & Support</h1>
      <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#141414] mb-4">How can we help you?</h2>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-[#2E37A4]">Frequently Asked Questions</h3>
            <p className="text-sm text-[#667085]">Find quick answers to common questions about appointments, lab reports, and prescriptions.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-[#2E37A4]">Contact Support</h3>
            <p className="text-sm text-[#667085]">
              Email us at{" "}
              <a
                href="mailto:care@precisionhealth.in"
                className="text-[#2E37A4] font-medium hover:underline"
              >
                care@precisionhealth.in
              </a>{" "}
              or call our 24/7 helpline at{" "}
              <a
                href="tel:+919976540310"
                className="text-[#2E37A4] font-medium hover:underline"
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
