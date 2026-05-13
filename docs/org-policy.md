# Autonomous engineering org — operating policy

Vyara development runs as an autonomous multi-agent team. No human intervention is required between PR creation and main-branch merge.

## Org chart

```
Orchestrator (the overnight engineering manager)
   │
   ├── Dev Agent A   ┐
   │                 ├──→ feature branches → PM Agent → main
   ├── Dev Agent B   ┘
   │
   └── (occasional one-off agents for chores / hotfixes)
```

## Shift schedule

| Role | Window | Cron | Notes |
|---|---|---|---|
| Dev agents (×2 max parallel) | 23:00 – 11:00 local | `0 23 * * *` (kicks off the shift) | Each agent picks one task, branches off `main`, commits, opens a PR. Max two in parallel — token-aware. |
| PM agent | 02:00 – 03:00 local | `0 2 * * *` | Reviews any `task/**` or `chore/**` branch newer than `main`, auto-merges (or REQUEST_CHANGES) following the review playbook. |

## Token & rate-limit policy

- **At most 2 dev agents** run concurrently.
- If a rate limit is hit mid-session, the orchestrator pauses, returns control, and resumes on the next shift.
- Branches that didn't make it to merge stay open; PM picks them up at the next 02:00 window.

## Branch & commit conventions

- `task/<ID>-<kebab-slug>` for feature work (e.g. `task/BE-11-patient-crud-api`).
- `chore/<slug>` for ops/config (e.g. `chore/db-credentials`).
- One task per branch, one logical commit per task. Conventional Commits style: `feat(BE-11): ...`, `chore: ...`.
- Each commit message ends with `Refs: <ID>` and (if applicable) `Depends-on: <ID>`.

## PM review playbook

1. Run `git --no-pager diff --stat main..<branch>` and inspect each touched file.
2. Score on: scope match, code quality, docs presence, safety (no secrets), declared dependencies.
3. Verdict per branch:
   - **MERGE** — ff-or-no-ff into main, push back, archive the branch ref.
   - **REQUEST_CHANGES** — leave the branch as-is, record blockers in the PM report.
4. Foundation-phase carve-outs: don't block on missing tests, missing JSDoc, or style preferences.
5. SLA: ≤30 tool uses per review session.

## Mount-quirk note (internal)

The git work-tree is on a virtiofs mount that blocks `.lock`-file cleanup. All agents must operate in a `/tmp/work-<slug>` clone, commit there, then push back to the mount by:
1. Copying new objects from `<clone>/.git/objects/**` into `<mount>/.git/objects/**`.
2. Overwriting the destination ref file (e.g. `.git/refs/heads/main` or `.git/refs/heads/task/<...>`) with the new SHA.

This is the canonical workaround — do not attempt `git push` to the mount directly.
