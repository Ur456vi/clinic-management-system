"use client";

/**
 * Calendly-style date + time picker for the assessment booking form.
 *
 *   - Left column: a month calendar with prev/next month navigation. Past
 *     dates and Sundays (clinic is "By Appointment Only" on Sundays per
 *     the contact page) are disabled. Today is outlined; the active
 *     selection is filled burgundy.
 *   - Right column: once a date is picked, the available time slots
 *     (30-min grid 9:00–18:30) appear as buttons. Clicking one sets the
 *     final date+time and calls back to the parent form.
 *   - Both selections live in component-local state and are pushed up
 *     through onChange whenever they change so the parent form can drive
 *     submit-button enablement.
 *
 * No dependencies — pure date arithmetic on the Date prototype. Date
 * strings are kept in ISO `YYYY-MM-DD` shape to match the server's zod
 * validator. Times are `HH:MM` strings.
 */

import * as React from "react";

import { ChevronDownIcon } from "@/components/public/icons";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarPickerProps = {
  value: { date: string; time: string };
  onChange: (next: { date: string; time: string }) => void;
};

export function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  // The month currently shown in the calendar grid (defaults to the
  // selected date's month, falling back to today).
  const [viewMonth, setViewMonth] = React.useState<Date>(() => {
    if (value.date) {
      const parsed = parseIso(value.date);
      if (parsed) return startOfMonth(parsed);
    }
    return startOfMonth(new Date());
  });

  const today = React.useMemo(() => startOfDay(new Date()), []);

  const monthLabel = viewMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  // Grid days: leading blanks for week alignment + every day of the month.
  // Week starts Monday (Indian convention).
  const grid = React.useMemo(() => {
    const first = startOfMonth(viewMonth);
    // Monday = 0, Sunday = 6
    const weekdayIdx = (first.getDay() + 6) % 7;
    const daysInMonth = endOfMonth(viewMonth).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < weekdayIdx; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(
        new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d),
      );
    }
    return cells;
  }, [viewMonth]);

  const selectedDate = value.date ? parseIso(value.date) : null;

  const canGoPrev = (() => {
    // Disallow paging into a fully-past month.
    const prev = addMonths(viewMonth, -1);
    return endOfMonth(prev).getTime() >= today.getTime();
  })();

  return (
    <div
      className="rounded-2xl border p-4 md:p-6"
      style={{
        background: "white",
        borderColor: "var(--brand-rule)",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="md:col-span-7">
          {/* Month header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => canGoPrev && setViewMonth(addMonths(viewMonth, -1))}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--brand-cream-2)]"
              style={{ color: "var(--brand-ink)" }}
            >
              <ChevronDownIcon
                size={18}
                style={{ transform: "rotate(90deg)" }}
              />
            </button>
            <p
              className="text-sm font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "18px",
              }}
            >
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              aria-label="Next month"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--brand-cream-2)]"
              style={{ color: "var(--brand-ink)" }}
            >
              <ChevronDownIcon
                size={18}
                style={{ transform: "rotate(-90deg)" }}
              />
            </button>
          </div>

          {/* Weekday strip */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="text-[11px] font-semibold uppercase tracking-wider text-center py-1"
                style={{ color: "var(--brand-mute)" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, i) => {
              if (!day) return <div key={`b${i}`} />;
              const iso = toIso(day);
              const isPast = day.getTime() < today.getTime();
              const isSunday = day.getDay() === 0;
              const isDisabled = isPast || isSunday;
              const isToday = sameDay(day, today);
              const isSelected =
                selectedDate !== null && sameDay(day, selectedDate);

              const style: React.CSSProperties = {};
              let cls =
                "w-full aspect-square rounded-full flex items-center justify-center text-sm transition-all";
              if (isDisabled) {
                style.color = "var(--brand-mute)";
                style.opacity = 0.4;
                cls += " cursor-not-allowed line-through";
              } else if (isSelected) {
                style.background = "var(--brand-burgundy)";
                style.color = "white";
                style.fontWeight = 600;
                cls += " shadow-sm";
              } else if (isToday) {
                style.border = "1.5px solid var(--brand-burgundy)";
                style.color = "var(--brand-burgundy)";
                style.fontWeight = 600;
              } else {
                style.color = "var(--brand-ink)";
              }
              if (!isDisabled && !isSelected) {
                cls +=
                  " hover:bg-[var(--brand-cream)] hover:text-[var(--brand-burgundy)]";
              }

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    // Selecting a new date clears the time so the user
                    // re-picks a slot — prevents accidentally booking the
                    // wrong combination.
                    onChange({ date: iso, time: "" });
                  }}
                  className={cls}
                  style={style}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <p
            className="mt-3 text-[11px]"
            style={{ color: "var(--brand-mute)" }}
          >
            Sundays are by appointment only — please contact us directly to
            request a Sunday slot.
          </p>
        </div>

        {/* Time slots */}
        <div
          className="md:col-span-5 border-t pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6"
          style={{ borderColor: "var(--brand-rule)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--brand-burgundy)" }}
          >
            {selectedDate
              ? `Slots for ${selectedDate.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}`
              : "Select a date"}
          </p>

          {selectedDate ? (
            <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {TIME_SLOTS.map((slot) => {
                const isSelected = value.time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onChange({ date: value.date, time: slot })}
                    className="rounded-lg py-2.5 text-sm font-semibold transition-all"
                    style={
                      isSelected
                        ? {
                            background: "var(--brand-burgundy)",
                            color: "white",
                            border: "1.5px solid var(--brand-burgundy)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--brand-burgundy)",
                            border: "1.5px solid var(--brand-burgundy)",
                          }
                    }
                  >
                    {formatSlotLabel(slot)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-xl border border-dashed px-4 py-6 text-center text-xs"
              style={{
                borderColor: "var(--brand-rule)",
                color: "var(--brand-mute)",
                background: "var(--brand-cream-2)",
              }}
            >
              Pick a day on the calendar to see available time slots.
            </div>
          )}

          {value.date && value.time ? (
            <div
              className="mt-4 rounded-xl p-4 text-sm"
              style={{
                background: "var(--brand-olive-soft)",
                color: "var(--brand-ink)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--brand-burgundy)" }}>
                Your slot
              </p>
              <p className="font-semibold">
                {parseIso(value.date)?.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {formatSlotLabel(value.time)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── time slots (9:00 – 18:30, every 30 min) ──────────────────────── */

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];

  for (let h = 10; h <= 18; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
  }

  return out;
})();

function formatSlotLabel(slot: string): string {
  // 09:30 → 9:30 AM, 14:00 → 2:00 PM
  if (!/^\d{2}:\d{2}$/.test(slot)) return slot;
  const [hStr, m] = slot.split(":");
  const h = Number.parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m} ${period}`;
}

/* ── date helpers ─────────────────────────────────────────────────── */

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map((x) => Number.parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}
