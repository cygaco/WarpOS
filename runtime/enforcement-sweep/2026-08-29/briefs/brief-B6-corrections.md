# SP-20260829-001 — bundle B6 — CORRECTIONS

You are the B6 builder. **B6 is the last fix bundle of this sprint.** Its list is closed: nine items, below, and nothing else. Anything you discover that is not on the list is **reported in your envelope and left alone** — not repaired, however small or however serious it looks.

## Where you work

A worktree detached at `12d2aef0`, path in the dispatch envelope. Work only there. One commit. Do not switch branches, merge, push, or touch any other checkout.

## THE TWO RULES THAT GOVERN EVERY ITEM

**1. Every item changes what is STATED. No item may change what is TRUE of the gate's behaviour.**
The enforcer's success predicate is `regressed.length === 0 && newEntrants.length === 0`. Nothing you do may change that predicate or alter any pass/fail outcome. If a fix you are about to make would, stop, leave it, and say so in your envelope.

**2. The list is closed because a fix bundle repairs only what its own phase introduced.**
Pre-existing defects are not yours to fix here, even correct-looking ones. This is not tidiness — repairing a defect in order to make an old sentence true **erases the instance of the class this sprint exists to study.** You are correcting sentences to match facts. You are never manufacturing facts to match sentences.

## THE TWO ARTIFACT RULES — read these before you edit anything

**The registry ships, so its own prose is edited in place — and the superseded text is KEPT, marked superseded, never deleted.** A correction is a new claim and the record must be able to show both states.

**⚠️ A QUOTED SENTENCE embedded in the registry is a record of something else. Annotate it; never rewrite it.** If you are told a quoted sentence is false, the false sentence is in the thing being quoted. Editing the quote would falsify the record of what that thing says — strictly worse than leaving it. **Quotes get a note beside them. They do not get corrected.**

**The bundle envelope from the previous bundle is a returned artifact — annotate it in a new file, never edit it.**

## THE NINE ITEMS

### 1 — the `edit-watcher.js:674` correlation

That registry row asserts the site is uncorrelated, and its `tool_correlation_note` says so in prose. Read `scripts/hooks/edit-watcher.js` around that catch, read the sibling row `edit-watcher.js:897` and what relation it records, and read the committed audit capture under `runtime/enforcement-sweep/2026-08-29/b5/`. Correct the row's correlation fields and rewrite the note's claim about it.

**Then re-measure every coverage figure by running the enforcer yourself.** Do not copy any figure from any report, including this brief.

### 2 — the baseline's `purpose` field

**Print the whole field into your envelope before you touch it.** A faithful correction cannot be written of text that was not read.

It is false twice over — in count and in kind — and it contradicts itself within one paragraph about a single site. Find that contradiction by reading it; do not take anyone's word for where it is.

Rewrite it from **measured sets with their endpoints named in the text**. The endpoints are commits, not detector stamps — note that a baseline carries three distinct shas (the commit the file lives in, the commit it was emitted at, and the *detector version* its `detector_sha` names), and that diffing baseline files by the stamp lands on the wrong file. Give each departed id a reason drawn from the sets and the registry:
- **line-shift with return** — left under one id, came back under another;
- **line-shift, never tracked** — moved, was never a registry row;
- **no longer detected** — the detector stops finding it after an edit.

**"No longer detected" is a statement about the INSTRUMENT, not about the site.** It does not mean repaired and it does not mean the permissive path is gone. For any id whose row keeps `expected_finding: "present"`, use exactly: **"no longer detected; the permissive path is retained by design per the row's own disclosure"**. A bare "no longer detected" would be a second understatement inside the sentence written to fix the first one.

### 3 — the B5-R repair's "standard" claim

It claims the repair was prepared to the same demonstrated standard as the earlier hook repairs. Compare what those repairs each carry as executed evidence against what this one carries. Rewrite the claim to state what was actually done — a bounded-window check, plus an injection executed by the reviewer, **attributed to reviewer `d-mtfb42md-46a6f456`**.

**Do NOT add a test to make the old claim true.** The gap is the finding; closing it would erase it. The claim lives in an immutable commit message, so the correction goes in `CORRECTIONS.md` and in the relevant registry row's note.

### 4 — a stale line citation

One row's `decision_semantics_quote` cites a payload-parse line that is not that line at the sha the row is stamped with. Check each cited line number against the file at the stamped sha, correct it, and say briefly in your envelope why it drifted.

### 5 — a ceiling attribution

A row attributes a limitation to `gate-failclosed-audit.js`'s stated ceiling. Read `CEILING_TEXT` and check whether it says that. If not, correct the attribution — **without editing `CEILING_TEXT`**, which belongs to another bundle.

### 6 — `worktree-preflight.js`: a sound disposition resting on a false quoted sentence, plus a new site

**(a)** The row at `:160` **keeps its disposition** — the catch there is genuinely repaired and was verified non-permissive by execution. What is false is the sentence the row quotes as its decision semantics: that comment is the **code's own comment**, authored by an earlier bundle's repair, and B5 quoted it **faithfully**. Read the file's git helper near the top and see what it does with an `execSync` failure, then add a note beside the quote with three parts, in this order:
1. the quoted sentence is the code's own comment, authored by the earlier repair — **quote it, do not edit it**;
2. it is false about the function, with the helper's actual behaviour stated;
3. **this row's disposition rests on the executed check, not on the quoted comment.**

**Part 3 must not be dropped.** Without it the row reads as a disposition whose only justification has been discredited.

**(b)** Add a **new row** for the helper's own catch. Disposition **`contested`** — never `defect`: this is a correction bundle, not a grading pass, and the substance belongs to later lanes. `expected_finding: "present"`. `tool_correlated: false`, **with the reason stated by naming which sentence of the detector's stated ceiling covers it** (a catch that *returns* rather than exits is outside the detector's predicate). `polarity_provenance: "manual-by-read"` with a real quote of the helper. **Not repaired.**

Include this sentence verbatim in the row: **"contested; not tool-correlated, so this disposition does not enter the enforcer's enforcement count."** Shipping "contested fails closed as enforced" unqualified would be a decision semantics that does not fire — this sprint's own class, in the row written to correct a previous instance of it.

**(c)** **Do not touch the code comment itself.** It was authored by an earlier bundle and is outside this fence. Name it in your envelope as a carried item, and name **both** places the false sentence now ships — the hook and the registry's quote of it — so a later repair of one does not leave the other stale.

### 7 — `version-bump-guard.js`: a false claim, plus a new site

**(a)** The three rows share a B5-authored note claiming a specific number of read/parse failure sites and that a read failure never silently produces a fail-open outcome. Read the file end to end — **every `try` on a path the allow/refuse decision depends on**, not only the ones the detector found — and correct the claim. Superseded text kept.

**(b)** Add a **new row** for the site that claim misses. Same shape as 6(b): **`contested`**, `expected_finding: "present"`, `tool_correlated: false` with the ceiling sentence that explains why, `manual-by-read` with a real quote, the same disclosure sentence verbatim, **not repaired**.

### 8 — `CORRECTIONS.md`, beside the previous bundle's envelope

One entry per false sentence in that envelope: the sentence quoted, the correction, and who found it. The envelope's own bytes stay untouched. Where two reviewers found the same thing, say so as a **union** — never "both reviewers confirmed", because they read different prompts and answered different questions.

### 9 — a resolved pointer, stated as resolved

One registry pointer to the previous envelope now resolves because the landing committed that file. State it as **resolved when the landing committed the file** — not as repaired. Nobody fixed it, and a record saying "cured" will read as though someone did.

## Then

- Re-emit the baseline after items 1, 6 and 7, and **state plainly in the bundle record what the `detector_sha` field actually is** — it is `git rev-parse --short HEAD`, the repository's HEAD, **not** an identity of the detector, so a baseline emitted before its own commit carries the parent's sha. Say which case yours is. **Refuse to seal if the value is `unknown`.** Do not repair the function that produces it — outside the fence.
- Every coverage figure moves again. **Re-measure all of them; carry none forward**, including any hardcoded count in a test file, which you must update to the runner's own `actual:` value with before/after quoted.
- Run, each as its own command, and print real exit codes: the enforcer; `node --test` on `scripts/checks/gate-failclosed-audit.test.js`, `scripts/checks/gate-failclosed-enforcer.test.js`, and `runtime/enforcer-fixtures/SP-20260829-001/b3-fault-injection.test.js`; then `node scripts/testsuite/enforce.js`.
- Re-run the sprint's fooling-input fixtures against the lexer **as built at your landed sha**, sha recorded beside each result.
- Regenerate the three manifests **LAST**: `node scripts/generate-framework-manifest.js`, then `node scripts/warpos/snapshot-installed.js`, then `node scripts/warpos/manifest/build.js`.
- **Never pipe a gate's exit through `tail` or `head` in an `&&` chain** — the pipeline's status is `tail`'s and a red gate passes silently.

One commit, message prefix `fix(SP-20260829-001 B6):`.

## OUT OF SCOPE — absolute

- `scripts/checks/gate-failclosed-enforcer.js` and `scripts/checks/gate-failclosed-audit.js`. **If you notice a defect in either — including one that looks serious, including one that looks like exactly what this sprint is about — name it in your envelope and leave it.** Repairing it would change the predicate the round is about to test.
- Any hook's behaviour, any `process.exit`, any control flow. B6 changes sentences and registry rows. If an item seems to need a code change to a hook, you have misread it.
- Any code comment authored by an earlier bundle.
- Anything under `runtime/enforcement-sweep/` except your own envelope and `CORRECTIONS.md`.

## Prohibitions

- Never `git commit --no-verify`; never disable, weaken or allowlist past a guard. If a guard blocks you, quote the block and stop.
- Never hand-edit a registry, baseline or manifest value to make a gate pass. Every number you write is one your own run printed.
- Never place a credential-shaped literal anywhere; labelled placeholders only.
- Never push, merge, or delete a branch or worktree.

## Your envelope — write it to `runtime/enforcement-sweep/2026-08-29/b6/ENVELOPE.md` AND COMMIT IT

A pointer to an uncommitted file resolves to nothing; that happened last bundle. Return eight lines or fewer pointing at it. It contains:

- the commit sha;
- **item by item**: the sentence as it was, printed in full **before** the rewrite, and the sentence as it now reads;
- every coverage figure **as your own run printed it**, with the run's output beside it;
- the enforcer's full JSON and exit code; the three suites' observed counts; `enforce.js`'s real exit code; the fixture re-run results with their sha;
- the `detector_sha` statement;
- **every carried finding by name** — anything you noticed and deliberately did not repair, and why it is outside the fence;
- **what you could not check, by name.** An empty section is itself a claim, and this sprint exists because gates swallow "could not check" into "pass".

You may read the two reviewer output files under `runtime/enforcement-sweep/2026-08-29/b5/` as evidence of **what** is false. **Do not copy their wording** — they are claims, and you rewrite from the artifacts and the sets you measured yourself. Where a reviewer names a line number, check it; the line number is part of its claim, not a fact.

Nothing here tells you what any corrected sentence should say. If you find yourself writing what the brief seems to want rather than what the file says, stop and go read the file.
