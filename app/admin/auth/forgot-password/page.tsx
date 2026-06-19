"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, Check, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

type Step = "form" | "success" | "otp" | "reset" | "reset-success"

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("")
  const [step, setStep] = useState<Step>("form")
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""))
  const [timeLeft, setTimeLeft] = useState<number>(30)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [ticket, setTicket] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)

  const isFormValid = email.length > 0
  const isResetValid = password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword

  // Timer logic for OTP
  React.useEffect(() => {
    if (step === "otp" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, timeLeft])

  const formatTime = (seconds: number) => {
    return `00:${seconds.toString().padStart(2, "0")} sec`
  }

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Something went wrong")
      }
      setStep("success")
    } catch (err) {
      notify.error("Failed to request password reset", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("")
    if (otpCode.length !== 6 || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Invalid or expired code")
      }
      setTicket(data.data.ticket)
      setStep("reset")
    } catch (err) {
      notify.error("OTP Verification Failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (timeLeft > 0 || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Something went wrong")
      }
      setTimeLeft(30)
      notify.success("Verification code resent successfully")
    } catch (err) {
      notify.error("Failed to resend verification code", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmReset = async () => {
    if (!isResetValid || !ticket || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to reset password")
      }
      setStep("reset-success")
    } catch (err) {
      notify.error("Failed to reset password", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false

    const newOtp = [...otp]
    newOtp[index] = element.value
    setOtp(newOtp)

    // Focus next input
    if (element.nextElementSibling && element.value !== "") {
      ; (element.nextElementSibling as HTMLInputElement).focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp]
      if (otp[index] === "") {
        if (index > 0) {
          newOtp[index - 1] = ""
          setOtp(newOtp)
          const prevSibling = e.currentTarget.previousElementSibling as HTMLInputElement | null
          if (prevSibling) {
            prevSibling.focus()
          }
        }
      } else {
        newOtp[index] = ""
        setOtp(newOtp)
      }
    }
  }

  return (
    <div className={`flex min-h-screen items-center justify-center p-4 font-sans ${step === "reset" || step === "reset-success" ? "bg-white" : "bg-[#F9FAFB]"}`}>
      <div
        className={`w-full flex flex-col items-center border border-[#EAECF0] ${step === "reset" || step === "reset-success" ? "bg-white" : "bg-[#F9FAFB]"}`}
        style={{
          width: '556px',
          height: step === "reset-success" ? '443px' : step === "reset" ? '607px' : step === "otp" ? '493px' : step === "success" ? '443px' : '501px',
          borderRadius: '16px', // 2xl
          padding: '40px',
          boxShadow: '0px 4px 6px -2px #10182808, 0px 12px 16px -4px #10182814',
          gap: step === "reset-success" || step === "success" ? '32px' : '24px'
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image
            src="/images/logos/dr-yuvraaj-logo.png"
            alt="Vyara Logo"
            width={600}
            height={65}
            className="object-contain"
            priority
          />
        </div>

        {step === "form" ? (
          <>
            {/* Header Text */}
            <div className="text-center">
              <h1
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '32px',
                  color: '#141414',
                  textAlign: 'center'
                }}
              >
                Forgot Password?
              </h1>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#141414'
                }}
              >
                No worries, we will send you reset instructions.
              </p>
            </div>

            {/* Form area */}
            <div className="w-full flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#344054'
                  }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[14px]">
                    <Mail className="h-5 w-5 text-[#667085]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    placeholder="Email Address"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex border border-[#D0D5DD] bg-[#F9FAFB] text-base text-[#101828] transition-all focus:border-[#D5ABAB] focus:outline-none focus:ring-2 focus:ring-[#D5ABAB]/20"
                    style={{
                      width: '476px',
                      height: '48px',
                      borderRadius: '8px',
                      paddingTop: '10px',
                      paddingRight: '14px',
                      paddingBottom: '10px',
                      paddingLeft: '44px',
                    }}
                  />
                </div>
              </div>

              <Button
                className="w-full transition-all duration-300"
                style={{
                  height: '48px',
                  backgroundColor: isFormValid && !isLoading ? '#6B2B26' : '#D5ABAB',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                  marginTop: '8px',
                  cursor: isFormValid && !isLoading ? 'pointer' : 'default'
                }}
                disabled={!isFormValid || isLoading}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="flex justify-center">
                <Link
                  href="/"
                  className="text-sm font-semibold text-[#6B2B26] hover:text-[#54201D] transition-colors"
                  style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
                >
                  Back to Login
                </Link>
              </div>

              <div className="mt-1">
                <p
                  style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '100%',
                    color: '#000000',
                    textAlign: 'center'
                  }}
                >
                  Copyright © 2026 - Dr. Yuvraaj Singh MD.
                </p>
              </div>
            </div>
          </>
        ) : step === "success" ? (
          <>
            {/* Success Icon */}
            <div className="flex flex-col items-center -mt-2 -mb-2">
              <div className="w-12 h-12 rounded-full bg-[#00C851] flex items-center justify-center">
                <Check className="h-6 w-6 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="text-center">
              <h1
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '32px',
                  color: '#141414',
                  textAlign: 'center'
                }}
              >
                Email Sent!
              </h1>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#141414'
                }}
              >
                Check your email and change your password.
              </p>
            </div>

            <div className="w-full">
              <Button
                className="w-full"
                style={{
                  height: '56px',
                  backgroundColor: '#6B2B26',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                  cursor: 'pointer'
                }}
                onClick={() => setStep("otp")}
              >
                Reset Password
              </Button>
            </div>

            <div className="mt-auto pb-2">
              <p
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '100%',
                  color: '#000000',
                  textAlign: 'center'
                }}
              >
                Copyright © 2026 - Dr. Yuvraaj Singh MD.
              </p>
            </div>
          </>
        ) : step === "otp" ? (
          <>
            {/* OTP Verification Step */}
            <div className="text-center">
              <h1
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '32px',
                  color: '#141414',
                  textAlign: 'center'
                }}
              >
                Verification Code
              </h1>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#141414',
                  textAlign: 'center'
                }}
              >
                Enter the verification code sent to <span className="font-bold">{email || "abc09@gmail.com"}</span> email <br /> address
              </p>
            </div>

            {/* OTP Input Grid */}
            <div
              className="flex gap-[24px] mt-2"
              style={{ width: '456px' }} // 6x56px + 5x24px
            >
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  placeholder={focusedIndex === index ? "" : "-"}
                  value={data}
                  onChange={(e) => handleOtpChange(e.target as HTMLInputElement, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => {
                    setFocusedIndex(index)
                    e.target.select()
                  }}
                  onBlur={() => setFocusedIndex(null)}
                  className="otp-input w-[56px] h-[56px] border border-[#DDDDDD] rounded-[8px] bg-transparent text-center text-xl font-semibold text-[#101828] focus:border-[#6B2B26] focus:outline-none focus:ring-1 focus:ring-[#6B2B26]"
                  style={{ padding: '16px' }}
                />
              ))}
            </div>

            {/* Timer and Resend Link */}
            <div
              className="flex justify-between items-center"
              style={{ width: '456px' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '11.96px',
                  color: '#6B2B26',
                  textAlign: 'center'
                }}
              >
                {formatTime(timeLeft)}
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '11.96px',
                  color: '#667085',
                  textAlign: 'center'
                }}
              >
                Didn't receive the OTP?{" "}
                <button
                  className="hover:underline"
                  style={{
                    fontWeight: 600,
                    color: timeLeft === 0 && !isLoading ? '#6B2B26' : '#667085',
                    cursor: timeLeft === 0 && !isLoading ? 'pointer' : 'default'
                  }}
                  onClick={handleResendOtp}
                  disabled={timeLeft > 0 || isLoading}
                >
                  Resend OTP
                </button>
              </p>
            </div>

            {/* Verify Button */}
            <div className="w-full">
              <Button
                className="w-full"
                style={{
                  height: '56px',
                  backgroundColor: otp.join("").length === 6 && !isLoading ? '#6B2B26' : '#D5ABAB',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                  cursor: otp.join("").length === 6 && !isLoading ? 'pointer' : 'default'
                }}
                disabled={otp.join("").length !== 6 || isLoading}
                onClick={handleVerifyOtp}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>

            <div className="mt-auto pb-2">
              <p
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '100%',
                  color: '#000000',
                  textAlign: 'center'
                }}
              >
                Copyright © 2026 - Dr. Yuvraaj Singh MD.
              </p>
            </div>
          </>
        ) : step === "reset" ? (
          <>
            {/* Reset Password Step */}
            <div className="text-center">
              <h1
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '32px',
                  color: '#141414',
                  textAlign: 'center'
                }}
              >
                Reset Password
              </h1>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#141414'
                }}
              >
                Your new password must be different from the previous one.
              </p>
            </div>

            <div className="w-full flex flex-col gap-4 mt-2">
              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#344054'
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[14px]">
                    <Lock className="h-5 w-5 text-[#667085]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********************"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex w-full border border-[#D0D5DD] bg-[#F9FAFB] text-base text-[#101828] transition-all focus:border-[#6B2B26] focus:outline-none focus:ring-1 focus:ring-[#6B2B26]"
                    style={{
                      height: '48px',
                      borderRadius: '8px',
                      paddingLeft: '44px',
                      paddingRight: '44px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-[14px] text-[#667085] hover:text-[#344054]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#344054'
                  }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[14px]">
                    <Lock className="h-5 w-5 text-[#667085]" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********************"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex w-full border border-[#D0D5DD] bg-[#F9FAFB] text-base text-[#101828] transition-all focus:border-[#6B2B26] focus:outline-none focus:ring-1 focus:ring-[#6B2B26]"
                    style={{
                      height: '48px',
                      borderRadius: '8px',
                      paddingLeft: '44px',
                      paddingRight: '44px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-[14px] text-[#667085] hover:text-[#344054]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full mt-2"
                style={{
                  height: '48px',
                  backgroundColor: isResetValid && !isLoading ? '#6B2B26' : '#D5ABAB',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                  cursor: isResetValid && !isLoading ? 'pointer' : 'default'
                }}
                disabled={!isResetValid || isLoading}
                onClick={handleConfirmReset}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting Password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="flex justify-center">
                <Link
                  href="/"
                  className="text-sm font-semibold text-[#6B2B26] hover:text-[#54201D] transition-colors"
                  style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
                >
                  Back to Login
                </Link>
              </div>

              <div className="mt-auto pb-2">
                <p
                  style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '100%',
                    color: '#000000',
                    textAlign: 'center'
                  }}
                >
                  Copyright © 2026 - Dr. Yuvraaj Singh MD.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Reset Success Step */}
            <div className="flex flex-col items-center -mt-2 -mb-2">
              <div className="w-12 h-12 rounded-full bg-[#00C851] flex items-center justify-center">
                <Check className="h-6 w-6 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="text-center">
              <h1
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '32px',
                  color: '#141414',
                  textAlign: 'center'
                }}
              >
                Password Reset Successfully
              </h1>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#141414'
                }}
              >
                Your new password has been successfully changes.
              </p>
            </div>

            <div className="w-full">
              <Button
                className="w-full"
                asChild
                style={{
                  height: '56px',
                  backgroundColor: '#6B2B26',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                  cursor: 'pointer'
                }}
              >
                <Link href="/">Back To Login</Link>
              </Button>
            </div>

            <div className="mt-auto pb-2">
              <p
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '100%',
                  color: '#000000',
                  textAlign: 'center'
                }}
              >
                Copyright © 2026 - Dr. Yuvraaj Singh MD.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
