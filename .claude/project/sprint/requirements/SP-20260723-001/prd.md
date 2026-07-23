# SP-20260723-001 — Helm entry-file refresh + single-source shim projection + parity enforcer

**Status:** design-locked (β DECIDE B/0.89, 2026-07-23; OPEN_ADR → ADR-0036).
**Composition:** backend unit (docs + one JS parity enforcer), risk medium, no UI/copy domains.
**Sources of truth this consolidates (do not re-derive):** operator DUMP #0 (2026-07-23, ruled first); β plan→design DECIDE + riders; DoE design-boundary enforcer contract (record `d-mrwvqdq3-508bd9f2`); E-DISPATCH-SHAPE-001 fold (G2.2).

## Why
A helm trial (pickup #1 agy block, #2 GPT-5.6-helm) against a stale/missing entry doc tests the doc, not the helm. The entry files are the first thing every executor reads. CODEX.md is stale (2026-06-11, points at a closed fix-cycle); ANTIGRAVITY.md + GEMINI.md do not exist; AGENTS.md has no entering-agent preamble. This sprint is the enabler; minimum honest ship = thin shims + a parity enforcer. The full G2.2 generated-projection (a generator that regenerates shims + a drift check, atomic source+projection commits) is the DEFERRED end-state — do not gold-plate (operator directive).

## What ships
1. **Canonical source** `.claude/project/reference/entry-preamble.md` — the provider-neutral entering-agent preamble, wrapped in the marked region (below). Framework doctrine layer (already a shipped dir; siblings operational-loop.md / reader-discipline.md). AUTHORITY-NEUTRAL: describes the repo + read-order + dispatch basics and POINTS to CLAUDE.md for identity; never asserts "you are Alex/President", a default top-level role binding, or unconditional operator merge/deploy authority (authority-pollution-scan.js is a BLOCKING scan:full gate over AGENTS.md/GEMINI.md/non-root CLAUDE.md).
2. **CODEX.md** (refresh) — framework-root-doc shim; embed the marked shared block; provider-delta = codex ChatGPT-OAuth auth surface (auth.json auth_mode=chatgpt → `codex exec` bills the ChatGPT plan, $0 metered API), the `codex exec --sandbox workspace-write --ask-for-approval never [-c model_reasoning_effort=<lvl>] -m <model> -` stdin convention, hooks-are-inert manual duties, the background-reap warning, cross-provider-review-stays-real, pointer to shared rules. Drop the stale SP-20260611-002 "First action".
3. **ANTIGRAVITY.md** (create) — framework-root-doc shim (already in build.js allowlist); embed the marked block; provider-delta = `agy --model <display-name> --print-timeout <dur> -p '<prompt>'` (prompt is the -p VALUE, not stdin; usesStdin:false), self-auth via ~/.gemini keyring, and the HONEST ED-230 state: agy has NEVER served with verified proof; never claim live from transport; the panel-3lab agy lane is BLOCKED-ON-OPERATOR until one real `fallback:false` ledger record exists.
4. **GEMINI.md** (create) — framework-root-doc shim; ADD `rel === "GEMINI.md"` to build.js framework-root-doc allowlist; embed the marked block; provider-delta = THIN sunset-tombstone: the individual-tier `gemini` CLI is SUNSET and its legacy wiring was REMOVED for 1.0 (ADR-0031); all Gemini-family work routes through Antigravity `agy` → see ANTIGRAVITY.md. GEMINI.md is a CONVENTION REDIRECT (parallel to CODEX.md/ANTIGRAVITY.md) — NOT a claim of a live `gemini` CLI route (verify-don't-inherit: the earlier "still live-wired" framing was stale 2026-07-20-era memory, caught by the gauntlet qa lane). REMOVAL-TRIGGER (documented in the file + ADR-0036): drop GEMINI.md + its enforcer must-exist entry + its build.js allowlist line once the Gemini family is fully retired or the per-executor-entrypoint convention drops a dedicated Gemini shim.
5. **AGENTS.md** (additive) — insert a compact "Entering-agent preamble" section embedding the marked block near the top; keep ALL existing router content. Authority-neutral.
6. **Enforcer** `scripts/checks/entry-preamble-parity.js` + `scripts/checks/entry-preamble-parity.test.js` — the named maintenance-contract enforcer (below).
7. **Wiring** — enforcer into `.claude/commands/scan/full.md` (direct-script section) AND `scripts/warpos/release-gates.js` (a `gate()` entry, 0→green / 1→RED / 2→RED). build.js GEMINI.md allowlist add. Manifest regen (framework-manifest + _warpos) as the LAST step before release.
8. **ADR-0036** — pins ship-thin-now / defer-G2.2 + the enforcer maintenance contract + the GEMINI.md removal-trigger; references E-DISPATCH-SHAPE-001. INDEX.md updated.

## Marker convention (DoE-locked)
HTML-comment fences, carried IDENTICALLY in the canonical source and every embedder (shim-of-itself, one symmetric extractor):
```
<!-- WARPOS:ENTERING-AGENT-PREAMBLE:BEGIN v1 -->
...shared block...
<!-- WARPOS:ENTERING-AGENT-PREAMBLE:END -->
```

## Enforcer contract (DoE-locked; the build-spec for the enforcer)
Per-file config table the enforcer keys on REAL FILE BYTES (never a self-declared field):

| File | exists-required | embeds marked block (hash-parity) | thinness tier |
|---|---|---|---|
| `.claude/project/reference/entry-preamble.md` (canonical, the hash ORACLE) | yes | yes (source of truth) | n/a |
| CLAUDE.md | yes | no (identity-asserting root doctrine; the target the preamble points to) | n/a |
| AGENTS.md | yes | yes | n/a (router doc, not a thin shim) |
| CODEX.md | yes | yes | full-entry |
| ANTIGRAVITY.md | yes | yes | full-entry |
| GEMINI.md | yes | yes | tombstone |

Checks:
- **EXISTS**: every exists-required file present → else finding.
- **REGION PRESENT + non-empty**: every embedder carries a non-empty marked region → else finding (a shim that dropped the block is a defect a size-max alone misses — the MIN).
- **HASH-PARITY**: each embedder's marked-region hash === the canonical source's marked-region hash. Normalize: take bytes STRICTLY BETWEEN the marker lines (exclude both marker lines), CRLF/CR→LF, trim edge trailing-newline / whitespace-only lines, sha256 UTF-8. Minimal otherwise — never touch intra-line content. The canonical source is the SOLE hash oracle (never hash a shim as the oracle — the tautology false-green DoE flagged).
- **THINNESS**: the provider-delta region (bytes OUTSIDE the marked region) ≤ tier bound. tombstone ≤ 2KB / 40 lines; full-entry ≤ 8KB / 120 lines. A MAX drift-into-fat guard, not a target.
- **FAIL-CLOSED**: exit 0 clean / 1 finding / 2 could-not-run (canonical unreadable / internal error — never a silent green). Release-gate map: 0→green, 1→RED (a drifted preamble is a single-source lie — no yellow tier), 2→RED.

## Acceptance criteria
- **AC-1** Canonical source exists at `.claude/project/reference/entry-preamble.md`, carries the marked region, is authority-neutral, and ships (manifest picks it up on regen).
- **AC-2** CODEX.md refreshed: marked block embedded + hash-parity with canonical; delta ≤ full-entry bound; carries the codex ChatGPT-OAuth auth surface + exec/stdin convention; no stale SP-20260611-002 pointer.
- **AC-3** ANTIGRAVITY.md created: marked block + hash-parity; delta ≤ full-entry; agy invocation stated; ED-230 honesty line present ("never served with verified proof / do not claim live"); no live claim.
- **AC-4** GEMINI.md created as a thin sunset-tombstone: marked block + hash-parity; delta ≤ tombstone bound; redirect to ANTIGRAVITY.md; removal-trigger documented; added to build.js framework-root-doc allowlist.
- **AC-5** AGENTS.md carries the entering-agent preamble section (marked block + hash-parity); ALL prior router content retained (additive); authority-neutral.
- **AC-6** Enforcer `scripts/checks/entry-preamble-parity.js` implements the full contract above; **first run is GREEN on the shipped bytes** (all files exist + thin + hash-parity holds).
- **AC-7** Enforcer test plants every hardest failure and proves the boundary: one-char semantic edit inside an embedded region → RED; pure-CRLF/trailing-newline reformat → GREEN; missing entry file → RED; oversized shim delta → RED; absent shared region → RED; canonical-unreadable → exit 2. Live control (shipped bytes) → GREEN.
- **AC-8** Enforcer wired into /scan:full AND release-gates.js (or the gap /enforcement:log'd before merge — the named-enforcer-or-debt rule). authority-pollution-scan.js stays GREEN on the new/edited neutral surfaces (AGENTS.md, GEMINI.md).
- **AC-9** Manifests regen'd (framework-manifest + _warpos); BC-02/BC-05 green. ADR-0036 written + INDEX updated.
- **AC-10** Cross-provider gauntlet (qa-reviewer + security-reviewer + backend-reviewer) binding-PASS on the enforcer + docs. Brokered land to main (fence live). Retro deferred to milestone (RI-001).
