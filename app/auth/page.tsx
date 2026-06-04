"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSendOTP = () => {
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    sessionStorage.setItem("vyara_phone", phone);
    router.push("/auth/otp");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(val);
    setError("");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-8 font-inter animate-in fade-in duration-700">
      <div className="bg-[#F9FAFB] rounded-2xl border border-[#EAECF0] p-10 w-full max-w-[556px] flex flex-col items-center gap-6 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)] transition-transform hover:scale-[1.01]">
        
        {/* Logo */}
        <div className="flex items-center justify-center">
          <img
            src="/dr-yuvraaj-logo.png"
            alt="IPHMH Logo"
            width={79}
            height={80}
            className="object-contain"
          />
        </div>

        {/* Heading */}
        <div className="flex flex-col items-center gap-2 w-full">
          <h1 className="text-2xl font-bold text-[#141414] text-center leading-8 m-0">Sign in</h1>
          <p className="text-base font-medium text-[#667085] text-center leading-6 m-0">Enter your login details to sign in</p>
        </div>

        {/* Form */}
        <div className="flex flex-col items-start gap-8 w-full mt-2">
          {/* Phone Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-bold text-[#344054] leading-5">Phone Number</label>
            <div 
              className={`flex flex-row items-center p-3 gap-2 w-full h-12 border rounded-lg bg-white shadow-sm focus-within:ring-4 focus-within:ring-[#EEF0FF] transition-all duration-200 ${
                error ? "border-[#FDA29B]" : "border-[#D0D5DD] focus-within:border-[#2E37A4]"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#667085]">
                <path
                  d="M2.5 3.5C2.5 2.94772 2.94772 2.5 3.5 2.5H6.27924C6.76957 2.5 7.19357 2.83187 7.31873 3.30653L8.19357 6.73077C8.30467 7.15753 8.13045 7.60617 7.76923 7.84615L6.41026 8.73077C7.35897 10.6923 8.84615 12.1731 10.7692 13.1282L11.6667 11.7692C11.9038 11.408 12.3525 11.2338 12.7821 11.3397L16.1987 12.1795C16.674 12.3 17 12.7263 17 13.2179V16C17 16.5523 16.5523 17 16 17H14.5C7.87258 17 2.5 11.6274 2.5 5V3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={handlePhoneChange}
                className="flex-1 border-none outline-none text-base font-medium text-[#141414] bg-transparent leading-6 placeholder-[#667085]"
              />
            </div>
            {error && <p className="text-xs font-bold text-[#F04438] m-0 animate-shake">{error}</p>}
          </div>

          {/* Send OTP Button */}
          <button
            onClick={handleSendOTP}
            className="flex flex-row justify-center items-center p-4 w-full h-12 bg-[#2E37A4] border border-[#2E37A4] rounded-lg text-white text-base font-bold cursor-pointer shadow-sm hover:bg-[#1e2570] hover:border-[#1e2570] active:scale-[0.98] transition-all duration-200"
          >
            Send OTP
          </button>
        </div>

        {/* Copyright */}
        <p className="text-xs font-bold text-[#667085] leading-4 m-0 mt-2">Copyright © 2026 - Vyara.</p>
      </div>
    </main>
  );
}