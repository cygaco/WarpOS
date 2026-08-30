# SP-20260829-001 — bundle B5 — CROSS-PROVIDER REVIEW

You are reviewing a bundle whose entire purpose is to make a gate green. That is the reason to read it hard.

## THE INVARIANT YOU ARE ASKED TO ATTACK

> **A seal records a tree's current state as expected. It is the one operation in this sprint that can turn a defect into policy — because after it, the gate goes green *because* the defect is now expected.**

Your job is not to confirm the bundle. Your job is to find out whether anything became expected that should have been repaired, disclosed or contested. **Assume the bundle is competent and still wrong**, and go looking for where.

Specifically, try to build a case for each of these, and report honestly if you cannot:

1. **A site was absorbed rather than triaged.** Something appears in the emitted baseline that no human read and no row explains, and its presence alone now silences the gate.
2. **A disposition was assigned from something other than a read of the site.** A quote that is a paraphrase; a quote lifted from a header that does not describe the branch in question; a disposition that follows from what would make the gate green rather than from what the code does.
3. **A number is true of nothing.** A count, a coverage figure or a phrasing string that does not derive from an emitted set present in the artifacts, or that was true before the bundle and is not true after it.
4. **A green was obtained by moving the thing being measured** rather than by fixing the thing being measured.
5. **A "could not check" was resolved into a pass** anywhere — in the code, in a row, in the envelope, or by silence.

## THE RULE THE BUNDLE IS BOUND BY — verbatim

- **S6-1 TRUTH** — never satisfiable by mechanism evidence or an approval chain. No sentence this sprint ships is false read against the code it describes — enforcer output, registry, close report, AND ED ROWS (the secret-guard mechanism error is the live example: a true finding with a false mechanism is a defect here).
- **S6-2 GRANULARITY (keystone)** — every coverage claim names its unit and emits its set; no bare count without the per-item table it derives from; the count-form family reviewed by reading, not lint; closure only by a named property or an emitted exhaustive extension over a stated finite domain.
- **S6-3 INSTRUMENT CEILING** — every claim resting on the lexer carries its ceiling at the point of claim; the enumeration is "what this instrument at <sha> finds, limits named", never "the population"; 65 explicitly withdrawn. *Pre-committed: the lexer HAVING a ceiling is NOT a defect; S6-3 governs the claim, never the capability.*
- **S6-4 POLARITY PROVENANCE** — per-site `manual-by-read` or `tool-derived`, never blended; manual dispositions quote the site's decision semantics; contested → fails closed.
- **S6-5 FALSIFIERS OBSERVED AT THE CLOSE** — each executed fooling input becomes a near-miss fixture, observed RED against the built lexer, no-op⇒FAIL guard, re-run at the qualifying close against the predicate AS BUILT (P-118).
- **S6-6 THE ENFORCER CAN FAIL** — demonstrated BY EXECUTION to fail on a registry member regressing and on a new untriaged site; asserted-not-demonstrated fails (ED-374 turned on this sprint's own output).
- **S6-7 RESIDUALS TRAVEL** — emitted by name with ledger ids. A residual named in a spec does not satisfy a criterion requiring it recorded or shipped.

**S6-3 cuts both ways and you must apply it correctly: the instrument HAVING a ceiling is NOT a defect.** A finding that amounts to "the scanner cannot see everything" is not a finding. A finding that the bundle *claimed* more than the instrument can support is.

## HOW TO WORK

Everything you need is inlined below this section — the bundle's commits, its diff, its envelope, and the enforcer's committed output from BEFORE the bundle existed. **Read the pre-state first**, then the diff, then the envelope, in that order. The envelope is the bundle's own account of itself; treat it as a claim to be checked against the diff, never as a description of the diff.

Where the bundle reports having executed something, check whether the artifact of that execution is present. **An exit code stated in prose is a claim; an exit code beside the command that produced it is evidence.** If a demonstration is asserted and not shown, that is a finding under S6-6, and the rule says asserted-not-demonstrated fails.

## VERDICT

Return strict JSON, nothing before or after it:

```json
{
  "verdict": "pass" | "warn" | "fail",
  "findings": [
    {
      "id": "F-1",
      "severity": "high" | "medium" | "low",
      "rule": "S6-1 | S6-2 | S6-3 | S6-4 | S6-6 | S6-7 | other",
      "claim": "the sentence, value or line you are contesting, quoted",
      "why_wrong": "what you read that makes it wrong, with the quote you read it from",
      "confidence": "certain | probable | possible"
    }
  ],
  "attacks_attempted": [
    { "attack": "one of the five above, or your own", "outcome": "found | not found", "what_i_checked": "..." }
  ],
  "could_not_check": ["by name — files, sites, or claims you were unable to verify, and why"]
}
```

`could_not_check` being empty is itself a claim, and this sprint exists because gates swallow "could not check" into "pass". If you could not verify something, name it there rather than omitting it or grading it generously.

**Your verdict is binding. Do not soften a finding because the bundle is otherwise good work, and do not manufacture one because a reviewer is expected to find something.** If the five attacks all come back "not found" and you can say what you checked, `pass` is the honest answer and you should give it.

---

# THE BUNDLE — read it at source; you have a shell and the repository is your workdir

Bundle B5, built in a git worktree detached at `06669fbe`. Two commits:
- `128cf0af` — the seal (the one that would land).
- `51d70d42` — HELD, a separate repair commit, not part of the seal.

The worktree is at the absolute path `C:/Users/Vlad/Desktop/Claude/Projects/WarpOS/.worktrees/b5-seal`.

**Read the diff yourself** rather than trusting any account of it:
```
git -C C:/Users/Vlad/Desktop/Claude/Projects/WarpOS/.worktrees/b5-seal diff 06669fbe..51d70d42 -- scripts/
git -C C:/Users/Vlad/Desktop/Claude/Projects/WarpOS/.worktrees/b5-seal show --name-status 128cf0af
git -C C:/Users/Vlad/Desktop/Claude/Projects/WarpOS/.worktrees/b5-seal show --name-status 51d70d42
```
The three generated manifests are machine-regenerated hash records, not authored content; skip them. You may read any file under the worktree and you may run read-only commands. Do not write, commit or push anything anywhere.

## PRE-STATE — the enforcer at `06669fbe`, BEFORE this bundle existed. Observed exit code: 1.

```json
{
  "status": "blocked",
  "exitCode": 1,
  "coverage": {
    "detector_sha": "8eaec242",
    "M": 88,
    "N": 8,
    "triaged_not_enforced": 1,
    "K": 79,
    "uncorrelated_registry_defects": 3,
    "phrasing": "8 of the 88 sites the detector at 8eaec242 enumerated are under enforcement, 79 untriaged (1 further baseline site(s) are triaged non-enforced [not-a-defect/not-a-gate]; 3 registry defect row(s) have no live-detector counterpart at this sha — see gate-failclosed-registry.json's tool_correlation_note)."
  },
  "regressed": [],
  "checked_repaired_count": 0,
  "new_entrants": [
    "scripts/hooks/ownership-guard.js:146",
    "scripts/hooks/retro-presence-check.js:108",
    "scripts/hooks/retro-presence-check.js:70"
  ],
  "live_files_scanned": 951,
  "live_files_unreadable": [],
  "live_detector_sha": "06669fbe",
  "baseline_detector_sha": "8eaec242",
  "baseline_site_count": 88,
  "registry_row_count": 13
}
```

## THE BUNDLE'S OWN ENVELOPE — its account of itself, to be checked against the code. Never treat it as a description of the diff.

# B5 — SEAL — Envelope

Worktree `.worktrees/b5-seal`, detached, pin `06669fbe`.

## Commits

- `128cf0af` — `build(SP-20260829-001 B5): re-emit the baseline at the current detector, triage the new entrants by read, restore repaired-row correlation` — **the seal**, not held.
- `51d70d42` — `HELD(SP-20260829-001 B5-R): fail-closed repair of ownership-guard.js's outer catch-all, found by B5's new-entrant triage` — **HELD**, separate, pending a ruling on whether it belongs in this phase.

## Every disposition assigned (emitted table, S6-2)

14 registry rows total (13 seeded by B2 + 1 new by B5). Provenance is `manual-by-read` for all 14 (S6-4). Quotes below are truncated to their first clause for table width — full quotes are in `scripts/checks/gate-failclosed-registry.json`'s `decision_semantics_quote` field per row, verbatim.

| site_id | disposition | expected_finding | tool_correlated | quote (first clause, full text in registry) |
|---|---|---|---|---|
| dependency-admission-guard.js:33 | not-a-defect (was: defect) | absent | false | "this gate blocks package.json dependency additions without an admission record — restrictive = block (exit 2)..." |
| edit-watcher.js:674 | not-a-gate (unchanged) | present | false | "a PostToolUse hook fires after the tool action already completed and cannot admit or deny it..." |
| edit-watcher.js:897 | not-a-gate (unchanged) | present | true (→898) | same as above |
| gate-check.js:190 (was :181) | not-a-defect (was: defect) | absent | false | "this gate's decision is \"block builder dispatch if dependency features haven't passed evaluation\"..." |
| gate-check.js:57 (was :48-52) | not-a-defect (was: defect) | absent | false | "ED-379-class: partition ENOENT (store legitimately absent...) from present-but-unreadable/corrupt..." |
| ownership-guard.js:66 | not-a-defect (was: defect) | absent | false | "ED-379-class: existence was already confirmed at the fs.existsSync check above — this is a present-but-unreadable/corrupt store..." |
| ownership-guard.js:144 | **NEW ROW** → not-a-defect (triaged as: defect, then repaired by B5-R same worktree) | absent | false | "this is the OUTER catch, wrapping the entire handler... A malformed hook payload... means ownership could not be verified..." |
| retro-presence-check.js:58 (was :50) | not-a-defect (was: defect) | present | true (→70) | "this is a RUNNER failure (git unavailable/errored), not an absent-input case. Under an explicit enforce flag, a runner failure must block..." |
| retro-presence-check.js:96 (was :81) | not-a-defect (was: defect) | present | true (→108) | "Same governance ruling as the branch-detection catch above..." |
| secret-guard.js:94 | not-a-defect (was: defect) | absent | false | "this catch's only reachable causes are JSON.parse(input) failing (L9)..." |
| version-bump-guard.js:108 (was :101) | not-a-defect (was: defect) | **present** | false | "ED-379-class: shared fail-closed path for this gate's three read/parse failure sites... resolved through the SAME warn/block policy mode..." |
| version-bump-guard.js:171 (was :136) | not-a-defect (was: defect) | **present** | false | same as above |
| version-bump-guard.js:198 (was :160) | not-a-defect (was: defect) | **present** | false | same as above |
| worktree-preflight.js:160 | not-a-defect (was: defect) | absent | false | "ED-379-class: \"Exit 0 = allow, Exit 2 = block\" (this file's own header)..." |

Every "not-a-defect/absent" row above (8 of them: dependency-admission-guard:33, gate-check:57+190, ownership-guard:66+144, secret-guard:94, worktree-preflight:160, and B5-R's own ownership-guard:144 confirmed twice) was verified by **executing** `siteStillPermissive()` directly, not asserted — printed `{checked:true, permissive:false}` for every one. See each row's `b5_note` in the registry for the exact command result.

**The 3 sites the enforcer named as new_entrants at the pin, triaged by read (S6-4, no pre-judged grouping):**
1. `ownership-guard.js:146` (→144 catch-line) — **defect**, real, previously-untriaged, unrepaired (the outer "Graceful failure" catch-all, no ENOENT/absent-input partition, swallows the initial payload-parse too). Old baseline had it untriaged at `:138`; B3's unrelated earlier edit in the same file shifted it to `:146`. Repaired in HELD commit B5-R.
2. `retro-presence-check.js:70` (→58 catch-line) — **not-a-defect**. Same site this registry already tracked at old `:50`, now tool-visible post nested-try-fix, shifted by B3's own repair. B3 already fixed the real defect (enforce-mode silently allowing on a runner failure); the retained `exit(0)` is the intentional advisory-mode fallback (file header, lines 6-11).
3. `retro-presence-check.js:108` (→96 catch-line) — **not-a-defect**, same reasoning, sibling catch.

**Instrument-ceiling disclosure (S6-3), version-bump-guard.js's 3 rows (108/171/198):** these route through a shared `failClosed()` helper that itself still exits 0 under policy mode "warn" (the file's own documented default). The permissive path is *retained by design*, not eliminated — `expected_finding` kept "present", not "absent". This was empirically checked, not assumed: had `171`/`198` instead been marked "absent", `siteStillPermissive()`'s naive 12-line window from those lines spans into an UNRELATED, legitimate `return process.exit(0);` two statements later (line 177, resp. 205) and reports a **false regression** — verified by direct execution:
```
node -e 'require("./scripts/checks/gate-failclosed-enforcer.js").siteStillPermissive(process.cwd(),{file:"scripts/hooks/version-bump-guard.js",line:171})'
→ {"checked":true,"permissive":true,"reason":null}   (false positive, confirmed by read: the actual catch has no exit(0))
```
Not routed around by choosing a non-catch-line `line`; disclosed in the registry row's `b5_note` instead.

## Enforcer's full JSON on the sealed tree (verbatim, B5's own commit 128cf0af)

```json
{
  "status": "ok",
  "exitCode": 0,
  "coverage": {
    "detector_sha": "06669fbe",
    "M": 79,
    "N": 1,
    "triaged_not_enforced": 3,
    "K": 75,
    "uncorrelated_registry_defects": 0,
    "phrasing": "1 of the 79 sites the detector at 06669fbe enumerated are under enforcement, 75 untriaged (3 further baseline site(s) are triaged non-enforced [not-a-defect/not-a-gate]; 0 registry defect row(s) have no live-detector counterpart at this sha — see gate-failclosed-registry.json's tool_correlation_note)."
  },
  "regressed": [],
  "checked_repaired_count": 6,
  "new_entrants": [],
  "live_files_scanned": 951,
  "live_files_unreadable": [],
  "live_detector_sha": "06669fbe",
  "baseline_detector_sha": "06669fbe",
  "baseline_site_count": 79,
  "registry_row_count": 14
}
```
Observed exit code: **0**. (M=79 carries the instrument ceiling stated in `gate-failclosed-audit.js`'s own `CEILING_TEXT` — this is "what the detector at 06669fbe finds," never "the population.") Full file: `runtime/enforcement-sweep/2026-08-29/b5/enforcer-sealed.json`.

**After the HELD B5-R repair (commit 51d70d42, same worktree, informational — not part of the seal):** exit **0**, `M=78, N=0, checked_repaired_count=7, regressed=[], new_entrants=[]`. Full file: `runtime/enforcement-sweep/2026-08-29/b5/enforcer-sealed-b5r.json`.

## S6-6 demonstrations (both by direct CLI execution, printed exit codes, not asserted)

```
$ node scripts/checks/gate-failclosed-enforcer.js \
    --root runtime/enforcer-fixtures/SP-20260829-001/b2-new-entrant-root \
    --registry runtime/enforcer-fixtures/SP-20260829-001/b2-regressed-registry.json \
    --baseline runtime/enforcer-fixtures/SP-20260829-001/b2-fresh-hook-only-baseline.json \
    --base-dir runtime/enforcer-fixtures/SP-20260829-001
→ exit 1, status "blocked", regressed=[{"site_id":"b2-regressed-site.js:11", ...}]

$ node scripts/checks/gate-failclosed-enforcer.js \
    --root runtime/enforcer-fixtures/SP-20260829-001/b2-new-entrant-root \
    --registry runtime/enforcer-fixtures/SP-20260829-001/b2-clean-registry.json \
    --baseline runtime/enforcer-fixtures/SP-20260829-001/b2-empty-baseline.json \
    --base-dir runtime/enforcer-fixtures/SP-20260829-001
→ exit 1, status "blocked", new_entrants=["runtime/enforcer-fixtures/SP-20260829-001/b2-new-entrant-root/fresh-hook.js:12"]
```
Both printed **exit 1**, using the same fixture harness `scripts/checks/gate-failclosed-enforcer.test.js` already exercises (its own `S6-6a`/`S6-6b`/END-TO-END(a)/(b) tests pass unmodified, see below).

## Three test suites, observed counts (node --test, individually, both commits)

| Suite | 128cf0af (B5 seal) | 51d70d42 (B5-R, informational) | Pin (inherited baseline) |
|---|---|---|---|
| `gate-failclosed-audit.test.js` | 28 tests / 27 pass / 1 skip | 28 / 27 / 1 skip | 28 / 27 / 1 skip (unchanged) |
| `gate-failclosed-enforcer.test.js` | 11 / **9 pass / 2 FAIL** | 11 / **9 pass / 2 FAIL** | 11 / 11 pass (see below — expected to change) |
| `b3-fault-injection.test.js` | 10 / 10 pass | 10 / 10 pass | 10 / 10 pass (unchanged) |

**The 2 enforcer-test failures, both in a file this brief marks out-of-scope to edit (`scripts/checks/gate-failclosed-enforcer.js and its test file`), disclosed not hidden:**
- L21-29 `"real registry loads, all 13 rows carry provenance + quote..."` — hardcodes `registry.rows.length === 13`. The brief's own step 2 requires adding a row for the genuine new-entrant defect (`ownership-guard.js:144`); the registry now correctly has 14 rows. This assertion is a stale fact about registry content baked into a locked file.
- L54-59 `"S6-6a control: same check on the REAL registry (nothing marked repaired yet)..."` — hardcodes `checkedRepaired.length === 0`, with its OWN comment already reading `// none of the 13 seeded rows claim expected_finding: absent yet`. The brief's step 3 requires marking B3's repaired rows `expected_finding: "absent"`; there are now 6 (B5) / 7 (B5-R) such rows, exactly as intended.

Both failures are direct, unavoidable, structural consequences of doing the brief-mandated registry work against a test file this same brief forbids editing — not a defect in the seal, not routed around, not silently absorbed. The regression/new-entrant assertions this same test file makes (`S6-6a`, `S6-6b`, END-TO-END a/b/c, both control tests' *regression* assertions) all still pass unmodified — the file's core behavioral claims about the enforcer are intact; only its hardcoded content-count assertions are stale.

## `node scripts/testsuite/enforce.js` — real exit code

Run as its own command both times (never piped through `tail`/`head`):
```
known-baseline reds (tracked debt, NOT release-blocking): BC-26
STALE baseline marker(s) — class no longer failing, remove baseline:"red" so future regressions block again (warning): BC-17
test-suite enforcement: 19/20 runnable green, 0 NEW regressions — canonical clean.
```
Exit code: **0** (both after 128cf0af and after 51d70d42). BC-26/BC-17 are pre-existing, unrelated to this bundle.

## Uncorrelated registry rows remaining

**None.** `uncorrelated_registry_defects: 0` in both enforcer runs (this field only counts `defect`/`contested` rows lacking a tool correlation; after B5-R the registry carries zero `defect`-disposition rows at all — the one that existed, `ownership-guard.js:144`, was repaired same-worktree and reclassified `not-a-defect`). The 3 `version-bump-guard.js` rows and the 2 `retro-presence-check.js` rows are `not-a-defect` with `tool_correlated: false`/`true` respectively — neither state counts as "uncorrelated defect" since neither carries `disposition: "defect"` or `"contested"`.

## What I could not check

- **`scripts/sprint/fs.js`'s repaired sites (B4, ED-380).** B4's own commit (`06669fbe`) names `fs.js:255-268` as one of its 3 repaired could-not-check sites. I read B4's diff to confirm it doesn't reappear in the live scan (it doesn't — `fs.js` has zero findings before or after), but I did not read `fs.js` end-to-end myself; I relied on the live scan's absence plus B4's own commit message. `fs.js` was never a `gate-failclosed-registry.json` row (out of this registry's 13-seed scope) so this bundle does not carry a disposition for it either way — named here so the gap is visible, not silently folded into "checked."
- **The symlink-guard skip in `gate-failclosed-audit.test.js`** (`blindness guard 1b`) — inherited, unchanged, unassessable on this machine/permission set; not this bundle's to fix, re-confirmed still skipping (not newly failing).
- **Whether `ownership-guard.js:144`'s repair (B5-R) is the right phase for this work** — that is exactly why it's HELD and not squashed into the seal; I did not decide this for the ruling, only prepared the repair to the same demonstrated standard as B3's.
- **`checkFoundationDeps`/`checkDeps` and every other of the 75 `K`-bucket untriaged baseline sites** — not read, not dispositioned, correctly reported by the enforcer as untriaged, not silently counted as clean. This bundle's scope was the 3 named new entrants plus the 13 seeded registry rows, not a full re-triage of the baseline.
