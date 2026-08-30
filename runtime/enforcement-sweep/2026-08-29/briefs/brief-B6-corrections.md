# SP-20260829-001 — bundle B6 — CORRECTIONS

You are the B6 builder. **B6 is the last fix bundle of this sprint.** Its enumeration is closed: seven items, listed below, and nothing else. Anything you discover that is not on this list is **registered and carried**, never repaired here — you name it in your envelope and you leave it alone.

## Where you work

A worktree detached at `12d2aef0`, path given in the dispatch envelope. Work only there. Do not switch branches, merge, push, or touch any other checkout.

## THE ONE RULE THAT GOVERNS EVERY ITEM

> **Every item on this list changes what is STATED. No item may change what is TRUE of the gate's behaviour.**

The enforcer's success predicate is `regressed.length === 0 && newEntrants.length === 0`. **Nothing you do may change that predicate, or the inputs that feed it in a way that alters a pass/fail outcome.** If a fix you are about to make would, stop, leave it, and say so in your envelope — it has left the fence and becomes a carried item, however small it looks.

This is not a formality. The sprint's subject is claims that exceed what was done. Repairing a defect in order to make an old sentence true **erases the instance of the very class this sprint exists to study.** You are correcting sentences to match facts, not manufacturing facts to match sentences.

## THE SEVEN ITEMS

Each one is a sentence **this sprint's own bundle B5 wrote** that is false read against the code it describes. Each was found by a review lane, not by the bundle's author.

### Item 1 — the `edit-watcher.js:674` correlation field

`scripts/checks/gate-failclosed-registry.json`'s `tool_correlation_note` currently ends:

> "edit-watcher.js:674 remains genuinely uncorrelated (not-a-gate, a PostToolUse hook with no admit/deny decision — the tool's pattern-match simply has nothing polarity-relevant to find there, independent of the nested-try fix)."

Read `scripts/hooks/edit-watcher.js` around that catch, and read the sibling row `edit-watcher.js:897` in the same registry, and read the committed audit capture under `runtime/enforcement-sweep/2026-08-29/b5/`. Then decide what the row's `tool_correlated` and `tool_finding_line` should actually be, and correct both the field and the note.

**Then RE-MEASURE the coverage numbers by running the enforcer.** Do not type any recomputed figure from any report, including this brief — the numbers in the sealed output move when that field moves, and the only admissible values are the ones your own run prints.

### Item 2 — the baseline's provenance sentence

**Print `scripts/checks/gate-failclosed-baseline.json`'s `purpose` field in full into your envelope BEFORE you touch it.** A faithful correction cannot be written of text that was not read.

Then read that field against the actual departed and arrived sets, which you derive yourself by diffing the site_id sets between the relevant commits. Two of its statements about the same site cannot both be true; find that for yourself rather than taking my word for which. Rewrite the paragraph so every sentence in it is true of the sets you measured, and **name the endpoints of every departure claim** — a "12 sites left" claim means nothing without saying left *from what* and *to what*.

### Item 3 — the `worktree-preflight.js:160` row's mechanism

Its `decision_semantics_quote` asserts that a failure anywhere on that path means a later check "was never reached". Read `scripts/hooks/worktree-preflight.js` — in particular how the file's own git helper handles an `execSync` failure — and rewrite the quote so its mechanism is true. **The disposition itself is not in question here; the mechanism account is.** A true finding with a false mechanism is a defect in this sprint.

### Item 4 — the three `version-bump-guard.js` rows' claim

Their shared `decision_semantics_quote` makes a claim about how many read/parse failure sites this gate has and about what a read failure never does. Read `scripts/hooks/version-bump-guard.js` end to end — every `try` on a path the commit/allow decision depends on, not only the ones the detector found — and correct the claim.

Two constraints on the rewrite:
- The permissive path in those three rows is **retained by design**; say so in the row's own terms, in the form *"no longer detected; the permissive path is retained by design per the row's own disclosure"*.
- If you find a read-failure site the claim does not cover, **do not repair it.** Withdraw the claim, name the site in your envelope as a carried finding, and leave the code alone. Repairing it is outside the fence and would change the predicate.

### Item 5 — the stale line citation

One row's `decision_semantics_quote` cites a payload-parse line number that is not that line at the sha the row is stamped with. Find it by checking each cited line number against the file at the stamped sha, and correct it. Note *why* it drifted, briefly, in your envelope.

### Item 6 — the `CEILING_TEXT` attribution

A row attributes a limitation to `gate-failclosed-audit.js`'s stated ceiling. Read `CEILING_TEXT` and check whether it says that. If it does not, correct the attribution — **without** editing `CEILING_TEXT` itself, which belongs to another bundle and is out of scope.

### Item 7 — the "standard" claim on the B5-R repair

The bundle envelope claims its repair was prepared "to the same demonstrated standard" as the earlier hook repairs. Compare what those repairs each carry as executed evidence against what this one carries. **Rewrite the claim to be true. Do NOT add a test to make the old claim true** — the gap is the finding, and closing it would erase it. Where an injection was in fact executed against the repair, attribute it to the reviewer that ran it (`d-mtfb42md-46a6f456`), not to the bundle.

## Two evidence files get ANNOTATED, never edited

Two further findings concern the committed bundle envelope. **Evidence is annotated, never rewritten.** Create `CORRECTIONS.md` beside the envelope recording, for each: what the envelope says, what is actually the case at which commit, and who found it. Leave the envelope's own bytes untouched.

- Its emitted disposition table states one row in a state that is true of a later commit, not of the commit the table describes.
- Its count of `expected_finding: "absent"` rows does not match either commit; derive both real counts yourself.

## OUT OF SCOPE — do not repair, do not "improve"

- `scripts/checks/gate-failclosed-enforcer.js` and `scripts/checks/gate-failclosed-audit.js` and their test files. **This is absolute.** If you notice a defect in either — including one that looks serious, including one that looks like exactly what this sprint is about — **name it in your envelope as a carried finding and leave it.** It is out of the fence by construction, and repairing it here would change the predicate the round is about to test.
- Any hook's behaviour. B6 touches no `process.exit`, no control flow, no guard logic. If an item seems to require a code change to a hook, you have misread the item — re-read it.
- Anything under `runtime/enforcement-sweep/` except the new `CORRECTIONS.md`.

## Verification — B6 has no review lane, so your own evidence is all there is

1. Run `node scripts/checks/gate-failclosed-enforcer.js` as its own command. Print the full JSON and the real exit code.
2. Run each of these individually with `node --test` and print the counts you observed: `scripts/checks/gate-failclosed-audit.test.js`, `scripts/checks/gate-failclosed-enforcer.test.js`, `runtime/enforcer-fixtures/SP-20260829-001/b3-fault-injection.test.js`.
3. Regenerate the three manifests LAST, in order: `node scripts/generate-framework-manifest.js`, then `node scripts/warpos/snapshot-installed.js`, then `node scripts/warpos/manifest/build.js`.
4. Run `node scripts/testsuite/enforce.js` as its own command and read its real exit code. **Never pipe a gate's exit through `tail` or `head` in an `&&` chain** — the pipeline's status is `tail`'s, and a red gate passes silently.

One commit. Message prefix `fix(SP-20260829-001 B6):`.

## Prohibitions

- Never `git commit --no-verify`; never disable, weaken, or allowlist past a guard. If a guard blocks you, quote the block in your envelope and stop.
- Never hand-edit a registry, baseline or manifest value to make a gate pass. Every number you write must be one your own run printed.
- Never place a credential-shaped literal anywhere; labelled placeholders only.
- Never push, merge, or delete a branch or worktree.

## Your envelope

Write `runtime/enforcement-sweep/2026-08-29/b6/ENVELOPE.md` **and commit it** (a pointer to an uncommitted file resolves to nothing — that happened last bundle). Return eight lines or fewer pointing at it. It contains:

- the commit sha;
- **item by item**: the sentence as it was, printed in full before the rewrite, and the sentence as it now reads;
- for item 1, the coverage figures **as your own enforcer run printed them**, with the run's output beside them;
- the enforcer's full JSON and exit code; the three suites' observed counts; `enforce.js`'s real exit code;
- **every carried finding, by name** — anything you noticed and deliberately did not repair, with why it is outside the fence;
- **what you could not check, by name.** An empty section here is itself a claim, and this sprint exists because gates swallow "could not check" into "pass".

Nothing in this brief tells you what any corrected sentence should say. If you find yourself writing what the brief seems to want rather than what the file says, stop and go read the file.
