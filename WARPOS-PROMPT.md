# WarpOS Prompt — Step-driven `bootstrap:spinup` + degrade-proof canon engine

> **For:** the canonical WarpOS framework repo (Alex α).
> **Scope:** WarpOS framework ONLY — the bootstrap/canon/roadmap engines, the skills, the
> enforcers. Do **NOT** touch `server/` or any cockpit UI: that is the masterconsole product
> layer and is built separately (see `MASTERCONSOLE-PROMPT.md`). You DO, however, expose the
> contracts that layer consumes.
> **Companion:** `MASTERCONSOLE-PROMPT.md` (the product-side runner that consumes this).
> **Created:** 2026-06-06.

---

Refactor `bootstrap:spinup` into a step-driven pipeline, make the engine refuse degraded output
for good, and rename Milestone→Epic globally. Reuse existing engines; do not reimplement.

## WHY (root cause — confirmed in the consumer at `server/bootstrap-actions.ts`)

The consumer runs the WHOLE chain in one exec; at the first LLM phase the orchestrator exits
code 3 (`needs_orchestration`) and the consumer has no in-loop agent to do the synthesis, so the
flow stops at canon. The framework fix = make each phase an independently-dispatchable,
idempotent, resumable step with a clean `--json` status + a machine-readable
`orchestration_prompt`, so any consumer (an in-loop Alpha session, OR a product runner) can drive
one step = one turn. AND make the engine NEVER able to ship degraded canon, regardless of caller.

## 0) GAP ANALYSIS FIRST

Read `bootstrap:spinup.md` + `spinup-orchestrate.js` + `phases/{canon,onscreen,intent,roadmap,preflight}.js`
end-to-end and enumerate EVERY behavior (preflight `/scan:install` gate; DEV_SETUP guide-anchor;
research-tier resolution; canon `needs_orchestration` handoff; bounded research + `sources[]`
β-directive; `canon-no-unfilled-tokens` enforcer; scaffold-if-missing S0.3; `verifyServe` gate =
build clean + HTTP 200 + entry transforms; visual-review BAIL-when-no-Playwright; design-library
pointer; `.warpos/spinup-state.json`; `--phase`/`--resume`; `--repo-root`; `--json`;
`test-spinup-orchestrate.js`). Map each to exactly ONE step and print the table BEFORE coding. A
silently dropped behavior is itself a regression.

## 1) INVOCATION CONTRACT — ONE step-driven skill

Positional step + `--` modifiers (no per-step skill files; no parallel clone pipeline). Consumers
pass argv directly, so this is the shape:

```
/bootstrap:spinup [<step>] [--clone <url>] [--name][--what][--who]
                  [--where android|ios|web|desktop-pc|desktop-mac]
                  [--research simple|deep] [--repo-root <path>] [--resume] [--json]
```

- `<step>` ∈ `{ setup, canon, roadmap, paint }` — a positional SUBCOMMAND (like `git commit`).
  Omitted ⇒ full chain `setup→canon→roadmap→paint`. NOT a dashed flag.
- Rename orchestrator phases to match: fold `preflight`+`intent` INTO `setup`, `onscreen`→`paint`,
  add `setup` (= create+scaffold+seed+preflight).
- `--clone <url>` is a MODIFIER on `setup` (and full chain): swaps intent SOURCE from structured
  args to competitor intel via `scripts/portfolio/clone.js` (write clone doc to
  `_docs/clones/<slug>/` and keep).
- Each step: idempotent (read-before-write; 2nd run = no-op), independently resumable, fails with
  a clear non-zero exit. EMIT a stable `--json` status consumers can drive on:
  `{ phase, status (ok|needs_orchestration|failed), ran[], orchestration_prompt,
  data{serveUrl,firstAction,roadmapPath} }`. State persists to `.warpos/spinup-state.json` (extend
  existing).
- When structured args are supplied, NO step may fall back to an interactive prompt and NO step
  may exit-3 dead-end when driven standalone — each runs as its own turn.
- **CONSUMER CONTRACT (expose, do not implement):** the LLM steps (canon/roadmap/paint) return
  `needs_orchestration` with a machine-readable `orchestration_prompt`. A consumer fulfills it (an
  in-loop Alpha session, or a product-side headless runner) and re-invokes with `--resume`. The
  engine defines + documents this contract; it does NOT spawn agents itself.

### Steps

- **setup** — DETERMINISTIC (no LLM): sibling repo + `git init` + WarpOS install + app scaffold
  (platform-aware §3) + register + capture raw intake (name→slug/title, what→problem/JTBD,
  who→cohorts, where→platform) into the INTENT/brief artifact ONLY (raw→intent is correct). Reuse
  `portfolio:new`'s engine (§4). Runs start→finish.
- **canon** — AI SYNTHESIS (anti-degrade §2): reads the brief, an AI SYNTHESIZES
  `_requirements/00-canonical/*`. Returns `needs_orchestration` via CLI per the consumer contract.
- **roadmap** — AI: `roadmap:create` → `ROADMAP.md`, Epics + sprints (§5), core-loop first.
- **paint** — AI: execute Epic 1's sprints until the core loop SERVES, gated by `verifyServe`.
  Preserve scaffold-if-missing, visual-review opt-in/BAIL, design pointer + guide-anchors.

## 2) ENGINE REFUSES DEGRADED OUTPUT (load-bearing)

This regression recurs: WI-51, fixed in `92457ab`, reverted by WI-47 take-theirs. The engine is the
LAST line; it refuses degradation no matter what a caller requests. HARD INVARIANTS:

- **NO PATH TO DEGRADED CANON.** There is no flag, tier, alias, or default that produces or accepts
  un-synthesized / thin / placeholder / generic-substituted canon. Specifically: REMOVE `off` from
  `spinup-orchestrate.js` `RESEARCH_TIERS` + `normalizeResearchMode` and REJECT `--research off`
  (clear non-zero error). Floor = `simple` (cheap real research, default); `deep` = explicit opt-up.
  Forbid any alias that resolves to off (the old `light→off` bug). Forbid any `--auto`/`--fast`/skip
  path that bypasses synthesis or the enforcer gate.
- **Raw user input NEVER lands in canon** — it lives in the INTENT/brief only. Canon substance
  (vision, JTBD, cohorts, golden paths, product model, failure states) is AI-SYNTHESIZED. The ONLY
  deterministic passthrough is non-substantive identity facts (name, slug, platform label).
- `generate.js`'s deterministic render = structural scaffold ONLY (valid shape, zero raw
  `{{tokens}}`); never ships as "done." The canon step MUST hand off to an AI to synthesize every
  thin/substantive field.
- **FAIL-CLOSED GATE, NON-OPT-OUT:** the canon step runs `canon-no-unfilled-tokens.js` as a
  completion gate; it cannot report success while any `*needs input:*` or raw `{{token}}` survives.
- **THE ONE AUDITED EXCEPTION:** `--allow-needs-input` may pass a GENUINELY-EXTERNAL field (a
  real-world fact only the user can supply) ONLY with a logged reason, recorded per-field. It is NOT
  a bulk escape and NEVER applies to thinkable substance. Guard it so it can't become the next
  renamed hole (the WI-51 pattern). `/enforcement:log` it.

## 3) PLATFORM TARGET (`--where`, NEW)

Accept `android|ios|web|desktop-pc|desktop-mac`. Record in the brief + canon PRODUCT_MODEL;
influence the roadmap; pass to the scaffold. v1: if native scaffolds aren't implemented in
`scripts/scaffold/app.js`, scaffold the web/PWA baseline for ALL targets, RECORD the target
honestly, add a "native packaging" Epic to the roadmap, and `/warp:flag` the missing
native-scaffold capability into `WARPOS.md`. Never present a web app as native (verify-before-claim).

## 4) RECONCILE `portfolio:new` (one implementation per phase)

Split `new.js` into `create()`/`scaffold()` callables (or have `setup` invoke its existing
functions). The `setup` step reuses them; `portfolio:new` becomes the `setup` step composed. No
duplicated create/scaffold logic.

## 5) RENAME Milestone → Epic GLOBALLY

`roadmap:create.md`, `ROADMAP.md` template + existing `ROADMAP.md`, `scan:roadmap-trace` /
`check:roadmap-trace`, `roadmap:add/ideas/next/prioritize`, every milestone ref in docs/specs.
Rename-hygiene: grep ALL occurrences of `milestone`/`Milestone` across `.md`/`.json`/`.js` before
declaring done. Fix the now-circular line "Milestone 1's first sprint MUST be a `/portfolio:spinup`"
→ "Epic 1's first sprint = the paint step / core-loop sprint." `roadmap-trace` must assert Epic and
stay green.

## 6) PORTFOLIO SUITE — PRECISE scope (do NOT over-apply)

- **`portfolio:spinup`** — keep as cross-repo pass-through wrapper (`scripts/portfolio/dispatch.js`);
  forward positional `<step>` + `--clone` + intake flags + `--repo-root` + `--resume` + `--json`
  verbatim. Do NOT add `portfolio:canon/roadmap/paint`.
- **`portfolio:new`** — reconcile per §4.
- **`portfolio:open/list/register/run/status/sync`** — UNCHANGED.

## 7) REGRESSION ENFORCERS (framework-side; make breakage self-detecting)

- `test-spinup-orchestrate.js` → per-step seam test: each step runs standalone, idempotent (2nd run
  = no-op), resumes; full chain passes. REPLACE the old `--research off` test path with a
  FIXTURE-FINDINGS injection (`--research-in <fixture>`) so the synthesis path runs deterministically
  WITHOUT real spend AND without a dumb shortcut.
- Add a test asserting `--research off` (and any degrade alias/skip) is REJECTED non-zero.
- Anti-degrade test: the fail-closed gate FAILS dumb/thin canon and PASSES synthesized canon.
- Headless-contract test: setup/canon/roadmap never block on interactive input with structured args;
  emit a valid `--json` status with `orchestration_prompt` at LLM steps; never exit-3 dead-end.
- Document the consumer dispatch contract (step + `--json` + `orchestration_prompt` + `--resume`) in
  the skill body and name its enforcer.

## 8) β + ACCEPTANCE

Consult β at the design boundary (CLAUDE.md autonomy). ACCEPTANCE (framework-scoped):

- Each step independently dispatchable + idempotent + resumable + valid `--json`.
- Full chain reaches a served first paint when synthesis is fulfilled (in-loop or via a consumer
  runner).
- The engine has NO path to degraded output (`--research off` and any degrade alias/skip rejected;
  fail-closed gate non-opt-out; raw input never in canon).
- Milestone→Epic green under `roadmap-trace`.
- Portfolio scope limited to `spinup` pass-through + `new` reconcile.
- Gap-analysis table shows zero dropped behaviors.
- Seam + headless-contract + anti-degrade + research-off-rejected tests pass.
