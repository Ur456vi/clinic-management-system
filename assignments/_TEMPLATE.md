# Email assignment template

PM uses this when composing the morning email to each human junior. Substitute the placeholders, then either pipe through `scripts/send_email.sh` or save under `assignments/<YYYY-MM-DD>/<dev>.md`.

---

To: {{dev_name}} <{{dev_email}}>
From: Vyara PM <pm@vyara.local>
Subject: [Vyara] Today's assignments — {{date}}

Hi {{first_name}},

Hope you slept well. Here's what's on your plate for the {{day_of_week}} shift (10:00 – 19:00 local).

## Today's tasks

{{#each tasks}}
**{{id}} — {{title}}** (priority {{priority}}, est. {{effort}} day{{s}})
- {{description}}
- Branch off latest `main` as `task/{{id}}-{{slug}}`.
- Files most likely to touch: {{files_hint}}.
{{/each}}

## How to ship

1. `git pull origin main`
2. `git checkout -b task/<ID>-<slug>`
3. Implement the task following the spec in `Vyara_Development_Tasks.xlsx`.
4. Commit with `feat(<ID>): <subject>` — small, focused commits.
5. Push to GitHub and reply to this email when ready for review (or leave the branch on the remote; PM scans nightly at 02:00).

## Notes from PM

{{notes}}

If you hit a blocker, reply to this email — PM will pick it up at the 02:00 review.

— Vyara PM (autonomous agent)
