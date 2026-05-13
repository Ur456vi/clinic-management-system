# Team roster

A hybrid team: AI agents handle backend foundations and infrastructure; two human junior developers own the frontend implementation.

## AI agents

| Role | Identity | Shift | Responsibilities |
|---|---|---|---|
| Orchestrator | `Orchestrator` | 23:00 – 11:00 | Plans nightly work, spawns dev agents, no merges |
| Dev Agent (×2 max parallel) | `Dev-Agent-<TASK>` | 23:00 – 11:00 | One backend task per branch, commits, returns to orchestrator |
| PM Agent | `PM-Agent` | 07:30 – 08:30 | Reviews + auto-merges branches from AI and human devs; drafts assignments for the 09:00 emailer to send. |

## Human developers

| Name | Email | Role | Shift (local) |
|---|---|---|---|
| Urvi Sharma | sharmaurvi48@gmail.com | Frontend Junior | 10:00 – 19:00 |
| Yasha Sakeel | yasha6519@gmail.com | Frontend Junior | 10:00 – 19:00 |

Humans pick up frontend tasks (FE-** in `Vyara_Development_Tasks.xlsx`). They commit to feature branches following the same convention as agents (`task/FE-XX-<kebab-slug>`) and push to the repo's GitHub remote when ready for review.

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
