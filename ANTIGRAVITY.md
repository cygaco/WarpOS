# ANTIGRAVITY.md — Antigravity / Gemini executor entrypoint (thin shim, one source of truth)

> Thin per-executor entrypoint for the **Antigravity `agy` CLI** (the Gemini-family lab, the sunset-
> `gemini`-CLI migration target). The shared entering-agent rules are the block below (single-sourced
> from `.claude/project/reference/entry-preamble.md`, hash-parity-checked); this file adds ONLY what is
> different under `agy`. (SP-20260723-001 / ADR-0036.)

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

## What is DIFFERENT under Antigravity (`agy`)

**1. Honest state — agy has NEVER served with verified proof (ED-230).** This is the load-bearing fact. The `agy` lane is the Gemini-family security-hunter / research route on paper, but no run has yet produced a verified *served-model* proof (the logs echo the request-side model, which is not an attestation). Doctrine: **never claim a lane is live from transport success** — a completed spawn is not a served-model. The panel-3lab `agy` lane stays **BLOCKED-ON-OPERATOR** until one real `fallback:false` ledger record with account-config served-model proof exists; until then the security panel degrades to the 2-family floor (GPT + Claude) rather than silently passing. Do not mark agy live, do not attest an agy verdict, and do not let a green transport read as a green lane.

**2. Invocation — prompt on the `-p` argv value, not stdin.**
```
agy --model <DISPLAY-NAME> --print-timeout <dur> -p '<prompt>'
```
`--model` takes a **display name**, not a slug (the dispatch boundary maps slug→display). The prompt rides the `-p` argv VALUE — `agy` has no stdin `-` positional (unlike `codex`); it is bounded + injection-checked + native-exe-only by the safe-spawn `agy` ARG_POLICY carve-out (ADR-0023). `{reasoning}` is empty for `agy` (thinking is always-on; no effort flag). NEVER run `agy models` headless — it hangs (>10 min, zero output).

**3. Auth — self-auth via the shared keyring.** `agy` self-authenticates through `~/.gemini` (the Antigravity keyring); it does not take an API key on the command line. Auth works from a subprocess (no operator login needed for the spawn itself — the "auth wall" framing was retracted, ADR-0027). The residual blockers are role-routing + a headless tool-permission wall + the ED-230 served-model proof gap, not authentication.

**4. Headless permissions — scoped read-only allow-list, never skip-permissions.** Under headless `agy` the sanctioned posture is a scoped read-only allow-list (ADR-0031); do NOT reach for `--dangerously-skip-permissions`. A "command permission auto-denied" wall is a permissions-posture problem to resolve with an allow-rule + β/operator sign-off, not a reason to disable the guard.

**5. Same executor-mechanics as the other non-Claude CLIs.** As with Codex: no WarpOS hooks fire (the guards are your manual responsibility), you have no in-process Agent tool (dispatch via the CLI routes only), builders dispatch FOREGROUND (the reap), and cross-provider review stays real (a binding FAIL cannot be overridden). See `CODEX.md` §§3–6 for the detail — the mechanics are identical; only the invocation + the ED-230 honesty above differ.
