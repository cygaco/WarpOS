---
description: Run every scan in parallel — a full system scan across project health, governance, and WarpOS distribution integrity — merged into one unified report. One command for full system health.
---

# /scan:full — Unified Health Check

Runs every `/scan:*` skill in parallel and merges their output into one report — a **full system scan**. The single-entry diagnostic. Use before shipping, on session start after a long break, or any time you're about to trust the system to do heavy work.

This skill does **not** duplicate logic — it delegates to the specialists and aggregates. If a specialist changes its checks, `/scan:full` inherits the change for free.

## Input

`$ARGUMENTS` — Mode selection:
- No args — **full system scan**: every `/scan:*` skill (Tier 1 core + Tier 2 governance + Tier 3 WarpOS integrity), default modes
- `--fast` — Tier 1 core only (architecture internal, environment ready, references quick, requirements static compact, system inventory, patterns diagnose-only)
- `--deep` — all tiers in thorough modes (architecture seams+health, environment audit, patterns diagnose+propose, requirements full static audit, every WarpOS integrity scan)
- `--json` — raw aggregated JSON output
- `--since=<N>d` — passed through to patterns for time-window analysis
- `--focus=<feature>` — scoped spec audit in requirements

---

## Delegation plan

Dispatch the scan suite **in parallel** (via Agent tool, each producing a sub-report — or Bash-spawned `claude -p` for non-team sessions). The runtime caps concurrent agents (~10); dispatch in batches as slots free. Every scan is a side-effect-free audit, so parallel dispatch is always safe.

**Tier 1 — Core project health** *(always; the only tier under `--fast`)*

| # | Skill | Mode (default / `--fast` / `--deep`) | Produces |
|---|---|---|---|
| 1 | `/scan:architecture` | internal+seams+health / internal / internal+seams+health | Layer integrity report |
| 2 | `/scan:environment` | ready / ready / audit | Tool + env readiness |
| 3 | `/scan:references` | (default) / --summary / (default) | Broken-ref list |
| 4 | `/scan:requirements` | static / static --compact / static full + drift | Spec health |
| 5 | `/scan:patterns` | diagnose / diagnose / diagnose+propose | Cross-run intelligence |
| 6 | `/scan:system` | inventory / inventory / inventory + drift | System manifest audit |

**Tier 2 — Governance & quality** *(default + `--deep`)*

`/scan:ac-coverage` · `/scan:coherence` · `/scan:design-system` · `/scan:dispatch-routing-parity` · `/scan:privacy` · `/scan:roadmap-trace` · `/scan:sprint-beta-honesty` · `/scan:adhoc-team-hygiene` · `/scan:timeline` · `/scan:node-procs` · `/scan:issues`

**Tier 3 — WarpOS distribution integrity** *(default + `--deep`)*

`/scan:install` · `/scan:framework-purity` · `/scan:framework-views-fresh` · `/scan:warpos-version-quorum` · `/scan:warpos-manifest-coverage` · `/scan:warpos-manifest-honesty` · `/scan:warpos-path-resolution` · `/scan:warpos-structure-parity` · `/scan:warpos-staleness` · `/scan:warpos-tracked-transients` · `/scan:warpos-capsule-resolvable` · `/scan:warpos-install-baseline` · `/scan:warpos-applied-migrations` · `/scan:warpos-migration-coverage` · `/scan:warpos-migration-presence`

**Regression seed — the bug-class lens** *(default + `--deep`)*

`/scan:regressions` — runs the **26 recurring bug classes** (`_requirements/07-testing/recurring-bug-classes.json`) as detectors and reports a catch-rate. Several detectors overlap the tiers above; this is the roll-up view + the 0.17.0 test-suite core. Surfaces `gap`/`partial`/`n/a` classes as the system's backlog.

Each scan returns `{ findings: [{severity, check, message, file?, suggestedFix?}], summary }`. **Don't run sequentially** — parallel dispatch cuts wall time dramatically. A scan that's N/A in the current repo role (e.g. some `warpos-*` checks in canonical) reports `skipped` with a reason rather than failing.

---

## Aggregation

After all six return, merge into one rollup:

### Summary table

```
┌──────────────────────────────────────────────────────────────────────┐
│ /scan:full — 2026-04-17T03:45Z — mode: default                       │
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
- Any critical references → `/scan:references --fix`
- Any stale maps → `/maps:all --refresh`
- Any spec drift → `/scan:requirements review`
- Any manifest drift → `/scan:system --update`
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
  "recommended_next": ["/scan:references --fix", "/maps:all --refresh"]
}
```

---

## Execution

**Via the Agent tool (team mode):**

Dispatch six Explore agents in a single message (multiple tool calls in one turn = parallel). Each agent's prompt is the corresponding specialist skill's content + "Run in <mode> mode. Return JSON report."

**Via `claude -p` (solo mode, no teammates):**

Bash, all six in the background with `&`, then `wait`:

```bash
claude -p "/scan:architecture internal" > /tmp/check-arch.json &
claude -p "/scan:environment ready"    > /tmp/check-env.json &
claude -p "/scan:references"           > /tmp/check-refs.json &
claude -p "/scan:requirements static"  > /tmp/check-req.json &
claude -p "/scan:patterns diagnose"    > /tmp/check-pat.json &
claude -p "/scan:system"               > /tmp/check-sys.json &
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
- **Single-feature checks** — use `/scan:requirements <feature>` directly
- **Quick triage** — `/warp:health` is faster for a green/yellow/red rollup

## Related

- `/warp:health` — lightweight rollup (faster, less detail)
- `/warp:doctor` — planned: `/warp:health` + `/scan:full` + deltas
- `/sleep:deep` Phase 2 — runs `/scan:full --fast` as part of cleanup
- `/oneshot:preflight` — pre-agent-run subset (architecture + environment + requirements)
