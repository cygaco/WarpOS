# Lane evidence — `security_claude_hunter` (BINDING) — S-VLADW1-04 gauntlet-1 (DIAGNOSTIC)

Shape: `in-process-agent` · claude-opus-5 · elapsed 652964 ms · 29 tool_uses · agentId `a12d0736b691441f0`
Target: commit `b9b8df3`. Third and last of three SERIALIZED lanes.
Worktree clean at finish — **conductor re-verified independently:** `git status --porcelain -- engine/` = 0,
**all probe files removed** (`find engine -name "__probe*" -o -name "tmp-*"` → nothing), suite 339/339.

**Verdict: FAIL.** **S4-1 cannot-assess · S4-2 FAILS · S4-3 FAILS · S4-4 cannot-assess · S4-5
cannot-assess · S4-6 holds.**

## F-1 — HIGH — THE WALKER RESIDUAL, FINALLY INSTANTIATED

The backend lane said plainly this check *"defeated the control in the predecessor's gauntlet-2 and it
remains unperformed by this lane."* **This lane performed it.**

Probe placed at `engine/scripts/__probe_walker.js` — **`scripts/` IS in `package.json#files`, i.e.
shipped-and-scanned**:

    import { createRequire } from 'node:module';
    const req = createRequire(import.meta.url);
    const cp = req('child_process');
    const method = 'sp'+'awn';
    cp[method](bin, argv, { env });

- `CHILD_PROCESS_IMPORT_PATTERN` matches only `from` / `require(` / `import(` — an **aliased** `req(...)`
  is caught by neither it nor `DYNAMIC_CALL_PATTERN` (which keys on the literal `require|import` callee).
- `RAW_LAUNCH_PATTERN` needs the literal token `spawn(` — **computed access `cp['spawn']` evades it.**
- Result: `spawn-env-allowlist: OK — 35 file(s) scanned, 0 violations`, **`check:ship` exit 0.**
- Then exercised with a denylisted, secret-shaped env value the wrapper would REFUSE: a real child echoed
  **`CHILD_SAW=sk-ant-<REDACTED>`**.

**Graded correctly by the lane itself:** the probe file is not in the committed tree, so this proves the
**CONTROL is defeatable**, not that the committed package leaks. **Not disclosed anywhere** — grep of
`CUSTODY.md` / `spawn-shim.js` / `spawn-env-allowlist.js` empty.

## F-2 — HIGH — S4-2 — the canonical transform is defeated as a CLASS

`canonicalizeClaimText` folds only the `\p{Pd}` dash class, JS `\s`, and case. **It performs NO Unicode
confusable or normalization fold.** So a token that renders identically to a reader canonicalizes
differently and walks past the conflation check:

| variant | result |
|---|---|
| exact `PROVEN` in the Asserted section (control) | **RED** `status-token-conflation`, exit 1 |
| `PRO​VEN` (ZERO-WIDTH SPACE) | **GREEN**, exit 0 |
| `PRОVEN` (CYRILLIC О) | **GREEN**, exit 0 |

Also evades: soft-hyphen U+00AD, ZWNJ U+200C, LRM U+200E, full-width forms; and for the ASSERTED token,
tilde / vertical-bar / katakana-prolonged-mark U+30FC separators. Verified `/\s/.test('​') === false`.

**This is exactly the class β refused a variant enumeration to close** — dash-CLASS is folded by Unicode
property, the confusable/zero-width class **is not folded at all**, and **the brief's own guidance to
normalize NFKD on match was not applied.** A false PROVEN label ships GREEN in the Asserted section.

## F-3 — HIGH — S4-3 — the same gap defeats refuse-not-skip

An **unbound** Ceiling paragraph ships GREEN when an invisible character sits in the lead-in:

| variant | result |
|---|---|
| `**Ceiling — …` (control) | **RED** `unbound-paragraph`, exit 1 |
| `**Ceiling​ — …` (ZWSP after keyword) | **GREEN** |
| `**​Ceiling — …` (leading ZWSP) | **GREEN** |
| `**Ceiling­ — …` (soft hyphen) | **GREEN** |

Root cause: `RESEMBLANCE_KEYWORD /^\s*\*\*\s*(A\d+|Asserted|Ceiling)/i` — a ZWSP is **not** `\s` and not part
of the keyword, so `resemblesBindableLeadIn` returns null, the paragraph is **silently skipped rather than
refused**, and the canonical marker never matches it either. **Distinct from the backend lane's
bold-placement and dash-count variants — this is the invisible/format-character class, undisclosed.**

## A STRONG POSITIVE, and it is worth as much as the findings

`regressions_from_this_build: **none found**` — and it earned that by attacking bundle D directly:

> Executed a plain array (`prototype === Array.prototype`) carrying an **index GETTER** and a
> **stateful-toString element** against the REAL `auditedSpawn`; each was read **EXACTLY ONCE**
> (`getterCalls=1`, `toStringCalls=1`), so the scan-time value and the spawn-time value are the same frozen
> primitive — **the T4/T8 TOCTOU split cannot be reopened via a getter, stateful `valueOf`/`toString`, or a
> mutating `length` on a plain array.**

It states explicitly that its three findings are **pre-existing design gaps this build did not introduce
and did not close** — not new breakage.

## Going-in items

1. **cannot-assess** — confirmed the shipped Ceilings are among the 15 bound-and-matched paragraphs and the
   document is internally consistent (no simultaneous landed/not-landed under green), consistent with F′'s
   stated intent, but did not diff against bundle A's brief to verify minimality. *(qa and backend both
   adjudicated this JUSTIFIED independently.)*
4. **Reasonable/honest** — `CUSTODY.md:155-157` explicitly declines to name the unrecoverable commit and
   anchors the surrounding wording to `0732cd8` / `514c2d9` / `55fc6a3`. The `opts.cwd`/`stdio`
   pass-through Ceiling is disclosed on the shipped surface, **so S4-6 is satisfied for that residual.**

## `what_i_could_not_assess`

- **S4-1's full truth sweep** (qa's lane) — *"F-2 proves the MECHANISM that would let a false
  PROVEN/ASSERTED label ship green, but I did not find a specific already-false shipped claim."*
- **S4-2(d)'s battery re-run** (backend's) — not duplicated.
- **S4-5 / AC-8.6 runtime behaviour** — did not exercise the driver entry path or RF-7.
- **S4-4's per-mutant observation counts** — did not read the falsifier artifacts per-description, so
  cannot say whether described-mutation count equals claimed count.
- **F-1's reach to the LIVE held secret** — proved the control defeatable with a caller-supplied decoy;
  *"did not trace whether any real shipped code path provisions the live secret into such a call."*
- Atomicity beyond the Ceiling binding it execution-tested.
