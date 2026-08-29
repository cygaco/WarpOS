# /enforcement:sweep — 2026-08-29

Run as Phase 4.5 of /session:end. Five lenses, parallel read-only sub-agents.

- Ledger paths.enforcementDebt — 292 rows (through ED-368) before, **300 rows (through ED-376)** after.
- paths.recurringIssuesFile — 10 rows before, **11 rows (through RI-010)** after.
- `node scripts/enforcement/ed-dup-id-lint.js` -> **exit 0**.

## The single worst find

**Four live gates swallow "I could not check" into "it passed."** (filed ED-369, high)

Three are PreToolUse/Stop hooks wired in .claude/settings.json right now:

- `scripts/hooks/gate-check.js` — loadStore() returns null from its catch, consumed at
  "[gate-check] WARNING: Could not read store.json, allowing dispatch" -> process.exit(0).
  Absent store and **corrupt** store take the same path.
- `scripts/hooks/gauntlet-gate.js` — "WARN: store.json not found, allowing dispatch" -> exit 0.
- `scripts/hooks/tracker-completion-gate.js` — "if (!res) process.exit(0); // runner error -> never
  trap the session". A crashed scripts/trackers/validate.js is indistinguishable from a GREEN
  tracker, **even under TRACKER_GATE_ENFORCE=1**.
- `scripts/sprint/design.js` — the R-id trace-integrity check ends
  "catch { return { ok: true }; // fail-open for unexpected errors }", wrapped around logic the same
  function deliberately hardened to fail-CLOSED for born-broken traceability.

Deleting or corrupting one JSON file silently disables the builder-dispatch admission gates, and the
only signal is a stderr WARN inside a hook whose output nobody reads.
scripts/enforcement/ed-dup-id-lint.js is the in-repo positive example of the right shape
(ENOENT -> SKIP exit 0; present-but-unreadable -> exit 2, explicitly partitioned).

## Counts

| Lens | Candidates | TRACEABLE | FILED | TRIAGE |
|---|---|---|---|---|
| deferral-comments   |  8 | 1 | 1 | 6 |
| prompt-suppressions | 12 | 9 | 1 | 2 |
| skipped-tests       |  7 | 1 | 2 | 4 |
| unenforced-claims   |  6 | 1 | 2 | 3 |
| review-residuals    | 15 | 0 | 2 | 13 (rolled into ED-373) |
| **total**           | **48** | **12** | **8 rows** | **28** |

FILED counts ROWS, not candidates: 8 rows carry 20 distinct candidates. Several classes were
consolidated rather than filed one-per-instance, per the skill rule against inflating counts.

## Filed (ED-369 .. ED-376)

| ID | Sev | What |
|---|---|---|
| ED-369 | high | Gates swallow absent/corrupt/thrown into exit 0 (4 sites, 3 live-wired). The unreadable-input half of the false-green family; ED-366 is the empty-input half, ED-352 the misreporting half. |
| ED-370 | high | scripts/delta-build-reviewer-prompt.js — a LIVE generator hardcodes 4 uncited suppression clauses ("Known stubs ... do NOT flag" x2, "HYGIENE Rule 74 ... do NOT count" x2). ED-304 covers staged one-off prompts; nothing covers generators, which re-assert forever. |
| ED-371 | high | A named enforcer that does not exist on disk. /scan:tools (named as THE enforcer in CLAUDE.md "## Tool Use") is not registered anywhere — ED-033 lists it as an unbuilt candidate. scripts/warpos/promote.js is cited as a live engine by ADR-0001 + warpos-class-wiring.md; a repo-wide find returns nothing. Mirror of ED-338 one level out. |
| ED-372 | high | Custody credential-scan bypass: caller-controlled Array.prototype.map on an Array subclass evades stringification, Node re-stringifies inside spawn(). Binding security finding at a release-gating alpha ruling, fix shape given, never filed. |
| ED-373 | medium | Nothing reconciles an alpha ruling "Residuals named" / "Successor sprint scope" section against the ledger. 15 residuals across 3 rulings with no ED, while siblings from the same rulings were filed as ED-358/360/361/362/363. ED-361 does this at the builder-envelope grain only. |
| ED-374 | medium | Built enforcer wired so it cannot fail. security-pass-count.js proves the 3-provider review FIRED only under --strict; /scan:full calls it without. coverage-gate-scan.js "ALWAYS exits 0" under a RAMP with no flip-trigger and "this sprint" long past. |
| ED-375 | high | ADR-0041 states ARGV is an uncovered credential carrier and that the args-inspection wrapper "must land in the same change". It did not. argv is the carrier WarpOS actually uses (agy toolless-inline, cat-substitution shapes). |
| ED-376 | medium | security-binding-lane.js servedModelUnverifiableFromRecord keys on the literal provider === "antigravity" — a renamed or new unverifiable provider binds green. Same shape ED-023 already closed for reviewer renames. ED-244 covers the other half of this lane. |

## Filed to paths.recurringIssuesFile

**RI-010** — merge-guard blocks the `node -e` + fs-write idiom.

Ground truth measured from paths.eventsFile this session: the exact detail string
"node -e with fs write blocked" appears **56 times**, first 2026-07-23T19:00:13Z, last
2026-08-29T12:03:21Z. (The task brief said 33x; 56 is the measured count.) The rule own comment
records a prior wave — "L-2026-05-14-event-merge-guard-node-e-recurring: this rule fired 45x in 3
days" — so this is at least the second measured recurrence, and the only response so far was to make
the block message more prescriptive. The guard is correct and load-bearing; the recurring issue is
that no ergonomic sanctioned append primitive exists for the JSONL memory stores, so the blocked
idiom is re-attempted indefinitely. Permanent fix proposed: one scripts/memory/append.js that the
block message can name. Pairs with ED-367 and ED-368 — all three are consequences of the memory
stores having no first-class write API.

## TRACEABLE — covered, not re-filed (12)

| Candidate | Covered by |
|---|---|
| runtime/gauntlet-SP-20260725-002/gauntlet-security-{final,r10-gpt,r15-gpt}.txt — uncited TOCTOU / store-DIR-confinement / dirty-store / sandbox-EPERM suppressions | ED-304 (genesis was filed FROM this sprint; realpath named in the row) |
| runtime/gauntlet/SP-20260723-003/r3{e,f,g}/security-gpt-prompt.txt — "NAMED CEILINGS — do NOT re-report" | ED-304 + ED-338 (r3f/r3g cite ED-274 for one item and bundle uncited ones alongside) |
| runtime/sp002-gauntlet/qa-reviewer-prompt.md — AC-8.4 "DOCUMENTED RESIDUE" | ED-304 |
| runtime/sp002-dispatch/w1-2ndpass-canary-prompt.md + 3 sp002-gauntlet siblings — "do NOT flag report-only as a defect" | ED-304 |
| runtime/vlad-w1/build-prompt-s9-quota.md — "beta has already ruled on it", no msg_id | ED-267 / ED-239 |
| tests/regression/SP-20260614-001/readiness-panel.spec.ts — all 6 tests self-skip via isGated() | ED-301 (its amendment names this exact defect: "the B-1 test existed, was well-written, and SKIPPED") |
| ADR-0031 point-2 openai-floor violated by registry derivation, no enforcer | ED-244 (verbatim) |

## TRIAGE — parked, not filed (28)

The ones worth a human read. The rest were stylistic TODOs, ADR-documented scope boundaries (an ADR
IS a decision record, not a hidden comment), or already-fixed comments.

1. **.claude/commands/commit/land.md** — the Seam-E brokered-merge fence covers refs/heads/$DEFAULT
   but explicitly not the remote push step ("it stays as-is"). A real scope gap: a push of HEAD:main
   never touches a local ref. But ED-264 owns the Seam-E thread and already has 4 named sub-items.
   **Recommend: fold into ED-264 as sub-item (v)** rather than a genesis row — that needs the
   alpha/beta who own the thread.
2. **scripts/state/materialize.js** — "Known limitation (flagged, not a hard dep): a start whose
   pair was already folded to the archive tier will not appear in what-running; consume the C3 union
   reader once it lands." what-running can under-report live in-flight work.
   **Recommend: fold into ED-222**, which owns the reader-discipline/materialize thread.
3. scripts/hooks/lib/injection-patterns.js — deliberately excludes bare "jailbreak" / "developer
   mode" as topic words to avoid false positives. Judged a designed precision threshold, not a
   deferred fix. Not filed.
4. scripts/sprint/validate.js — "additionalProperties: false (warn-only — we accept extras)", full
   JSON-Schema "out of scope for v0.1". A drifted or typo'd tracker field passes validation.
   Borderline; adjacent to ED-326. Not filed.
5. scripts/hooks/lint-hook-output.js — "MultiEdit deliberately not enforced in v1." The validator
   exists to catch a framework upgrade renaming a tool payload field; MultiEdit is exempt. Low.
6. scripts/dispatch-agent.js recordStartedRow — bypasses the rotation-capable helper by deliberate
   choice; the completions ledger grows unbounded. Low, operational.
7. scripts/checks/warpos-ship-coverage.js — manifest ownership misclassifications (owner=framework
   on per-run scratch) permanently allowlisted rather than reclassified. Hygiene.
8. **.claude/commands/epic/*.md (8 files)** — "STATUS: designed — not yet built (E-LIFECYCLE-001
   Wave 3 ...; build deferred)". Honestly self-labeled and traced to a wave id, so declared roadmap
   rather than hidden debt — but /scan:skill-hook-coverage counts them as skills, and a caller
   invoking /epic:acceptance gets nothing. **Recommend: a human decides whether the wave pointer is
   tracking enough.**
9. runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md S2-b — execution-proven false claim strings
   on the shipped CUSTODY.md trust surface. Drove the S2 FAIL / NO RELEASE, so it blocked rather
   than shipped; also adjacent to ED-292, which is scoped to code comments rather than doc surfaces.
   Enumerated inside ED-373 rather than filed separately.
10. The remaining 13 vlad-w1 residuals are enumerated verbatim inside the ED-373 source field. A
    further 5 deferral-comment hits were already tracked (ED-264 trusted-controller.js Seam-E
    hook_active; ED-229 liveness-read-choke-point.js regex residual; AC-8.4 in check-ac-coverage.js)
    and were excluded by the lens before reaching reconciliation.

## Lens candidate files (this directory)

- deferral-comments.jsonl (8)
- prompt-suppressions.jsonl (12)
- skipped-tests.jsonl (7)
- unenforced-claims.jsonl (6)
- review-residuals.jsonl (15)

## Constraints observed

Wrote only to paths.enforcementDebt, paths.recurringIssuesFile, and this run directory.
No tracked source or docs, no TRACKER.md, no DUMP.md, no trackers/. No git commands run.
