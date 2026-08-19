# S-VLADW1-03 — Vlad Wave-1 CUSTODY RESIDUALS TO RELEASE (successor to S-VLADW1-01)

- **Sprint label and number:** S-VLADW1-03
- **Title:** Close the residuals that failed S-VLADW1-01's release rule (R2 claims, R3 wiring proof), build AC-8.6, and take the custody set to a releasable state
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-VLAD-001](../epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md)
- **Predecessor:** [S-VLADW1-01](S-VLADW1-01-vlad-engine-skeleton.md) — **closed at honest state 2026-08-19, NOT released.** α applied β's pre-committed release rule verbatim at the close of `runtime/vlad-w1/gauntlet-r4-final/`: **R1 HOLDS · R2 FAILS · R3 FAILS AS STATED · R4 HOLDS**. Ruling: `runtime/vlad-w1/gauntlet-r4-final/ALPHA-RULING-R1-R4.md`.
- **Goal:** Make every shipped custody claim true, make the wiring proof capable of going red on removal, and build the one criterion (AC-8.6) that distinguishes "runs in our CI" from "runs in their install" — so the custody set can be released rather than closed.
- **Scope:** The seven items from the α ruling (below), verbatim in intent. Repair, wiring and one genuinely-missing criterion. **No new custody controls** unless a residual demands one and β rules it in.
- **Out of scope:** The write path and the agent face (Wave 2). Re-litigating S-VLADW1-01's ruling — R1/R4 held and are not reopened. The four parked SDK credential vars (`AWS_BEARER_TOKEN_BEDROCK`, `ANTHROPIC_FOUNDRY_API_KEY`, `ANTHROPIC_FOUNDRY_AUTH_TOKEN`, `ANTHROPIC_AWS_API_KEY`) — **parked by operator ruling 2026-08-18** as a possible multi-provider WarpOS feature after launch; they stay disclosed-open with a standing drift test, and this sprint does not adopt them.
- **Current state:** **Building — mid fix-attempt 1 of 2** (as of the 2026-08-19 session wrap). Gate chain: plan→design cleared (β row 304, msg_id `5a1d83bc`); design→build cleared with the release rule **S1–S5 pre-committed** (β row 305, msg_id `7c05e9d1` — full text `runtime/beta-consult/S-VLADW1-03-r2-verdict-7c05e9d1.md`). Build landed on vlad `wt/S-VLADW1-01-engine`: bundles 8a/8c/8d/8e @ `8b6993e`, bundle 8b @ `a9e6708` (271/271, `check:ship` exit 0; bootstrap restructure per row 304 Q3(b); re-scrub choke-point in `auditedSpawn`; ten-attack battery committed). **Gauntlet-1 run and adjudicated** (evidence `runtime/vlad-w1/s03/gauntlet-1/` @ WarpOS `8a15bc1f`; adjudication in `ROUND-ADJUDICATION.md`): 4/4 lanes FAIL as verdicts; **S1 HOLDS (execution-backed) · S4 partial · S2/S3/S5 FAIL · β Q3 condition unsatisfied** (tautology lint fail-open AND unwired). α read recorded 2026-08-19 (not terminal — the qualifying run is the gauntlet whose evidence dir follows fix attempt 2). **Fix attempt 1 is IN FLIGHT and healthy** (α ruling 2026-08-19: fire attempt 1 on the ordered set). Five bundles 9a–9e, strictly disjoint file ownership, each brief ≤6.6KB. **9c landed `ok:true` @ `6ca9988`** (271→283 pass, exit 0; lint fail-closed on absent/empty root → `NO_DATA` non-zero, wired into `check:ship`, all three demonstrations quoted). **9a landed `ok:true`** (extractor fixed as a CLASS — comment-strip then whole-source match, closing both the two-imports-per-line and block-comment fail-opens; presence-test replaced with an executed evaluation-order truth-test; mutant OBSERVED RED; the false ordering sentence replaced in BOTH entries). 9b/9d/9e still writing at the time of this line.

> **CORRECTION, recorded because the misread will recur.** An earlier revision of this line stated *"all five 9a–9e dispatches DIED AT SPAWN (`ok:false`, 0-byte envelopes)"*. **That was false**, and was written at 22:54:43Z while the builders were mid-flight. A `PENDING` completion row carries `ok:false` **by design** — that is its initial state, not a death — so five PENDING rows plus five 0-byte envelopes sampled shortly after dispatch produce exactly the signature that was read as spawn failure. The ledger contains **no** batch of failed 9a–9e dispatches; the only five rows are `d-mt0oium3` / `d-mt0olgv9` / `d-mt0oo380` / `d-mt0oqpmt` / `d-mt0otc1k`, of which `d-mt0oo380` (9c) and `d-mt0oium3` (9a) returned `ok:true`. **Discriminator for next time: a real death has a `shape` field on the row, or an empty worktree diff. Within the dispatch bound, PENDING+`ok:false`+0-byte means unfinished, not dead.** Consequence that matters: **fix attempt 1 has NOT been burned** — re-firing on the false record would have consumed attempt 2 of the two β allowed and left the sprint with none.
- **Percent completion:** 75% — fix attempt 1 fully landed (all five bundles `ok:true`, suite 294/294, `check:ship` exit 0, @ `0732cd8`), and **gauntlet-2 is run and adjudicated** (`runtime/vlad-w1/s03/gauntlet-2/`, WarpOS `53555821`; all four lanes `ok:true`, `gauntlet-verify` PASS exit 0). **S1 holds · S2 FAILS · S3 FAILS · S4 UNMEASURED · S5 HOLDS.** The number is NOT higher because two criteria still fail, S4 has been carried on assertion for two rounds without anyone mutating the five falsifiers, and **only one fix attempt remains** (attempt 2 of 2). S3's failure is the sharp one: `src/bootstrap.js:27` carries `initCredentialCustody(...)` inside a COMMENT, which matches `CALLS_SCRUB_RE`, so the new invocation assertion's `anyCallFound` half is pre-satisfied for every shipped graph and is **inert** — execution-proven by a probe entry that kept A1 green at 22/22 while a real child received the decoy credential. Graded **S3 not S1**: the bypass needs a non-shipping entry, so the CONTROL is inert rather than the package leaking.

## Sequencing — THIS SPRINT RUNS FIRST ON THE VLAD SURFACE

**Ahead of S-VLADW1-02's build**, which is queued behind it. S-02 consumes this seam (the engine, the
receipt envelope, the custody boundary), so building the audit lane on top of an unreleased custody set
would layer new work over the exact residuals that failed the release rule — and would make any later
custody change a change under a consumer. Both sprints share one repo surface, so they cannot run
concurrently regardless.

## Definition of Done

- [ ] Plan contract authored and accepted, with β consulted at the plan→design boundary.
- [ ] **A release rule is minted FRESH for this sprint and PRE-COMMITTED by β at the design→build boundary — before any result exists.** S-VLADW1-01's R1–R4 do not carry over automatically; β mints this sprint's criteria on its own evidence. The pre-commitment is the point: a gate written after the result is not a gate.
- [ ] **R2 — every claim in shipped copy is true.** CUSTODY.md's P2 status/wording corrected to the proven set and consistent with its own named ceiling; the "FIRST STATEMENT, before every other import" ESM overclaim removed from **both entry points and the test assertion message**. Preferred over softening: restructure the entry as a tiny bootstrap that imports nothing but the seam and then dynamically imports the server — **making the claim true rather than narrowing it**. Final user-facing register routed to the operator (Class C — no builder finalises it).
- [ ] **R3 — the wiring proof can go RED.** The graph-reachability walker is non-vacuous: the `|| true` placeholder deleted; `canSpawn` covers bare `child_process`, `createRequire`, and dependency-reached spawn (**including the Agent SDK, the one production dependency that launches a child**); and a standing test **fails when the scrub call is deleted from `server-entry.js`**. That last clause is the whole item — a wiring proof that cannot fail on removal is not a proof.
- [ ] **`initCredentialCustody` idempotence semantics decided and tested.** Today a later call is a complete no-op, so a credential provisioned after the first call is never scrubbed (found independently by the cross-family lane and the backend lane). Decide re-scrub-on-call vs documented single-shot — and if single-shot, the limitation ships in the header rather than being discovered again.
- [ ] **AC-8.6 built — real work, not a name.** A product-layer custody self-check invoked when the server or job runner starts, with its named test. This is the criterion that makes P3 a runtime control in a *user's* install rather than only in our test run. The pointer-lint filing is corrected at the same time (**missing-NAME, not missing-FILE**).
- [ ] **The surviving MEDIUMs are closed or explicitly deferred with residuals named** — quota position-dependence (an AC-9.3 wrong-door risk), the driver's `ok` ignoring `status.outcome`, an id-less `tools/call` running side effects, the vacuous `permission-level-valid` check, `cancelJob`'s `idempotent` flag, the PEM redaction residual, the missing `child.on('error')` listener, and `protocolVersion` vs `serverInfo.title`.
- [ ] **ONE production consumer wired for `createModelSession` / `classifyProviderSignal`** — or both marked not-yet-wired exports in shipped copy. S-9's seam evidence currently rests on a path nothing calls, which makes AC-9.5's consumption clause vacuously satisfied.
- [ ] **Gauntlet re-run with the same discipline** — registry-fixed roster, agy mandatory on the security bundle with its read-scope ceiling stated, the three Claude lanes recorded as ONE family, mutant evidence riding with each bundle, `execution_proven` reserved for what was actually run.
- [ ] **ED-340 closed or carried forward with a stated reason.** It stays OPEN at this sprint's start on the roster half and AC-8.4's lineage.

## Related definitions
- Validator, Verification, Evidence, Completion — see ../../TRACKER.md

## Tasks
- [ ] **Mint the sprint-registry entry (`add-sprint.js`) at BUILD AUTHORIZATION, not now — deliberate.** The tracker is minted; the registry entry is not. `add-sprint.js` overwrites `reg.primary` unconditionally, so registering an unauthorized sprint now would repoint the primary and a later `/sprint:full` would attach to a sprint nobody has authorized. Mint it when the operator authorizes the build, and **commit the mint immediately** — it lands uncommitted. Reconcile ROADMAP in the same change.
- [ ] Mint the plan contract and route the plan→design β consult.
- [ ] Apply the **design-phase record-trust gate** before build — this sprint's controls gate irreversible actions on records, which is exactly its trigger.
- [ ] Sequence the build so the R3 walker fix and the AC-8.6 work do not contend on `server-entry.js`.
- [ ] Re-derive the `verified_by` population **from the acceptance criteria, not from any finding list** — see the predecessor's retro input 2.

## Evidence basis (why each scope item exists)
Every item traces to a lane finding with a path — this sprint was scoped from a verdict corpus, not designed fresh:
- `runtime/vlad-w1/gauntlet-r4-final/ALPHA-RULING-R1-R4.md` — the ruling and the seven-item scope.
- `runtime/vlad-w1/gauntlet-r4-final/evidence-backend-reviewer.md` — B-01/B-02 (walker exemptions; the `|| true` tautology), B-03 (ESM overclaim), B-04 (P1 inert shapes), the surviving MEDIUMs.
- `runtime/vlad-w1/gauntlet-r4-final/evidence-qa-reviewer.md` — the `check:pointers` ruling, the 15-of-48 re-derivation, AC-8.6 disclosure judgment.
- `runtime/vlad-w1/gauntlet-r4-final/evidence-security-claude-hunter.md` — S1/S2 (ordering claim; class check vacuous for its own instance), F7 (P2 shipped claim vs ceiling).
- `runtime/vlad-w1/gauntlet-r4-final/evidence-security-agy.md` — the idempotence no-op, the alternation-anchor hazard, `opts.cwd`.
- Prior rounds: `runtime/vlad-w1/gauntlet/`, `gauntlet-r2/`, `gauntlet-r3/`.

## Risks
- **The predecessor's signature defect recurring.** A control built, verified in isolation, and never wired to the surface it protects — three instances in S-VLADW1-01, and the fourth was inside the fix for the third. **Mitigation: no control counts as done until a test fails on its removal from the shipped surface.**
- **Correcting from a finding list rather than re-deriving.** Three recurrences in the predecessor, all the conductor's. **Mitigation: re-derive the population from the source of truth every time; the instinct alone has been shown insufficient.**
- **Scope creep into new controls.** The predecessor's residuals are repair and wiring. A new scanner is unreviewed surface; if one seems necessary, it goes to β first.

## Decisions
- **2026-08-19 — this sprint exists rather than a fourth fix attempt.** β's rule pre-committed "no attempt 4"; α applied it. Reopening S-VLADW1-01 would be reshaping a pre-committed gate after seeing the result, which β barred in both directions (P-094). A named successor is the sanctioned path and keeps the predecessor's close honest.

## Completion record
- Final state: In progress — Building, mid fix-attempt 1 of 2 (session ended 2026-08-19 by operator instruction; resume per DUMP.md)
- Percent completion: 55% (as of the 2026-08-19 wrap)
- Completion timestamp: n/a
- Definition of done used: the Definition of Done above
- Evidence of completion: n/a
- Session IDs / dates / agents: 2026-08-19 — Alex ε as "Epsilon" (minted at the predecessor's close)
- Parent epic: E-VLAD-001
- Remaining follow-up items: all DoD items above; the four parked SDK credential vars remain disclosed-open per the operator's 2026-08-18 ruling and are NOT this sprint's scope.
- Related untracked work: None
- ../../TRACKER.md updated: Yes · Roadmap reconciled: pending the registry mint
