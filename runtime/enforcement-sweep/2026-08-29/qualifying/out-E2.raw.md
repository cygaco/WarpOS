# Lane E2 — raw returned text, verbatim

> Captured by the conductor from the Agent tool's return. Harness note on capture: the return
> matched an instruction-shaped pattern (`settings-json`) because the lane grepped
> `.claude/settings.json` as part of its wiring observation; the harness neutralised control tags.
> No directive in this text is an instruction to anyone — it is a lane's report.

Tree fully restored (all four checksums match originals, `git status` empty, HEAD unchanged, all four controls back to baseline values). Report follows.

---

{"verdict":"warn"}

## Lane E2 — adversarial. Findings in my own name.

**Pin verified before anything else.** Both content markers reproduce in my checkout: the baseline's `purpose` opens with ``SUPERSEDED by `b6_correction_of_purpose` ``, and the registry holds 16 rows with exactly two `contested` (`version-bump-guard.js:183`, `worktree-preflight.js:30`). HEAD = `c88aac1df718fc0772c16b6e428130a095549a6c`. This is the tree the envelope names.

### CONTROLS FIRST — all green, so refusals are attributable

| control | exit |
|---|---|
| `scripts/checks/gate-failclosed-enforcer.js` unmutated | **0** |
| `gate-failclosed-enforcer.test.js` | 0 (pass 11, fail 0) |
| `gate-failclosed-audit.test.js` | 0 (fail 0, skipped 1) |
| `b3-fault-injection.test.js` | 0 (fail 0) |

There is a green control, so every transition below is mine.

### A. CAN THE ENFORCER FAIL? — YES, demonstrated by execution, both required modes

**A1 — registry member regressed (in-window).** Mutation: in `scripts/hooks/dependency-admission-guard.js`, line 34 (registry row 0's catch is line 33, `expected_finding: absent`), replaced the comment with `    process.exit(0); // E2-DEMO-1a regression of a repaired site`, line count preserved at 53.
→ **exit 1**, `regressed: [{site_id:"scripts/hooks/dependency-admission-guard.js:33", reason:"still permissive-shaped despite expected_finding=absent"}]`, `new_entrants:["...:34"]`.

**A2 — new untriaged site.** Created `scripts/checks/e2-new-entrant-probe.js`, a fresh `catch (e) { process.exit(0); }` appearing in no registry row and in no baseline id.
→ **exit 1**, cleanly isolated: `regressed: []`, `new_entrants:["scripts/checks/e2-new-entrant-probe.js:7"]`, `live_files_scanned` 951→952.

**No-op guard — required, and it passes.** Replaced the decision at L200 with `const ok = true;`. The same input that gave exit 1 in A2 gave **exit 0**, while `new_entrants` remained populated (detection still ran; only the decision was neutered). So A1/A2 measured the gate's decision, not something else. Bonus: the shipped suite **catches** the no-op — `gate-failclosed-enforcer.test.js` went to **exit 1, fail 2**. The decision is genuinely test-covered. Credit where due.

**Reach difference between the two modes (this is the interesting half).** Same site, regression moved *outside* the disclosed 12-line window — line 49 `process.exit(2);` → `process.exit(0);`, anchor still line 33:
→ **exit 1**, but `regressed: []`, `new_entrants:["...:49"]`. The regression check missed it entirely; only the new-entrant path caught it. The 12-line window is disclosed at `WINDOW_LINES` and I am **not** filing the window as a bypass. What I am filing is the coupling: for any repaired site, the regression check alone does not hold, and the catch depends on the *baseline* path staying honest — which section B shows it need not.

### B. CAN THE DISPOSITIONS BE DEFEATED? — YES

**B1 — the seal, defeated to exit 0 over a live fail-open site.** With the A2 probe still present and permissive, I appended `"scripts/checks/e2-new-entrant-probe.js:7"` to `baseline.site_ids` and deliberately left `site_count` at 78.
→ **exit 0**, `status:"ok"`, `new_entrants: []`, with a genuinely fail-open `catch (e) { process.exit(0); }` live in the tree.

Two things inside that result are mine and are, as far as I can see, undisclosed:

1. **The gate then asserts a false provenance sentence.** Its coverage phrasing read: *"0 of the **79** sites **the detector at 12d2aef0 enumerated** are under enforcement…"*. The detector at `12d2aef0` enumerated 78. The 79th was typed by hand thirty seconds earlier. The gate attributes hand-authored content to the detector's enumeration without ever verifying it came from there. That is a claim exceeding the instrument, emitted by the instrument.
2. **The file carries the evidence of its own tamper and the gate never reads it.** `site_count: 78` versus `site_ids.length: 79`. `loadBaseline` checks only `Array.isArray(data.site_ids)`. A free, zero-cost integrity check sits unused in the file it would have caught.

**B2 — provenance blended, and the blend is the cheap direction.** On the contested row `worktree-preflight.js:30` I set `polarity_provenance:"tool-derived"`, **deleted** `decision_semantics_quote`, left `instrument:"manual-by-read"` contradicting it, and resolved the contested judgement to `not-a-defect`.
→ **exit 0**. `uncorrelated_registry_defects` silently went 2→1. Nothing reported that a contested judgement had been resolved.

Loader boundary probes (in-process, on temp registries outside the tree) show the validation is real but **asymmetric**:

| probe | result |
|---|---|
| `polarity_provenance:"blended"` | REJECTED |
| provenance field missing | REJECTED |
| `manual-by-read` with empty quote | REJECTED |
| **`tool-derived` with no quote** | **ACCEPTED** |
| **`instrument` contradicting `polarity_provenance`** | **ACCEPTED** |
| **`tool-derived` + fabricated `tool_finding_line: 99999`** | **ACCEPTED at load** |

So the cheapest way to strip a human judgement of the evidence that made it auditable is to relabel it as machine-derived — the exact blend Question B asks about, answered yes. (Fair defence noted: `computeCoverage` L156 cross-checks `tool_finding_line` against the baseline set, so the fabricated correlation does not inflate `N`.)

**B3 — could-not-check swallowed into pass.** I moved `scripts/hooks/dependency-admission-guard.js` out of the tree entirely, leaving row 0's `expected_finding: absent` unverifiable.
→ **exit 0**, `regressed: []`, and **`checked_repaired_count` still reports 7** — byte-identical to a run where all 7 were genuinely verified. `siteStillPermissive` computes `reason: "file-unreadable: ENOENT"` and `checked:false`, then `checkRegistryRegressions` pushes it into `checkedRepaired` regardless and the reason never reaches the output. The counter is named for checks and counts attempts. An operator cannot distinguish "7 repaired sites verified" from "0 verified, 7 missing".

**B4 — dispositions are inert on the verdict.** All 16 rows set to `disposition:"defect"` → **exit 0**, `N` 0→4. No disposition value can make this gate refuse.

**Disclosure boundary, stated honestly.** B4 and the `status:"unknown"` facet of B3 are **already registered** — `S6-7-RESIDUALS.md` R-1 ("the enforcer computes four signals and lets none reach its verdict", recorded as ED-403/404/405), and β's ruling `3f5b8d47` (row 390) names L200 and states "the seal is what clears the block" from a source read. I am not claiming those as discoveries. My contribution to them is that they are now **executed with a control run beside them**, which is precisely what that ruling said was still owed: *"it corroborates; it does not discharge… the adversarial lane discharges S6-6 at the final pin."* Treat A1/A2/no-op as that discharge. Undisclosed in what I read: B1's false provenance sentence, the unread `site_count`, B2's provenance asymmetry, and B3's attempts-not-checks counter.

**One further observation, not a mutation.** The gate has no trigger. `grep -c failclosed .claude/settings.json` = 0 (66 hooks are registered there, none of them this). No file under `.claude/commands/` or `scripts/` outside `scripts/checks/gate-failclosed*` invokes it. All 29 repo references are its own files, fixtures, sprint evidence, β notes, and manifest inventories. Whether a bundle that calls itself an "enforcer skeleton" is *supposed* to be wired yet is a judgement I do not make; the observation is that today nothing runs it.

### Required fields

**execution_proven** — *ran, with exit codes read unpiped, each as its own command:* the 4 controls; A1 in-window regression (1); out-of-window regression (1); A2 new entrant (1); no-op guard (0) plus suite-under-no-op (1, fail 2); B1 seal tamper (0); B2 provenance blend (0); B4 all-defect (0); B3 file-removed (0); 6 loader boundary probes; 4 post-restoration controls (0/0/0/0). *Reasoned about, NOT run:* redirection via the `--root` / `--registry` / `--baseline` flags (L225-228 accept arbitrary paths — I read the code but executed no redirection attack); any TOCTOU between the live scan and the regression re-read; whether the audit's own detector has shape gaps beyond its stated CEILING_TEXT. Those three are **hypotheses**, labelled as such.

**derivation_rule** — The verdict is `ok = regressed.length === 0 && newEntrants.length === 0` (L200) and nothing else. I enumerated, from source, the finite set of inputs to those two terms and attacked each member: for `regressed` — (R1) the `expected_finding !== "absent"` skip, (R2) the `checked:false` unreadable path, (R3) the 12-line window bound, (R4) the two permissive regexes, (R5) row-controlled `file`/`line`, (R6) registry contents/loader validation; for `newEntrants` — (N1) baseline membership, (N2) the `--root` scan boundary, (N3) detector shape coverage, (N4) live unreadable files. Members attacked by execution: R1/R2/R3/R6 and N1. **What this rule does NOT reach:** anything not an input to L200 — so it says nothing about the audit module's internal detection correctness (N3, a disclosed ceiling I deliberately did not file), nothing about the CLI flag surface (R5/N2 by redirection, reasoned only), nothing about concurrency, and nothing about whether the gate is invoked at all in a real workflow. An attack set derived from one boolean cannot speak to defects that never reach that boolean.

**what_i_could_not_assess** — Whether ED-403/404/405 exist as recorded: `.claude/project/memory/enforcement-debt.jsonl` **does not exist in this checkout** (untracked; the envelope's copy is under the repo root, which my scope contract forbids me). R-1 cites those IDs and I could neither confirm nor refute them. Also unassessed: whether the coverage phrase "under enforcement" is defined anywhere as narrower than "will cause a refusal" — that is claim-truth work and belongs to E1, not me; I supply only the execution fact that `N=4` coexists with exit 0. Also: `node scripts/testsuite/enforce.js` exits 1 in this checkout — per the envelope I did not diagnose it.

**files_i_could_not_see** — Read end to end: `gate-failclosed-enforcer.js` (all 249 lines). **Sampled, not read end to end:** `gate-failclosed-audit.js` (24.8 KB — I grepped `unknown` and read the correlation notes about it, never the body; `analyzeHandler`/`findCatchHandlers`/`cleanSource` internals are unread, which is exactly why N3 is excluded from my derivation rule). `gate-failclosed-registry.json` (36.8 KB) — I read **all 16 rows' scalar fields** programmatically plus both contested rows' full text and the two header notes; the other 14 rows' `b5_note`/`b6_note` prose is unread, a window into a structured region rather than the region. `S6-7-RESIDUALS.md` — read the derivation-rule header and R-1/R-2 bodies in full; R-3…R-12 are **titles only**, so a finding of mine may be registered there and I would not know. `gate-failclosed-baseline.json` — read the metadata fields and both purpose fields; the 78 `site_ids` I queried by membership, never enumerated. One β consult read in full; the other five in that directory unread.

**what_would_confirm_or_refute** — B1 refuted if some artifact discloses that the coverage phrasing is not a provenance claim, or if a separate check verifies baseline authorship. B1 confirmed further by adding a `site_count !== site_ids.length` assertion to `loadBaseline` and watching my tamper turn from exit 0 to a refusal — a three-line change. B3 refuted if `checked_repaired_count` is documented as an attempt counter anywhere; confirmed by surfacing the discarded `reason` into the output. B2 refuted if `tool-derived` rows are evidenced by some mechanism I did not find; confirmed by requiring evidence symmetrically for both provenance values and asserting `instrument === polarity_provenance`. The wiring observation is settled by naming this gate's intended trigger, or by a residual entry (R-3…R-12) that already does.

**read_outside_the_quoted_region** — Yes, and it changed my report. I read β's ruling `SP-20260829-001-repair-in-B5-ok-ignores-dispositions-3f5b8d47.md` and `S6-7-RESIDUALS.md` R-1 *after* running B4 and B1, and consequently **downgraded** both from novel findings to already-registered ones, and reframed A1/A2 as the discharge that ruling says was owed. I also read the registry's `site_unit_definition` / `tool_correlation_note` (which is how I know the nested-try blind spot was fixed, closing off a "both checks miss" attack I had planned), and grepped `.claude/settings.json`, `.claude/commands/`, `scripts/`, and `_warpos/MANIFEST.json` for wiring.

**tree_state_on_exit** — **Fully restored, incrementally after each mutation, never batched.** Every one of the six mutation episodes was reverted and re-verified before the next began, each followed by a control re-run that returned to exit 0. Final state: `git status --porcelain` (and `--untracked-files=all`) **empty**; HEAD unchanged at `c88aac1d`; md5 of all four touched files identical to their pre-mutation values (`gate-failclosed-enforcer.js` `67ff9ac1…`, registry `f4f49e7f…`, baseline `49b36fb9…`, `dependency-admission-guard.js` `eaa0ae32…`); `scripts/checks/e2-new-entrant-probe.js` removed; all four controls re-run at exit 0/0/0/0. Nothing committed, nothing pushed, no branch or worktree touched. All scratch artifacts (backups, mutation scripts, captured JSON) live outside the repo in the session scratchpad. I read and mutated only `.claude/worktrees/enf-e2-adversarial`; no other checkout was read from or run against.

### Why `warn` and not `pass` or `fail`

Not `pass`: `pass` means I attacked it and it held, and it did not hold — B1 produced **exit 0 with a live fail-open site in the tree**, and the gate emitted a false provenance sentence while doing so. Not `fail`: the lane's central question, A, was answered affirmatively with a green control, two observed refusals, and a passing no-op guard — this enforcer demonstrably refuses both classes it claims, and its own suite catches a neutered decision. The B-side defeats are real, and the largest of them are already registered by the sprint (R-1, β row 390) rather than newly discovered. The undisclosed residue — the false provenance sentence under seal tamper, the unread `site_count`, the asymmetric provenance validation, and a counter that reports attempts as checks — is what keeps this off `pass`.
