# S-VLADW1-04 — Vlad Wave-1 CUSTODY CLAIMS MADE UN-INVERTIBLE (successor to S-VLADW1-03)

- **Sprint label and number:** S-VLADW1-04
- **Title:** Make the custody claim bind refuse rather than skip, move the bind with every correction, close the `args.map` scan door, build AC-8.6, and take the custody set to a releasable state
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-VLAD-001](../epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md)
- **Predecessor:** [S-VLADW1-03](S-VLADW1-03-vlad-custody-residuals-to-release.md) — **closed at honest state 2026-08-28, NOT released.** α applied β's pre-committed release rule (row 305, msg_id `7c05e9d1`) verbatim at the close of `runtime/vlad-w1/s03/gauntlet-3/`: **S1 HOLDS · S2 FAILS · S3 HOLDS · S4 HOLDS · S5 HOLDS-at-close.** Ruling: `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md`. TERMINAL applied: no fix attempt 3.
- **Starting surface:** vlad `wt/S-VLADW1-01-engine` at **`b2583d6`**, NOT merged to vlad main. The branch is left in place deliberately; this sprint starts from that commit.
- **Goal:** Make the mechanism that binds custody claims actually un-invertible — refuse rather than silently skip, and move the bind in the same change as any correction — then close the residual controls the qualifying gauntlet named, so the custody set can be released rather than closed a second time.
- **Scope:** The nine residuals from the α ruling (below), verbatim in intent, plus AC-8.6 as first-class build scope.
- **Out of scope:** Re-litigating S-VLADW1-03's ruling — S1, S3, S4 and S5 held and are not reopened. The write path and the agent face (Wave 2). The four parked SDK credential vars (`AWS_BEARER_TOKEN_BEDROCK`, `ANTHROPIC_FOUNDRY_API_KEY`, `ANTHROPIC_FOUNDRY_AUTH_TOKEN`, `ANTHROPIC_AWS_API_KEY`) — parked by operator ruling 2026-08-18 as a possible multi-provider feature after launch; they stay disclosed-open with a standing drift test.
- **Current state:** Minted, not authorized. No build has started and no sprint-registry entry exists.
- **Percent completion:** 0%

## The failure this sprint exists to fix, stated plainly

Fix attempt 2 of the predecessor delivered the class fixes its rule demanded: the inert invocation control
closed at the shared lexer, fourteen paragraphs byte-bound with the bind proven on a real edit, the false
ordering clause removed, every mutant no-op-guarded, a clean checkout byte-identical to the working tree,
318/318 green. **And the bind's own derivation predicate became the new overclaim.** The mechanism built so
that a claim could not be inverted under green gates (i) misses any Asserted or Ceiling paragraph not led by
an exact em-dash, silently, and (ii) pins two execution-falsified sentences so that correcting them turns
`check:ship` red. That is the same class one layer up, and it is item 1 below.

## Residuals carried from the α ruling (verbatim)

1. **S2-a** — derivation predicate accepts only an exact em-dash lead-in; non-matching Asserted/Ceiling paragraphs are skipped with no violation (backend F-1, HIGH). Fix shape: a paragraph that LOOKS like a lead-in (bolded `Asserted`/`Ceiling` + any dash/colon/indent) must be either bound or REFUSED, never skipped.
2. **S2-b** — two bound sentences are false by execution (qa F-1; security second-order): the preload-Ceiling "not named on any other surface" sentence (contradicted by `entry-bootstrap.test.js:687`) and the 10d attribution sentence; the bind must move in the same change as the correction.
3. **S2-c** — header's what-is-NOT-bound list omits P1–P4 body prose (qa F-3).
4. **S2-d / 10d class claim** — absorb iterates the current call's list while delete sweeps history; an omitted previously-captured name is deleted without absorption (agy F-1, LOW, unreachable via shipped callers). Make absorb sweep history too, or state the precondition and downgrade the claim to INSTANCE.
5. **Defeated control (not a leak)** — caller-controlled `args.map` on an Array subclass bypasses stringification in the scan; Node re-stringifies inside `spawn()` (security F-1/F-2/F-3, T8/T4 TOCTOU reopened through a door A3 did not close). Fix shape: `Array.prototype.map.call` / `Array.from` + own-property iteration in the scan, mirrored by a committed regression fixture.
6. **S3 strength** — driver entry's scrub is load-bearing only at text/AST level (security F-4).
7. **AC-8.6** — deferred (β row 306: not an AP-15 reshape); the CLASS-form residual ("every shipped control is invoked by some product-layer path — item 4's walker approximates it; AC-8.6 is one instance; no enforcer asserts the general form") travels to the successor.
8. **ED-340 disposition** — remains OPEN, carried forward: the mutant half of its closing condition was satisfied 2026-08-10 (both mutants observed RED on lever-verified targets); the ROSTER half and AC-8.4's lineage remain open, now with ED-354 (installed-roster parity at the vlad cwd — the `security-fixer` 375 ms reap) as the concrete instance. Not closed by this sprint.
9. Process residuals for the retro: ε's usage-limit death mid-gauntlet (recovered artifact-first, no lane re-run); 10c's bound-timeout-after-commit signature (1200177 ms, committed 22 s before the bound) now separable from clamp and nothing-spawned; the ED-257 right-sizing warning that fired and went unread; ε's "clean tree" wording caught by the backend lane.

## The CLASS-form residual (carried verbatim — an OWED carry-forward, not S5's condition)

**Precision, per β correction 2 (msg_id `b6d38f04`):** S5 HOLDS **outright**, satisfied by
`runtime/vlad-w1/s03/fix-attempt-2/ROUND-RECORD.md` §4 — a recorded surface that existed at close. This
tracker write is an **owed carry-forward under β row 306**, not the condition S5 was contingent on.
Conditioning a criterion on a future write is the AP-14 shape and β removed it from the ruling; it is
removed here too.

Carried verbatim from ROUND-RECORD §4, per β row 306, which holds that the build spec that originally
named this residual does not count as its disclosure:

> **Build-spec item 6, field 4 — INSTANCE.** It closes AC-8.6 specifically. **Residual:** the general
> property — *every shipped control is invoked by some product-layer path* — is what item 4's walker
> approximates; AC-8.6 is one instance of it, and **no enforcer asserts the general form.**

`CUSTODY.md` discloses only the INSTANCE (that one fixture is not wired to run in a user's install). The
CLASS form is disclosed nowhere on the shipped surface. Two gauntlet-3 lanes (qa F-6, security F-6)
independently reached this by grep and flagged the same tension: a `CUSTODY.md` reader is handed the
instance without the class. This sprint either enforces the general form or ships it as a disclosed ceiling.

## Definition of Done

- [ ] Plan contract authored and accepted, with β consulted at the plan→design boundary.
- [ ] **A release rule is minted FRESH by β and PRE-COMMITTED at the design→build boundary — before any result exists.** S-VLADW1-03's S1–S5 do not carry over automatically. The pre-commitment is the point: a gate written after the result is not a gate.
- [ ] **Residual 1 (S2-a) — the derivation REFUSES rather than skips.** A paragraph that looks like an Asserted or Ceiling lead-in under any dash, colon or indentation is bound or refused by name, never silently skipped. Falsifier: each of the seven authorings the gauntlet-3 backend lane used must be RED, not only the em-dash pair.
- [ ] **Residual 2 (S2-b) — the two false bound sentences corrected, with the bind moving in the same change.** Correcting a bound claim must not require a second commit to make the gate green again.
- [ ] **Residual 3 (S2-c) — the header's what-is-NOT-bound list matches what the lint actually leaves unbound**, including P1–P4 body prose.
- [ ] **Residual 4 (S2-d) — absorb/delete symmetry decided and tested**, or the precondition stated and the claim re-graded INSTANCE.
- [ ] **Residual 5 — the `args.map` scan door closed**, with a committed regression fixture carrying the Array-subclass shape.
- [ ] **Residual 6 — the driver entry's scrub proven load-bearing at RUNTIME**, not only at text/AST level.
- [ ] **AC-8.6 built — real work, not a name.** A product-layer custody self-check invoked when the server or job runner starts, with its named test, and `check:pointers` resolving `custody-runtime.test.js::selfcheck-runs-on-user-machine` instead of reporting missing-NAME.
- [ ] **The CLASS-form residual either ENFORCED or SHIPPED as a disclosed ceiling** — a general assertion that every shipped control is invoked by some product-layer path, or an honest ceiling saying no enforcer asserts it.
- [ ] **ED-340 carried or closed with a stated reason**, with ED-354 named as its concrete instance.
- [ ] **Gauntlet re-run with the same discipline** — registry-fixed roster, agy mandatory on the security bundle with its read-scope ceiling stated, the Claude lanes recorded as ONE family, mutant evidence riding with each bundle, `execution_proven` reserved for what was actually run.

## Related definitions
- Validator, Verification, Evidence, Completion — see ../../TRACKER.md

## Tasks
- [ ] **Mint the sprint-registry entry (`add-sprint.js`) at BUILD AUTHORIZATION, not at mint time — deliberate.** `add-sprint.js` overwrites `reg.primary` unconditionally, so registering an unauthorized sprint would repoint the primary and a later `/sprint:full` would attach to a sprint nobody authorized. Mint it when the operator authorizes the build, and **commit the mint immediately** — it lands uncommitted. Reconcile ROADMAP in the same change.
- [ ] Mint the plan contract and route the plan→design β consult.
- [ ] Apply the **design-phase record-trust gate** before build.
- [ ] **Right-size every builder brief under the 12000 B ED-257 floor.** The predecessor lost a bundle to a 16810 B brief that hit the 20-minute bound 22 s after committing; the wrapper warned at fire time and the warning went unread.
- [ ] **Set `WARPOS_DISPATCH_BACKGROUND=1` on every backgrounded build-chain dispatch** (ED-353) — absence fail-closed clamps to 540 s.
- [ ] Re-derive the `verified_by` population from the acceptance criteria, not from any finding list.

## Evidence basis (why each scope item exists)
Every item traces to a lane finding with a path — scoped from a verdict corpus, not designed fresh:
- `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md` — the ruling and the nine-item residual set.
- `runtime/vlad-w1/s03/gauntlet-3/evidence-backend-reviewer.md` — S2-a (the em-dash predicate, seven authorings, controls first).
- `runtime/vlad-w1/s03/gauntlet-3/evidence-qa-reviewer.md` — S2-b, S2-c, and the S5 class-form tension.
- `runtime/vlad-w1/s03/gauntlet-3/evidence-security-claude-hunter.md` — the `args.map` defeated control, the S3 driver strength concern, and the bind-pins-a-falsehood second-order finding.
- `runtime/vlad-w1/s03/gauntlet-3/evidence-security-agy.md` — the absorb/delete asymmetry (cross-family, third round running).
- `runtime/vlad-w1/s03/fix-attempt-2/ROUND-RECORD.md` — the class-form residual, the clean-checkout probe, the three dispatch death signatures.

## Risks
- **The predecessor's signature defect recurring one layer up.** Three gauntlets, three rounds in which the repair produced a new defect one layer out from the thing it fixed — most recently the bind itself. **Mitigation: no control counts as done until a test fails on its removal AND the control is attacked at the layer above it.**
- **A correction that turns the ship gate red.** Because bound sentences are gate-enforced, any claim correction must move the bind in the same change. **Mitigation: treat claim-text and canonical-copy as one atomic edit, owned by one bundle.**
- **Scope creep into new controls.** The residuals are repair, wiring and one genuinely-missing criterion (AC-8.6). If a new scanner seems necessary, it goes to β first.

## Decisions
- **2026-08-28 — this sprint exists rather than a fourth fix attempt on S-VLADW1-03.** β's rule pre-committed "no attempt 3"; α applied it. Reopening the predecessor would be reshaping a pre-committed gate after seeing the result, which β barred in both directions (P-094). A named successor is the sanctioned path and keeps the predecessor's close honest.
- **2026-08-28 — the predecessor's branch is NOT merged.** `wt/S-VLADW1-01-engine` stays at `b2583d6` as the surface this sprint starts from, because its shipped copy contains claims proven false by execution.

## Completion record
- Final state: Not started — minted at the predecessor's close, awaiting operator build authorization
- Percent completion: 0%
- Completion timestamp: n/a
- Definition of done used: the Definition of Done above
- Evidence of completion: n/a
- Session IDs / dates / agents: 2026-08-28 — minted by Alex ε at the close of S-VLADW1-03
- Parent epic: E-VLAD-001
- Remaining follow-up items: all DoD items above; the four parked SDK credential vars remain disclosed-open per the operator's 2026-08-18 ruling and are NOT this sprint's scope.
- Related untracked work: None
- ../../TRACKER.md updated: Yes · Roadmap reconciled: pending the registry mint at build authorization
