# Lane E3 — raw returned text, verbatim

> Captured by the conductor from the harness transcript
> (`tasks/a34e63055bcb9f731.output`, 111 rows, 329519 B), final assistant text, 9310 B.
> This lane hit a 20-turn ceiling at 06:05:01Z and was RESUMED at 06:05:20.174Z; it is not
> a single-pass run. Original spawn 06:02:33.770Z, final message 06:08:39.367Z.

Tree clean, pin unchanged. Emitting the verdict.

```
{"verdict":"fail"}
```

## E3 — fixtures exist; teeth are real except one guard that half-lies

**Pin measured by me:** `git rev-parse HEAD` → `c88aac1df718fc0772c16b6e428130a095549a6c` (`c88aac1d`), matching `QUALIFYING_PIN`. Content markers verified independently: baseline `purpose` opens `SUPERSEDED by \`b6_correction_of_purpose\``; registry has **16** rows, exactly two `contested` (`version-bump-guard.js:183`, `worktree-preflight.js:30`). Every result below was run by me at this commit; nothing is carried forward.

**Why `fail`:** not a missing fixture, and not a stale re-run. One test I checked **lacks teeth on half of what its name asserts**.

### The finding — `blindness guard 2` is half-decorative

The test is named *"unreadable/**malformed** settings.json yields wired='unknown', never collapsed to false"*. `getWiredStatus` has two independent `return "unknown"` branches: unreadable/missing (line 600) and malformed-JSON (line 605).

| Mutation | Landed? (diff) | Observed |
|---|---|---|
| line 600 unreadable → `return false` | yes | suite **exit 1**, 26 pass / 1 fail — guard-2 fails. Teeth. |
| line 605 malformed → `return false` | yes | suite **exit 0**, 27 pass / 0 fail — **nothing fails.** No teeth. |

Cause, read from the test body (L276-281): it points at a directory with **no** `settings.json` and asserts once. It never feeds malformed JSON. The malformed branch — the one whose own code comment says *"never collapse into 'false'"* — is asserted by the test's **name only**. A fixer could collapse it and stay green.

I nearly mis-reported this: my first attempt at the 605 mutation silently did not match (line 604 is `} catch (e) {`), and the resulting exit 0 looked like a teeth failure. I caught it by echoing the line and diffing, then re-ran. **An unlanded mutation and a toothless test are indistinguishable from the exit code alone** — every mutation above is diff-confirmed as landed.

### Mutations I RAN — all at `c88aac1d`, all restored

| # | Mechanism neutralised | Observed | Teeth |
|---|---|---|---|
| M1 | `analyzeSource` → `return []` (no-op) | audit **exit 1**, 20 pass/7 fail; all 4 `fn-` fail | yes |
| M2 | `analyzeSource` → flag-everything | audit **exit 1**, 21 pass/6 fail; all 4 `fp-` fail | yes |
| M3 | `siteStillPermissive` → `permissive=false` | enforcer **exit 1**; `S6-6a` + `END-TO-END (a)` fail | yes |
| M4 | `newEntrants` → `[]` | enforcer **exit 1**; `S6-6b` + `END-TO-END (b)` fail | yes |
| M5 | secret-guard catch `exit(2)`→`exit(0)` (fail-open) | b3 **exit 1**; secret-guard malformed-payload test fails | yes |
| M6 | `cleanSource` → `return src` (no masking) | audit **exit 1**; `fp-string-literal` + cleanSource test fail | yes |
| M7 | `getWiredStatus` malformed → `false` | audit **exit 0** — **no test fails** | **NO** |
| M8 | `getWiredStatus` unreadable → `false` | audit **exit 1**; guard-2 fails | yes |

The no-op guard mattered here in both directions: **M1 alone would have "proved" the 4 `fp-` fixtures fine**, since a detector returning `[]` satisfies every `expected:false` assertion by absence. Only M2 (flag-everything) tests them. Each `fp-`/`fn-` fixture has teeth **only against the mutation direction that opposes it** — that is genuine, but it means neither half of the battery alone constrains the detector.

**Unmutated baselines I measured:** audit 28 tests / 27 pass / 0 fail / **1 skip**; enforcer 11 / 11 / 0 / 0; b3 10 / 10 / 0 / 0. All three exit 0.

**`not-reached` (never "passing"):** `blindness guard 1b: a dangling symlink…` — **skipped** on this machine (cannot create symlinks). It exits 0 inside a green suite; per the brief I do not inherit that convention. It is an **unverified** guard.

### derivation_rule

**Question A (executed fooling inputs).** Rule: the fixtures a suite loads from `runtime/enforcer-fixtures/SP-20260829-001/` and asserts against, enumerated from the suites' own source plus `git ls-files`. Members: `fn-nested-brace.js`, `fn-long-handler.js`, `fn-spacing-variant.js`, `fn-quoted-reordered-key.js`, `fp-string-literal.js`, `fp-method-named-catch.js`, `fp-unreachable-after-throw.js`, `fp-false-value.js`, `nt-both-permissive.js`, `b2-clean-registry.json`, `b2-empty-baseline.json`, `b2-fresh-hook-only-baseline.json`, `b2-regressed-registry.json`, `b2-regressed-site.js`, `b2-new-entrant-root/fresh-hook.js`, `b3-fault-injection.test.js`. **All 16 are git-tracked at this pin** — no fixture is missing, and each of the 8 `fn`/`fp` carries a live `oldNaiveDetect` discrimination assertion proving it still fools the old predicate at *this* build.

**What that rule does NOT reach:** inputs executed during diagnosis that were **never promoted to a file**. I grepped `runtime/enforcement-sweep/2026-08-29/` for `fn-|fp-|nt-` filenames and got **zero hits** — the sprint's prose records do not enumerate the probe inputs at all. So I can confirm every *committed* fixture exists and discriminates; **I cannot rule out a probe input that fooled the scanner and was never written down.** A bounded search supports my positive finding and cannot support a negative one. What would find it: the B1/B2 builder transcripts or the original probe script, neither of which is in the evidence tree I can see.

**Question B (tests checked).** Rule: every test in the three named files, mutated at the mechanism it names. I mutated 7 distinct mechanisms covering the detector core, both enforcer failure modes, and 1 of the 10 b3 hooks.

### what_i_could_not_assess

- **9 of 10 b3 fault-injection tests** — I mutated only `secret-guard.js`. `gate-check.js` (×2), `worktree-preflight.js`, `dependency-admission-guard.js`, `ownership-guard.js:66`, `retro-presence-check.js:50`, `version-bump-guard.js` (×3) are **not-reached**, not passing. Each guards a *different* hook's fail-closed path; M5's teeth say nothing about them.
- `blindness guard 1` (zero-files → exit 2), the `runAudit` real-repo self-scan, `computeCoverage`, and the enforcer's registry-provenance loader validations (`loadRegistry` throws) — not mutated.
- The symlink guard (skipped, above).
- I did **not** run `node scripts/testsuite/enforce.js`; per the envelope its exit 1 is a property of this checkout and out of scope. No count here comes from it.

### files_i_could_not_see

`gate-failclosed-audit.js` (698 lines) — I read L513-540 and L594-612 end to end and sampled the rest by grep; `findCatchHandlers`, `analyzeHandler`, `parseTopLevelProps`, `matchDelim` I treated as black boxes exercised through `analyzeSource`. `gate-failclosed-enforcer.js` L1-120 read fully, L120-248 sampled by grep. `b3-fault-injection.test.js` (13.9k) — read only the 10 test names from its run output, never the bodies; **my M5 attribution rests on the test name plus the observed failure, not on reading its assertions.** A window into a structured region is not that region.

### execution_proven

M1-M8 were **executed**, each with a diff confirming the mutation landed, each followed by an immediate `cp`-restore and a `git status --porcelain --untracked-files=all` check. Nothing above is a reasoned prediction. The one thing I *reasoned* rather than ran: that the 9 unmutated b3 hooks probably behave like secret-guard — **that is not a teeth check and I do not claim it.**

### what_would_confirm_or_refute

For the M7 gap: add an assertion to guard-2 that writes a `settings.json` containing invalid JSON and asserts `"unknown"`; with line 605 collapsed to `false` that assertion must fail. If it still passes, my finding is wrong. For the 9 unreached hooks: repeat M5's shape per hook (flip its catch's `exit(2)`→`exit(0)`) and confirm exactly one b3 test fails each time.

### read_outside_the_quoted_region

Yes — the envelope named the sprint evidence dir under the repo root, which my scope contract forbids. I read the **committed copy inside my own checkout** (`runtime/enforcement-sweep/2026-08-29/`) instead: `REPORT.md`, `CORRECTIONS.md`, `b6/ARTIFACT-CHECK.md` (grep windows). I touched no other worktree and no path under the repo root except the brief itself.

### tree_state_on_exit

**Restored and verified clean.** `git status --porcelain --untracked-files=all` is empty; `git rev-parse HEAD` is still `c88aac1d`. Restores were incremental — after every single mutation, never batched. Post-restore I re-ran the audit suite to 27 pass / 0 fail / 1 skip, matching the baseline. I committed nothing, pushed nothing, and checked out nothing. Backups live outside the repo in the session scratchpad.

**Constraint I worked under:** the harness blocks `node -e` full-file writes and the `Edit` tool is disabled this session, so all mutations were made with `sed -i` plus an explicit diff to prove each landed — which is what caught the unlanded M7.

**Premise check:** the brief's warning that fixtures would be pinned to an earlier commit **did not reproduce here.** The `oldNaiveDetect` discrimination assertions re-execute against the current build every run, so the fixtures are re-proven at this pin by construction, not by a carried-forward record. The failure this lane found is a different one: a guard whose *name* covers two branches and whose *assertions* cover one.
