# Team roster

A hybrid team with a clear chain of command:

- **Leadership** — CEO (Varun) + Secondary PM (Kunal, client-facing)
- **Operations** — PM Agent (AI) runs day-to-day project management
- **Execution** — AI dev agents on backend, two human juniors on frontend

The team reports to **Kunal and Varun** for status and visibility. Operational direction (assignments, code review, merges) comes from the PM Agent.

## Leadership

| Name | Email | Role | Responsibilities |
|---|---|---|---|
| Varun Pratap Singh | varunpratapsingh191@gmail.com | CEO | Strategy, ultimate decisions, full visibility on every report and assignment. |
| Kunal | kunal@chirpin.in | Secondary PM (client-facing) | Updates and manages the client. Receives every status update so he can translate it into client comms. |

## AI agents

| Role | Identity | Shift | Responsibilities |
|---|---|---|---|
| Orchestrator | `Orchestrator` | 23:00 – 11:00 | Plans nightly work, spawns dev agents, no merges |
| Dev Agent (×2 max parallel) | `Dev-Agent-<TASK>` | 23:00 – 11:00 | One backend task per branch, commits, returns to orchestrator |
| PM Agent | `PM-Agent` | 07:30 – 08:30 | Primary PM. Reviews + auto-merges branches from AI and human devs; drafts daily assignments; reports up to Kunal + Varun via the 12:00 daily-reports cron. |

## Human developers

| Name | Email | Role | Shift (local) | Branch namespace |
|---|---|---|---|---|
| Urvi Sharma | sharmaurvi48@gmail.com | Frontend Junior (doctor portal) | 10:00 – 19:00 | `urvi/<FE-ID>-<slug>` or `urvi` for WIP |
| Yasha Sakeel | yasha6519@gmail.com | Frontend Junior (patient portal) | 10:00 – 19:00 | `yasha/<FE-ID>-<slug>` or `yasha` for WIP |

Humans pick up frontend tasks (FE-** in `Vyara_Development_Tasks.xlsx`). They commit to feature branches in **their own namespace** so attribution is clear in the git log and PM can easily filter PRs by owner. Pushes to GitHub's remote are picked up at the next 07:30 PM review.

> **Initial divergence note** (2026-05-13): Urvi's existing work is on `main`; Yasha's is on the `yasha` branch. The migration to unified routing/auth is tracked in [`portal-consolidation-plan.md`](./portal-consolidation-plan.md).

## Daily rhythm

```
05:00  AI dev shift starts (off-peak)
        └─ Orchestrator picks 2 backend tasks, spawns 2 dev agents
06:30  Dev agents finish; branches open
07:30  PM Agent reviews fresh AI PRs + any human PRs from yesterday evening
        ├─ Auto-merges approved branches into main
        └─ Drafts today's frontend assignments to assignments/<DATE>/<dev>.md
08:30  PM shift closes
09:00  Emailer sends today's assignments to Urvi & Yasha (Cc Kunal)
10:00  Urvi and Yasha online; pick up assignments from inbox
12:00  Daily task report → kunal@chirpin.in (off-peak)
19:00  Urvi and Yasha push their day's branches; sign off
05:00  Cycle repeats
```

> Every LLM-heavy job runs in the IST off-peak window (05:00–18:30 IST = US night → US early-morning = Anthropic's lowest load). AI dev PRs get same-day review (≈2.5 h SLA); human PRs pushed at 19:00 get reviewed the next morning at 07:30 (≈12.5 h SLA).

## Communication

- **Code review / merge decisions**: PM Agent comments on the branch, auto-merges on approval, leaves blockers in `assignments/<date>/<dev>.md` if changes needed.
- **Task assignment**: PM Agent emails each human at the start of their shift (10:00) — Subject prefix `[Vyara] Today's assignments — <date>`.
- **Standups / async updates**: not required; the workbook + git log is the source of truth.

## Workbook expectations

- Each human updates the `Status` column of their FE-** rows when they pick a task up (`In progress`) and when they push (`In review`).
- PM updates the column to `Merged` after auto-merge.
