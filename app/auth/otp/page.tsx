"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function OTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [phone, setPhone] = useState("+91 785*******");
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setTimer(30);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("vyara_phone") || "";
    if (saved) {
      setPhone(`+91 ${saved.slice(0, 3)}${"*".repeat(4)}${saved.slice(-3)}`);
    }
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...otp];
    updated[idx] = val.slice(-1);
    setOtp(updated);
    setError("");
    if (val && idx < 4) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      inputs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (!pasted) return;
    const updated = ["", "", "", "", ""];
    pasted.split("").forEach((char, i) => { updated[i] = char; });
    setOtp(updated);
    inputs.current[Math.min(pasted.length, 4)]?.focus();
  };

  const handleVerify = () => {
    if (otp.join("").length < 5) {
      setError("Please enter the complete OTP");
      return;
    }
    router.push("/patient/dashboard");
  };

  const formatTime = () => {
    const m = String(Math.floor(timer / 60)).padStart(2, "0");
    const s = String(timer % 60).padStart(2, "0");
    return `${m}:${s} sec`;
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <img
            src="/dr-yuvraaj-logo.png"
            alt="Dr. Yuvraaj Logo"
            width={79}
            height={80}
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Heading */}
        <div style={styles.headingWrap}>
          <h1 style={styles.title}>Verification Code</h1>
          <p style={styles.subtitle}>
            Enter the verification code sent to{" "}
            <strong>{phone}</strong> phone number
          </p>
        </div>

        {/* OTP Section */}
        <div style={styles.otpSection}>
          <div style={styles.otpRow}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                autoFocus={i === 0}
                style={{
                  ...styles.otpBox,
                  borderColor: error ? "#F04438" : digit ? "#6B2B26" : "#DDDDDD",
                }}
              />
            ))}
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          {/* Timer + Resend */}
          <div style={styles.timerResendRow}>
            <span style={styles.timerText}>{formatTime()}</span>
            <span
              style={{
                ...styles.resendText,
                opacity: canResend ? 1 : 0.5,
                cursor: canResend ? "pointer" : "not-allowed",
                color: canResend ? "#6B2B26" : "#666666",
              }}
              onClick={() => {
                if (canResend) {
                  setOtp(["", "", "", "", ""]);
                  setError("");
                  startTimer();
                  inputs.current[0]?.focus();
                }
              }}
            >
              Didn&apos;t receive the OTP?{" "}
              <span style={{ fontWeight: 600 }}>Resend OTP</span>
            </span>
          </div>
        </div>

        {/* Verify Button */}
        <button
          style={styles.btn}
          onClick={handleVerify}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#242d8a")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#6B2B26")}
        >
          Verify
        </button>

        <p style={styles.copyright}>Copyright © 2026 - Vyara.</p>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    padding: "2rem 1rem",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #EAECF0",
    padding: "40px",
    width: "100%",
    maxWidth: "556px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    boxShadow:
      "0px 12px 16px -4px rgba(16,24,40,0.08), 0px 4px 6px -2px rgba(16,24,40,0.03)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#141414",
    textAlign: "center",
    lineHeight: "32px",
    margin: 0,
  },
  subtitle: {
    fontSize: "16px",
    fontWeight: 400,
    color: "#141414",
    textAlign: "center",
    lineHeight: "24px",
    margin: 0,
  },
  otpSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    width: "100%",
  },
  otpRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    width: "100%",
  },
  otpBox: {
    width: "56px",
    height: "56px",
    textAlign: "center",
    fontSize: "20px",
    fontWeight: 600,
    border: "1.5px solid #DDDDDD",
    borderRadius: "8px",
    color: "#141414",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    fontSize: "12px",
    color: "#F04438",
    margin: 0,
    textAlign: "center",
  },
  timerResendRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    maxWidth: "400px",
    flexWrap: "wrap",
  },
  timerText: {
    fontSize: "12px",
    fontWeight: 400,
    color: "#666666",
    whiteSpace: "nowrap",
  },
  resendText: {
    fontSize: "12px",
    fontWeight: 400,
    transition: "opacity 0.2s, color 0.2s",
    whiteSpace: "nowrap",
  },
  btn: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    width: "100%",
    height: "48px",
    background: "#6B2B26",
    border: "1px solid #6B2B26",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0px 1px 2px rgba(16,24,40,0.05)",
    transition: "background 0.2s",
    fontFamily: "Inter, sans-serif",
  },
  copyright: {
    fontSize: "12px",
    fontWeight: 400,
    color: "#000000",
    lineHeight: "15px",
    margin: 0,
  },
};