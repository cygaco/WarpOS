# GEMINI.md — Gemini executor entrypoint (SUNSET tombstone → ANTIGRAVITY.md)

> Thin per-executor entrypoint for the Gemini family. The shared entering-agent rules are the block
> below (single-sourced from `.claude/project/reference/entry-preamble.md`, hash-parity-checked); this
> file's only delta is the sunset notice. (SP-20260723-001 / ADR-0036.)

<!-- WARPOS:ENTERING-AGENT-PREAMBLE:BEGIN v1 -->
**What this repo is.** WarpOS is a framework for running an autonomous AI software company. Work is delivered by mode-selected *faces* of a single operator persona, plus departmental agents (Product, Engineering, Growth). Identity, the autonomy ceilings, and the full operating doctrine live in `CLAUDE.md` — this preamble asserts none of them; it points you there.

**Read order — once, then act.**
1. `DUMP.md` (repo root, local) — the session handoff: next action, in-flight state, verbatim payloads. Read once, then execute.
2. `TRACKER.md` (repo root) — the ENFORCED source of truth. It OUTRANKS `DUMP.md`, this preamble, and your own assumptions. Validate with `node scripts/trackers/validate.js` (must exit 0) before AND after meaningful work; on any disagreement, the tracker wins.
3. `CLAUDE.md` (repo root) — the operating doctrine: autonomy, dispatch, and policy/enforcement + refactor/rename hygiene. Its RULES apply to every executor; the harness-specific mechanics may not.

**Dispatch is CLI-first.** Agent dispatch runs through the CLI wrappers — `node scripts/dispatch-claude.js <role> <prompt-file> -w` for build-chain Claude roles, `node scripts/dispatch-agent.js <role> <prompt-file>` for cross-provider reviewers. CLI is mandatory; a provider API is used ONLY where there is no CLI equivalent. Cross-provider review diversity is required, and a binding FAIL cannot be overridden.

**Guards, gates, and output destinations.** The repo's guarantees are enforced: the `refs/heads/main` reference-transaction fence (every write to main goes through the broker), `/scan:full`, and the release gates. Every policy names an enforcer or logs the debt. Write per-run output under `runtime/`, never a manifest-tracked project dir. Orchestrators hold envelopes, not content — heavy work goes to a subprocess that writes its full output to a file and returns a short envelope. Regenerate both manifests after editing any hash-tracked file.

**For identity, authority, and the complete rules, read `CLAUDE.md`.**
<!-- WARPOS:ENTERING-AGENT-PREAMBLE:END -->

## SUNSET — route Gemini through Antigravity (`agy`)

The individual-tier **`gemini` CLI is SUNSET**. All Gemini-family work — the security-hunter lane and the research-lead consult — routes through the **Antigravity `agy` CLI**. See **`ANTIGRAVITY.md`** for the invocation, auth, and the honest ED-230 served-model state.

The `gemini` CLI's legacy wiring was REMOVED for WarpOS 1.0 (ADR-0031): Gemini-family lab work (the security hunter's Gemini lane, the research-lead consult) routes through `agy`, and the security-reviewer's verifiable binding floor is OpenAI while agy's served-model proof stays open (ED-230). This file is a CONVENTION REDIRECT — an executor or reader looking for a per-family `GEMINI.md` entrypoint (parallel to `CODEX.md` / `ANTIGRAVITY.md`) is pointed to `agy` rather than a dead end. It does NOT claim a live `gemini` CLI route (there is none).

**Removal-trigger (ADR-0036):** DELETE this file — and remove its entry from `scripts/checks/entry-preamble-parity.js`'s must-exist set and the `build.js` framework-root-doc allowlist — once the Gemini family is fully retired (no `agy`/Gemini lane remains) or the per-executor-entrypoint convention drops a dedicated Gemini shim.
