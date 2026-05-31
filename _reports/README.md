# _reports/ — Plain-language reports

This folder holds **ELI5 reports**: short, jargon-free write-ups of what
happened during the project, filed at meaningful moments so a smart
non-engineer can read one and understand the work without digging through
commits, trackers, or chat logs.

Think of it as the project's **"what just happened, in plain English"** shelf.
Every report leads with a **TL;DR**, explains the work like you would to a
curious friend, and always lists **watch-outs** (the risks and gotchas).

## When reports get filed

| Subdir | Filed when | Rough company analogy |
|---|---|---|
| `sprints/` | A sprint finishes (closed / retrospected) | "What shipped this iteration" |
| `milestones/` | A roadmap milestone / release ships | "Release announcement, readable" |
| `sessions/` | A working session ends | **The weekly-status equivalent** |
| `checkpoints/` | Any intelligent moment worth capturing (free-form) | "Heads-up note to the team" |

Reports do **not** have to be about sprints. The `sessions/` and `checkpoints/`
folders exist so the project can capture "here's where we are" at natural
breakpoints — the substitute for a weekly company update.

## How to write one

Use the skill — don't hand-roll the format:

```
/report sprint <SP-id>
/report milestone <milestone-name-or-version>
/report session            # this session; dated filename
/report checkpoint "<short title>"
```

`/report` reads the relevant artifacts (sprint tracker + retro + commits, the
ROADMAP milestone block, this session's commits + events + conversation, or a
free-form moment), then writes a filled report into the right subdir here.

Every report follows `framework/templates/report/REPORT_TEMPLATE.md`, in this
exact order:

1. **`# <Type> Report — <id/title> (<date>)`**
2. **`## TL;DR`** — 2–4 sentences at the very top: what happened + why it
   matters.
3. **`## What we did (ELI5)`** — plain language, no jargon. Explain like to a
   smart non-engineer.
4. **`## Watch-outs`** — risks, gotchas, debt, things to monitor. Never empty:
   if there's nothing, the report says **"none"** explicitly.
5. **`## Details / links`** — the audit trail (commits, artifacts, related
   sprint/milestone ids), kept *below* the ELI5 layer for anyone who wants to
   dig in.

## Filename convention

- Sprint: `_reports/sprints/<SP-id>.md` (e.g. `SP-20260531-001.md`)
- Milestone: `_reports/milestones/<name-or-version>.md` (e.g. `0.18.1.md`)
- Session: `_reports/sessions/<YYYY-MM-DD>.md` (add `-HHMM` if a day has more
  than one)
- Checkpoint: `_reports/checkpoints/<YYYY-MM-DD>-<slug>.md`

One file per report. Reports are append-only history — don't rewrite an old
report when something changes later; file a new checkpoint or correct it in the
next report and link back.

## Dual identity (read this before assuming what lives here)

`_reports/` has **two meanings** depending on which repo you're in — the same
split as `ROADMAP.md`:

- **In canonical WarpOS (this repo):** `_reports/` holds **WarpOS's own**
  reports — the framework's sprints, milestones, and sessions. The reports
  committed here describe building WarpOS itself.
- **In a downstream consumer project:** `_reports/` is the **consumer's own**
  report shelf, describing *their* product's work. A fresh install receives an
  **empty seed** — just this folder layout (the four subdirs + a copy of this
  README), with **no canonical reports inside**.

Sync is **one-way** (canonical → consumer) and covers only the *structure +
template + `/report` skill*, never the report content. Consumers never push
reports back to canonical.

### Ownership

Report content is **`owner=project`** — per-project output, like sprint tracker
state or runtime logs. It is **NOT framework-manifest content**: WarpOS's own
reports in this repo are not shipped to consumers, and a consumer's reports are
theirs alone. The only framework-owned, shipped pieces are the **template**
(`framework/templates/report/REPORT_TEMPLATE.md`), the **`/report` skill**, and
this **README seed** — not the `.md` reports that land in the four subdirs.
