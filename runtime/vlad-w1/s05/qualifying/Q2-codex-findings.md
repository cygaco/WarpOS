# Q2 (codex) — extracted finding set

**Lane:** `d-mtf6pwa2-69d952e6`, cabinet/openai gpt-5.6-sol, ok:true, 530600 ms, raw output
`out-Q2.json` → `out-Q2-adversarial.md`. **Token, read from the lane's own raw file, line 1:**
`{"verdict":"fail"}`

**Envelope budget: STATED-AND-EXCEEDED.** ≤7 min stated; ran **530600 ms ≈ 8.8 min**, inside the 900 s
bound.

**Lane's own limits, quoted — these bound the union:**
> `files_i_could_not_see`: *"Read end-to-end: `CUSTODY.md` lines 1–619 and `package.json`. Sampled
> rather than read end-to-end: `custody-claim-lint.js`: relevant rule, binding, denylist, aggregation,
> and CLI regions … `test/custody-claim-lint.test.js`: not read end-to-end."*
> `what_i_could_not_assess`: *"The complete Node test file: `node --test
> test/custody-claim-lint.test.js` failed at runner startup with `spawn EPERM`, exit `1`; no test node
> executed. The CLI and exported checker functions did execute successfully."*

**`spawn EPERM` is a lane-environment limit of the codex route, not an artifact defect** — the sandbox
refusing a child process. Sibling of the pre-fire sandbox finding that moved Q3 in-process.

**EXTRACTION, not a grading.** Criterion mapping is β's at the close under NO STACKING.

---

## Emitted finding ids

`F-Q2C-1a` · `F-Q2C-1b` · `F-Q2C-2`

**Split per β `f81a5d63` §1: finding_1's two halves are recorded SEPARATELY**, because one may be a
designed ceiling and only the other can fire S5-1.

---

## F-Q2C-1a — EXECUTION. Three false claims accepted by the real CLI.

**Class (lane's own):** false encryption claims accepted.
**This entry records only what was RUN. It makes no claim that a shipped sentence is false.**

| # | placement | exact input, verbatim | result as printed |
|---|---|---|---|
| 1 | Preamble, `<SCRATCH>/preamble.md` line 3 | `Credential custody uses authenticated encryption for its retained snapshot.` | `matched=false`; CLI exit `0`; zero violations; four Proven claims checked |
| 2 | Proven prose, `<SCRATCH>/prose.md` line 492, immediately before `## Asserted` | `Captured credentials are encrypted before retention.` | `matched=false`; CLI exit `0`; zero violations; four Proven claims checked |
| 3 | Tagged Proven heading, `<SCRATCH>/heading.md` line 492 | `### P1 — Captured credential values are encrypted before retention.` | `matched=false`; CLI exit `0`; zero violations; **five** Proven claims checked |

**The claims are false — lane's reason, verbatim:**
> *"`src/env-scrub.js:389-394` copies the environment string directly into a frozen snapshot, and
> `src/env-scrub.js:501-506` returns that same string. I executed a placeholder probe:
> `samePlaintext=true` / `envOwnPropertyAfterInit=false` / `alreadyInitialized=false`, process exit
> `0`. Thus the environment entry is deleted, but the retained value remains recoverable unchanged; no
> encryption occurred."*

**Lane's root cause, verbatim:**
> *"Rule 1 checks only that a `###` heading begins with `P1`–`P4` (`custody-claim-lint.js:385-388,
> 444-481`). Non-heading Proven prose and out-of-section prose are checked only against five lexical
> patterns (`:1528-1538,1572-1633`). Ordinary positive assertions such as 'is encrypted' fall outside
> those patterns."*

**Lane's stated derivation rule, verbatim:**
> *"I partitioned the unbound claim locations exposed by the lint's control flow: 1. Text outside the
> recognized sections. 2. Non-heading prose inside Proven. 3. A level-3 Proven heading whose only
> validated property is the `P1`–`P4` prefix. For each member, I expressed the same directly
> falsifiable encryption property without a status token or one of the five forbidden regex shapes.
> This rule does not reach bound Asserted/Ceiling paragraphs, package.json, other shipped files,
> arbitrary paraphrases, rollups, Unicode/Markdown evasions, dependency behavior, or the complete
> semantic truth of CUSTODY.md."*

## F-Q2C-1b — THE CLAIM HALF. β `f81a5d63` §1 asked whether a shipped sentence says the lint would catch this. **I looked. Sentences exist on BOTH sides; all three verbatim, ungraded.**

**Cutting TOWARD a defect — `CUSTODY.md` L320-322, the Proven section preamble, verbatim:**
> *"Each item below carries an explicit clause id (P1–P4), **the enforcer that checks it on every
> run**, and a proof scope stating exactly what was scanned — **a claim stated more broadly than it
> runs is itself a defect.** Status: **PROVEN** — the claim is bounded by the enforcer's own green/red
> state, never a stronger promise than that."*

Input 3 above inserted a `### P1 —` item with **no enforcer, no Status, no proof scope**, and the CLI
reported **five** Proven claims checked at exit 0.

**Cutting AWAY from a defect — two shipped disclosures of exactly this limit, verbatim:**
> L116: *"It does not detect semantically equivalent rollups in ANY other wording, and no enumeration
> of wordings will close this,"*
> L241: *"it is a literal-keyword search, so a semantically equivalent guarantee phrased without one of
> these six words … is invisible to it, the same unbounded-family problem item (2) above names for the
> rollup class"*

**No sentence anywhere in `CUSTODY.md` claims the lint verifies arbitrary claim truth** — I searched
for that class of statement and found none; the two above disclose the opposite. **Bound of that
absence claim, stated: `CUSTODY.md` only, this pin; I did not search the other shipped files.**

**Whether L320-322 is a claim about the DOCUMENT's authoring discipline or about what the LINT
enforces is the interpretive question, and it is β's — not mine and not the lane's.**

## F-Q2C-2 — A shipped A5 claim contradicted by its own supporting artifacts.

**Class (lane's own):** shipped claim already false.
**Shipped, verbatim at `CUSTODY.md:524`:**
> `**A5 — The SDK-launched child is a named, sanctioned exception to P2, unreached by P2's enforcer — and it is a DESIGNED carrier, not an operating one.**`

**Result as printed:** *"The unchanged document's CLI run exited `0` with zero violations."*

**Lane's reason, verbatim:**
> *"- P2 defines `src/spawn-shim.js` as its sole sanctioned exception (`spawn-env-allowlist.js:3-12`).
> - Its implementation exempts only that path (`:326-360`).
> - `model-seam.js:655-680,689-706` says the SDK call is outside P2's domain and is an exception to P4
>   instead.
> - `CUSTODY.md:531-566` repeats that correction.
> - Nevertheless, `custody-claim-lint.js:1073` stores and binds the false A5 heading verbatim."*

**Lane's supporting execution, verbatim:**
> *"I also executed all three P2 checks directly against comment-stripped `src/model-seam.js`:
> raw-launch `0`, dynamic-specifier `0`, auditedSpawn `0`. The complete P2 scan returned `ok=true`,
> zero violations across 35 files, process exit `0`."*

**Lane's own reasoned-vs-executed split, verbatim:**
> *"Reasoned rather than executed: I did not launch the SDK subprocess or make a network request. The
> A5 domain contradiction follows from P2's explicit definition and exemption path; it does not depend
> on SDK runtime behavior."*

---

## Conductor observations — NOT gradings

1. **β's §1 split was the right call and it changed what this file says.** Recorded as one finding,
   F-Q2C-1 would have read as "the lint has a bypass." Split, F-Q2C-1a is an execution against a limit
   the document discloses twice, and F-Q2C-1b is where any S5-1 defect could live.
2. **I did the search β said it had not done**, and it returned sentences on both sides. Presenting
   both rather than the one supporting the finding.
3. **F-Q2C-2 is a pre-existing shipped claim**, not sprint-authored this round — distinct from
   F-Q1-11/F-Q1-12, which the sprint wrote in this attempt.
