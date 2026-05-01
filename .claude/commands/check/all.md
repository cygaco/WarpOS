---
description: Run every check in parallel and produce one unified report — architecture, environment, references, requirements, patterns, system. One command for full project health.
---

# /check:all — Unified Health Check

Runs every `/check:*` skill in parallel and merges their output into one report. The single-entry diagnostic. Use before shipping, on session start after a long break, or any time you're about to trust the system to do heavy work.

This skill does **not** duplicate logic — it delegates to the specialists and aggregates. If a specialist changes its checks, `/check:all` inherits the change for free.

## Input

`$ARGUMENTS` — Mode selection:
- No args — run all six checks with their default modes (fast where possible, thorough for audits)
- `--fast` — skip slow modes. Just: architecture internal, environment ready, references quick, requirements static compact, system inventory, patterns diagnose-only
- `--deep` — run thorough modes (architecture seams+health, environment audit, patterns diagnose+propose, requirements full static audit)
- `--json` — raw aggregated JSON output
- `--since=<N>d` — passed through to patterns for time-window analysis
- `--focus=<feature>` — scoped spec audit in requirements

---

## Delegation plan

Dispatch **six specialists in parallel** (via Agent tool where each produces a sub-report, or Bash-spawned `claude -p` for non-team sessions):

| # | Skill | Mode (default / `--fast` / `--deep`) | Produces |
|---|---|---|---|
| 1 | `/check:architecture` | internal+seams+health / internal / internal+seams+health | Layer integrity report |
| 2 | `/check:environment` | ready / ready / audit | Tool + env readiness |
| 3 | `/check:references` | (default) / --summary / (default) | Broken-ref list |
| 4 | `/check:requirements` | static / static --compact / static full + drift | Spec health |
| 5 | `/check:patterns` | diagnose / diagnose / diagnose+propose | Cross-run intelligence |
| 6 | `/check:system` | inventory / inventory / inventory + drift | System manifest audit |

All six run concurrently. Each returns a JSON report with `{ findings: [{severity, check, message, file?, suggestedFix?}], summary }`.

**Don't run sequentially.** The skills are side-effect-free audits; parallel dispatch is safe and cuts wall time ~4×.

---

## Aggregation

After all six return, merge into one rollup:

### Summary table

```
┌──────────────────────────────────────────────────────────────────────┐
│ /check:all — 2026-04-17T03:45Z — mode: default                       │
├──────────────────────────────────────────────────────────────────────┤
│  Specialist          Critical  High  Medium  Low   Status            │
│  ────────────        ────────  ────  ──────  ───   ──────            │
│  architecture        0         2     5       3     ⚠ 2 high          │
│  environment         0         0     1       0     ✓ ready           │
│  references          1         0     4       12    ✗ 1 broken link   │
│  requirements        0         3     7       2     ⚠ spec drift      │
│  patterns            —         —     —       —     ✓ 0 new clusters  │
│  system              0         0     2       0     ⚠ 2 stale entries │
│  ────────────        ────────  ────  ──────  ───   ──────            │
│  TOTAL               1         5     19      17                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Critical section

Anything severity=critical across all specialists. List each with: which specialist, file, one-line fix. This is the go/no-go gate — critical = ship blocked.

### High-priority actions

Top 5-10 across specialists, sorted by severity then impact. Each entry:
- `[specialist] <file>:<line>` — message
- Suggested fix

### Per-specialist sections

Full sub-reports collapsed by default. One-line teaser + "run /check:<name> directly for detail."

### Recommended next commands

Based on findings:
- Any critical references → `/check:references --fix`
- Any stale maps → `/maps:all --refresh`
- Any spec drift → `/check:requirements review`
- Any manifest drift → `/check:system --update`
- Provider CLI missing → echo the install command inline

---

## Output format

### Markdown (default)

Full formatted report above, plus:

```
## Decision

✓ SHIP — zero critical findings
OR
✗ BLOCKED — <N> critical findings must be resolved before ship
OR
⚠ PROCEED WITH CAUTION — zero critical, but <N> high findings should be addressed
```

### JSON (`--json`)

```json
{
  "ranAt": "<ISO>",
  "mode": "default|fast|deep",
  "specialists": {
    "architecture": { "critical": N, "high": N, "findings": [...] },
    "environment": { "...": "..." },
    "references": { "...": "..." },
    "requirements": { "...": "..." },
    "patterns": { "...": "..." },
    "system": { "...": "..." }
  },
  "summary": { "critical": N, "high": N, "medium": N, "low": N },
  "decision": "ship|blocked|caution",
  "recommended_next": ["/check:references --fix", "/maps:all --refresh"]
}
```

---

## Execution

**Via the Agent tool (team mode):**

Dispatch six Explore agents in a single message (multiple tool calls in one turn = parallel). Each agent's prompt is the corresponding specialist skill's content + "Run in <mode> mode. Return JSON report."

**Via `claude -p` (solo mode, no teammates):**

Bash, all six in the background with `&`, then `wait`:

```bash
claude -p "/check:architecture internal" > /tmp/check-arch.json &
claude -p "/check:environment ready"    > /tmp/check-env.json &
claude -p "/check:references"           > /tmp/check-refs.json &
claude -p "/check:requirements static"  > /tmp/check-req.json &
claude -p "/check:patterns diagnose"    > /tmp/check-pat.json &
claude -p "/check:system"               > /tmp/check-sys.json &
wait
# Then aggregate each JSON into the final report
```

Use whichever path is faster for the current session.

---

## When to run

- **Before shipping** — the definitive pre-ship gate
- **First thing after `/clear` on a long-running branch** — catch drift accumulated across sessions
- **After a structural change** (new system, renamed skill, moved directory) — cascade check
- **Weekly / on `/sleep:deep`** — embedded as a growth-phase step
- **When `/warp:health` shows multiple yellow items** — deep dive to classify them

## Not for

- **Per-edit validation** — hooks handle that (path-guard, memory-guard, edit-watcher)
- **Single-feature checks** — use `/check:requirements <feature>` directly
- **Quick triage** — `/warp:health` is faster for a green/yellow/red rollup

## Related

- `/warp:health` — lightweight rollup (faster, less detail)
- `/warp:doctor` — planned: `/warp:health` + `/check:all` + deltas
- `/sleep:deep` Phase 2 — runs `/check:all --fast` as part of cleanup
- `/oneshot:preflight` — pre-agent-run subset (architecture + environment + requirements)
