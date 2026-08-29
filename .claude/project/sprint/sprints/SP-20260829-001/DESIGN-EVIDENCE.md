# SP-20260829-001 — DESIGN-PHASE EVIDENCE

**Status: design IN PROGRESS, blocked at the β plan→design gate on scope (Q1) and the audit's
blocking mode (Q3). No builder dispatched. No code changed.**

Tree: `session/2026-08-29` @ `8d15c162`. Every claim below was read from the repo at that commit.
Probes are committed and re-runnable: `probe-failopen.js`, `triage-failopen.js` (both in this
directory; both exit 2 on a zero enumeration rather than reporting "clean").

---

## 1. The four sweep-named sites — VERIFIED, with one correction to the sweep

| site | wiring | verified shape |
|---|---|---|
| `scripts/hooks/gate-check.js` | PreToolUse:Agent | `loadStore()` L48-52 catches ENOENT **and** parse error into one `null`; consumed L153-158 → WARN + `exit(0)`. Separately L181-182 bare `catch { process.exit(0) }` over a 38-line try. |
| `scripts/hooks/gauntlet-gate.js` | PreToolUse:Agent | L87-93 absent store → WARN + exit 0. **L219-224 outer catch is ALREADY fail-CLOSED** ("infrastructure errors block dispatch"). |
| `scripts/hooks/tracker-completion-gate.js` | Stop:* | L69 `if (!res) process.exit(0)` inside the catch around `execFileSync(validate.js --json)`. `ENFORCE` (L31) is read only at the FINAL exit L84 → a crashed validator exits 0 **even under `TRACKER_GATE_ENFORCE=1`**. |
| `scripts/sprint/design.js` | CLI (not hook-wired) | L193-194 `catch { return { ok: true } }` wrapping the R-id trace-integrity check whose own body (L181-192) returns a detailed `ok:false`. |

**CORRECTION carried into every downstream brief.** The sweep report's headline sentence —
*"gate-check.js and gauntlet-gate.js: corrupt store == absent store → allow"* — is **true of
gate-check.js and false of gauntlet-gate.js**. gauntlet-gate has only the absent-half; its parse
path already blocks. Briefing the uncorrected sentence would have had a builder "fix" a path that is
already correct, and would have shipped a false sentence in a sprint about false sentences.

**The positive shape to copy** (`scripts/enforcement/ed-dup-id-lint.js` L42-47): ENOENT → printed
`SKIP` + exit 0; anything else → `exit(2)`. A second in-repo example, in the very file ED-356 is
about: `scripts/hooks/merge-guard.js:302` already fails CLOSED on a crashed `doc-ref-integrity`
runner ("runner crashed (exit=…) — fail-closed"). The framework already knows how to do this in two
places; the defect is that it is not done uniformly.

## 2. The population — ε's stated unsafe assumption, now MEASURED

`assumptions.unsafe` in PC-20260829-0087 said the four sites almost certainly do not exhaust the
class. Measured over **307 non-test files** in `scripts/{hooks,checks,enforcement,sprint,dispatch}`:

- **65 terminal-decision fail-open sites** (a `catch` reaching `process.exit(0)` or
  `return { ok: true }`) across **47 files**.
- **64 distinct scripts are hook-wired in `.claude/settings.json`; 45 of them carry ≥1 such site.**
- Directory split: `scripts/hooks` 64, `scripts/sprint` 1.

The raw shape (including tests and per-item loop skips) is **364 hits across 111 files** — which is
the evidence that **a write-time lint is the wrong mechanism.** ED-369's third candidate enforcer
proposes exactly that lint; this sprint should say so rather than build it.

## 3. Triage — evidence, not verdicts

`triage-failopen.js` extracts per site: does the file have any blocking path at all (a "gate" with no
blocking path is not a gate); is there a justifying comment; how wide is the swallowed `try`; is it
live-wired and on what event.

- sites in files that have a blocking path (gate-like): **18**
- sites with no justifying comment nearby: **33**
- sites whose `try` spans > 40 lines (wide swallow): **21**
- **highest-concern slice — live-wired AND blocking-path AND no justifying comment: 12**

The 12: `dependency-admission-guard.js:33` · `edit-watcher.js:674,897` · `gate-check.js:181` ·
`ownership-guard.js:66` · `retro-presence-check.js:50,81` · `secret-guard.js:94` ·
`version-bump-guard.js:101,136,160` · `worktree-preflight.js:160`.

**Four read closely, and they land in three different categories** — which is why the count must
never be reported as a defect count:

1. **Real defect.** `secret-guard.js:94` — the outer `catch { process.exit(0) }` spans **86 lines**,
   wrapping the file read *and* the credential pattern loop. An unreadable/throwing target file
   means the credential scan silently permits the write. No justifying comment. Unfiled anywhere.
   Same shape as ED-369, on a security control, found inside the sprint scoped to fix ED-369.
2. **Documented and defensible.** `untrusted-content-firewall.js:44` ("infra, not a content threat");
   `format.js:70` ("formatting failure shouldn't block work").
3. **Fail-open IS fail-safe.** `authorization-gate.js:390` wraps a decision that *grants* elevated
   permission (turbo); failing open means NOT granting it. Repairing this would make the system less
   safe. Any mechanism that treats the shape as the defect gets this one backwards.

## 3b. The 12 high-concern sites, ALL READ — and the structural root

All twelve are now read (not sampled). **Nine are real defects; three are defensible.** More
importantly, the nine are not twelve unrelated bugs — they are **three named sub-shapes**, which is
what makes a general fix possible without a noisy lint:

> ⚠️ **VARIANT A'S MECHANISM AS STATED BELOW IS SUPERSEDED — see §6c-bis.** `process.exit(2)`
> *terminates* rather than throws, so the `catch` never intercepted the decision. The mechanical test
> **"no catch may span both" is WITHDRAWN and must not be built.** β endorsed that test by name at
> row 323 §5 and has withdrawn the endorsement (row 326, `f3d82b45`).
>
> **THE PROPERTY THAT REPLACES IT — β's corrected wording, row 326, adopted VERBATIM:**
>
> > **Every failure on a path the decision depends on must terminate on the restrictive side of that
> > gate's own decision — never at a permissive outcome reached by having skipped the decision.**
> > *(Pre-decision failure kinds seen so far include payload parse, store read, validator run and
> > discriminator read; the list is illustrative, not definitional.)*
>
> My own first replacement — *"every pre-decision failure path terminates non-zero"* — **is withdrawn**
> and had two defects β named: it **re-breaks category 3** (`authorization-gate.js:390` is a *grant*
> gate, where a pre-decision failure SHOULD exit 0, so "terminates non-zero" would flag as a defect the
> case we established makes the system less safe — the polarity qualifier had gone missing), and it
> **enumerates inside a property** (naming four failure kinds definitionally, so a fifth — an env read,
> a clock, a network call, a `require` — escapes it: AP-19 in the sentence meant to replace an
> enumeration).
>
> The site list and every disposition below are unaffected. Left in place rather than rewritten so the
> error and its correction are both on the record.

**Variant A — ONE catch spans both the infra-parse and the policy evaluation.** The defensible
reason for failing open on a malformed *hook payload* silently licenses failing open on the *guarded
decision*, because both live under the same `catch`.
- `secret-guard.js:94` (86-line try wrapping the file read AND the credential loop)
- `worktree-preflight.js:160` (41 lines, wraps the blocking smoke-marker `exit(2)`)
- `retro-presence-check.js:81` (36 lines, wraps the `--enforce` `exit(2)`)
- `dependency-admission-guard.js:33` (wraps `checkPackageEdit` and its `exit(2)`)
- `version-bump-guard.js:101` (wraps the ENTIRE `run()` — every blocking path in the file)
- `gate-check.js:181` (38 lines)
- `edit-watcher.js:897` (whole module body)

**Variant B — ENOENT and corrupt conflated on a REQUIRED input.** The literal ED-369 shape, and it
has more instances than the sweep found:
- `gate-check.js` `loadStore()` L48-52 — the sweep's own finding
- `version-bump-guard.js:136` — `version.json` unreadable → allow commit
- `ownership-guard.js:66` — store unreadable → allow; and L58-59 documents only the ABSENT half
  ("No store = can't enforce ownership, allow"), so the corrupt half is undocumented as well as wrong
- (`gauntlet-gate.js` L87-93 has the absent-half only; its corrupt path already blocks)

**Variant C — "cannot DETERMINE applicability" treated as "not applicable".** A discriminator read
fails, so the gate concludes there is no obligation:
- `retro-presence-check.js:50` — `git branch --show-current` fails → exit 0, so no retro obligation
- `version-bump-guard.js:160` — `git diff --cached` fails → treated as nothing staged

This is exactly the line the product-lead consult drew unprompted: *"SKIP is allowed only when the
invocation is provably outside the check's declared applicability."* A failed discriminator is not a
proof of non-applicability.

**Defensible (3 of 12):** `edit-watcher.js:674` (narrow hook-payload parse on a PostToolUse
observer), `ownership-guard.js:66`'s absent-half *as documented*, and the narrow
`version-bump-guard.js` bypass sentinels (which are explicit, logged operator bypasses, not silent).

**The three remedies follow from the three variants, and generalize:**
- **A** → split the catch: payload parse in its own narrow `try` (fail-open, documented); policy
  evaluation OUTSIDE it (fail-closed). Mechanically checkable: no `catch` may span both.
- **B** → partition ENOENT from every other error at each required-input read — the
  `ed-dup-id-lint.js` shape, already in-repo.
- **C** → a failed discriminator read is FAIL-CLOSED, never "not applicable".

**Coverage honesty:** 12 of 65 sites are read. **53 remain untriaged.** The three variants are
derived from 12 sites and I do not claim they exhaust the population's shapes — a thirteenth site
could present a fourth variant. What I can say is that the twelve highest-concern sites, selected by
a stated mechanical filter (live-wired AND has-a-blocking-path AND no-justifying-comment), contain
no shape outside these three.

## 4. The three carried ED premises — RE-VERIFIED (were `asserted_from_ed_row`)

The plan contract flagged these as unverified and required the design phase to re-verify before any
brief asserts them. All three hold at `8d15c162`:

- **ED-374 (1)** — `scripts/checks/security-pass-count.js`: `--strict` gates the runtime assertion
  (L111 parse, L157 `if (warns.length && strict) return 1`), and `.claude/commands/scan/full.md:129`
  invokes it **without** `--strict`. L79 `if (!sec.length) return warns` — zero reviews asserts
  nothing. CONFIRMED.
- **ED-374 (2)** — `scripts/checks/coverage-gate-scan.js:21`: "RAMP: REPORT-ONLY this sprint — it
  reports gaps and ALWAYS exits 0". No machine-readable flip trigger or flip date. CONFIRMED.
- **ED-356** — `scripts/checks/doc-ref-integrity.js:66`
  `const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname,"..","..")` — it scans the
  WarpOS canonical root regardless of which tree is being committed; `merge-guard.js:278` invokes it
  `--enforce` on commits. CONFIRMED.
- **ED-363** — `scripts/dispatch-claude.js:319`
  `promptStr = promptArg === "-" ? readFileSync(0) : readFileSync(promptArg)` — the prompt is passed
  through **verbatim**; no ENVIRONMENT header is prepended and no preflight compares a brief's
  asserted cwd against `runCwd`. The wrapper computes `runCwd` (L415-420, L466) and stamps it on the
  completion record (L789) but never tells the builder. CONFIRMED (absence proved by reading the
  prompt-construction path, not inferred).

## 5. The record-trust gate — APPLICABLE, and this is where it bites

ε's design-phase record-trust gate applies: these gates are readers that trust a record (a store
file, a validator's JSON) to admit an irreversible action (builder dispatch, session end).

1. **Single choke-point + structural guard.** Proposed: one shared `readGateInput()` that returns a
   three-way discriminated result (`PASS`-eligible / `SKIP` with a stated applicability reason /
   `FAIL-CLOSED` with a reason), plus a guard that fails any registered gate reading its input
   outside it. Un-routed readers must fail, or the choke-point is advisory.
2. **Partition the surface.** Same-session (store files this session wrote) vs cross-session (a
   validator subprocess, a ledger another session appended). The Stop-hook case is cross-session and
   is the one where fail-closed has real operational cost.
3. **Adversarial falsifier fixtures, required-present, BEFORE build.** One per repaired site:
   truncated JSON, unreadable file (permission), an injected throw, and — for the Stop hook — a
   crashing and a timing-out validator. Each must be observed RED against the OLD code and GREEN
   against the new; a fixture never observed failing proves nothing.
4. **Named enforcer.** The enumerating audit is that enforcer. Whether it ships blocking is β Q3.

## 6. Open, and NOT mine to close

- **β Q1** — scope. Both plan consults said cut below the briefed minimum; my stake points the same
  way, so I will not self-rule.
- **β Q3** — blocking vs report-only, now load-bearing rather than a detail: blocking over the live
  population reds `/scan:full` on up to 45 files this sprint cannot triage; report-only instantiates
  ED-374. A third path exists (blocking over a declared registry seeded with only the triaged sites,
  untriaged population reported as a counted residual) but that is a criteria decision.
- **Lane concurrency** — the team lead holds `[S05 β-auth] q3`.
- **Build authorization** — the team lead's, not mine.

## 6b. CONDUCTOR-SIDE DEFECTS in this sprint's own conduct — recorded, not quietly corrected

Two of mine, both caught by others, both the class this sprint is about. Recorded here because a
correction that leaves no trace teaches nothing.

**(1) BRIEF-PRIMING — the framing shaped what the gate saw (AP-15/P-097 shape).** I told β "neither
consult was primed with a preferred scope." **That was false.** α checked and found it: my
director-of-product brief line 79 says *"Push back if `recommended` is the overbuild reflex"* and my
product-lead brief lines 81-82 ask *"what would you cut first?"*. Both frame toward narrowing — the
answer I wanted and had a stake in. β had flagged exactly this as the falsifier on its Q1 verdict
(*"'Neither was primed' is your account, and it is the load-bearing premise of the whole Q1 answer"*)
and the falsifier **fired**. The consults' *reasoning* still holds independently (both argued from
"enumerate the registered population", without knowing the population was 65 across 45 live files),
so the substance survives; but Q1's ratification now rests on α's merits ruling, **not** on my
priming claim. I do not get to keep the credit for an unprimed consult I did not run.

**(1b) THE PRIMING FINDING IS NOW CONFIRMED BY AN INDEPENDENT LANE, WITH QUOTED LEXICAL REUSE.**
The cross-family verification lane (`d-mteuu4h3-81080e69`, gpt-5.6-sol) read both briefs AND both
consult envelopes — envelopes **nobody had read before**, including β. Its verdict, verbatim:

> *"Verdict: both answers visibly followed the briefs' narrower-scope framing. They added substantive
> reasoning, but their decisive scope grounds were supplied by the prompts. The conductor's claim that
> neither consult was primed with a preferred scope is not supportable."*

The evidence it cites is lexical and causal, not impressionistic:
- My DoP brief line 79-80 — *"Push back if `recommended` is the overbuild reflex — three of the four
  extra items are different failure shapes"* — returns in the answer as *"They are … different failure
  **classes**"*. My supplied Lane-A-awaiting-authorization framing (brief lines 62-63) returns as
  *"Bundling them … threatens Lane A's schedule"*, i.e. my own scheduling cue used as a reason to
  reject `recommended`.
- Worse for the product-lead consult: my brief line 64 **supplied the hierarchy** —
  *"R-1..R-3 are the core. R-4 and R-5 are the `recommended` scope's additions"* — and the answer
  returns *"Keep R-1 through R-3 as the release slice"* and *"Ship the smallest coherent slice: R-1,
  R-2, and R-3"*. The conclusion was in the question.
- It credits both with genuine added work (acceptance criteria, the R-5 split, the Stop-hook judgment)
  but finds those additions *"reinforce a narrowing conclusion already cued by the brief"*.

**Disposition: BOTH PLAN CONSULTS ARE STRUCK AS EVIDENCE.** They do not support the narrowing, and —
per β — contaminated support for a conclusion is **not** support for its negation either, so they do
not support bundling. **The scope decision rests solely on α's merits ruling and β d0c5b2e7 §1**,
which were reached on grounds neither I nor the briefs authored.

**(2) FALSE MECHANISM IN AN ED FILING — inaccurate disclosure of a real gap (P-110/AP-17).** I
reported `secret-guard.js:94` as *"the outer catch wraps the entire scan including the file read, so
an unreadable target file silently permits the write."* **There is no file read in that file at all**
— `grep -n "readFileSync\|readFile\|fs\." scripts/hooks/secret-guard.js` returns zero lines;
`content` comes from the hook payload at L11-12. β caught it; I then verified β's correction against
the source myself rather than taking it. The **actual** mechanism is `JSON.parse(input)` at L9
throwing into `catch { process.exit(0) }` at L94-95, permitting the write unscanned. The conclusion
survives (a credential control converting could-not-check into permit, ED-369 class); the description
did not — and the description is what a builder would have implemented, wrapping a read that does not
exist while the real throw path stayed open. **ED-379 was filed on my false mechanism and needs
amending.** Severity per β, discriminator first: HIGH by class (the guard genuinely does not guard and
reports nothing), with reachability stated honestly alongside — the trigger is a malformed
harness-generated payload, not demonstrably attacker-reachable; the low reachability does not
downgrade the class and the class does not make it a live exploitable hole.

Fix polarity for that site: an unparseable payload on a credential guard is **could-not-check** and
must fail closed; the absent-input path (L15 `!filePath || !content`) and the `.env` skip (L18) are
**nothing-to-check** and must stay exit 0 — the same partition as `tracker-completion-gate.js` L48 vs
L69.

**Both are the sprint's own thesis committed by its conductor**: (1) is a claim whose frame was wrong
while its data was right; (2) is an accurate finding wrapped in an inaccurate mechanism. That is
S4-1a's shape and S-VLADW1-05 exists to end it — landing in lane B, inside the sprint scoped to fix
the same family.

## 6c. PER-SITE DISPOSITION TABLE (β d0c5b2e7 §2 — gates the registry seed)

β blocked the registry seed because my variant lists enumerated twelve sites while I reported
"nine defects / three defensible", and the three were unmarked. **β was right, and the reconciliation
found two errors of mine plus a defect in my own extractor.** Every number below is derived from this
table. No number in any artifact of this sprint is typed.

**Discriminator (β's property, not a category list):** *does the error path land on the PERMISSIVE or
the RESTRICTIVE side of the decision THIS gate makes?* A file with no blocking path makes no decision
and is therefore not a gate.

**Blocking-path verification, per file** (`grep -c 'process\.exit(2)'`): dependency-admission-guard 1 ·
gate-check 1 · ownership-guard 1 · retro-presence-check 1 · secret-guard 1 · version-bump-guard 1 ·
worktree-preflight 1 · **edit-watcher 0**.

| # | site | disposition | variant | justification — quoting this gate's own decision semantics |
|---|---|---|---|---|
| 1 | `dependency-admission-guard.js:33` | **defect** | A | Decision: `decision:"block"` + `exit(2)` when a package.json edit adds deps with no admission record. The catch spans `checkPackageEdit` **and** that decision → error = dep admitted. Permissive. |
| 2 | `edit-watcher.js:674` | **not-a-gate** | — | **`grep -c 'process.exit(2)'` = 0.** Every exit is `exit(0)`; PostToolUse observer. The `"deny"` my extractor matched is a *string literal inside the `BEHAVIORAL_KEYWORDS` array* (L276), not a decision. No permissive/restrictive side exists. |
| 3 | `edit-watcher.js:897` | **not-a-gate** | — | Same file, same reason. |
| 4 | `gate-check.js:181` | **defect** | A | Decision: `exit(2)` "BLOCKED: Builder for X cannot start" on unmet deps. A 38-line try wraps that decision → any throw = dispatch allowed. Permissive. |
| 5 | `ownership-guard.js:66` | **defect** | B | Decision: `exit(2)` at L135. `JSON.parse(readFileSync(storePath))` → `exit(0)`; ENOENT and corrupt take the same path, and the comment above documents only the ABSENT half ("No store = can't enforce ownership, allow"). Permissive on the undocumented half. |
| 6 | `retro-presence-check.js:50` | **defect** | C | Decision: `exit(2)` under `--enforce`/`RETRO_ENFORCE`. `git branch --show-current` fails → `exit(0)`, concluding *no retro obligation*. Failure to DETERMINE applicability rendered as not-applicable. Permissive. |
| 7 | `retro-presence-check.js:81` | **defect** | A | Outer catch spans 36 lines including the `if (enforce) process.exit(2)`. Permissive. |
| 8 | `secret-guard.js:94` | **defect** | A | Decision: `exit(2)` "BLOCKED: File contains a <secret>". An 86-line try wraps `JSON.parse(input)` (L9) **and** the pattern loop **and** that decision → a malformed payload permits the write unscanned. Permissive. **ED-379** (mechanism corrected: the throw source is L9's parse, NOT a file read — this file contains no file read). |
| 9 | `version-bump-guard.js:101` | **defect** | A | Catch wraps `run(JSON.parse(input))` — i.e. the ENTIRE decision function including its `exit(2)`. Permissive. |
| 10 | `version-bump-guard.js:136` | **defect** | B | `version.json` unreadable → `return process.exit(0)`; ENOENT and corrupt conflated on a required input. Permissive. |
| 11 | `version-bump-guard.js:160` | **defect** | C | `git diff --cached --name-only` fails → `exit(0)`, treated as *nothing staged*. Cannot-determine rendered as not-applicable. Permissive. |
| 12 | `worktree-preflight.js:160` | **defect** | A | Decision: `exit(2)` "BLOCKED: No worktree smoke test this session". A 41-line try wraps it. Permissive. Note the same file handles a narrow git failure CORRECTLY at L131-133 (inner try, documented non-blocking) — the wide outer catch is the defect, not the pattern. |

**Derived from the table:** high-concern filter output **12** · not-a-gate (filter false positives)
**2** · defects **10** · variant A **6**, variant B **2**, variant C **2** (6+2+2 = 10).

### THREE DENOMINATORS ARE LIVE. All three stated, with what moved and why (S6-2)

β caught that my reported figures changed between messages without remark, which is the S6-2 class
happening inside the note celebrating S6-2. Recorded rather than absorbed:

| figure | denominator | source | status |
|---|---|---|---|
| **9 defects / 3 defensible** | 12 filter-output sites | §3b as first written (commit `3cd44fb9`) | **WITHDRAWN — never derived** |
| **10 defects / 2 not-a-gate** | 12 filter-output sites | §6c table | current, derived from the table |
| **11 defects / 2 not-a-gate** | 13 sites | lane A2's instrument | correct for A2's denominator |

**What moved, 9/3 → 10/2 — and the honest answer is that the 9/3 was never derivable from my own
document.** §3b simultaneously listed **twelve** sites across variants A(7) + B(3) + C(2), *all
presented as defect variants*, **and** asserted "nine are real defects; three are defensible" — 15
dispositions over 12 sites. The two statements contradicted each other, which is exactly why β
blocked the registry seed on it.

Reconstructing from `git show 3cd44fb9`, the named "**Defensible (3 of 12)**" were
`edit-watcher.js:674`, *"`ownership-guard.js:66`'s absent-half as documented"*, and *"the narrow
`version-bump-guard.js` bypass sentinels"*. **Only the first is a population member.** The second is a
**sub-path of a site I simultaneously classified a defect**; the third names **explicit early returns
that are not `catch` sites at all** and were never in the 65. So two of the three "defensible" were
not sites, and the sites they notionally covered were already inside the defect list. Separately,
`edit-watcher.js:897` — counted a defect under variant A — was reclassified **not-a-gate**. Net: +1
defect, and a "defensible" bucket that dissolves into "not-a-gate ×2".

**So the movement is not a reclassification story: it is an underived assertion being replaced by a
count derived from an emitted table.** That is the whole argument for emitted sets, demonstrated
against my own numbers. And 10/2-over-12 vs A2's 11/2-over-13 is a third, separate thing — a
denominator difference (`gate-check.js:48-52`, carried outside the probe population), not a
disagreement; A2 named it itself and its dispositions match mine exactly.

**None of these three numbers may travel without its table.**

### Two errors of mine that β's block surfaced

1. **"nine defects / three defensible" was wrong.** The correct figures are **10 defects and 2
   not-a-gate**. My three "defensible" were mis-derived: `edit-watcher:674` is not defensible but
   *not-a-gate*; `ownership-guard:66`'s absent-half is a **sub-path of a site I simultaneously
   called a defect**, not a separate site; and the `version-bump-guard` bypass sentinels are
   explicit early returns, **not `catch` sites at all** and never population members. I counted
   sub-paths and non-members as if they were sites.
2. **My variant B listed `gate-check` `loadStore` (L48-52), which is NOT a member of the 65.** Its
   catch returns `null`, not `exit(0)`, so the probe's pattern never matched it. It is a real defect
   (the sweep's original finding, verified by β at source) and it IS a repair target — but it must be
   carried as an **in-scope repair outside the enumerated population**, not smuggled into a variant
   list as though the probe had found it. Repair set = 10 population members + `gate-check` loadStore
   = **11 sites**, and the two figures must never be merged into one number.

### A defect in my own extractor — load-bearing, because it is the audit's ancestor

`triage-failopen.js`'s `has_blocking_path` predicate is
`/process\.exit\(2\)/ || /"deny"|'deny'|permissionDecision/ || /return\s*\{\s*ok:\s*false/` over raw
source. On `edit-watcher.js` it matched the **string `"deny"` in a keyword-list array** and declared
a file with zero blocking paths to be gate-like. **A shape predicate matched text where semantics
were required** — the same class this sprint exists to close, inside the instrument built to find it.

The audit enforcer must not inherit this. Its "is this a gate" test must be a real blocking-path
determination (at minimum `process.exit(2)` / an emitted block decision outside a data literal), and
it needs a near-miss fixture in which a keyword-shaped **string literal** must NOT register as a
blocking path.

### Standing conditions honored here

No typed counts: every figure above is derived from the table. The 53 untriaged sites are to be
**emitted by name** (the probe emits them; no "counted residual" phrasing anywhere). β has read 4 of
the 12 and none of the other 53 — **this table is my account and is owed an independent lane re-read
BEFORE the registry is sealed** (β d0c5b2e7 §6), which is the right order precisely because I author
both the registry and the enforcer that reads it.

## 6c-bis. INDEPENDENT RE-READ OF THE DISPOSITIONS — A2, and a mechanism correction it forced

Lane A2 (`d-mtevftkp-f2166a8f`, cabinet/gpt-5.6-sol, `ok:true`, 380591 ms, all four ED-377 fields
present) fixed its thirteen dispositions in Phase 1 before being shown §6c.

**DISPOSITION DISAGREEMENTS: NONE.** All thirteen match.

**The count reconciles exactly, and A2 named the framing difference itself:** it reports **11 defects /
2 not-a-gate over THIRTEEN sites**; §6c reports **10 defects / 2 not-a-gate over TWELVE table
members**. The difference is precisely `gate-check.js:48-52` (`loadStore`), which §6c deliberately
carries OUTSIDE the probe population because its `catch` returns `null` rather than `exit(0)`. A2's
words: *"its '10 defects / 2 not-a-gate' count is correct only for its twelve table members, not for
this thirteen-site instrument."* 10 + 1 = 11. **Not a disagreement — two different denominators, both
stated.** This is why the emitted set matters more than the count: the numbers differ while the
underlying facts are identical.

### Two places A2 agrees for a BETTER reason than mine — both are corrections

**(i) My evidence for `edit-watcher` not-a-gate was insufficient.** I ran
`grep -c 'process.exit(2)'` → 0. A2: *"zero matches for `process.exit(2)` is not sufficient
evidence. My conclusion follows from reading the complete control flow and finding no blocking form
of any kind, plus its PostToolUse placement."* It is right, and this is **the same class lane B
found in my instrument** — grepping for a *form* is not determining *semantics*. The disposition
survives; the justification behind it has been upgraded from mine to A2's.

**(ii) ⚠️ VARIANT A's MECHANISM DESCRIPTION IS IMPRECISE — this changes the remedy.** §3b describes
variant A as *"one catch spans both the infra-parse and the policy evaluation"*, implying the `catch`
intercepts the blocking decision. **It does not.** A2:

> *"the catches do not intercept `process.exit(2)` — `process.exit` terminates rather than throws. The
> defect is that preceding parsing/checking failures are converted into exit 0 before the deny
> decision can be reached."*

That is correct and it is my **third** mechanism-description error this sprint (after the
`secret-guard` file-read that does not exist, and "neither consult was primed"). The dispositions are
unaffected; the **fix shape is not**:

- **Wrong remedy** (implied by my wording): move the `exit(2)` out of the `try`, or narrow the `try` so
  it stops "covering" the decision. The decision was never at risk — it terminates the process.
- **Correct remedy:** the failures that occur *before* the decision is reachable — payload parse, store
  read, validator run, discriminator read — must **fail closed on their own**, so control never
  silently arrives at `exit(0)` having skipped the decision.

Variant A should therefore be stated as **"a pre-decision failure is converted into a permissive exit
before the gate's decision can be reached"**, not as "a catch spanning the decision". The variant-A
remedy in §3b ("no catch may span both") is consequently the wrong mechanical test and must not ship
as written; the testable property is that **every pre-decision failure path terminates non-zero**.

**Residual A2 names honestly:** no hook was behaviourally executed; all thirteen dispositions are
source-derived. Its `what_would_confirm_or_refute` asks for fault injection through the real hook
harness — forcing each named parse/read/git failure on a valid event and asserting the resulting
allow/block. **That is the right shape for the enforcer's own fixtures**, and it is stronger than
anything currently planned. Lane A1 converged on the same shape independently.

**⚠️ RIDER, non-optional (β row 326 §5): the fault injection carries a no-op⇒FAIL guard.** A harness
that silently fails to inject the fault reports green and certifies nothing — **that is ED-366's
blind-scanner class** (`orphanCount: 0` while `scanned: 0`), the exact shape already guarded against
in `probe-failopen.js`. If the fault did not actually fire, the fixture **FAILS** rather than passes.

**⚠️ AND A CORRECTION TO MY OWN OVERCLAIM (β row 326 §3).** I argued to β that the corrected property
is *"checkable WITHOUT reachability analysis"*. **That is an overclaim and is withdrawn.** The
accurate statement: **more often locally checkable; the general case remains a reachability question.**
Trivial for `catch { process.exit(0) }`; not trivial for a catch that sets a flag and falls through to
a later exit. And the polarity half stays manual by design regardless. It does not disturb the Q1
ruling — that rested on the tech rule's conjunction (conditions 3 and 4 unmet) and needs no help — but
under **S6-1** a sentence overstating what a property makes checkable is precisely the class this
sprint exists to close, so it is corrected here rather than in the build spec.

## 6d. ED-353 SECOND INSTANCE — the clamp on the `dispatch-agent.js` route (2026-08-29)

Filed here so the enforcer sprint's successor sees the **route gap**, not just the recurrence.

**What happened.** The independent re-derivation lane (`d-mteugj7o-fc57fdcc`, role `cabinet`,
gpt-5.6-sol) returned `ok:false`, `exit_code 1`, **`elapsed_ms 540402`**, `output: ""`. That elapsed
figure is the **540 s foreground-clamp signature**: `dispatch-agent.js` clamps the child bound to
`FOREGROUND_CEILING_MS` unless `WARPOS_DISPATCH_BACKGROUND=1` is present. I fired it as a bare
`node scripts/dispatch-agent.js …` with no env prefix.

**Not a provider fault, and the error blob proves it** — codex started cleanly: `workdir` correct,
`model: gpt-5.6-sol`, `sandbox: workspace-write`, session id present, the prompt echoed back. It was
reading and was killed before it could emit. **A healthy provider start + zero output + `elapsed`
540xxx is the clamp signature**, and reading it as a provider failure sends you re-litigating the
wrong layer.

**THE ROUTE GAP — this is the part worth an enforcer.** ED-353's first instance was on
`dispatch-claude.js`. The mitigations that grew around it are all shaped to *that* route: the
operator-authorized settings allow-rules are
`Bash(WARPOS_DISPATCH_BACKGROUND=1 node scripts/dispatch-claude.js *)`, the conductor instructions say
"builders MUST carry `WARPOS_DISPATCH_BACKGROUND=1`", and my own memory entry was written about
builders. **`dispatch-agent.js` — the cross-provider reviewer route — has the same clamp and none of
the surrounding habit.** Cross-provider CLIs buffer output to exit and routinely run 6-10 minutes, so
the reviewer route is arguably *more* clamp-exposed than the builder route, and it is the one with no
allow-rule, no instruction text and no memory shaped around it.

**The rule as it should be stated:** the clamp is a property of the **wrapper's timeout policy, not of
the role**. Any dispatch that can exceed ~9 minutes carries the env var, whichever wrapper it uses.

**Enforcer shape for the successor** (this is a candidate, not a claim that it exists): the wrapper
itself should emit a stderr advisory at spawn when the resolved bound equals `FOREGROUND_CEILING_MS`
and no background signal is present — ED-353's own `enforcer_candidate_addendum` already proposes
exactly this plus a `death_cause:"foreground-clamp"` tag on completion rows so `gauntlet-verify` and
`epsilon-liveness` report a TIMEOUT rather than a reap. **A doc line is not sufficient** — that
addendum says so, and this instance is the proof: the doc line existed, on the other route, and the
gap was the route rather than the knowledge.

**Recovery taken:** re-dispatched **smaller AND larger-bound** (never an identical retry — a death
exactly at the clamp is a timeout). The one over-large brief was split into
`d-mteuu37u-98a6a1f7` (population + dispositions) and `d-mteuu4h3-81080e69` (instrument audit +
priming check), both with `WARPOS_DISPATCH_BACKGROUND=1`. **Disclosed cost of the split:** the two
lanes cannot cross-reference, so a disagreement with §6c found by lane A cannot be attributed by that
lane to a probe defect found by lane B. The conductor reconciles them and must say so, rather than
presenting the pair as a single independent read.

## 6e. A SECOND, DIFFERENT DISPATCH CEILING — the two wrappers disagree (2026-08-29)

Distinct from §6d and worth its own enforcer candidate. After the clamp death was fixed with
`WARPOS_DISPATCH_BACKGROUND=1`, the re-fired lane died AGAIN at **`elapsed_ms 900663`**, exit 1,
zero bytes — **not** the clamp. Read at source from `scripts/dispatch/timeout-policy.js#WRAPPER_DEFAULTS`:

| wrapper | key | background bound |
|---|---|---|
| `dispatch-claude.js` (builders) | `dispatch-claude` / `epsilon-claude` | **1200000 ms** |
| `dispatch-agent.js` (cross-provider reviewers) | `epsilon-agent` / `run-provider` | **900000 ms** |

`foregroundAwareTimeout(900000, {background:true})` returns 900000, so the env var worked exactly as
intended; the brief simply exceeded the route's real maximum. Its sibling lane survived at
**814785 ms — 85 seconds of headroom**, so both halves were sized against a ceiling (1200s) that does
not apply to their route.

**Two distinct signatures that call for OPPOSITE fixes:**
- `elapsed ≈ 540xxx` → the foreground clamp; the fix is the env var.
- `elapsed ≈ 900xxx` on a `dispatch-agent.js` lane → the background ceiling itself; the fix is a
  smaller brief. Treating this as the clamp case buys another death.

**Enforcer candidates for the successor:**
1. Nothing surfaces WHICH ceiling applies at brief-authoring time — the wrapper knows its own
   `WRAPPER_DEFAULTS` key and could print the resolved effective bound at spawn.
2. Tag a completion row whose `elapsed_ms` lands within a small epsilon of the resolved bound with
   `death_cause: "bound-exhausted"` (distinct from ED-353's `"foreground-clamp"`), so
   `gauntlet-verify` reports a TIMEOUT with the right remedy rather than a generic reap.
3. **Nothing tells the dispatched agent its own deadline.** A cross-provider lane at high reasoning
   effort optimises for completeness right up to the moment it is killed with zero bytes salvaged.
   The wrapper could inject the effective bound into the prompt; until it does, the conductor must
   write the budget into every brief by hand — *"your route is killed at N minutes; a partial answer
   returned beats a complete answer killed; spend at most half your time analysing, then stop and
   write."* That instruction was added to the re-split briefs and is the lever that should have been
   pulled on the first re-fire.

## 6f. ED-381 — isolation worktrees are cut from a STALE BASE (observed, OUT OF SCOPE for this sprint)

**Filed by α as ED-381.** Recorded here as an observed instance with its proof, and explicitly **not**
in this sprint's scope — it is dispatch infrastructure, and a successor/enforcer-sprint candidate.

**The defect.** `dispatch-claude.js -w` cuts the isolation worktree from the **session's starting
commit** rather than the current branch HEAD. Every builder dispatched after the first therefore
starts on a tree that no longer exists.

**Proof, run rather than asserted.** Bundle B2′'s worktree base was **`c3b8654f`** — this session's
opening commit — although B1 (`e10200c7`), B2 (`09232d15`), the reviewed allowlist commit
(`fde68483`) and three manifest regenerations had already landed on `session/2026-08-29`:

```
git merge-base --is-ancestor 09232d15 <B2′ base>   →  NOT an ancestor
git -C <B2′ worktree> log --oneline -1 HEAD~4      →  c3b8654f
```

**Consequences OBSERVED in this sprint, not theorised:**
1. **A builder had to hand-sync its own prerequisites.** B2′ found none of `gate-failclosed-*` in its
   tree and resolved it with file-level `git checkout <sha> -- <paths>` (correctly refusing to run
   `git merge`), then flagged it prominently rather than fixing it silently.
2. **An already-reviewed governance decision was re-applied by a builder.** B2′ had to re-add the
   allowlist entries its worktree was missing, and said so precisely: *"I did not author a new
   allowlist decision; I re-applied an accepted one this worktree was missing."* A stale base turns a
   settled conductor decision into work a builder must redo — and redoing it is exactly the act the
   sprint's own discipline forbids builders from doing.
3. **Every one of the conductor's four merges hit generated-file conflicts.** Each stale-based
   worktree regenerates `.claude/framework-manifest.json` and `_warpos/MANIFEST.json` from a tree that
   is missing prior landings, so the manifests diverge by construction. **This was not four unrelated
   accidents; it was one defect firing four times**, and it was misread as ordinary merge friction
   until B2′ named the base.

**Why it belongs to the enforcer family rather than to hygiene.** The failure is silent by
construction: nothing in the dispatch path tells the builder its base is stale, and the symptom
(missing files) is indistinguishable from a scope error by the builder. That is the same shape as
every ED-369-class finding in this sprint — **a condition the actor cannot detect from inside.**

**Enforcer candidates (not built here):** have the wrapper stamp the base sha into the prompt and into
the completion record so a stale base is visible in the ledger; or resolve the worktree base from the
current branch HEAD at spawn; or fail the dispatch when the requested base is not an ancestor of HEAD.

## 7. What I would file regardless of scope

`secret-guard.js:94` is a real, unfiled fail-open on a credential control. Whatever scope β rules,
that should get an ED row so it is not lost with this sprint's context. I have not filed it — filing
is a ledger write and the lead appends rows.
