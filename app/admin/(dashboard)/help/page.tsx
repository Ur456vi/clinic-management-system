import React from "react"
import { HelpCircle, Mail, MessageCircle, FileText, ExternalLink } from "lucide-react"

export default function HelpSupportPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Help & Support</h1>
        <p className="text-sm text-[#667085] mt-1">Get help with the clinic management system or contact our support team.</p>
      </div>

      {/* Support Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm hover:border-[#2E37A4] transition-colors cursor-pointer group">
          <div className="h-10 w-10 bg-[#F4F5FF] text-[#2E37A4] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2E37A4] group-hover:text-white transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#101828] mb-1">Documentation</h3>
          <p className="text-sm text-[#667085] mb-4">Detailed guides on how to use all features of the system.</p>
          <span className="text-sm font-medium text-[#2E37A4] flex items-center gap-1">
            Read docs <ExternalLink className="h-3 w-3" />
          </span>
        </div>
        
        <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm hover:border-[#2E37A4] transition-colors cursor-pointer group">
          <div className="h-10 w-10 bg-[#F4F5FF] text-[#2E37A4] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2E37A4] group-hover:text-white transition-colors">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#101828] mb-1">Live Chat</h3>
          <p className="text-sm text-[#667085] mb-4">Chat directly with our technical support team (9 AM - 6 PM).</p>
          <span className="text-sm font-medium text-[#2E37A4]">
            Start a conversation
          </span>
        </div>

        <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm hover:border-[#2E37A4] transition-colors cursor-pointer group">
          <div className="h-10 w-10 bg-[#F4F5FF] text-[#2E37A4] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2E37A4] group-hover:text-white transition-colors">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#101828] mb-1">Email Support</h3>
          <p className="text-sm text-[#667085] mb-4">Send us an email and we'll get back to you within 24 hours.</p>
          <span className="text-sm font-medium text-[#2E37A4]">
            support@vyara.local
          </span>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden mt-2">
        <div className="px-6 py-5 border-b border-[#EAECF0]">
          <h2 className="text-lg font-semibold text-[#101828]">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-[#EAECF0]">
          <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <h4 className="text-sm font-semibold text-[#101828] mb-1">How do I add a new patient?</h4>
            <p className="text-sm text-[#667085]">Navigate to the Patients tab on the left sidebar, and click the "Add New Patient" button in the top right corner.</p>
          </div>
          <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <h4 className="text-sm font-semibold text-[#101828] mb-1">Can I reset my password?</h4>
            <p className="text-sm text-[#667085]">Yes, you can reset your password from the login screen using the "Forgot Password" link, or by contacting your system administrator.</p>
          </div>
          <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <h4 className="text-sm font-semibold text-[#101828] mb-1">Where are the invoices stored?</h4>
            <p className="text-sm text-[#667085]">All billing and invoices are accessible under the Invoices tab. You can filter them by status (Draft, Issued, Paid, Void).</p>
          </div>
        </div>
      </div>
    </div>
  )
}
