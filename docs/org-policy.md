# Autonomous engineering org — operating policy

Vyara development runs as a hybrid team. AI agents own backend foundations and infrastructure; two human junior developers own frontend implementation. No human intervention is required between PR creation and main-branch merge — the PM Agent does the review and merge.

For team identity, see [`team.md`](./team.md).

## Org chart

```
Orchestrator (AI, night-shift engineering manager)
   │
   ├── Dev Agent A (AI)   ┐
   │                       ├──→ task/** branches  ┐
   ├── Dev Agent B (AI)   ┘                        │
   │                                                ├──→ PM Agent (AI)  ──→  main
   ├── Urvi Sharma (human, frontend)               │
   └── Yasha Sakeel (human, frontend)              ┘
        └──→ task/FE-** branches
```

## Shift schedule

| Role | Window | Cron | Notes |
|---|---|---|---|
| AI dev agents (×2 max) | 23:00 – 11:00 | `0 23 * * *` | Each agent picks one backend task, branches off `main`, opens a PR. |
| PM Agent | 02:00 – 03:00 | `0 2 * * *` | Reviews every open `task/**` and `chore/**` branch (AI + human), auto-merges approved ones, emails new assignments to Urvi and Yasha. |
| Human juniors | 10:00 – 19:00 | manual | Frontend tasks (FE-**). Read assignments emailed by PM. Branch + commit + push to remote. |

## Token & rate-limit policy

- **At most 2 AI dev agents** run concurrently.
- If a rate limit is hit, the orchestrator pauses, returns control, and lets the next scheduled shift pick it up.
- Branches that didn't make it to merge stay open; PM picks them up at the next 02:00 window.

## Branch & commit conventions

- `task/<ID>-<kebab-slug>` for feature work (e.g. `task/BE-11-patient-crud-api`, `task/FE-12-patient-list-real-fetch`).
- `chore/<slug>` for ops/config (e.g. `chore/db-credentials`).
- One task per branch, one logical commit per task. Conventional Commits style: `feat(BE-11): ...`, `feat(FE-12): ...`, `chore: ...`.
- Each commit message ends with `Refs: <ID>` and (if applicable) `Depends-on: <ID>`.

## PM review playbook

1. Run `git --no-pager diff --stat main..<branch>` and inspect each touched file.
2. Score on: scope match, code quality, docs presence, safety (no secrets), declared dependencies.
3. Verdict per branch:
   - **MERGE** — `--no-ff` into main, push back, archive the branch ref.
   - **REQUEST_CHANGES** — leave the branch as-is; record blockers in `assignments/<date>/<dev>.md` (for humans) or in the next dev-shift queue (for AI).
4. Foundation-phase carve-outs: don't block on missing tests, missing JSDoc, or style preferences.
5. SLA: ≤45 tool uses per nightly review.

## PM email-assignment playbook

After review/merge, PM picks 1–2 unblocked **frontend** tasks per human junior from `Vyara_Development_Tasks.xlsx` (priority: `P0 Foundation` and `P1 Clinical` first, then `P2 Treatment`). For each human:

1. Compose an assignment message (see `assignments/_TEMPLATE.md`).
2. Try to send via Resend if `RESEND_API_KEY` is set in `.env.local`. See `scripts/send_email.sh`.
3. **Fallback**: write the message to `assignments/<YYYY-MM-DD>/<dev>.md`. The user can then forward manually.

PM logs every assignment in the shift report.

## Mount-quirk note (internal)

The git work-tree is on a virtiofs mount that blocks `.lock`-file cleanup. All agents must operate in a `/tmp/work-<slug>` clone, commit there, then push back to the mount by:
1. Copying new objects from `<clone>/.git/objects/**` into `<mount>/.git/objects/**`.
2. Overwriting the destination ref file with the new SHA.

This is the canonical workaround — do not attempt `git push` to the mount directly.
