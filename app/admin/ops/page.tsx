"use client"

/**
 * /admin/ops — entry point for the Patient Operations Tracker. Resolves the
 * most recent patient and forwards to their tracker. (A real build would
 * land on a patient picker / global search.)
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export default function OpsIndexPage() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/patients?limit=1", { credentials: "include" })
        const json = await res.json()
        const id = (json?.data ?? [])[0]?.id
        if (!cancelled && id) router.replace(`/admin/ops/${id}`)
        else if (!cancelled) router.replace("/admin/patients")
      } catch {
        if (!cancelled) router.replace("/admin/patients")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div style={{ background: "#F6F1E7", minHeight: "100vh" }} className="flex items-center justify-center text-[#16302A]">
      <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Opening operations tracker…
    </div>
  )
}
