import React from "react"
import { Settings, User, Bell, Shield, Key } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Settings</h1>
        <p className="text-sm text-[#667085] mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="col-span-1 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#F4F5FF] text-[#2E37A4] font-medium text-sm transition-colors text-left">
            <User className="h-5 w-5" /> Profile
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#667085] hover:bg-gray-50 hover:text-[#101828] font-medium text-sm transition-colors text-left">
            <Settings className="h-5 w-5" /> General
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#667085] hover:bg-gray-50 hover:text-[#101828] font-medium text-sm transition-colors text-left">
            <Bell className="h-5 w-5" /> Notifications
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#667085] hover:bg-gray-50 hover:text-[#101828] font-medium text-sm transition-colors text-left">
            <Shield className="h-5 w-5" /> Security
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="col-span-1 md:col-span-3">
          <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#EAECF0]">
              <h2 className="text-lg font-semibold text-[#101828]">Profile Information</h2>
              <p className="text-sm text-[#667085]">Update your photo and personal details here.</p>
            </div>
            <div className="p-6 opacity-60 pointer-events-none">
              <div className="flex items-center gap-6 mb-8">
                <div className="h-20 w-20 rounded-full bg-[#F2F4F7] flex items-center justify-center border-2 border-white shadow-sm">
                  <User className="h-10 w-10 text-[#98A2B3]" />
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054]">
                    Change avatar
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-[#B42318]">
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">First name</label>
                    <input disabled type="text" className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-gray-50 text-sm" value="Admin" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">Last name</label>
                    <input disabled type="text" className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-gray-50 text-sm" value="User" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1.5">Email address</label>
                  <input disabled type="email" className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-gray-50 text-sm" value="admin@vyara.local" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1.5">Role</label>
                  <input disabled type="text" className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-gray-50 text-sm" value="Administrator" />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#EAECF0] flex justify-end gap-3">
                <button className="px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054]">Cancel</button>
                <button className="px-4 py-2 bg-[#2E37A4] text-white rounded-lg text-sm font-medium">Save changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
