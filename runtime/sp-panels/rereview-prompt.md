# Cross-provider RE-REVIEW — SP-20260615-001 panel build, fix-cycle for 5 blockers

You previously returned `VERDICT=FAIL BLOCKERS=5 NOTES=7` (full prior findings: `runtime/sp-panels/xreview.md`). The fixes are applied. RE-VERIFY each blocker against the CURRENT code and give a fresh BINDING verdict. Be skeptical — confirm the fixes are real, not cosmetic, and that no NEW false-green/fail-soft hole was introduced. Use injectable/require probes (your sandbox blocks nested spawnSync — the new tests were written in-process for this reason).

scopeContract: { "mode": "read-only", "allowedFiles": [], "forbiddenFiles": ["**/*"], "note": "read-only reviewer — write findings ONLY to runtime/sp-panels/xreview2.md" }

## ENFORCER `scripts/checks/panel-registry-coverage.js` — confirm 3 blockers closed
- B1 (was: `panels: []` array reads green): confirm a non-plain-object `panels` (array/scalar) now fails CLOSED (exit ≥2), distinct from clean 0 / finding 1. Probe an injected `{"$schema":"warpos/panel-registry/v1","panels":[]}`.
- B2 (was: lane-skip masks real orphans): confirm a missing `node scripts/panel/<x>.js` opener is SKIPPED only when the lane DIR is absent; when `scripts/panel/` EXISTS, an absent script is a hard `orphan_opener` finding (exit 1). Probe via the injectable `evaluate({registry, resolve, exists, laneDirExists})` seam AND a real orphan-in-existing-lane registry.
- B3 (was: extra `route` passes): confirm a row with an extra key (esp. `route`) is now an `extra_row_keys` finding (exit 1) — the row shape is bound EXACTLY to {name,opener,description,run_context}.
- Confirm the real registry still exits 0 (0 findings) and the 0/1/≥2 contract stays distinct.

## GENERATOR `scripts/panel/roadmap.js` — confirm 2 blockers closed
- B4 (was: missing file → "None in flight"/0, not "section unavailable"): confirm an ABSENT active-sprints.yaml AND absent open-gaps registers now render "section unavailable" (DISTINCT from present-but-empty → "None in flight"/0). Probe `--root <nonexistent>` (or in-process `generate({root})`): In-flight + Open-gaps must say "section unavailable".
- B5 (was: broken YAML silently healthy): confirm malformed active-sprints.yaml (`sprints: [`, unterminated quote, stray `]`/`}`) now degrades In-flight to "section unavailable" and does NOT silently normalize to empty — WHILE the real file (titles containing `#`/quotes) is NOT false-flagged. Confirm still strictly read-only (no source write-back) and every degrade exits 0 / never throws.

## Output
Write findings to `runtime/sp-panels/xreview2.md`. End stdout with ONE line exactly:
`VERDICT=<PASS|FAIL> BLOCKERS=<n> NOTES=<n>`
