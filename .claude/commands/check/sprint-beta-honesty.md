---
description: Audits Beta consultation honesty across post-cutoff /sprint:full runs (missing consults, placeholder verdicts, ESCALATE-without-halt)
---

# /check:sprint-beta-honesty

Audits the Beta consultation cadence enforced by `/sprint:full` (SP-20260525-003). For every post-cutoff sprint that ran at least one `/sprint:full` phase, the check verifies that each expected phase boundary has a real `sprint_full_beta_consult` event — not a placeholder — and that every `ESCALATE` verdict was followed by a halt.

## What it detects

Three finding types, each with shape `{ sprint_id, phase, expected_consult, actual_event, verdict, evidence, finding_type }`:

1. **`missing_consult`** — a phase boundary was reached (`sprint_full_phase_started` for that phase) but no `sprint_full_beta_consult` event was recorded for the sprint + boundary. The four expected boundaries are `before_design`, `before_execute`, `before_release-prep`, `before_retro` (corresponding to transitions into phases 2–5). `before_plan` is not a check boundary.

2. **`placeholder_verdict`** — a consult event exists but is considered fake:
   - Kind is `sprint_full_beta_consultation` (the pre-SP-003 placeholder name), **or**
   - Kind is `sprint_full_beta_consult` but `beta_message` is empty/missing, `latency_ms` is null/undefined, or `model` is empty/missing. Note: `latency_ms = 0` is valid (CLI resume has no live round-trip; it is not a placeholder signal).

3. **`escalate_without_halt`** — a `sprint_full_beta_consult` with `verdict: "ESCALATE"` has no corresponding `sprint_full_halt` with `halt_reason: "beta_escalate"` for the same sprint at/after the consult timestamp.

## Date-cutoff (legacy exempt)

Sprints whose start date is **before `2026-05-25`** (the SP-003 ship date) are **exempt**. Their events predate the enforcement mechanism and flagging them would be false positives. Override the cutoff with `--since <ISO-date>`.

If a sprint's start date cannot be determined from `paths.sprintSprints/<id>/current.yaml` or `paths.sprintActiveRegistry`, the sprint is **exempted** (fail-safe: prefer not-false-flagging over over-reporting).

## Graceful empty

If no applicable (post-cutoff, dated) sprints with `/sprint:full` activity exist — which is the expected state until the first real `/sprint:full` run occurs after the cutoff — the check exits `0` with an informational message:

```
OK   [sprint-beta-honesty] no applicable sprints in window (cutoff <date>) — nothing to audit
```

An empty events file, a missing full-reports directory, or a dataset containing only legacy sprints all produce this clean outcome.

## Invocation

```bash
node scripts/checks/sprint-beta-honesty.js [--json] [--since <ISO-date>]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--json` | off | Emit machine-readable JSON instead of human text |
| `--since <ISO-date>` | `2026-05-25` | Override the legacy-exempt cutoff date |

**Exit codes:** `0` = clean (no findings or no applicable sprints); `1` = one or more findings.

## JSON output shape

```json
{
  "ok": false,
  "applicable": 2,
  "checked": 2,
  "findings": [
    {
      "sprint_id": "SP-...",
      "phase": "design",
      "expected_consult": "before_design",
      "actual_event": null,
      "verdict": null,
      "evidence": "phase 'design' started but no sprint_full_beta_consult recorded for boundary 'before_design'",
      "finding_type": "missing_consult"
    }
  ],
  "totalFindings": 1,
  "cutoff": "2026-05-25",
  "undatedExempt": 0,
  "malformedLines": 0
}
```

## See also

- `_docs/sprint/AUTONOMY.md` — preset configuration for halt/approval behaviour in `/sprint:full`
- SP-20260525-003 — ships the halt-at-boundary enforcement mechanism (`sprint_full_beta_consult` + `sprint_full_halt`)
- SP-20260525-004 / T-20260525-214 — this check (engine + skill + tests)
- `scripts/checks/test-sprint-beta-honesty.js` — fixture-driven tests (run `node scripts/checks/test-sprint-beta-honesty.js`)
