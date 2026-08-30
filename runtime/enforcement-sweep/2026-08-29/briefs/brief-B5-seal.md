# SP-20260829-001 — bundle B5 — SEAL

You are the B5 builder. One bundle, one worktree, two commits. Read this whole brief before editing anything.

## Where you work

Worktree: `C:/Users/Vlad/Desktop/Claude/Projects/WarpOS/.worktrees/b5-seal`, detached at `06669fbe`, clean at handoff. Work only there. Do not switch branches, do not merge, do not push, do not touch any other checkout of this repository.

## The state you inherit — established facts, verified before this brief was written

At `06669fbe`, in a detached checkout:

- `node scripts/checks/gate-failclosed-audit.js` → **exit 0**.
- `node scripts/checks/gate-failclosed-enforcer.js` → **exit 1**, `"status": "blocked"`.
- The enforcer's full JSON at that pin is committed verbatim at `runtime/enforcement-sweep/2026-08-29/pin-06669fbe/enforcer-at-06669fbe.json`, with its exit code and the audit's beside it. **Read that file first.** It is the pre-state you are changing, it is already evidence in this sprint's record, and you must not modify, move or regenerate anything in that directory.
- Test suites at the pin, run individually with `node --test`: `scripts/checks/gate-failclosed-audit.test.js` → 28 tests / 27 pass / 1 skipped (a symlink guard that cannot be assessed on this machine); `scripts/checks/gate-failclosed-enforcer.test.js` → 11 / 11 pass; `runtime/enforcer-fixtures/SP-20260829-001/b3-fault-injection.test.js` → 10 / 10 pass.

Three earlier bundles landed before you: B1 built the audit lexer and its near-miss fixture battery; B2 and B2′ built the registry, the baseline and the enforcer and fixed a nested-try scan-continuation defect in the detector; B3 repaired hook sites named in the registry; B4 repaired sites in `scripts/sprint/*` and `scripts/check/install.js`. **The registry and the baseline were never re-emitted after B3 and B4 landed.** That is what this bundle exists to do.

## Why the enforcer is blocking — read it yourself, do not take this paragraph as the finding

The enforcer reports `new_entrants`, `regressed`, `checked_repaired_count` and `uncorrelated_registry_defects`. Read `scripts/checks/gate-failclosed-enforcer.js` — specifically `checkRegistryRegressions`, `checkNewEntrants` and `computeCoverage` — and work out for yourself what each of those values means about the tree and which of them your work is supposed to move. **Do not infer from this brief what the correct disposition of any particular site is.** Nothing in this brief tells you an expected outcome and you should be suspicious of any reading of it that seems to.

## THE RULE — S6-1..S6-7, verbatim, minted before any result of this sprint existed

These bind your work and your bundle envelope. They are reproduced exactly.

- **S6-1 TRUTH** — never satisfiable by mechanism evidence or an approval chain. No sentence this sprint ships is false read against the code it describes — enforcer output, registry, close report, AND ED ROWS (the secret-guard mechanism error is the live example: a true finding with a false mechanism is a defect here).
- **S6-2 GRANULARITY (keystone)** — every coverage claim names its unit and emits its set; no bare count without the per-item table it derives from; the count-form family reviewed by reading, not lint; closure only by a named property or an emitted exhaustive extension over a stated finite domain.
- **S6-3 INSTRUMENT CEILING** — every claim resting on the lexer carries its ceiling at the point of claim; the enumeration is "what this instrument at <sha> finds, limits named", never "the population"; 65 explicitly withdrawn. *Pre-committed: the lexer HAVING a ceiling is NOT a defect; S6-3 governs the claim, never the capability.*
- **S6-4 POLARITY PROVENANCE** — per-site `manual-by-read` or `tool-derived`, never blended; manual dispositions quote the site's decision semantics; contested → fails closed.
- **S6-5 FALSIFIERS OBSERVED AT THE CLOSE** — each executed fooling input becomes a near-miss fixture, observed RED against the built lexer, no-op⇒FAIL guard, re-run at the qualifying close against the predicate AS BUILT (P-118).
- **S6-6 THE ENFORCER CAN FAIL** — demonstrated BY EXECUTION to fail on a registry member regressing and on a new untriaged site; asserted-not-demonstrated fails (ED-374 turned on this sprint's own output).
- **S6-7 RESIDUALS TRAVEL** — emitted by name with ledger ids: the 53 unread, reachability/polarity, the parser ADR candidate, ED-374/356/363, the withdrawn 65, ED-380. A residual named in a spec does not satisfy a criterion requiring it recorded or shipped.

Also binding, from the same mint: **NO STACKING, specific before general.** **A residual named in a spec does not satisfy a criterion requiring it recorded or shipped.**

## What you build

### Commit 1 — the seal

1. **Re-emit `scripts/checks/gate-failclosed-baseline.json`** as an emitted set captured by the audit's own method at the current detector, with its `detector_sha` and the file's own header conventions preserved. The file's purpose text states the capture method and the anchor convention; honour both, and update the header prose so every sentence in it is true of the file you emit (S6-1). **Never auto-append; never hand-add an id you did not capture.** If the header's own account of how it was captured stops being accurate, rewrite that account rather than leaving it.

2. **Triage every site the enforcer names as a new entrant, BY READ.** For each: open the file, read the enclosing gate, and decide its disposition from the site's own decision semantics. Record it as a registry row with `polarity_provenance: "manual-by-read"` and a `decision_semantics_quote` that is a real quote from the code or its header — never a paraphrase, never blended provenance (S6-4). A site whose disposition you cannot settle by reading is **contested**, and contested fails closed. **Do not pre-judge any of the three and do not let the order they appear in suggest a grouping.** Your read is the evidence; nothing else in this repository is.

3. **Give the registry rows repaired by earlier bundles their post-repair disposition**, with tool correlation restored so each row's `tool_finding_line` matches the current detector's own anchor for that site. Work out from `computeCoverage` and `checkRegistryRegressions` what a repaired row has to look like for the enforcer to actually check it, and make it so. Where a row cannot be correlated, it stays uncorrelated **and you name it and say why in the bundle envelope** — an uncorrelated row is a disclosure, not a thing to make disappear.

4. **The enforcer must exit 0 on the sealed tree.** Run it. Print the exit code you actually observed.

5. **Then demonstrate, by execution, that it still fails** — once on a registry member regressing, once on a new untriaged site. Use the fixture harness already in `runtime/enforcer-fixtures/SP-20260829-001/` (there are fixture registries, baselines and a regressed-site file there; read them before writing new ones). Report both exit codes **as printed**. An assertion that it would fail is worth nothing here (S6-6).

6. **Tests green.** Run each of the three suites named above individually with `node --test` and report the counts you observed, not the counts in this brief.

7. **Regenerate the three manifests LAST**, in this exact order, after every other edit: `node scripts/generate-framework-manifest.js`, then `node scripts/warpos/snapshot-installed.js`, then `node scripts/warpos/manifest/build.js`. Then run `node scripts/testsuite/enforce.js` as its own command and read its real exit code. **Never pipe a gate's exit code through `tail` or `head` in an `&&` chain** — the pipeline's status is `tail`'s, and a red gate slips through silently.

Commit 1 message: `build(SP-20260829-001 B5): re-emit the baseline at the current detector, triage the new entrants by read, restore repaired-row correlation`, plus a body that states what you did and what you observed.

### Commit 2 — HELD, separate, not part of the seal

Some of the sites you triage in step 2 may come out as defects. **If and only if a site you triaged is a defect**, prepare its repair — the same shape earlier bundles used for this class, a permissive termination replaced by a non-zero one carrying a governance message — as a **second, separate commit** in the same worktree.

That commit must leave the tree self-consistent on its own: the repaired rows' dispositions updated to match, the enforcer run again and exiting 0, tests green, manifests regenerated last. Report its exit codes separately.

**Commit 2 is HELD.** Its message must begin `HELD(SP-20260829-001 B5-R):` and its body must state that it is held pending a ruling on whether the repair belongs in this phase. Do not squash it into commit 1. Do not reorder them. If your triage produces no defect, say so plainly and make no second commit — an empty second commit is worse than none.

## Out of scope — do not edit

- `scripts/checks/gate-failclosed-audit.js` and its test file. The detector is another bundle's artifact and moving it moves every figure that cites it.
- `scripts/checks/gate-failclosed-enforcer.js` and its test file. If you believe the enforcer itself is wrong, **say so in the envelope and stop** — do not repair the thing that judges you.
- Anything under `runtime/enforcement-sweep/`.
- Any file outside this worktree.

## Prohibitions

- Never `git commit --no-verify`, and never disable, weaken or add an allowlist entry to any guard or hook in order to get a commit through. If a guard blocks you, report the block verbatim in your envelope and stop.
- Never hand-edit a registry, progress or manifest file to make a gate pass. Every value you write must be one you produced by running something or by reading a file.
- Never place a credential-shaped literal anywhere; labelled placeholders only.
- Never push. Never merge. Never delete a branch or a worktree.

## Your envelope — what you return

Eight lines or fewer as the returned text, pointing at the artifacts. In the worktree, write `runtime/enforcement-sweep/2026-08-29/b5/ENVELOPE.md` (create the directory) containing:

- the two commit shas and which is held;
- **every disposition you assigned, as an emitted table** — site, disposition, provenance, the quote you read it from. No count anywhere without the set it derives from (S6-2). If you state a coverage figure, it carries the instrument's ceiling in the same sentence (S6-3);
- the enforcer's full JSON output at the sealed tree, verbatim, with its exit code;
- both S6-6 demonstration commands and their exit codes as printed;
- the three test suites' observed counts;
- `node scripts/testsuite/enforce.js`'s real exit code;
- every uncorrelated registry row that remains, by name, with why;
- **what you could not check, by name** — files you could not read, sites whose semantics you could not settle, anything you asserted without executing it. This section being empty is itself a claim, and this sprint is about gates that swallow "could not check" into "pass".

Nothing in this brief tells you what the answer is. If you find yourself reasoning from what the brief seems to expect rather than from what you read in the code, stop and go read the code.
