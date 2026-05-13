"use client"

import React, { useState, useRef, ChangeEvent } from "react";

type ToastType = "success" | "error";

interface ToastState {
  message: string;
  type: ToastType;
}

interface NavItemProps {
  icon: React.ComponentType;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface SelectFieldProps {
  placeholder: string;
  options?: string[];
  value: string;
  onChange: (val: string) => void;
}

interface InputFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

// ── Icons (inline SVG to avoid any dependency) ──────────────────────────────
const Icon = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M9 16l2 2 4-4"/>
    </svg>
  ),
  Flask: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6l1 7-4 10-4-10Z"/><path d="M6.5 10h11"/>
    </svg>
  ),
  FileCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  HelpCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  Notifications: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  Camera: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
};

// ── Sidebar Nav Item ─────────────────────────────────────────────────────────
const NavItem = ({ icon: IconComp, label, active, onClick }: NavItemProps) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "12px 16px 12px 20px",
    borderRadius: 8, border: "none", background: active ? "#EEF0FB" : "transparent",
    cursor: "pointer", color: active ? "#2E37A4" : "#444",
    fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: active ? 600 : 400,
    transition: "all 0.18s ease", position: "relative",
  }}>
    <span style={{ color: active ? "#2E37A4" : "#666", flexShrink: 0, display:"flex" }}>
      <IconComp />
    </span>
    <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
    {active && (
      <span style={{
        position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
        width: 4, height: 26, background: "#2E37A4", borderRadius: 17,
      }} />
    )}
  </button>
);

// ── Custom Select ────────────────────────────────────────────────────────────
const SelectField = ({ placeholder, options = [], value, onChange }: SelectFieldProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "10px 14px", border: "1px solid #D0D0D0",
        borderRadius: 6, background: "#fff", cursor: "pointer",
        fontFamily: "'Inter', sans-serif", fontSize: 13, color: value ? "#141414" : "#A1A1A1",
      }}>
        {value || placeholder}
        <Icon.ChevronDown />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #D0D0D0", borderRadius: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100,
        }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{
              padding: "9px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif",
              cursor: "pointer", color: "#141414",
              background: value === opt ? "#EEF0FB" : "transparent",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#F4F5F8"}
              onMouseLeave={e => e.currentTarget.style.background = value === opt ? "#EEF0FB" : "transparent"}
            >{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Text Input ───────────────────────────────────────────────────────────────
const InputField = ({ label, required, value, onChange, type = "text", placeholder = "" }: InputFieldProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
        color: "#333", display: "flex", alignItems: "center", gap: 2,
      }}>
        {label}
        {required && <span style={{ color: "#E53E3E", marginLeft: 1 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: "10px 14px", border: `1px solid ${focused ? "#2E37A4" : "#D0D0D0"}`,
          borderRadius: 6, fontFamily: "'Inter', sans-serif", fontSize: 13,
          color: "#141414", outline: "none", background: "#fff",
          transition: "border-color 0.15s",
          boxShadow: focused ? "0 0 0 3px rgba(46,55,164,0.08)" : "none",
        }}
      />
    </div>
  );
};

// ── Toast Notification ───────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }: ToastProps) => (
  <div style={{
    position: "fixed", bottom: 32, right: 32, zIndex: 9999,
    background: type === "success" ? "#2E37A4" : "#E53E3E",
    color: "#fff", padding: "14px 22px", borderRadius: 8,
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
    boxShadow: "0 8px 32px rgba(46,55,164,0.25)",
    display: "flex", alignItems: "center", gap: 12,
    animation: "slideUp 0.3s ease",
  }}>
    <span>{message}</span>
    <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
    <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
export default function PatientProfileSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: "Amit", lastName: "Singh",
    email: "amit.singh@example.com", phone: "+91 98765 43210",
    addressLine1: "12, Green Park Colony",
    addressLine2: "Near Civil Lines",
    country: "India", state: "Uttar Pradesh",
    city: "Meerut", pincode: "250001",
    avatarUrl: null,
  });

  const set = (key: keyof typeof form) => (val: string | null) => setForm(f => ({ ...f, [key]: val }));

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = () => {
    if (!form.firstName || !form.email) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    showToast("Profile saved successfully!");
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          set("avatarUrl")(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Render ──
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#141414]">Profile Settings</h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm overflow-hidden">
        {/* Tabs row */}
        <div className="flex border-b border-[#F2F4F7] overflow-x-auto">
          {[
            { key: "profile", label: "Profile Settings", icon: Icon.User },
            { key: "password", label: "Change Password", icon: Icon.Lock },
            { key: "notifications", label: "Notifications", icon: Icon.Notifications },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`
              flex items-center gap-2 px-6 py-4 border-none bg-transparent cursor-pointer font-inter text-sm transition-all whitespace-nowrap
              ${activeTab === tab.key ? "text-[#2E37A4] font-bold border-b-2 border-[#2E37A4]" : "text-[#667085] font-medium border-b-2 border-transparent hover:text-[#141414]"}
            `}>
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6 lg:p-8">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-8">
              {/* Basic Info */}
              <section className="flex flex-col gap-6">
                <h2 className="text-base font-bold text-[#141414]">Basic Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2E37A4] to-[#4BA461] flex items-center justify-center text-white font-bold text-2xl overflow-hidden border-4 border-[#EEF0FB] shadow-sm">
                      {form.avatarUrl
                        ? <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        : "AS"}
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2E37A4] border-2 border-white cursor-pointer flex items-center justify-center text-white hover:bg-[#1e2570] transition-colors shadow-md">
                      <Icon.Camera />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#141414] mb-1">Profile Image</div>
                    <div className="text-xs text-[#667085] mb-2 font-medium">JPG, PNG or GIF. Max size 2MB.</div>
                    <button onClick={() => fileRef.current?.click()} className="px-4 py-1.5 border border-[#D0D0D0] rounded-lg bg-white cursor-pointer font-inter text-xs font-bold text-[#141414] hover:bg-gray-50 transition-colors shadow-sm">Change Photo</button>
                  </div>
                </div>

                {/* Name + Email/Phone grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="First Name" required value={form.firstName} onChange={set("firstName")} placeholder="First name" />
                  <InputField label="Last Name" value={form.lastName} onChange={set("lastName")} placeholder="Last name" />
                  <InputField label="Email" required type="email" value={form.email} onChange={set("email")} placeholder="Email address" />
                  <InputField label="Phone Number" required value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" />
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-[#F2F4F7]" />

              {/* Address Info */}
              <section className="flex flex-col gap-6">
                <h2 className="text-base font-bold text-[#141414]">Address Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Address Line 1" value={form.addressLine1} onChange={set("addressLine1")} placeholder="Street address" />
                  <InputField label="Address Line 2" value={form.addressLine2} onChange={set("addressLine2")} placeholder="Apartment, suite, etc." />
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-bold text-[#141414]">Country</label>
                    <SelectField
                      placeholder="Select"
                      value={form.country}
                      onChange={set("country")}
                      options={["India", "United States", "United Kingdom", "Canada", "Australia"]}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-bold text-[#141414]">State</label>
                    <SelectField
                      placeholder="Select"
                      value={form.state}
                      onChange={set("state")}
                      options={["Uttar Pradesh", "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat"]}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-bold text-[#141414]">City</label>
                    <SelectField
                      placeholder="Select"
                      value={form.city}
                      onChange={set("city")}
                      options={["Meerut", "Noida", "Ghaziabad", "Agra", "Lucknow", "Kanpur"]}
                    />
                  </div>
                  <InputField label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="6-digit pincode" />
                </div>
              </section>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#F2F4F7]">
                <button onClick={() => setForm(f => ({ ...f, firstName: "Amit", lastName: "Singh" }))} className="px-6 py-2.5 border border-[#D0D0D0] rounded-lg bg-white cursor-pointer font-inter text-sm font-bold text-[#141414] hover:bg-gray-50 transition-colors shadow-sm">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-6 py-2.5 border-none rounded-lg bg-[#2E37A4] cursor-pointer font-inter text-sm font-bold text-white hover:bg-[#1e2570] transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <ChangePasswordTab onSave={() => showToast("Password changed successfully!")} />
          )}

          {activeTab === "notifications" && (
            <NotificationsTab onSave={() => showToast("Notification preferences saved!")} />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Change Password Tab ──────────────────────────────────────────────────────
function ChangePasswordTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const strength = (pwd: string) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };
  const s = strength(form.next);
  const colors = ["#E53E3E", "#F6AD55", "#F6E05E", "#4BA461"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div style={{ maxWidth: 420 }}>
      <h2 style={{ margin: "0 0 24px", fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 700, color: "#141414" }}>
        Change Password
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <InputField label="Current Password" required type="password" value={form.current} onChange={set("current")} />
        <div>
          <InputField label="New Password" required type="password" value={form.next} onChange={set("next")} />
          {form.next && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < s ? colors[s-1] : "#E8E9EE", transition: "background 0.3s" }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: s > 0 ? colors[s-1] : "#888", fontFamily: "'Inter',sans-serif" }}>
                {s > 0 ? labels[s-1] : ""}
              </div>
            </div>
          )}
        </div>
        <InputField label="Confirm New Password" required type="password" value={form.confirm} onChange={set("confirm")} />
        {form.confirm && form.next !== form.confirm && (
          <div style={{ fontSize: 12, color: "#E53E3E", fontFamily: "'Inter',sans-serif", marginTop: -10 }}>Passwords do not match.</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
          <button style={{ padding: "9px 24px", border: "1px solid #D0D0D0", borderRadius: 6, background: "#fff", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#444" }}>Cancel</button>
          <button onClick={onSave} style={{ padding: "9px 24px", border: "none", borderRadius: 6, background: "#2E37A4", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#fff", fontWeight: 600 }}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab({ onSave }: { onSave: () => void }) {
  const [prefs, setPrefs] = useState({
    email_appt: true, email_lab: false, email_prescription: true,
    sms_appt: true, sms_lab: true, sms_prescription: false,
  });
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{
      width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: checked ? "#2E37A4" : "#D0D0D0", position: "relative",
      transition: "background 0.2s", padding: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );

  const Row = ({ label, desc, k }: { label: string; desc: string; k: keyof typeof prefs }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #F4F5F8" }}>
      <div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, color: "#141414" }}>{label}</div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#888", marginTop: 2 }}>{desc}</div>
      </div>
      <Toggle checked={prefs[k]} onChange={() => toggle(k)} />
    </div>
  );

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ margin: "0 0 4px", fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 700, color: "#141414" }}>Notifications</h2>
      <p style={{ margin: "0 0 24px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#888" }}>Manage how you receive updates.</p>

      <h3 style={{ margin: "0 0 8px", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#2E37A4", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</h3>
      <Row label="Appointment Reminders" desc="Get reminded about upcoming appointments" k="email_appt" />
      <Row label="Lab Results" desc="Notify when lab reports are ready" k="email_lab" />
      <Row label="Prescription Updates" desc="Updates to your active prescriptions" k="email_prescription" />

      <h3 style={{ margin: "24px 0 8px", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#2E37A4", textTransform: "uppercase", letterSpacing: "0.5px" }}>SMS</h3>
      <Row label="Appointment Reminders" desc="SMS reminders before your visit" k="sms_appt" />
      <Row label="Lab Results" desc="SMS when lab reports are ready" k="sms_lab" />
      <Row label="Prescription Updates" desc="SMS for prescription changes" k="sms_prescription" />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 24 }}>
        <button style={{ padding: "9px 24px", border: "1px solid #D0D0D0", borderRadius: 6, background: "#fff", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#444" }}>Cancel</button>
        <button onClick={onSave} style={{ padding: "9px 24px", border: "none", borderRadius: 6, background: "#2E37A4", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#fff", fontWeight: 600 }}>
          Save Preferences
        </button>
      </div>
    </div>
  );
}