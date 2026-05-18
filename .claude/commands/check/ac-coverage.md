---
description: Read-only audit of acceptance-criteria.md verified_by:- linkage across active sprints.
user-invocable: true
namespace: check
reads: [".claude/project/sprint/sprints/*/current.yaml", ".claude/project/sprint/plan-contracts/*.yaml", ".claude/project/sprint/requirements/*/acceptance-criteria.md"]
writes: []
---

# /check:ac-coverage

Read-only audit of the `verified_by:` AC-linkage convention introduced
by SP-20260518-007 (Sprint Goal Verification). Scans every active
sprint's `acceptance-criteria.md` and reports per-AC linkage state:

- `executable` — has a `verified_by: <test-file>::<test-name>` line
- `not_applicable` — has `verified_by: not_applicable — <justification>` with a non-empty justification
- `missing` — no recognized `verified_by:` line (or empty justification, or a leftover placeholder)

Diagnostic only. **Never modifies tracker state.**

## Input

```
$ARGUMENTS  →  forwarded to: node scripts/sprint/check-ac-coverage.js
  --sprint <SP-id>     audit a specific sprint instead of all active sprints
  --json               machine-readable output (array of per-sprint reports)
  --help               print usage
```

## Output

Prose default — one summary line per sprint plus a missing-AC breakdown when applicable:

```
ac-coverage — sprint SP-20260520-001: 8 executable, 2 not_applicable, 1 missing  (total: 11)
  missing ACs:
    - AC-3.1.1 (line 47; placeholder)
```

JSON: array of objects `{ sprint_id, title, gate_applicable, goal_verification_reproduction, acceptance_criteria_path, total_acs, executable, not_applicable, missing, details[] }`.

## Empty-state behavior

- No active sprints in registry → stderr `no active sprints to audit` + exit 1.
- Sprint has no `acceptance_criteria` linked → ERROR line per sprint, gate_applicable reflects plan_contract.goal_verification presence.

## Exit codes

- `0` all ACs linked (or `goal_verification` absent — gate is not applicable; report is informational)
- `1` at least one sprint with `goal_verification` has `missing > 0`, OR no active sprints
- `2` usage error

## Implementation

```bash
node scripts/sprint/check-ac-coverage.js $ARGUMENTS
```

## Relationship to /sprint:release

`/check:ac-coverage` is the **pre-release audit** of the same convention the
`/sprint:release` ship-gate enforces at release time. Running this before
`/sprint:release prepare` lets operators see linkage gaps without minting a
release record. The release ship-gate's cited-test executor (R-6) is the
**executable** counterpart — it actually runs the cited tests.

## Notes

- Per Beta directive (PC-20260518-0011): empty justification on
  `not_applicable` is treated as `missing` — empty/whitespace = same as
  missing.
- Placeholder `verified_by:` lines containing `{{` or `<test-file>`
  count as `missing` so the audit doesn't false-positive on scaffolded
  templates.
- v1 does NOT auto-register `/check:ac-coverage` in `/check:all`. Add
  it manually if you want it in the default health pass.
