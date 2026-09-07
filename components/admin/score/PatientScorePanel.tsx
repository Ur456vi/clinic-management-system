"use client"

import { useCallback, useEffect, useState } from "react"

import { ScorePanel } from "./ScorePanel"
import type { ConsultationScore, ScoreHistoryEntry } from "./types"

/**
 * Score tab for the patient detail page.
 *
 * Two requests: the history endpoint for the timeline, then the newest entry's
 * full score for the section breakdown. The history endpoint deliberately
 * carries totals only, so the sections have to be asked for separately.
 */
export function PatientScorePanel({ patientId }: { patientId: string }) {
  const [score, setScore] = useState<ConsultationScore | null>(null)
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Nothing sets state before the first `await`: a synchronous setState inside
  // an effect body triggers a cascading render.
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/scores?limit=10`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const rows: ScoreHistoryEntry[] = (await res.json()).data ?? []
      setHistory(rows)
      setError(null)

      if (rows.length === 0) {
        setScore(null)
        return
      }
      const detail = await fetch(`/api/consultations/${rows[0].consultationId}/score`, {
        credentials: "include",
      })
      if (!detail.ok) throw new Error(`HTTP ${detail.status}`)
      setScore((await detail.json()).data)
    } catch (err) {
      setError(err instanceof Error ? `Couldn't load score (${err.message})` : "Couldn't load score")
    } finally {
      setLoading(false)
    }
  }, [patientId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  /** Retry runs from a click, so showing the spinner again is safe here. */
  const retry = useCallback(() => {
    setLoading(true)
    void load()
  }, [load])

  return (
    <ScorePanel
      score={score}
      // The newest consultation's own delta is shown on the card, so drop it
      // from the table to avoid stating the same change twice.
      history={history.slice(1)}
      loading={loading}
      error={error}
      onRetry={retry}
    />
  )
}
