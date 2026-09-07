"use client";

/**
 * Patient Health Score.
 *
 * Read-only view of the patient's own IPHMH wellness score from their RMO
 * consultations (GET /api/patient/me/scores, .../scores/:id).
 *
 * Three things this page deliberately does NOT show, per the clinical brief:
 *
 *   1. Per-question point values — anywhere, including tooltips and title
 *      attributes. Sections only.
 *   2. Red flags. Surfacing "blood in stool" to a patient in a self-service
 *      screen with no clinician present is a clinical decision, and the default
 *      is hidden.
 *   3. Draft or thinly-completed consultations. The API withholds those, so an
 *      empty list here means "not ready yet", never "you scored zero".
 *
 * Bars are neutral rather than traffic-lit: a red bar on a wellness
 * questionnaire reads to a patient as a diagnosis.
 */

import { useCallback, useEffect, useState } from "react";
import { Gauge, Loader2, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { ScoreBar } from "@/components/score/ScoreBar";
import { fraction, pct, scoreDate } from "@/components/score/format";

type HistoryEntry = {
  consultationId: string;
  date: string;
  overallScore: number;
  overallMaxScore: number;
  delta: number | null;
};

type SectionScore = { key: string; name: string; score: number; maxScore: number };

type ScoreDetail = {
  consultationId: string;
  consultationDate: string;
  totalScore: number;
  maxScore: number;
  sections: SectionScore[];
};

const CARD =
  "bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] shadow-sm";

export default function PatientHealthScorePage() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [detail, setDetail] = useState<ScoreDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/patient/me/scores?limit=10", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows: HistoryEntry[] = (await res.json())?.data ?? [];
      setHistory(rows);
      setError(null);
      if (rows.length === 0) return;

      const d = await fetch(`/api/patient/me/scores/${rows[0].consultationId}`, {
        credentials: "include",
      });
      if (!d.ok) throw new Error(`HTTP ${d.status}`);
      setDetail((await d.json())?.data ?? null);
    } catch {
      setError("We couldn't load your health score just now. Please try again shortly.");
      setHistory([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (history === null) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#6B2B26]" />
        Loading your health score…
      </div>
    );
  }

  const latest = history[0] ?? null;
  const percent = detail ? pct(detail.totalScore, detail.maxScore) : null;
  const older = history.slice(1);

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Health Score</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          A summary of your consultation, area by area. A higher score means a
          healthier result.
        </p>
      </div>

      {error ? (
        <p
          className="text-sm font-medium rounded-lg px-3 py-2"
          style={{ background: "#FDECEC", color: "#B4322B" }}
        >
          {error}
        </p>
      ) : null}

      {!latest || !detail ? (
        <div className={`${CARD} flex flex-col items-center justify-center py-14 text-center px-6`}>
          <Gauge className="h-8 w-8 mb-3 text-[#C9BFA6]" />
          <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">
            Your health score isn&apos;t ready yet
          </p>
          <p className="text-sm text-[#6B7B73] dark:text-[#94A3B8] mt-1.5 max-w-md">
            It appears here once your consultation has been completed with your
            care team. Nothing is needed from you in the meantime.
          </p>
        </div>
      ) : (
        <>
          {/* Overall */}
          <div className={`${CARD} p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#6C7688] dark:text-[#94A3B8]">
                  Overall
                </p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-4xl font-bold text-[#101828] dark:text-[#F9FAFB]">
                    {detail.totalScore.toLocaleString("en-GB")}
                  </span>
                  <span className="text-sm text-[#6C7688] dark:text-[#94A3B8]">
                    / {detail.maxScore.toLocaleString("en-GB")}
                  </span>
                  {percent !== null ? (
                    <span className="text-sm font-semibold text-[#6C7688] dark:text-[#94A3B8]">
                      ({percent}%)
                    </span>
                  ) : null}
                </div>
              </div>
              {latest.delta !== null ? <DeltaPill delta={latest.delta} /> : null}
            </div>

            <div className="mt-4">
              <ScoreBar
                label="Overall health score"
                score={detail.totalScore}
                maxScore={detail.maxScore}
                tone="neutral"
              />
            </div>

            <p className="text-xs text-[#6C7688] dark:text-[#94A3B8] mt-4">
              Consultation of {scoreDate(detail.consultationDate)}
            </p>
          </div>

          {/* Sections */}
          <div className={`${CARD} p-6`}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#101828] dark:text-[#F9FAFB] mb-5">
              By area
            </h2>
            <ul className="space-y-4">
              {detail.sections.map((s) => {
                const p = pct(s.score, s.maxScore);
                return (
                  <li key={s.key}>
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <span className="text-sm text-[#344054] dark:text-[#CBD5E1]">{s.name}</span>
                      <span className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] shrink-0 tabular-nums">
                        {fraction(s.score, s.maxScore)}
                        {p !== null ? (
                          <span className="ml-2 font-normal text-[#6C7688] dark:text-[#94A3B8]">
                            {p}%
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <ScoreBar label={s.name} score={s.score} maxScore={s.maxScore} tone="neutral" />
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-[#6C7688] dark:text-[#94A3B8] mt-5 pt-4 border-t border-[#EAECF0] dark:border-[#374151]">
              Only the areas covered in your consultation are shown. Your care
              team can talk you through any of them.
            </p>
          </div>

          {/* History */}
          {older.length > 0 ? (
            <div className={`${CARD} p-6`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#101828] dark:text-[#F9FAFB] mb-4">
                Previous consultations
              </h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EAECF0] dark:border-[#374151]">
                    {["Date", "Score", "Change"].map((h) => (
                      <th
                        key={h}
                        className="py-2 text-xs font-medium uppercase tracking-wider text-[#6C7688] dark:text-[#94A3B8]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                  {older.map((e) => {
                    const p = pct(e.overallScore, e.overallMaxScore);
                    return (
                      <tr key={e.consultationId}>
                        <td className="py-3 text-sm text-[#101828] dark:text-[#F9FAFB]">
                          {scoreDate(e.date)}
                        </td>
                        <td className="py-3 text-sm tabular-nums text-[#101828] dark:text-[#F9FAFB]">
                          <span className="font-semibold">
                            {fraction(e.overallScore, e.overallMaxScore)}
                          </span>
                          {p !== null ? (
                            <span className="text-[#6C7688] dark:text-[#94A3B8]"> ({p}%)</span>
                          ) : null}
                        </td>
                        <td className="py-3">
                          {e.delta === null ? (
                            // The two consultations covered different areas, so
                            // the totals are not comparable. Saying so beats a
                            // dash the reader will try to subtract past.
                            <span className="text-xs text-[#6C7688] dark:text-[#94A3B8]">
                              different areas covered
                            </span>
                          ) : (
                            <DeltaPill delta={e.delta} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Higher is healthier here, so a rise is the good outcome. */
function DeltaPill({ delta }: { delta: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{
        background: delta > 0 ? "#ECFDF3" : delta < 0 ? "#FEF3F2" : "#F2F4F7",
        color: delta > 0 ? "#027A48" : delta < 0 ? "#B42318" : "#344054",
      }}
      title="Change since your previous consultation"
    >
      {delta > 0 ? (
        <TrendingUp className="h-3 w-3" />
      ) : delta < 0 ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )}
      {delta > 0 ? "+" : ""}
      {delta}
    </span>
  );
}
