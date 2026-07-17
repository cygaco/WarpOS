# WarpOS Enforcement-Per-Provider Audit

**Date:** 2026-07-16 · **Scope:** how ENFORCEMENTS work per AI provider, native hook support per CLI, and whether a "universal enforcements adapter" is worth building.
**Method:** all claims grounded in files / live CLI probes. Live probes captured below.

---

## 0. TL;DR

- **Only ONE of the three provider CLIs has a real hook system: Claude Code.** Codex and Gemini/Antigravity (agy) have no event-hook mechanism at all. Codex and agy DO have *native permission/sandbox* controls (a different thing from hooks), but WarpOS runs them wide open.
- WarpOS's enforcement is **two-tier**: ~68 **Claude-Code hooks** (fire only inside a Claude session) + a handful of **Node wrapper/gate scripts** (provider-agnostic logic, but Claude-triggered).
- The **gap** is structural, not incidental: every safety-critical *file-content* guard (secrets, paths, purity, ownership, foundation) lives in a Claude PreToolUse hook. The moment a non-Claude model writes a file — as a subprocess builder or "at the helm" — **none of them fire**.
- **Verdict on the adapter: YES, but narrow.** Build ONE thing first: a **git pre-commit enforcement runner** that reuses the existing guard logic at the universal git choke point. Do NOT reimplement the 68-hook lifecycle as a provider-agnostic engine.

---

## 1. Claude Code lane — the hook system (`.claude/settings.json` + `scripts/hooks/*`)

Claude Code is the only lane with native event hooks. `.claude/settings.json` wires **~68 hook entries** across 8 events. Source: `.claude/settings.json`, `scripts/hooks/hook-manifest.json` (per-hook `failMode`/`enabled`).

**Events wired:** SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PostCompact, Stop, SessionEnd, StopFailure.

**Fail-CLOSED (blocking) guards — ~24**, the ones that actually *refuse* an action:

| Hook | Matcher | Blocks |
|---|---|---|
| `merge-guard` | Bash | unsafe merge/ref-delete patterns |
| `memory-guard` | Bash/Edit/Write | memory-store corruption |
| `framework-manifest-guard` | Bash | commit with stale/unregenerated manifests |
| `framework-purity-guard` | Bash | product-content leak into canonical |
| `path-registry-guard` | Bash | registry-source vs generated drift |
| `dispatch-route-guard` | Bash | **raw `codex exec` / `gemini -p` / `claude -p` (non-`--agent`) / `cat\|provider`** |
| `sprint-approval-guard` | Bash | release deploy without approval_ref |
| `secret-guard` | Edit/Write | secrets written to disk |
| `foundation-guard` | Edit/Write | edits to foundation/keystone files |
| `ownership-guard` | Edit/Write | writing generated views instead of source |
| `store-validator` | Edit/Write | malformed memory/event records |
| `path-guard` | Edit/Write | stale literal paths vs `paths.*` |
| `step-registry-guard`, `extension-edit-guard`, `dependency-admission-guard`, `requirement-format-guard`, `sprint-tracker-guard` | Edit/Write | schema/format/admission violations |
| `scope-contract-guard`, `team-guard`, `gate-check`, `gauntlet-gate`, `cycle-enforcer`, `prompt-validator` | Agent | build-chain dispatch invariants (worktree, team shape, gauntlet-green gate, scope) |
| `beta-gate` | AskUserQuestion | β consult before surfacing a question |

**Fail-OPEN (advisory/side-effect) — the rest (~44):** loggers (`prompt-logger`, `session-tracker`), formatters (`format`, `lint`, `typecheck`, `ui-lint`), savers (`compact-saver`, `handoff-live`, `session-stop`), regen (`skill-catalog-regen`, `systems-sync`), and the untrusted-content firewall (WebFetch/MCP).

**Key property:** every one of these is invoked by the Claude Code harness on its tool-lifecycle events. **They do not exist for any other process.** A codex subprocess, an agy session, or a human running `git commit` in a bare shell triggers exactly zero of them.

---

## 2. Codex (OpenAI) lane

**CLI installed:** `codex-cli 0.144.1` at `…/OpenAI/Codex/bin/codex` (live probe).

**How WarpOS dispatches it:** `scripts/dispatch-agent.js` → `scripts/hooks/lib/providers.js`. The invocation syntax (providers.js:406/774) is:
```
codex exec --sandbox workspace-write --ask-for-approval never {reasoning} -m {model} -
```
Prompt is fed on **stdin** (`-`), which carries the Windows-stdin fix + concurrency lock. Only **review-layer / security roles** dispatch to codex today — not file-writing build-chain roles.

**Does codex have a hook/policy mechanism?**
- **Hooks: NO.** Codex has no event-hook system comparable to Claude Code.
- **Native policy: YES — three mechanisms, all wrapper-controllable:**
  - `sandbox_mode`: `read-only` | `workspace-write` | `danger-full-access`
  - `approval_policy`: `untrusted` | `on-failure` | `on-request` | `never`
  - **execpolicy** (Starlark command allow/deny) + `.sandbox`/`.sandbox-bin` dirs (both present under `~/.codex/`).
- **Global config (`~/.codex/config.toml`, live read):** `sandbox_mode = "danger-full-access"`, `approval_policy = "never"`. **Codex's own guards are globally OFF.**
- **BUT the WarpOS wrapper overrides per call**: it passes `--sandbox workspace-write --ask-for-approval never` explicitly. So each dispatched codex run is confined to workspace-write **at the codex-native level**, regardless of the wide-open global config. This is the one place a codex-native enforcement is actually applied — and WarpOS sets it, not the user's config.

**What enforcement WE apply to codex output today (all wrapper-level, provider-independent):**
- `dispatch-route-guard` — blocks raw `codex exec` from Bash (forces the wrapper). *Live-demonstrated: this hook fired on my own read-only `codex exec --help` probe.*
- `dispatch-contract.js validate` — the dispatch SHAPE contract (API-when-CLI, class invariants).
- `dispatch-agent.js` wrapper — `--sandbox workspace-write`, concurrency lock, Windows-stdin fix, and a **completion record** appended to `.claude/runtime/dispatch-completions.jsonl`.
- `gauntlet-verify.js` — typed-success enforcer: a role with no well-formed `ok:true` record "did not run" (absence = death signal). BC-16.
- `provider-breaker` — circuit breaker on repeated provider failure.

---

## 3. Gemini / Antigravity (agy) lane

**CLIs installed (live probe):** `gemini 0.46.0` (`…/npm/gemini`) and `agy 1.1.3` (`…/agy/bin/agy`).

**How WarpOS dispatches it:** providers.js:416 still uses the **old** syntax `gemini {reasoning} -m {model} -p`. The dispatch code has NOT been migrated to `agy`.

**Status:** the individual `gemini` CLI is **hard-deprecated** (IneligibleTierError → "migrate to Antigravity"; memory `project_gemini_dispatch_headless_fix`). So the **Google lane is DOWN**: cross-provider gauntlet currently runs GPT + Claude (2-family). `agy` is on disk but its headless dispatch contract is unproven and unwired. ED-060.

**Does agy have a hook/policy mechanism?**
- **Hooks: NO** (`agy --help`, live).
- **Native permission controls: YES** — `--sandbox` (terminal-restricted sandbox), `--dangerously-skip-permissions` (auto-approve all), `--mode accept-edits|plan`. Same category as codex: per-session permission posture, not event hooks.

**What enforcement WE apply to agy/gemini today:** the same wrapper-level set as codex (route-guard, dispatch-contract, completion records, gauntlet-verify, provider-breaker) — but it is **moot while the lane is down**.

---

## 4. Provider-INDEPENDENT vs provider-DEPENDENT enforcement

**Provider-INDEPENDENT (live in Node wrapper/gate scripts — logic runs anywhere Node runs):**
- `scripts/dispatch/dispatch-contract.js validate` — dispatch shape keystone.
- `scripts/dispatch/gauntlet-verify.js` — typed-success / completion-record gate.
- `scripts/dispatch-agent.js` — per-call codex `--sandbox`, telemetry record, concurrency lock.
- `scripts/dispatch/provider-breaker.js`, `coverage-gate.js`.
- `trackers/validate.js`, manifest coverage checks, signal-board tests, `no-nul-bytes.js` — all plain scripts.

**Provider-DEPENDENT (live in Claude Code hooks — fire ONLY in a Claude session):**
- Every file-content guard: `path-guard`, `secret-guard`, `framework-purity-guard`, `ownership-guard`, `foundation-guard`, `memory-guard`, `store-validator`, `requirement-format-guard`.
- Every dispatch/agent guard: `dispatch-route-guard`, `team-guard`, `scope-contract-guard`, `gate-check`, `gauntlet-gate`, `cycle-enforcer`.
- Every Bash guard: `merge-guard`, `framework-manifest-guard`, `path-registry-guard`, `sprint-approval-guard`, `version-bump-guard`, `authorization-gate`.

**The subtle trap:** even the "provider-independent" scripts have a **Claude-dependent TRIGGER**. `dispatch-contract validate` and `gauntlet-verify` are *invoked by* Claude hooks or by `/scan:full` (which a human runs inside a Claude session). The CHECK is portable; the FIRING is not. That is the entire adapter thesis in one line.

---

## 5. The gap — what has NO equivalent when a non-Claude model is at the helm or writes files

When codex/agy is the **top-level orchestrator**, or a codex/agy **subprocess writes files directly**:

1. **File-content guards evaporate.** Secrets, stale paths, framework-purity leaks, ownership (source-vs-generated), foundation-file edits — all Claude PreToolUse Edit/Write hooks. A codex `workspace-write` run can write any of these violations and nothing blocks it. *(Mitigated TODAY only because file-writing build-chain roles are `claude_pinned` — the file-write lane is Claude, so its hooks fire. The gap is latent and grows the instant a non-Claude builder is enabled, which is the stated portability goal.)*
2. **Bash guards evaporate.** merge-guard, framework-manifest-guard (stale-manifest commit), sprint-approval-guard (deploy without approval), version-bump-guard — none apply to a codex shell.
3. **Dispatch guards partially evaporate.** dispatch-route-guard / team-guard / gate-check only constrain a *Claude* orchestrator's dispatch calls. A codex orchestrator calling providers directly is unconstrained.
4. **Session-lifecycle enforcement evaporates.** tracker-start/completion, retro-presence, handoff-live, β-gate — Claude-session concepts with no codex/agy analogue.

**What still holds regardless of helm:** anything reached through the Node dispatch wrappers (codex `--sandbox workspace-write`, completion records, gauntlet-verify) — but only for work that *flows through those wrappers*. A helm-level codex bypasses them entirely.

---

## 6. Assessment — "universal enforcements adapter"

**The economics are favorable for a narrow build, unfavorable for a broad one.**

- **Why narrow is cheap:** the enforcement *logic* already exists as Node modules and is mostly pure-function. codex/agy already flow through our Node wrappers — a natural choke point that already applies `--sandbox` + telemetry. And **git is the truly universal choke point**: every provider, at any level, commits through git. A `.git/hooks/pre-commit` runner catches file-write violations for ANY author — codex at the helm, agy subprocess, or a human in a bare shell — with no per-provider integration.
- **Why broad is a trap:** ~44 of the 68 hooks are Claude-session-lifecycle side-effects (session-start, compact-saver, handoff, tracker-start, formatters). They have **no meaning** for a codex subprocess. Reimplementing them as a provider-agnostic engine is high cost for near-zero portability value.

### Recommendation (3 lines)
1. **Build FIRST:** a `node scripts/enforce/precommit.js` runner wired as a **git pre-commit hook**, batching the 7 safety-critical content guards (secret, path, framework-purity, ownership, foundation, memory, no-nul-bytes) by extracting each hook's core check into a shared `lib/checks/` module the Claude hooks *also* call — one logic, two triggers (Claude hook + git hook). This closes the biggest portability gap at the universal choke point.
2. **Harden SECOND:** make any future file-writing subprocess dispatch run that same content-guard batch against its **worktree diff before merge** (the wrapper already owns this seam).
3. **Do NOT build:** a full provider-agnostic mirror of the session-lifecycle hooks, or per-CLI hook shims for codex/agy (they have no hook system to shim — their native `--sandbox`/`approval` knobs are already all we can set, and the wrapper already sets them).

**Value:** closes the #1 gap (file-write enforcement portability) for every provider at the git choke point. **Cost:** ~1 focused sprint — the checks exist; the work is refactor-to-shared-lib + a thin runner + git-hook wiring + a `.git/hooks` install step in `/warp:setup`.

---

## Appendix — live probe evidence
- `codex-cli 0.144.1`; `~/.codex/config.toml`: `sandbox_mode="danger-full-access"`, `approval_policy="never"`.
- `agy 1.1.3` — help exposes `--sandbox`, `--dangerously-skip-permissions`, `--mode accept-edits|plan`; no hook subsystem.
- `gemini 0.46.0` — present but tier-deprecated (Google lane down).
- `dispatch-route-guard` fired live on a read-only `codex exec --help` probe (the guard is real, and bash-inline `WARPOS_PROVIDER_PROBE=1` does NOT reach the PreToolUse hook — matches the guard's own warning).
- Wrapper codex invocation: providers.js:406/774 `codex exec --sandbox workspace-write --ask-for-approval never -m {model} -`.
