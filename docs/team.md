# Team roster

A hybrid team: AI agents handle backend foundations and infrastructure; two human junior developers own the frontend implementation.

## AI agents

| Role | Identity | Shift | Responsibilities |
|---|---|---|---|
| Orchestrator | `Orchestrator` | 23:00 – 11:00 | Plans nightly work, spawns dev agents, no merges |
| Dev Agent (×2 max parallel) | `Dev-Agent-<TASK>` | 23:00 – 11:00 | One backend task per branch, commits, returns to orchestrator |
| PM Agent | `PM-Agent` | 02:00 – 03:00 | Reviews + auto-merges branches from AI and human devs, emails next-day assignments to humans |

## Human developers

| Name | Email | Role | Shift (local) |
|---|---|---|---|
| Urvi Sharma | sharmaurvi48@gmail.com | Frontend Junior | 10:00 – 19:00 |
| Yasha Sakeel | yasha6519@gmail.com | Frontend Junior | 10:00 – 19:00 |

Humans pick up frontend tasks (FE-** in `Vyara_Development_Tasks.xlsx`). They commit to feature branches following the same convention as agents (`task/FE-XX-<kebab-slug>`) and push to the repo's GitHub remote when ready for review.

## Daily rhythm

```
23:00  AI dev shift starts
        └─ Orchestrator picks 2 backend tasks, spawns 2 dev agents
01:00  Dev agents finish; branches open
02:00  PM Agent shift opens
        ├─ Reviews all open task/** + chore/** branches (AI + human)
        ├─ Auto-merges approved branches into main
        └─ Sends tomorrow's frontend task assignments to Urvi and Yasha
03:00  PM shift closes
10:00  Urvi and Yasha online; pick up the assignments PM left for them
19:00  Urvi and Yasha push their day's branches; sign off
23:00  Cycle repeats
```

## Communication

- **Code review / merge decisions**: PM Agent comments on the branch, auto-merges on approval, leaves blockers in `assignments/<date>/<dev>.md` if changes needed.
- **Task assignment**: PM Agent emails each human at the start of their shift (10:00) — Subject prefix `[Vyara] Today's assignments — <date>`.
- **Standups / async updates**: not required; the workbook + git log is the source of truth.

## Workbook expectations

- Each human updates the `Status` column of their FE-** rows when they pick a task up (`In progress`) and when they push (`In review`).
- PM updates the column to `Merged` after auto-merge.
