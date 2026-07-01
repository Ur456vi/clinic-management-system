"use client"

/**
 * In-app file preview. Renders a file inline (PDF in an iframe, images as an
 * <img>) inside a modal instead of downloading it. The `url` must be an
 * INLINE presigned URL (minted with `asAttachment: false`) — an attachment
 * disposition would make the browser download even inside the iframe.
 *
 * File types browsers can't render inline (e.g. Word .doc/.docx) fall back to
 * an "Open in new tab" button.
 */

import { X, ExternalLink, FileText } from "lucide-react"

export default function FilePreviewModal({
  url,
  filename,
  mime,
  onClose,
}: {
  url: string
  filename: string | null
  mime: string | null
  onClose: () => void
}) {
  const isImage = !!mime && mime.startsWith("image/")
  const isPdf = mime === "application/pdf"

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(16,24,40,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[88vh] bg-white dark:bg-[#1F2937] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#EAECF0] dark:border-[#374151]">
          <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">
            {filename || "Document"}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => window.open(url, "_blank", "noopener")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475467] dark:text-[#CBD5E1] hover:underline px-2 py-1"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-[#98A2B3] hover:bg-gray-100 dark:hover:bg-[#111827]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-[#F4F5F7] dark:bg-[#111827] flex items-center justify-center overflow-auto">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={filename || "Preview"} className="max-w-full max-h-full object-contain" />
          ) : isPdf ? (
            <iframe src={url} title={filename || "Preview"} className="w-full h-full border-0" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
              <FileText className="h-10 w-10 text-[#C9BFA6]" />
              <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
                This file type can&apos;t be previewed here.
              </p>
              <button
                type="button"
                onClick={() => window.open(url, "_blank", "noopener")}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#1F3D33" }}
              >
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
